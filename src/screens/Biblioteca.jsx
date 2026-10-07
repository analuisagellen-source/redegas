// Biblioteca técnica (somente leitura nesta entrega). A edição pelo curador
// e pela organização chega com o banco de dados.

import { useState } from 'react'
import { APARELHOS_PADRAO, ESTADOS, MATERIAIS, VAPORIZACAO_A21, VAPORIZACAO_A22 } from '../domain/calc/index.ts'
import { PageHeader } from '../components'
import { fmt, fmtInt } from '../utils/format'

const ABAS = [['materiais', 'Materiais e diâmetros'], ['aparelhos', 'Aparelhos (Anexo D)'], ['vaporizacao', 'Vaporização GLP'], ['estados', 'Estados']]

export default function Biblioteca() {
  const [aba, setAba] = useState('materiais')
  return (
    <div className="page">
      <PageHeader titulo="Biblioteca técnica" subtitulo="Tabelas de referência usadas pelo motor de cálculo — somente leitura nesta versão" />
      <div className="tabs" role="tablist" style={{ marginBottom: 20 }}>
        {ABAS.map(([id, r]) => <button key={id} role="tab" aria-selected={aba === id} onClick={() => setAba(id)}>{r}</button>)}
      </div>

      {aba === 'materiais' && (
        <div className="stack-3">
          {MATERIAIS.map(m => (
            <div key={m.id} className="stack-1">
              <div className="row-flex"><div className="t-title">{m.nome}</div><span className="t-caption">{m.origem}</span></div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>DN</th><th className="r">DI (mm)</th>{m.conexoes.map(c => <th key={c.id} className="r">{c.nome} (m)</th>)}<th>Oferecido</th></tr></thead>
                  <tbody>
                    {m.diametros.map(d => (
                      <tr key={d.dn}>
                        <td>{d.dn}</td>
                        <td className="r">{d.di == null ? '—' : fmt(d.di, 1)}</td>
                        {m.conexoes.map(c => <td key={c.id} className="r">{d.leq[c.id] == null ? '—' : fmt(d.leq[c.id], 2)}</td>)}
                        <td>{d.di == null ? <span className="chip">Sem DI cadastrado</span> : <span className="chip success">Sim</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 'aparelhos' && (
        <div className="tbl-wrap" style={{ maxWidth: 700 }}>
          <table className="tbl">
            <thead><tr><th>Aparelho</th><th className="r">kW</th><th className="r">kcal/h</th></tr></thead>
            <tbody>{APARELHOS_PADRAO.map(a => <tr key={a.id}><td>{a.nome}</td><td className="r">{fmt(a.kw, 1)}</td><td className="r">{fmtInt(a.kcalH)}</td></tr>)}</tbody>
          </table>
          <div className="t-caption" style={{ padding: 12 }}>Padrão na falta do dado do fabricante (NBR 15526:2012, Anexo D). Equipamentos comerciais exigem a potência do fabricante.</div>
        </div>
      )}

      {aba === 'vaporizacao' && (
        <div className="grid-2">
          {[['A.2.1 — Tabela padrão', VAPORIZACAO_A21], ['A.2.2 — Tabela alternativa', VAPORIZACAO_A22]].map(([t, rows]) => (
            <div key={t} className="stack-1">
              <div className="t-strong">{t}</div>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Recipiente</th><th className="r">Vaporização (kg/h)</th></tr></thead>
                <tbody>{rows.map(r => <tr key={r.id}><td>{r.id}</td><td className="r">{fmt(r.vaporizacao, 1)}</td></tr>)}</tbody>
              </table></div>
            </div>
          ))}
          <div className="card-warn t-caption" style={{ gridColumn: '1 / -1' }}>
            Taxa de vaporização de referência. Consulte a tabela da distribuidora de GLP da sua região, pois a vaporização varia com o fornecedor e com o clima.
          </div>
        </div>
      )}

      {aba === 'estados' && (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>UF</th><th>Estado</th><th>Gases</th><th>Normas do Corpo de Bombeiros</th></tr></thead>
            <tbody>{ESTADOS.map(e => <tr key={e.uf}><td className="t-strong">{e.uf}</td><td>{e.nome}</td><td>{e.gases.join(', ')}</td><td className="wrap-cell">{e.normas.join(' · ')}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
