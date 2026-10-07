// Acesso a projetos e trechos no banco. Converte snake_case (banco) ⇄ camelCase (telas).
// Toda chamada confere { error }: o Supabase não "estoura", devolve o erro.

import { supabase } from './supabase'

const CAMPOS_PROJETO = {
  nome: 'nome', estado: 'estado', municipio: 'municipio', uso: 'uso', tipoUso: 'tipo_uso',
  tipologia: 'tipologia', gas: 'gas', materialId: 'material_id', pressaoOperacao: 'pressao_operacao', status: 'status',
}

const num = v => (v == null ? null : Number(v))

function trechoDoBanco(r) {
  return {
    id: r.id, nome: r.nome, montanteId: r.montante_id,
    lh: num(r.lh), lasc: num(r.lasc), ldesc: num(r.ldesc),
    conexoes: r.conexoes ?? {}, aparelhos: r.aparelhos ?? [],
    dentroUnidade: r.dentro_unidade, reguladorSaida: num(r.regulador_saida),
    dnForcado: r.dn_forcado, ignorar: r.ignorar, justificativa: r.justificativa,
    fInformado: num(r.f_informado), fJustificativa: r.f_justificativa,
  }
}

function trechoParaBanco(t, projectId, ordem) {
  return {
    id: t.id, project_id: projectId, ordem, nome: t.nome, montante_id: t.montanteId,
    lh: t.lh, lasc: t.lasc, ldesc: t.ldesc, conexoes: t.conexoes ?? {}, aparelhos: t.aparelhos ?? [],
    dentro_unidade: !!t.dentroUnidade, regulador_saida: t.reguladorSaida ?? null,
    dn_forcado: t.dnForcado ?? null,
    // o banco exige justificativa para ignorar; sem ela, "ignorar" não é gravado
    ignorar: !!t.ignorar && !!t.justificativa?.trim(), justificativa: t.justificativa ?? '',
    f_informado: t.fInformado ?? null, f_justificativa: t.fJustificativa ?? '',
  }
}

function projetoDoBanco(r, trechos) {
  return {
    id: r.id, nome: r.nome, estado: r.estado, municipio: r.municipio, uso: r.uso, tipoUso: r.tipo_uso,
    tipologia: r.tipologia, gas: r.gas, materialId: r.material_id, pressaoOperacao: num(r.pressao_operacao),
    status: r.status, revisao: r.revisao, versao: r.versao,
    criadoEm: r.created_at, atualizadoEm: r.updated_at, trechos,
  }
}

function projetoParaBanco(dados) {
  const out = {}
  for (const [k, col] of Object.entries(CAMPOS_PROJETO)) if (k in dados) out[col] = dados[k]
  return out
}

export async function carregarProjetos() {
  const [{ data: ps, error: e1 }, { data: ts, error: e2 }] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    supabase.from('network_segments').select('*').order('ordem'),
  ])
  if (e1 || e2) throw e1 || e2
  const porProjeto = new Map()
  for (const t of ts) {
    if (!porProjeto.has(t.project_id)) porProjeto.set(t.project_id, [])
    porProjeto.get(t.project_id).push(trechoDoBanco(t))
  }
  return ps.map(p => projetoDoBanco(p, porProjeto.get(p.id) ?? []))
}

export async function criarProjeto(dados, organizationId) {
  const { data, error } = await supabase.from('projects')
    .insert({ ...projetoParaBanco(dados), organization_id: organizationId }).select().single()
  if (error) throw error
  return projetoDoBanco(data, [])
}

export async function atualizarProjeto(id, patch) {
  const { data, error } = await supabase.from('projects').update(projetoParaBanco(patch)).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Grava a diferença entre a lista anterior e a nova (insere/atualiza e remove) */
export async function salvarTrechos(projectId, anteriores, novos) {
  const antes = new Map(anteriores.map((t, i) => [t.id, JSON.stringify(trechoParaBanco(t, projectId, i))]))
  const mudados = novos.map((t, i) => trechoParaBanco(t, projectId, i)).filter(r => antes.get(r.id) !== JSON.stringify(r))
  const ids = new Set(novos.map(t => t.id))
  const removidos = anteriores.filter(t => !ids.has(t.id)).map(t => t.id)

  if (mudados.length) {
    const { error } = await supabase.from('network_segments').upsert(mudados)
    if (error) throw error
  }
  if (removidos.length) {
    const { error } = await supabase.from('network_segments').delete().in('id', removidos)
    if (error) throw error
  }
}

export async function carregarPerfil(userId) {
  const { data, error } = await supabase.from('profiles')
    .select('id, nome, email, role, ativo, organization_id, organizations(nome)').eq('id', userId).single()
  if (error) throw error
  return { ...data, organizacao: data.organizations?.nome ?? null }
}

export async function listarMembros() {
  const { data, error } = await supabase.from('profiles')
    .select('id, nome, email, role, ativo, organization_id, organizations(nome)').order('nome')
  if (error) throw error
  return data
}

export async function atualizarMembro(id, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}

export async function listarOrganizacoes() {
  const { data, error } = await supabase.from('organizations').select('id, nome').order('nome')
  if (error) throw error
  return data
}

/** Mensagem amigável para os erros mais comuns do banco */
export function mensagemErro(e) {
  const m = e?.message ?? String(e)
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para esta ação.'
  if (/JWT|session|refresh/i.test(m)) return 'Sua sessão expirou. Entre novamente — o que você digitou continua na tela.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
  if (/check constraint/i.test(m)) return 'O banco recusou um valor fora das regras (verifique pressões, gás e estado).'
  return `Erro ao salvar: ${m}`
}
