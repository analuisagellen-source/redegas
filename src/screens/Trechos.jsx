// Entrada tabular de trechos (seção 5.5). Cada edição recalcula na hora.

import { useState } from 'react'
import { diametrosDisponiveis, materialPorId, potenciaDoAparelho } from '../domain/calc/index.ts'
import { ConfirmDialog, Empty, Field, Icon, Semaforo, Sheet, useToast } from '../components'
import { useProjetos } from '../app/ProjetosContext'
import { novoTrecho } from '../app/mockData'
import { fmt, fmtInt, novoId, parseNum } from '../utils/format'
import TrechoDetalhes from './TrechoDetalhes'

/** Campo numérico pt-BR: guarda o texto enquanto digita, grava ao sair */
function NumCell({ valor, onCommit, vazio = 0, largura = 64, label }) {
  const [txt, setTxt] = useState(null)
  const mostrado = txt ?? (valor == null ? '' : fmt(valor, Number.isInteger(valor) ? 0 : 2))
  return (
    <input className="ipt ipt-cell ipt-num" style={{ width: largura }} value={mostrado} aria-label={label}
      onFocus={e => { setTxt(mostrado); e.target.select() }}
      onChange={e => setTxt(e.target.value)}
      onBlur={() => { const n = parseNum(txt); onCommit(n == null ? vazio : n); setTxt(null) }}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()} />
  )
}

const COLUNAS_COLAR = 'Trecho · Montante · L horizontal · L ascendente · L descendente · Potência no ponto (kcal/h)'

function ColarPlanilha({ trechos, onAplicar, onClose }) {
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')

  const aplicar = () => {
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const porNome = new Map(trechos.map(t => [t.nome, t.id]))
    const novos = []
    for (const [i, linha] of linhas.entries()) {
      const c = linha.split(/\t|;/).map(x => x.trim())
      if (c.length < 3) { setErro(`Linha ${i + 1}: preciso de pelo menos trecho, montante e L horizontal.`); return }
      const id = novoId()
      const montanteId = c[1] ? porNome.get(c[1]) : null
      if (c[1] && !montanteId) { setErro(`Linha ${i + 1}: montante "${c[1]}" não encontrado (ele precisa vir antes).`); return }
      const pot = parseNum(c[5])
      novos.push(novoTrecho(id, c[0], montanteId ?? null, {
        lh: parseNum(c[2]) ?? 0, lasc: parseNum(c[3]) ?? 0, ldesc: parseNum(c[4]) ?? 0,
        aparelhos: pot ? [{ nome: 'Ponto (colado da planilha)', potencia: pot, quantidade: 1 }] : [],
      }))
      porNome.set(c[0], id)
    }
    if (!novos.length) { setErro('Nada para colar.'); return }
    onAplicar(novos)
  }

  return (
    <Sheet titulo="Colar da planilha" subtitulo="Copie as linhas no Excel e cole aqui" onClose={onClose}
      rodape={<><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={aplicar}>Adicionar trechos</button></>}>
      <div className="stack-2">
        <div className="card-tint t-caption">Colunas, nesta ordem: <strong>{COLUNAS_COLAR}</strong>. Separe por tabulação (Excel) ou ponto e vírgula. O montante pode ser um trecho já existente ou uma linha anterior.</div>
        <Field label="Linhas">
          <textarea className="ipt" rows={12} value={texto} onChange={e => { setTexto(e.target.value); setErro('') }}
            placeholder={'AB\t\t10\t0\t0\t\nBC\tAB\t5\t3\t0\t13390'} style={{ fontFamily: 'monospace' }} />
        </Field>
        {erro && <div className="card-danger t-caption">{erro}</div>}
      </div>
    </Sheet>
  )
}

export default function Trechos({ projeto, calc, goto }) {
  const { atualizar } = useProjetos()
  const toast = useToast()
  const [detalhe, setDetalhe] = useState(null)
  const [remover, setRemover] = useState(null)
  const [colar, setColar] = useState(false)
  const trechos = projeto.trechos
  const material = materialPorId(projeto.materialId)
  const diams = material ? diametrosDisponiveis(material) : []
  const conexoes = material?.conexoes ?? []
  const situacao = new Map(calc.linhas.map(l => [l.id, l]))

  const salvar = novos => atualizar(projeto.id, { trechos: novos })
  const setT = (id, patch) => salvar(trechos.map(t => (t.id === id ? { ...t, ...patch } : t)))

  const adicionar = () => {
    const ultimo = trechos[trechos.length - 1]
    salvar([...trechos, novoTrecho(novoId(), `T${trechos.length + 1}`, ultimo?.id ?? null, { dentroUnidade: ultimo?.dentroUnidade ?? false })])
  }
  const duplicar = t => {
    const i = trechos.findIndex(x => x.id === t.id)
    const copia = { ...structuredClone(t), id: novoId(), nome: `${t.nome}'` }
    salvar([...trechos.slice(0, i + 1), copia, ...trechos.slice(i + 1)])
    toast(`Trecho ${t.nome} duplicado.`)
  }
  const confirmarRemocao = t => {
    // trechos a jusante passam a sair do montante do removido
    salvar(trechos.filter(x => x.id !== t.id).map(x => (x.montanteId === t.id ? { ...x, montanteId: t.montanteId } : x)))
    setRemover(null)
    toast(`Trecho ${t.nome} removido.`)
  }

  if (!trechos.length) {
    return (
      <div className="card-flat">
        <Empty titulo="Nenhum trecho cadastrado"
          texto="Comece pelo trecho que sai do regulador (ou da central/medidor). Cada trecho seguinte indica de qual trecho ele parte (montante)."
          acao={<div className="row-flex" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={adicionar}><Icon name="plus" /> Primeiro trecho</button>
            <button className="btn btn-secondary" onClick={() => setColar(true)}><Icon name="paste" /> Colar da planilha</button>
          </div>} />
        {colar && <ColarPlanilha trechos={trechos} onClose={() => setColar(false)} onAplicar={n => { salvar([...trechos, ...n]); setColar(false); toast(`${n.length} trechos adicionados.`) }} />}
      </div>
    )
  }

  return (
    <div className="stack-2">
      <div className="row-between">
        <div className="t-caption" style={{ flex: 1 }}>
          Material: <strong>{material?.nome}</strong> · comprimentos em metros · conexões em quantidade.
          A situação (●) é recalculada a cada alteração.
        </div>
        <div className="row-flex">
          <button className="btn btn-secondary" onClick={() => setColar(true)}><Icon name="paste" /> Colar da planilha</button>
          <button className="btn btn-secondary" onClick={() => goto('projeto', { id: projeto.id, aba: 'dimensionamento' })}><Icon name="gauge" /> Ver dimensionamento</button>
          <button className="btn btn-primary" onClick={adicionar}><Icon name="plus" /> Adicionar trecho</button>
        </div>
      </div>

      {calc.erros.length > 0 && <div className="card-danger t-caption">{calc.erros.map((e, i) => <div key={i}>{e}</div>)}</div>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th />
              <th>Trecho</th>
              <th>Montante</th>
              <th className="r">L horiz.</th>
              <th className="r">L asc.</th>
              <th className="r">L desc.</th>
              {conexoes.map(c => <th key={c.id} className="r" title={c.nome}>{c.nome.replace('de compressão', '').trim()}</th>)}
              <th>Aparelhos no ponto</th>
              <th title="Trecho dentro de apartamento/casa: F = 100% e pressão ≤ 7,5 kPa">Na unidade</th>
              <th className="r" title="Pressão de saída do regulador no início do trecho (vazio = sem regulador)">Regulador (kPa)</th>
              <th>Diâmetro</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {trechos.map(t => {
              const l = situacao.get(t.id)
              const pot = t.aparelhos.reduce((s, a) => s + potenciaDoAparelho(a), 0)
              return (
                <tr key={t.id}>
                  <td>{l ? <Semaforo situacao={l.situacao} /> : null}</td>
                  <td><input className="ipt ipt-cell" style={{ width: 90 }} value={t.nome} aria-label="Nome do trecho"
                    onChange={e => setT(t.id, { nome: e.target.value })} /></td>
                  <td>
                    <select className="ipt ipt-cell" style={{ width: 100 }} value={t.montanteId ?? ''} aria-label="Trecho de montante"
                      onChange={e => setT(t.id, { montanteId: e.target.value || null })}>
                      <option value="">— início —</option>
                      {trechos.filter(x => x.id !== t.id).map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                    </select>
                  </td>
                  <td className="r"><NumCell valor={t.lh} label="L horizontal" onCommit={v => setT(t.id, { lh: v })} /></td>
                  <td className="r"><NumCell valor={t.lasc} label="L ascendente" onCommit={v => setT(t.id, { lasc: v })} /></td>
                  <td className="r"><NumCell valor={t.ldesc} label="L descendente" onCommit={v => setT(t.id, { ldesc: v })} /></td>
                  {conexoes.map(c => (
                    <td key={c.id} className="r">
                      <NumCell valor={t.conexoes?.[c.id] ?? 0} largura={48} label={c.nome}
                        onCommit={v => setT(t.id, { conexoes: { ...t.conexoes, [c.id]: Math.max(0, Math.round(v)) } })} />
                    </td>
                  ))}
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDetalhe(t)} style={{ minWidth: 150, justifyContent: 'space-between' }}>
                      <span>{t.aparelhos.length ? `${t.aparelhos.reduce((s, a) => s + (Number(a.quantidade) || 0), 0)} ap.` : 'Nenhum'}</span>
                      {pot > 0 && <span className="unit">{fmtInt(pot)} kcal/h</span>}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={!!t.dentroUnidade} aria-label="Dentro da unidade" style={{ accentColor: 'var(--primary)' }}
                      onChange={e => setT(t.id, { dentroUnidade: e.target.checked })} />
                  </td>
                  <td className="r"><NumCell valor={t.reguladorSaida} vazio={null} label="Pressão de saída do regulador" onCommit={v => setT(t.id, { reguladorSaida: v })} /></td>
                  <td>
                    <select className="ipt ipt-cell" style={{ width: 120 }} value={t.dnForcado ?? ''} aria-label="Diâmetro"
                      onChange={e => setT(t.id, { dnForcado: e.target.value || null })}>
                      <option value="">Auto{l && !t.dnForcado ? ` (${l.dn.split(' ')[0]})` : ''}</option>
                      {diams.map(d => <option key={d.dn} value={d.dn}>{d.dn}</option>)}
                    </select>
                  </td>
                  <td className="r">
                    <button className="btn btn-ghost btn-sm" title="Detalhes: aparelhos, F, ignorar" onClick={() => setDetalhe(t)}><Icon name="list" size={16} /></button>
                    <button className="btn btn-ghost btn-sm" title="Duplicar linha" onClick={() => duplicar(t)}><Icon name="copy" size={16} /></button>
                    <button className="btn btn-danger btn-sm" title="Remover" onClick={() => setRemover(t)}><Icon name="trash" size={16} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detalhe && <TrechoDetalhes projeto={projeto} trecho={detalhe} onClose={() => setDetalhe(null)}
        onSalvar={novo => { const { aparelhos, ...resto } = novo; setT(detalhe.id, { ...resto, aparelhos: aparelhos.map(({ _k, ...a }) => a) }); setDetalhe(null); toast('Trecho atualizado.') }} />}
      {colar && <ColarPlanilha trechos={trechos} onClose={() => setColar(false)}
        onAplicar={n => { salvar([...trechos, ...n]); setColar(false); toast(`${n.length} trechos adicionados.`) }} />}
      {remover && (
        <ConfirmDialog titulo={`Remover o trecho ${remover.nome}?`} perigo confirmar="Remover"
          texto="Os trechos que partiam dele passam a partir do trecho de montante dele. Esta ação não pode ser desfeita."
          onCancel={() => setRemover(null)} onConfirm={() => confirmarRemocao(remover)} />
      )}
    </div>
  )
}
