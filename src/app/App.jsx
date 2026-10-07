// Checa a sessão e o papel e mostra a interface certa.
// Com Supabase: login real (supabase.auth) + perfil na tabela profiles.
// Sem Supabase: login de demonstração escolhendo o perfil.

import { useEffect, useState } from 'react'
import Login, { LoginDemo, NovaSenha } from './Login'
import Shell from './Shell'
import { ProjetosProvider } from './ProjetosContext'
import { ToastProvider } from '../components'
import { supabase, temSupabase } from '../services/supabase'
import { carregarPerfil } from '../services/projetos'

const CHAVE_DEMO = 'redegas:sessao:v1'

function lerSessaoDemo() {
  try { return JSON.parse(localStorage.getItem(CHAVE_DEMO)) } catch { return null }
}

function AppDemo() {
  const [usuario, setUsuario] = useState(lerSessaoDemo)
  const entrar = u => {
    try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(u)) } catch { /* ignora */ }
    setUsuario(u)
  }
  const sair = () => {
    try { localStorage.removeItem(CHAVE_DEMO) } catch { /* ignora */ }
    setUsuario(null)
  }
  if (!usuario) return <LoginDemo onEntrar={entrar} />
  const perfil = { ...usuario, organizacao: 'Escritório Exemplo', organization_id: 'org-1' }
  return <ProjetosProvider perfil={perfil}><Shell usuario={perfil} onSair={sair} /></ProjetosProvider>
}

function Aviso({ children, onSair }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card stack-2" style={{ maxWidth: 460 }}>
        {children}
        {onSair && <button className="btn btn-secondary" onClick={onSair}>Sair</button>}
      </div>
    </div>
  )
}

function AppSupabase() {
  const [sessao, setSessao] = useState(undefined)   // undefined = ainda verificando
  const [perfil, setPerfil] = useState(null)
  const [erroPerfil, setErroPerfil] = useState(null)
  const [recuperando, setRecuperando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      setSessao(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = sessao?.user?.id
  useEffect(() => {
    if (!userId) { setPerfil(null); return }
    setErroPerfil(null)
    carregarPerfil(userId).then(setPerfil).catch(e => setErroPerfil(e.message))
  }, [userId])

  const sair = () => supabase.auth.signOut()

  if (sessao === undefined) return <Aviso><div className="t-caption">Carregando…</div></Aviso>
  if (recuperando && sessao) return <NovaSenha onConcluir={() => setRecuperando(false)} />
  if (!sessao) return <Login />
  if (erroPerfil) return <Aviso onSair={sair}><div className="card-danger">Não foi possível carregar seu perfil: {erroPerfil}</div></Aviso>
  if (!perfil) return <Aviso><div className="t-caption">Carregando seu perfil…</div></Aviso>
  if (!perfil.ativo) return <Aviso onSair={sair}><div className="card-danger">Seu acesso está desativado. Fale com o administrador do escritório.</div></Aviso>
  if (!perfil.role || !perfil.organization_id) {
    return (
      <Aviso onSair={sair}>
        <div className="t-title">Quase lá, {perfil.nome || perfil.email}</div>
        <div className="t-caption" style={{ fontSize: 14 }}>
          Sua conta foi criada, mas ainda está <strong>sem papel ou sem escritório configurado</strong>.
          Peça ao administrador do seu escritório para liberar o acesso.
        </div>
      </Aviso>
    )
  }
  return <ProjetosProvider key={perfil.id} perfil={perfil}><Shell usuario={perfil} onSair={sair} /></ProjetosProvider>
}

export default function App() {
  return (
    <div className="app">
      <div className="small-screen">O RedeGás foi feito para o computador. Para usar bem, abra numa tela com pelo menos 1366 px de largura.</div>
      <ToastProvider>
        {temSupabase ? <AppSupabase /> : <AppDemo />}
      </ToastProvider>
    </div>
  )
}
