// Equipe da organização. Administrador: define papel e ativa/desativa membros.
// Curador: vê todos e também define a organização (libera contas novas).
// Quem pode o quê é garantido pelo banco (RLS), não por esta tela.

import { useCallback, useEffect, useState } from 'react'
import { PageHeader, useToast } from '../components'
import { atualizarMembro, listarMembros, listarOrganizacoes, mensagemErro } from '../services/projetos'

const PAPEIS = [['projetista', 'Projetista'], ['estudante', 'Estudante'], ['admin', 'Administrador'], ['curador', 'Curador técnico']]

export default function Equipe({ usuario }) {
  const toast = useToast()
  const curador = usuario.role === 'curador'
  const [membros, setMembros] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    try {
      setMembros(await listarMembros())
      if (curador) setOrgs(await listarOrganizacoes())
    } catch (e) { setErro(mensagemErro(e)) }
  }, [curador])
  useEffect(() => { carregar() }, [carregar])

  const mudar = async (m, patch) => {
    setMembros(ms => ms.map(x => (x.id === m.id ? { ...x, ...patch } : x)))
    try { await atualizarMembro(m.id, patch); toast('Alteração salva.') } catch (e) { toast(mensagemErro(e), 'erro'); carregar() }
  }

  const pendentes = (membros ?? []).filter(m => !m.role || !m.organization_id)

  return (
    <div className="page">
      <PageHeader titulo="Equipe" subtitulo={curador ? 'Todas as contas do sistema' : `Membros do ${usuario.organizacao}`} />

      <div className="card-tint t-caption" style={{ marginBottom: 16 }}>
        <strong>Como incluir uma pessoa:</strong> por enquanto, a conta é criada no painel do Supabase
        (Authentication → Users → Add user). Ela aparece aqui sem papel; {curador ? 'defina o escritório e o papel.' : 'peça ao curador para vinculá-la ao escritório e depois defina o papel.'}
        {' '}O convite por e-mail direto pelo app chega numa próxima entrega.
      </div>

      {erro && <div className="card-danger">{erro}</div>}
      {curador && pendentes.length > 0 && <div className="card-warn t-caption" style={{ marginBottom: 12 }}>{pendentes.length} conta(s) aguardando liberação.</div>}
      {!membros ? <div className="t-caption">Carregando…</div> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Nome</th><th>E-mail</th>{curador && <th>Escritório</th>}<th>Papel</th><th>Acesso</th></tr></thead>
            <tbody>
              {membros.map(m => {
                const euMesmo = m.id === usuario.id
                return (
                  <tr key={m.id}>
                    <td className="t-strong">{m.nome || '—'}{euMesmo && <span className="unit"> (você)</span>}</td>
                    <td>{m.email}</td>
                    {curador && (
                      <td>
                        <select className="ipt ipt-cell" style={{ width: 200 }} value={m.organization_id ?? ''}
                          onChange={e => mudar(m, { organization_id: e.target.value || null })}>
                          <option value="">— sem escritório —</option>
                          {orgs.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                      </td>
                    )}
                    <td>
                      <select className="ipt ipt-cell" style={{ width: 170 }} value={m.role ?? ''} disabled={euMesmo}
                        onChange={e => mudar(m, { role: e.target.value || null })}>
                        <option value="">— sem papel —</option>
                        {PAPEIS.filter(([v]) => curador || v !== 'curador').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      <label className="check">
                        <input type="checkbox" checked={m.ativo} disabled={euMesmo} onChange={e => mudar(m, { ativo: e.target.checked })} />
                        {m.ativo ? 'Ativo' : 'Desativado'}
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
