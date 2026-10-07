// Tela central: tabela trecho a trecho (Anexo A.6) com semáforo.

import { useState } from 'react'
import { ORIGEM } from '../domain/calc/index.ts'
import { Icon, Semaforo, Sheet, Val } from '../components'
import { useProjetos } from '../app/ProjetosContext'
import { fmt } from '../utils/format'
import TrechoDetalhes from './TrechoDetalhes'

export function TabelaDimensionamento({ calc, selecionado, onSelecionar, compacta }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {!compacta && <th />}
            <th>Trecho</th>
            <th className="r">Ap. a jusante</th>
            <th className="r">C <span className="unit">kcal/h</span></th>
            <th className="r">C <span className="unit">kW</span></th>
            <th className="r">F <span className="unit">%</span></th>
            <th className="r">A <span className="unit">kcal/h</span></th>
            <th className="r">Q <span className="unit">m³/h</span></th>
            <th className="r">V <span className="unit">m/s</span></th>
            <th className="r">L hor.</th>
            <th className="r">L asc.</th>
            <th className="r">L desc.</th>
            <th className="r">L eq.</th>
            <th className="r">L total <span className="unit">m</span></th>
            <th className="r">P inicial <span className="unit">kPa</span></th>
            <th className="r">ΔP <span className="unit">kPa</span></th>
            <th className="r">P final <span className="unit">kPa</span></th>
            <th className="r">Perda acum. <span className="unit">%</span></th>
            <th className="r">Perda acum. <span className="unit">kPa</span></th>
            <th className="r">Limite <span className="unit">%</span></th>
            <th>DN</th>
            <th className="r">DI <span className="unit">mm</span></th>
            <th>Material</th>
            <th>Situação</th>
            {!compacta && <th>Observações</th>}
          </tr>
        </thead>
        <tbody>
          {calc.linhas.map(l => (
            <tr key={l.id} className={selecionado === l.id ? 'sel' : ''} style={{ cursor: onSelecionar ? 'pointer' : undefined }}
              onClick={() => onSelecionar?.(l.id)}>
              {!compacta && <td><Semaforo situacao={l.situacao} /></td>}
              <td className="t-strong" style={{ paddingLeft: 8 + l.nivel * 14 }}>{l.nivel > 0 && <span className="unit">└ </span>}{l.nome}</td>
              <td className="r">{l.aparelhosJusante}</td>
              <td className="r"><Val v={l.cKcalH} casas={0} origem={l.origens.c} /></td>
              <td className="r"><Val v={l.cKw} casas={1} origem={l.origens.c} /></td>
              <td className="r"><Val v={l.f} casas={2} origem={l.fOrigem} /></td>
              <td className="r">{fmt(l.a, 0)}</td>
              <td className="r">{fmt(l.q, 2)}</td>
              <td className="r"><Val v={l.v} casas={2} origem={`${l.origens.v} · limite 20 m/s: ${l.origens.limiteV}`} /></td>
              <td className="r">{fmt(l.lh, 2)}</td>
              <td className="r">{fmt(l.lasc, 2)}</td>
              <td className="r">{fmt(l.ldesc, 2)}</td>
              <td className="r"><Val v={l.leq} origem={l.origens.di} /></td>
              <td className="r">{fmt(l.lTotal, 2)}</td>
              <td className="r">{fmt(l.pi, l.pi >= 10 ? 2 : 3)}</td>
              <td className="r"><Val v={l.pi - l.pf} casas={3}
                origem={`Atrito ${fmt(l.dpAtrito, 4)} kPa (${l.origens.perda}) · desnível ${fmt(l.dpDesnivel, 4)} kPa (${l.origens.desnivel})`} /></td>
              <td className="r">{fmt(l.pf, l.pf >= 10 ? 2 : 3)}</td>
              <td className="r">{fmt(l.perdaAcumPct, 2)}</td>
              <td className="r">{fmt(l.perdaAcumKpa, 3)}</td>
              <td className="r">{l.limitePct != null ? <Val v={l.limitePct} casas={0} origem={l.limiteOrigem} /> : '—'}</td>
              <td>{l.dn}{l.dnForcado && <span className="unit"> (usuário)</span>}</td>
              <td className="r"><Val v={l.di} casas={1} origem={l.origens.di} /></td>
              <td>{l.material}</td>
              <td>
                {compacta ? { verde: 'Atende', amarelo: 'Atende (>90%)', vermelho: 'Reprova', ignorado: 'Ignorado' }[l.situacao]
                  : <span className={`chip ${{ verde: 'success', amarelo: 'warn', vermelho: 'danger', ignorado: 'danger' }[l.situacao]}`}>
                    {{ verde: 'Atende', amarelo: 'Atende (> 90%)', vermelho: 'Reprova', ignorado: 'Ignorado' }[l.situacao]}
                  </span>}
              </td>
              {!compacta && <td className="wrap-cell t-caption">{l.observacoes.join(' ')}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function resumoEstagios(estagios) {
  const cont = new Map()
  estagios.forEach(e => cont.set(e.pEstagio, (cont.get(e.pEstagio) ?? 0) + 1))
  return [...cont].map(([p, n]) => `${n > 1 ? `${n} × ` : ''}${fmt(p, p >= 10 ? 0 : 1)} kPa`).join(' · ')
}

function Resumo({ projeto, calc }) {
  const estagios = [...new Map(calc.linhas.map(l => [l.estagioId, l])).values()]
  const verdes = calc.linhas.filter(l => l.situacao === 'verde').length
  const amarelos = calc.linhas.filter(l => l.situacao === 'amarelo').length
  const vermelhos = calc.linhas.filter(l => l.situacao === 'vermelho' || l.situacao === 'ignorado').length
  return (
    <div className="grid-4">
      <div className="card-flat">
        <div className="t-micro">Gás</div>
        <div className="t-title">{projeto.gas}</div>
        <div className="t-caption">
          PCI <Val v={calc.params.pci} casas={0} un="kcal/m³" origem={ORIGEM.parametrosGas} /> · S <Val v={calc.params.s} casas={1} origem={ORIGEM.parametrosGas} />
        </div>
      </div>
      <div className="card-flat">
        <div className="t-micro">Norma de cálculo</div>
        <div className="t-title">{projeto.uso === 'residencial' ? 'NBR 15526:2012' : 'NBR 15358:2020'}</div>
        <div className="t-caption">{projeto.uso === 'residencial' ? 'Residencial' : 'Comercial (corr. 2021)'}</div>
      </div>
      <div className="card-flat">
        <div className="t-micro">Estágios de pressão</div>
        <div className="t-title">{estagios.length || '—'}</div>
        <div className="t-caption">{resumoEstagios(estagios)}</div>
      </div>
      <div className="card-flat">
        <div className="t-micro">Situação dos trechos</div>
        <div className="row-flex" style={{ marginTop: 6 }}>
          <span className="chip success">{verdes} atendem</span>
          {amarelos > 0 && <span className="chip warn">{amarelos} &gt; 90%</span>}
          {vermelhos > 0 && <span className="chip danger">{vermelhos} reprovam</span>}
        </div>
      </div>
    </div>
  )
}

export default function Dimensionamento({ projeto, calc, goto }) {
  const { atualizar } = useProjetos()
  const [sel, setSel] = useState(null)
  const [editar, setEditar] = useState(null)
  const linhaSel = calc.linhas.find(l => l.id === sel)

  if (calc.erros.length) {
    return (
      <div className="card-danger stack-1">
        <strong>Não foi possível dimensionar:</strong>
        {calc.erros.map((e, i) => <div key={i}>{e}</div>)}
        <div><button className="btn btn-secondary btn-sm" onClick={() => goto('projeto', { id: projeto.id, aba: 'dados' })}>Corrigir dados do projeto</button></div>
      </div>
    )
  }
  if (!calc.linhas.length) {
    return (
      <div className="card-flat empty">
        <div className="t-title">Ainda não há trechos</div>
        <div style={{ marginBottom: 16 }}>Cadastre os trechos da rede para ver o dimensionamento.</div>
        <button className="btn btn-primary" onClick={() => goto('projeto', { id: projeto.id, aba: 'trechos' })}><Icon name="table" /> Ir para trechos</button>
      </div>
    )
  }

  return (
    <div className="stack-3">
      <Resumo projeto={projeto} calc={calc} />
      <div className="t-caption">Clique num trecho para ver os detalhes. Passe o mouse sobre os valores sublinhados para ver a origem normativa.</div>
      <TabelaDimensionamento calc={calc} selecionado={sel} onSelecionar={setSel} />

      <div className="card-flat stack-2">
        <div className="row-between">
          <div className="t-title">Pendências</div>
          <span className={`chip ${calc.pendencias.length ? 'danger' : 'success'}`}>{calc.pendencias.length}</span>
        </div>
        {calc.pendencias.length === 0 ? <div className="t-caption">Nenhuma pendência no dimensionamento da rede.</div> : (
          <div className="stack-1">
            {calc.pendencias.map((p, i) => (
              <div key={i} className="row-flex" style={{ alignItems: 'flex-start' }}>
                <span className={`chip ${p.severidade === 'impeditiva' ? 'danger' : 'warn'}`}>{p.severidade}</span>
                <div style={{ flex: 1 }}><strong>Trecho {p.trecho}:</strong> <span className="t-caption">{p.mensagem}</span></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSel(p.trechoId)}>Ver trecho</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {linhaSel && (
        <Sheet titulo={`Trecho ${linhaSel.nome}`} subtitulo={`DN ${linhaSel.dn} · ${linhaSel.material}`} onClose={() => setSel(null)}
          rodape={<button className="btn btn-primary" onClick={() => setEditar(projeto.trechos.find(t => t.id === linhaSel.id))}>Ajustar diâmetro / ignorar</button>}>
          <div className="stack-2">
            <div className="row-flex"><Semaforo situacao={linhaSel.situacao} /><strong>{{ verde: 'Atende', amarelo: 'Atende, acima de 90% de algum limite', vermelho: 'Reprova', ignorado: 'Reprova — ignorado com justificativa' }[linhaSel.situacao]}</strong></div>
            {[
              ['Potência computada', `${fmt(linhaSel.cKcalH, 0)} kcal/h (${fmt(linhaSel.cKw, 1)} kW)`, linhaSel.origens.c],
              ['Fator de simultaneidade', `${fmt(linhaSel.f, 2)} %`, linhaSel.fOrigem],
              ['Vazão', `${fmt(linhaSel.q, 3)} m³/h`, 'Q = A / PCI (6.4)'],
              ['Comprimento total', `${fmt(linhaSel.lTotal, 2)} m (eq. ${fmt(linhaSel.leq, 2)} m)`, linhaSel.origens.di],
              ['Perda por atrito', `${fmt(linhaSel.dpAtrito, 4)} kPa`, linhaSel.origens.perda],
              ['Variação por desnível', `${fmt(linhaSel.dpDesnivel, 4)} kPa`, linhaSel.origens.desnivel],
              ['Pressão inicial → final', `${fmt(linhaSel.pi, 3)} → ${fmt(linhaSel.pf, 3)} kPa`, linhaSel.regimeAlto ? 'Regime acima de 7,5 kPa (pressões absolutas)' : 'Regime até 7,5 kPa'],
              ['Velocidade', `${fmt(linhaSel.v, 2)} m/s (limite 20)`, linhaSel.origens.limiteV],
              ['Perda acumulada no estágio', `${fmt(linhaSel.perdaAcumPct, 2)} % (${fmt(linhaSel.perdaAcumKpa, 3)} kPa)`, `Estágio de ${fmt(linhaSel.pEstagio, 2)} kPa`],
              ['Limite aplicável', linhaSel.limitePct != null ? `${linhaSel.limitePct} %` : 'Ponto intermediário', linhaSel.limiteOrigem ?? '—'],
              ...(linhaSel.pressaoProjeto != null ? [['Pressão de projeto', `${fmt(linhaSel.pressaoProjeto, 2)} kPa (operação + 50%)`, linhaSel.origens.pressaoProjeto]] : []),
            ].map(([k, v, o]) => (
              <div key={k} className="row-between" style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 8, alignItems: 'flex-start' }}>
                <div><div className="t-strong" style={{ fontSize: 13 }}>{k}</div><div className="t-caption">{o}</div></div>
                <div className="num" style={{ textAlign: 'right' }}>{v}</div>
              </div>
            ))}
            {linhaSel.observacoes.length > 0 && <div className="card-warn t-caption">{linhaSel.observacoes.join(' ')}</div>}
          </div>
        </Sheet>
      )}
      {editar && <TrechoDetalhes projeto={projeto} trecho={editar} onClose={() => setEditar(null)}
        onSalvar={novo => {
          const { aparelhos, ...resto } = novo
          atualizar(projeto.id, { trechos: projeto.trechos.map(t => (t.id === novo.id ? { ...resto, aparelhos: aparelhos.map(({ _k, ...a }) => a) } : t)) })
          setEditar(null)
        }} />}
    </div>
  )
}
