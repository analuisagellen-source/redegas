// 6.10 — Rede em árvore e dimensionamento automático.
// Função pura: recebe o projeto e os trechos, devolve a tabela do Anexo A.6.
// Tela, memorial, XLSX e DXF devem usar SEMPRE esta função.

import { diametrosDisponiveis, materialPorId, PARAMETROS_GAS, type Diametro, type Gas, type Uso } from './catalogo.ts'
import { calcularTrecho, fatorSimultaneidade, origemPerda, potenciaAdotada, vazao, type ContextoF } from './formulas.ts'
import { ORIGEM } from './origens.ts'
import { kcalHParaKw, PATM_PADRAO_KPA } from '../units/index.ts'

export interface AparelhoNoPonto {
  nome: string
  /** Potência nominal de consumo (kcal/h) */
  potencia: number
  quantidade: number
  /** Comercial: quando o fabricante informa só a potência útil (6.2) */
  potenciaUtil?: number | null
  eficiencia?: number | null
}

export interface TrechoRede {
  id: string
  nome: string
  montanteId: string | null
  lh: number
  lasc: number
  ldesc: number
  conexoes: Record<string, number>
  /** Aparelhos ligados no ponto final deste trecho */
  aparelhos: AparelhoNoPonto[]
  /** Trecho dentro de uma unidade (apartamento/casa): F = 100% */
  dentroUnidade?: boolean
  /** Regulador no início do trecho: pressão de saída (kPa) */
  reguladorSaida?: number | null
  dnForcado?: string | null
  ignorar?: boolean
  justificativa?: string
  fInformado?: number | null
  fJustificativa?: string
}

export interface ProjetoRede {
  gas: Gas
  uso: Uso
  /** Pressão de operação do primeiro estágio (kPa) */
  pressaoOperacao: number
  materialId: string
  pci?: number
  s?: number
  patm?: number
}

export type Situacao = 'verde' | 'amarelo' | 'vermelho' | 'ignorado'

export interface LinhaDimensionamento {
  id: string
  nome: string
  montanteId: string | null
  nivel: number
  aparelhosJusante: number
  cKcalH: number
  cKw: number
  f: number
  fOrigem: string
  a: number
  q: number
  v: number
  lh: number
  lasc: number
  ldesc: number
  leq: number
  lTotal: number
  pi: number
  dpAtrito: number
  dpDesnivel: number
  pf: number
  estagioId: string
  pEstagio: number
  regimeAlto: boolean
  perdaAcumKpa: number
  perdaAcumPct: number
  /** Limite de perda acumulada aplicável ao ponto final (%), quando houver */
  limitePct: number | null
  limiteOrigem: string | null
  dn: string
  di: number
  material: string
  dnForcado: boolean
  pressaoProjeto: number | null
  /** Maior razão valor/limite entre os critérios (1 = no limite) */
  utilizacao: number
  situacao: Situacao
  observacoes: string[]
  origens: Record<string, string>
}

export interface Pendencia {
  trechoId: string
  trecho: string
  severidade: 'impeditiva' | 'alerta'
  mensagem: string
}

export interface ResultadoRede {
  ok: boolean
  erros: string[]
  linhas: LinhaDimensionamento[]
  pendencias: Pendencia[]
}

const LIMITE_VELOCIDADE = 20

export function pressaoMaxima(uso: Uso, gas: Gas): number {
  if (uso === 'residencial') return 150
  return gas === 'GLP' ? 150 : 400
}

export function potenciaDoAparelho(ap: AparelhoNoPonto): number {
  const qtd = Number(ap.quantidade) || 0
  if (ap.potenciaUtil && ap.eficiencia && ap.eficiencia > 0) return qtd * (ap.potenciaUtil / ap.eficiencia)
  return qtd * (Number(ap.potencia) || 0)
}

export function dimensionarRede(projeto: ProjetoRede, trechos: TrechoRede[]): ResultadoRede {
  const erros: string[] = []
  const material = materialPorId(projeto.materialId)
  if (!material) return { ok: false, erros: ['Material não cadastrado.'], linhas: [], pendencias: [] }
  const diametros = diametrosDisponiveis(material)
  if (diametros.length === 0) {
    return { ok: false, erros: [`${material.nome} não tem diâmetro interno cadastrado: nenhum diâmetro pode ser oferecido.`], linhas: [], pendencias: [] }
  }

  const params = PARAMETROS_GAS[projeto.gas]
  const pci = projeto.pci ?? params.pci
  const s = projeto.s ?? params.s
  const patm = projeto.patm ?? PATM_PADRAO_KPA

  // Pressões máximas (6.9)
  const pMax = pressaoMaxima(projeto.uso, projeto.gas)
  const origemPMax = projeto.uso === 'residencial' ? ORIGEM.pressaoMaxRes : ORIGEM.pressaoMaxCom
  const pressoes = [projeto.pressaoOperacao, ...trechos.map(t => t.reguladorSaida).filter((p): p is number => p != null)]
  for (const p of pressoes) {
    if (!(p > 0)) erros.push('Pressão de operação deve ser maior que zero.')
    else if (p > pMax) {
      const quem = projeto.uso === 'comercial' && projeto.gas === 'GLP' ? 'Rede comercial de GLP' : `Rede ${projeto.uso}`
      erros.push(`${quem} limitada a ${pMax} kPa; informado ${p} kPa (${origemPMax}).`)
    }
  }

  // Árvore
  const porId = new Map(trechos.map(t => [t.id, t]))
  if (porId.size !== trechos.length) erros.push('Há trechos com identificador repetido.')
  const filhos = new Map<string, TrechoRede[]>()
  const raizes: TrechoRede[] = []
  for (const t of trechos) {
    if (!(t.lh >= 0 && t.lasc >= 0 && t.ldesc >= 0)) erros.push(`Trecho ${t.nome}: comprimentos devem ser números ≥ 0.`)
    if (t.montanteId == null) { raizes.push(t); continue }
    if (!porId.has(t.montanteId)) { erros.push(`Trecho ${t.nome}: trecho de montante não encontrado.`); continue }
    if (!filhos.has(t.montanteId)) filhos.set(t.montanteId, [])
    filhos.get(t.montanteId)!.push(t)
  }
  if (trechos.length > 0 && raizes.length === 0) erros.push('A rede precisa de pelo menos um trecho inicial (sem montante).')

  const ordem: { t: TrechoRede; nivel: number }[] = []
  const visitados = new Set<string>()
  const visitar = (t: TrechoRede, nivel: number) => {
    if (visitados.has(t.id)) return
    visitados.add(t.id)
    ordem.push({ t, nivel })
    for (const f of filhos.get(t.id) ?? []) visitar(f, nivel + 1)
  }
  raizes.forEach(r => visitar(r, 0))
  if (visitados.size !== trechos.length && erros.length === 0) erros.push('A rede tem um ciclo: algum trecho é montante dele mesmo.')

  if (erros.length) return { ok: false, erros, linhas: [], pendencias: [] }

  // Potência computada e aparelhos a jusante (pós-ordem)
  const cMap = new Map<string, number>()
  const nApMap = new Map<string, number>()
  for (let i = ordem.length - 1; i >= 0; i--) {
    const t = ordem[i].t
    let c = t.aparelhos.reduce((soma, ap) => soma + potenciaDoAparelho(ap), 0)
    let n = t.aparelhos.reduce((soma, ap) => soma + (Number(ap.quantidade) || 0), 0)
    for (const f of filhos.get(t.id) ?? []) { c += cMap.get(f.id)!; n += nApMap.get(f.id)! }
    cMap.set(t.id, c)
    nApMap.set(t.id, n)
  }

  // Diâmetro inicial: forçado pelo usuário ou o menor disponível
  const obsFixas = new Map<string, string[]>()
  const idx = new Map<string, number>()
  const forcado = new Set<string>()
  for (const { t } of ordem) {
    obsFixas.set(t.id, [])
    if (t.dnForcado) {
      const i = diametros.findIndex(d => d.dn === t.dnForcado)
      if (i >= 0) { idx.set(t.id, i); forcado.add(t.id) }
      else { idx.set(t.id, 0); obsFixas.get(t.id)!.push(`Diâmetro ${t.dnForcado} sem DI cadastrado: não pode ser usado.`) }
    } else idx.set(t.id, 0)
  }

  const avaliar = (): LinhaDimensionamento[] => {
    const linhas = new Map<string, LinhaDimensionamento>()
    for (const { t, nivel } of ordem) {
      const pai = t.montanteId ? linhas.get(t.montanteId)! : null
      let estagioId: string, pEstagio: number, pi: number
      if (t.reguladorSaida != null) { estagioId = t.id; pEstagio = t.reguladorSaida; pi = t.reguladorSaida }
      else if (!pai) { estagioId = 'principal'; pEstagio = projeto.pressaoOperacao; pi = pEstagio }
      else { estagioId = pai.estagioId; pEstagio = pai.pEstagio; pi = pai.pf }

      const observacoes = [...obsFixas.get(t.id)!]
      const contexto: ContextoF = projeto.uso === 'comercial' ? 'comercial' : t.dentroUnidade ? 'unidade' : 'coletivo'
      const c = cMap.get(t.id)!
      const rf = fatorSimultaneidade(c, contexto, t.fInformado != null ? { f: t.fInformado, justificativa: t.fJustificativa } : null)
      observacoes.push(...rf.erros, ...rf.alertas)
      const a = potenciaAdotada(rf.f, c)
      const q = vazao(a, pci)

      const diam: Diametro = diametros[idx.get(t.id)!]
      let leq = 0
      for (const [tipo, qtd] of Object.entries(t.conexoes ?? {})) {
        const n = Number(qtd) || 0
        if (!n) continue
        const unit = diam.leq[tipo]
        if (unit == null) observacoes.push(`Sem comprimento equivalente para "${tipo}" em ${diam.dn}.`)
        else leq += n * unit
      }
      const lTotal = t.lh + t.lasc + t.ldesc + leq
      const regimeAlto = pEstagio > 7.5
      const r = Number.isFinite(pi)
        ? calcularTrecho({ gas: projeto.gas, s, q, d: diam.di!, lTotal, lAsc: t.lasc, lDesc: t.ldesc, pi, regimeAlto, patm })
        : { dpAtrito: NaN, dpDesnivel: NaN, pf: NaN, v: NaN }

      const perdaAcumKpa = pEstagio - r.pf
      const perdaAcumPct = (perdaAcumKpa / pEstagio) * 100

      const ns = filhos.get(t.id) ?? []
      let limitePct: number | null = null
      let limiteOrigem: string | null = null
      if (ns.length === 0) {
        limitePct = 10
        limiteOrigem = projeto.uso === 'residencial' ? ORIGEM.limiteAparelhoRes : ORIGEM.limiteAparelhoCom
      } else if (ns.some(f => f.reguladorSaida != null)) {
        limitePct = projeto.uso === 'residencial' ? 30 : 20
        limiteOrigem = projeto.uso === 'residencial' ? ORIGEM.limiteReguladorRes : ORIGEM.limiteReguladorCom
      }

      let utilizacao = 0
      if (!Number.isFinite(r.pf) || r.pf <= 0) {
        utilizacao = Infinity
        observacoes.push('Pressão esgotada no trecho.')
      } else {
        const rv = r.v / LIMITE_VELOCIDADE
        utilizacao = Math.max(utilizacao, rv)
        if (rv > 1) observacoes.push(`Velocidade acima de ${LIMITE_VELOCIDADE} m/s.`)
        if (limitePct != null) {
          const rp = perdaAcumPct / limitePct
          utilizacao = Math.max(utilizacao, rp)
          if (rp > 1) observacoes.push(`Perda acumulada acima de ${limitePct}% da pressão do estágio.`)
        }
      }
      if (projeto.uso === 'residencial' && t.dentroUnidade && pEstagio > 7.5) {
        utilizacao = Infinity
        observacoes.push(`Pressão dentro da unidade acima de 7,5 kPa (${ORIGEM.pressaoUnidade}).`)
      }
      if (forcado.has(t.id)) observacoes.push('Diâmetro definido pelo usuário.')

      linhas.set(t.id, {
        id: t.id, nome: t.nome, montanteId: t.montanteId, nivel,
        aparelhosJusante: nApMap.get(t.id)!, cKcalH: c, cKw: kcalHParaKw(c),
        f: rf.f, fOrigem: rf.origem, a, q, v: r.v,
        lh: t.lh, lasc: t.lasc, ldesc: t.ldesc, leq, lTotal,
        pi, dpAtrito: r.dpAtrito, dpDesnivel: r.dpDesnivel, pf: r.pf,
        estagioId, pEstagio, regimeAlto, perdaAcumKpa, perdaAcumPct, limitePct, limiteOrigem,
        dn: diam.dn, di: diam.di!, material: material.nome, dnForcado: forcado.has(t.id),
        pressaoProjeto: projeto.uso === 'comercial' ? pEstagio * 1.5 : null,
        utilizacao, situacao: 'verde', observacoes,
        origens: {
          c: ORIGEM.potenciaComputada,
          f: rf.origem,
          perda: origemPerda(projeto.gas, regimeAlto),
          desnivel: ORIGEM.desnivel,
          v: ORIGEM.velocidade,
          limiteV: projeto.uso === 'residencial' ? ORIGEM.limiteVelocidadeRes : ORIGEM.limiteVelocidadeCom,
          di: material.origem,
          ...(projeto.uso === 'comercial' ? { pressaoProjeto: ORIGEM.pressaoProjetoCom } : {}),
        },
      })
    }
    return ordem.map(o => linhas.get(o.t.id)!)
  }

  const podeAumentar = (id: string) => !forcado.has(id) && idx.get(id)! < diametros.length - 1
  const aumentar = (id: string) => idx.set(id, idx.get(id)! + 1)

  // 6.10.3 — parte do menor diâmetro e aumenta até atender todos os pontos a jusante
  let linhas = avaliar()
  for (let iter = 0; iter < 5000; iter++) {
    const porLinha = new Map(linhas.map(l => [l.id, l]))
    const falhas = linhas.filter(l => l.utilizacao > 1).sort((x, y) => y.utilizacao - x.utilizacao)
    let mudou = false
    for (const l of falhas) {
      // velocidade: só o próprio trecho resolve
      if (Number.isFinite(l.v) && l.v > LIMITE_VELOCIDADE && podeAumentar(l.id)) { aumentar(l.id); mudou = true; break }
      // perda: qualquer trecho do caminho desde o regulador do estágio
      const caminho: LinhaDimensionamento[] = []
      let atual: LinhaDimensionamento | undefined = l
      while (atual && atual.estagioId === l.estagioId) {
        caminho.push(atual)
        atual = atual.montanteId ? porLinha.get(atual.montanteId) : undefined
      }
      const candidatos = caminho.filter(c => podeAumentar(c.id))
      if (!candidatos.length) continue
      const alvo = candidatos.reduce((m, c) => ((c.dpAtrito || 0) > (m.dpAtrito || 0) ? c : m))
      aumentar(alvo.id)
      mudou = true
      break
    }
    if (!mudou) break
    linhas = avaliar()
  }

  // Situação final e pendências
  const pendencias: Pendencia[] = []
  for (const l of linhas) {
    const t = porId.get(l.id)!
    if (l.utilizacao > 1) {
      if (t.ignorar && t.justificativa?.trim()) {
        l.situacao = 'ignorado'
        l.observacoes.push(`Ignorado pelo usuário: ${t.justificativa.trim()}`)
        pendencias.push({ trechoId: l.id, trecho: l.nome, severidade: 'alerta', mensagem: `Reprovação ignorada com justificativa: ${t.justificativa.trim()}` })
      } else {
        l.situacao = 'vermelho'
        if (!l.dnForcado) l.observacoes.push('Nenhum diâmetro disponível do material atende.')
        if (t.ignorar) l.observacoes.push('Para ignorar, a justificativa é obrigatória.')
        pendencias.push({ trechoId: l.id, trecho: l.nome, severidade: 'impeditiva', mensagem: l.observacoes.filter(o => !o.startsWith('Diâmetro definido')).join(' ') || 'Trecho reprovado.' })
      }
    } else if (l.utilizacao > 0.9) l.situacao = 'amarelo'
    else l.situacao = 'verde'
    if (l.situacao !== 'vermelho' && l.situacao !== 'ignorado' && obsFixas.get(l.id)!.length) {
      pendencias.push({ trechoId: l.id, trecho: l.nome, severidade: 'alerta', mensagem: obsFixas.get(l.id)!.join(' ') })
    }
  }
  return { ok: true, erros: [], linhas, pendencias }
}
