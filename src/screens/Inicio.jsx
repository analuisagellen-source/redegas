import { useMemo } from 'react'
import { Icon, PageHeader } from '../components'
import { useProjetos } from '../app/ProjetosContext'
import { calcularProjeto } from '../app/calculo'
import { fmtData } from '../utils/format'

const LIMITE = 5

function CardLista({ titulo, itens, vazio, goto, extra }) {
  return (
    <div className="card stack-2">
      <div className="t-micro">{titulo}</div>
      {itens.length === 0 ? <div className="t-caption">{vazio}</div> : (
        <div className="stack-1">
          {itens.slice(0, LIMITE).map(p => (
            <button key={p.id} className="btn btn-secondary" style={{ justifyContent: 'space-between', height: 'auto', padding: '10px 12px', whiteSpace: 'normal' }}
              onClick={() => goto('projeto', { id: p.id })}>
              <span style={{ textAlign: 'left' }}>
                <div className="t-strong">{p.nome}</div>
                <div className="t-caption" style={{ fontWeight: 400 }}>{p.estado} · {p.gas} · atualizado em {fmtData(p.atualizadoEm)}</div>
              </span>
              {extra?.(p)}
            </button>
          ))}
          {itens.length > LIMITE && <div className="t-caption">e mais {itens.length - LIMITE} — veja em Projetos.</div>}
        </div>
      )}
    </div>
  )
}

export default function Inicio({ goto, usuario }) {
  const { projetos } = useProjetos()
  const ativos = projetos.filter(p => p.status !== 'arquivado')

  const impeditivas = useMemo(() => {
    const m = new Map()
    for (const p of ativos) {
      const c = calcularProjeto(p)
      const n = c.erros.length + c.pendencias.filter(x => x.severidade === 'impeditiva').length
      if (n) m.set(p.id, n)
    }
    return m
  }, [ativos])

  const rascunhos = ativos.filter(p => p.status === 'rascunho')
  const comPendencia = ativos.filter(p => impeditivas.has(p.id))
  const emitidos = ativos.filter(p => p.status === 'emitido')

  return (
    <div className="page">
      <PageHeader titulo={`Olá, ${usuario.nome.split(' ')[0]}`} subtitulo={`Resumo dos projetos do ${usuario.organizacao}`}
        acoes={<button className="btn btn-primary" onClick={() => goto('novo')}><Icon name="plus" /> Novo projeto</button>} />

      <div className="grid-3">
        <CardLista titulo="Em rascunho" itens={rascunhos} vazio="Nenhum projeto em rascunho." goto={goto} />
        <CardLista titulo="Com pendências impeditivas" itens={comPendencia} vazio="Nenhuma pendência impeditiva." goto={goto}
          extra={p => <span className="chip danger">{impeditivas.get(p.id)}</span>} />
        <CardLista titulo="Emitidos recentemente" itens={emitidos} vazio="A emissão de revisões chega numa próxima entrega." goto={goto} />
      </div>

      <div className="card-flat row-flex" style={{ marginTop: 16 }}>
        <Icon name="book" />
        <div className="t-caption">
          <strong>Base normativa:</strong> NBR 15526:2012, NBR 15358:2020 (corr. 2021), NBR 13523:2019, NBR 13103:2020.
          Nenhuma edição nova afeta os projetos da organização.
        </div>
      </div>
    </div>
  )
}
