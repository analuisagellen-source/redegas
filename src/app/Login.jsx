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
  const [modo, setModo] = useState('entrar') // entrar | recuperar | criar
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

  // Qualquer pessoa pode criar a conta, mas só entra quem foi convidado:
  // o papel e o escritório vêm do convite no banco, nunca do navegador.
  const criarConta = async e => {
    e.preventDefault()
    if (senha.length < 8) { setMsg({ tipo: 'erro', texto: 'A senha precisa ter pelo menos 8 caracteres.' }); return }
    setEnviando(true); setMsg(null)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha,
      options: { emailRedirectTo: window.location.origin } })
    setEnviando(false)
    if (error) { setMsg({ tipo: 'erro', texto: /registered/i.test(error.message) ? 'Este e-mail já tem conta. Use "Entrar".' : error.message }); return }
    if (!data.session) setMsg({ tipo: 'ok', texto: 'Conta criada! Abra o e-mail que enviamos e clique no link de confirmação para entrar.' })
  }

  const acao = { entrar, recuperar, criar: criarConta }[modo]
  const rotulo = { entrar: 'Entrar', recuperar: 'Enviar link de recuperação', criar: 'Criar minha conta' }[modo]
  const trocar = m => { setModo(m); setMsg(null) }

  return (
    <Moldura>
      <form className="stack-2" onSubmit={acao}>
        {modo === 'criar' && <div className="t-title">Criar conta</div>}
        <Field label="E-mail">
          <input className="ipt" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </Field>
        {modo !== 'recuperar' && (
          <Field label={modo === 'criar' ? 'Escolha uma senha (mínimo 8 caracteres)' : 'Senha'}>
            <input className="ipt" type="password" autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
              value={senha} onChange={e => setSenha(e.target.value)} required />
          </Field>
        )}
        {msg && <div className={msg.tipo === 'erro' ? 'card-danger t-caption' : 'card-tint t-caption'}>{msg.texto}</div>}
        <button className="btn btn-primary" disabled={enviando} type="submit">{enviando ? 'Aguarde…' : rotulo}</button>
        {modo === 'entrar' ? (
          <div className="row-between">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => trocar('criar')}>Criar minha conta</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => trocar('recuperar')}>Esqueci minha senha</button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => trocar('entrar')}>Voltar para o login</button>
        )}
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
