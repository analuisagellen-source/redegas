import { useState } from 'react'
import { Field, Icon } from '../components'
import { mockUsuarios } from './mockData'
import { supabase } from '../services/supabase'

function Moldura({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card" style={{ width: 420, padding: 32 }}>
        <div className="row-flex" style={{ color: 'var(--primary)', marginBottom: 6 }}>
          <Icon name="flame" size={30} />
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>RedeGás</span>
        </div>
        <p className="t-caption" style={{ margin: '0 0 22px' }}>Dimensionamento de redes de gás GLP e GN.</p>
        {children}
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState('entrar') // entrar | recuperar
  const [msg, setMsg] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = async e => {
    e.preventDefault()
    setEnviando(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) setMsg({ tipo: 'erro', texto: /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message })
  }

  const recuperar = async e => {
    e.preventDefault()
    if (!email.trim()) { setMsg({ tipo: 'erro', texto: 'Informe seu e-mail.' }); return }
    setEnviando(true); setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    setEnviando(false)
    setMsg(error ? { tipo: 'erro', texto: error.message }
      : { tipo: 'ok', texto: 'Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.' })
  }

  return (
    <Moldura>
      <form className="stack-2" onSubmit={modo === 'entrar' ? entrar : recuperar}>
        <Field label="E-mail">
          <input className="ipt" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </Field>
        {modo === 'entrar' && (
          <Field label="Senha">
            <input className="ipt" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required />
          </Field>
        )}
        {msg && <div className={msg.tipo === 'erro' ? 'card-danger t-caption' : 'card-tint t-caption'}>{msg.texto}</div>}
        <button className="btn btn-primary" disabled={enviando} type="submit">
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link de recuperação'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setModo(modo === 'entrar' ? 'recuperar' : 'entrar'); setMsg(null) }}>
          {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar para o login'}
        </button>
      </form>
    </Moldura>
  )
}

export function NovaSenha({ onConcluir }) {
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState(null)
  const salvar = async e => {
    e.preventDefault()
    if (senha.length < 8) { setMsg('A senha precisa ter pelo menos 8 caracteres.'); return }
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) setMsg(error.message); else onConcluir()
  }
  return (
    <Moldura>
      <form className="stack-2" onSubmit={salvar}>
        <div className="t-title">Criar nova senha</div>
        <Field label="Nova senha (mínimo 8 caracteres)">
          <input className="ipt" type="password" autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} autoFocus />
        </Field>
        {msg && <div className="card-danger t-caption">{msg}</div>}
        <button className="btn btn-primary" type="submit">Salvar nova senha</button>
      </form>
    </Moldura>
  )
}

const DESCRICAO = {
  projetista: 'Cria, dimensiona e emite projetos.',
  estudante: 'Modo didático: saídas com marca d’água.',
  admin: 'Usuários, dados do escritório e biblioteca.',
  curador: 'Edita a base normativa (global).',
}

export function LoginDemo({ onEntrar }) {
  const [escolhido, setEscolhido] = useState(mockUsuarios[0].id)
  return (
    <Moldura>
      <div className="card-tint t-caption" style={{ marginBottom: 18 }}>
        <strong>Modo demonstração</strong> (sem banco de dados configurado). Escolha um perfil para entrar.
      </div>
      <div className="stack-1" role="radiogroup" aria-label="Perfil">
        {mockUsuarios.map(u => (
          <label key={u.id} className="card-flat row-flex" style={{ padding: '12px 14px', cursor: 'pointer',
            borderColor: escolhido === u.id ? 'var(--primary)' : undefined,
            boxShadow: escolhido === u.id ? '0 0 0 3px var(--primary-tint)' : undefined }}>
            <input type="radio" name="perfil" checked={escolhido === u.id} onChange={() => setEscolhido(u.id)} style={{ accentColor: 'var(--primary)' }} />
            <div>
              <div className="t-strong">{u.nome}</div>
              <div className="t-caption">{DESCRICAO[u.role]}</div>
            </div>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
        onClick={() => onEntrar(mockUsuarios.find(u => u.id === escolhido))}>Entrar</button>
    </Moldura>
  )
}
