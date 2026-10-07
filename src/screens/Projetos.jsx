import { useState } from 'react'
import { ConfirmDialog, Empty, Icon, PageHeader, useToast } from '../components'
import { useProjetos, USAR_MOCK } from '../app/ProjetosContext'
import { materialPorId } from '../domain/calc/index.ts'
import { fmt, fmtData } from '../utils/format'

const USO = { residencial: 'Residencial', comercial: 'Comercial' }

export default function Projetos({ goto }) {
  const { projetos, arquivar, restaurarDemo } = useProjetos()
  const [verArquivados, setVerArquivados] = useState(false)
  const [busca, setBusca] = useState('')
  const [confirmar, setConfirmar] = useState(null)
  const toast = useToast()

  const lista = projetos
    .filter(p => (verArquivados ? p.status === 'arquivado' : p.status !== 'arquivado'))
    .filter(p => p.nome.toLowerCase().includes(busca.trim().toLowerCase()))

  return (
    <div className="page">
      <PageHeader titulo="Projetos" subtitulo="Redes de distribuição interna de gás"
        acoes={<>
          {USAR_MOCK && <button className="btn btn-secondary" onClick={() => setConfirmar('demo')}>Restaurar demonstração</button>}
          <button className="btn btn-primary" onClick={() => goto('novo')}><Icon name="plus" /> Novo projeto</button>
        </>} />

      <div className="row-flex" style={{ marginBottom: 14 }}>
        <input className="ipt" style={{ maxWidth: 320 }} placeholder="Buscar pelo nome…" value={busca} onChange={e => setBusca(e.target.value)} />
        <label className="check"><input type="checkbox" checked={verArquivados} onChange={e => setVerArquivados(e.target.checked)} /> Ver arquivados</label>
      </div>

      {lista.length === 0 ? (
        <div className="card-flat">
          <Empty titulo={verArquivados ? 'Nenhum projeto arquivado' : 'Nenhum projeto ainda'}
            texto={verArquivados ? 'Projetos arquivados aparecem aqui.' : 'Crie o primeiro projeto para começar a dimensionar.'}
            acao={!verArquivados && <button className="btn btn-primary" onClick={() => goto('novo')}><Icon name="plus" /> Novo projeto</button>} />
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Projeto</th><th>Local</th><th>Uso</th><th>Gás</th><th>Material</th><th className="r">Pressão</th>
              <th className="r">Trechos</th><th>Situação</th><th>Atualizado</th><th />
            </tr></thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => goto('projeto', { id: p.id })}>
                  <td className="t-strong">{p.nome}</td>
                  <td>{p.municipio} / {p.estado}</td>
                  <td>{USO[p.uso]}</td>
                  <td><span className="chip">{p.gas}</span></td>
                  <td>{materialPorId(p.materialId)?.nome}</td>
                  <td className="r">{fmt(Number(p.pressaoOperacao), 1)} <span className="unit">kPa</span></td>
                  <td className="r">{p.trechos.length}</td>
                  <td><span className={`chip ${p.status === 'arquivado' ? '' : 'info'}`}>{p.status === 'arquivado' ? 'Arquivado' : 'Rascunho'}</span></td>
                  <td>{fmtData(p.atualizadoEm)}</td>
                  <td className="r" onClick={e => e.stopPropagation()}>
                    {p.status !== 'arquivado' && (
                      <button className="btn btn-ghost btn-sm" title="Arquivar" onClick={() => setConfirmar(p)}><Icon name="archive" size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmar === 'demo' && (
        <ConfirmDialog titulo="Restaurar dados de demonstração?" perigo confirmar="Restaurar"
          texto="Os projetos voltam ao estado original de demonstração. O que você alterou neste navegador será perdido."
          onCancel={() => setConfirmar(null)}
          onConfirm={() => { restaurarDemo(); setConfirmar(null); toast('Demonstração restaurada.') }} />
      )}
      {confirmar && confirmar !== 'demo' && (
        <ConfirmDialog titulo={`Arquivar "${confirmar.nome}"?`} confirmar="Arquivar"
          texto="O projeto sai da lista principal, mas não é apagado. Você encontra em “Ver arquivados”."
          onCancel={() => setConfirmar(null)}
          onConfirm={() => { arquivar(confirmar.id); setConfirmar(null); toast('Projeto arquivado.') }} />
      )}
    </div>
  )
}
