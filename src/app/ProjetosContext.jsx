// Estado global dos projetos. Com Supabase configurado, lê e grava no banco
// (atualiza a tela na hora e salva em seguida; se falhar, avisa e recarrega).
// Sem Supabase, roda no modo demonstração com dados no navegador.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { mockProjetos } from './mockData'
import { novoId } from '../utils/format'
import { temSupabase } from '../services/supabase'
import * as db from '../services/projetos'
import { useToast } from '../components'

export const USAR_MOCK = !temSupabase

const CHAVE = 'redegas:projetos:v1'
const ESPERA_MS = 700
const Ctx = createContext(null)

function carregarLocal() {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo)
  } catch { /* armazenamento indisponível: segue com o demo */ }
  return mockProjetos
}

export function ProjetosProvider({ perfil, children }) {
  const toast = useToast()
  const [projetos, setProjetos] = useState(() => (USAR_MOCK ? carregarLocal() : []))
  const [carregando, setCarregando] = useState(!USAR_MOCK)
  const [erroCarga, setErroCarga] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const base = useRef(new Map())        // trechos já gravados no banco, por projeto
  const pendentes = useRef(new Map())   // trechos aguardando gravação, por projeto
  const timer = useRef(null)

  const recarregar = useCallback(async () => {
    if (USAR_MOCK) return
    try {
      const ps = await db.carregarProjetos()
      base.current = new Map(ps.map(p => [p.id, p.trechos]))
      setProjetos(ps)
      setErroCarga(null)
    } catch (e) {
      setErroCarga(db.mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  useEffect(() => {
    if (!USAR_MOCK) return
    try { localStorage.setItem(CHAVE, JSON.stringify(projetos)) } catch { /* ignora */ }
  }, [projetos])

  const gravarPendentes = useCallback(async () => {
    const lote = [...pendentes.current]
    pendentes.current.clear()
    if (!lote.length) return
    setSalvando(true)
    try {
      for (const [id, trechos] of lote) {
        await db.salvarTrechos(id, base.current.get(id) ?? [], trechos)
        base.current.set(id, trechos)
      }
    } catch (e) {
      toast(db.mensagemErro(e), 'erro')
      await recarregar()
    } finally {
      setSalvando(pendentes.current.size > 0)
    }
  }, [recarregar, toast])

  // Não deixa fechar a aba com alteração ainda não gravada
  useEffect(() => {
    const aviso = e => { if (pendentes.current.size || salvando) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [salvando])

  const atualizar = useCallback((id, patch) => {
    setProjetos(ps => ps.map(p => (p.id === id ? { ...p, ...patch, atualizadoEm: new Date().toISOString() } : p)))
    if (USAR_MOCK) return
    const { trechos, ...campos } = patch
    if (Object.keys(campos).length) {
      db.atualizarProjeto(id, campos).catch(e => { toast(db.mensagemErro(e), 'erro'); recarregar() })
    }
    if (trechos) {
      pendentes.current.set(id, trechos)
      setSalvando(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(gravarPendentes, ESPERA_MS)
    }
  }, [gravarPendentes, recarregar, toast])

  const criar = useCallback(async dados => {
    if (USAR_MOCK) {
      const agora = new Date().toISOString()
      const p = { id: novoId(), status: 'rascunho', trechos: [], criadoEm: agora, atualizadoEm: agora, ...dados }
      setProjetos(ps => [p, ...ps])
      return p.id
    }
    const p = await db.criarProjeto(dados, perfil.organization_id)
    base.current.set(p.id, [])
    setProjetos(ps => [p, ...ps])
    return p.id
  }, [perfil])

  const arquivar = useCallback(id => atualizar(id, { status: 'arquivado' }), [atualizar])
  const restaurarDemo = useCallback(() => setProjetos(mockProjetos), [])

  const valor = useMemo(() => ({ projetos, carregando, erroCarga, salvando, atualizar, criar, arquivar, restaurarDemo, recarregar }),
    [projetos, carregando, erroCarga, salvando, atualizar, criar, arquivar, restaurarDemo, recarregar])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export const useProjetos = () => useContext(Ctx)
