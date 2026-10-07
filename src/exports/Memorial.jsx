// Memorial descritivo e de cálculo (versão simples). Usa os mesmos componentes
// e o mesmo resultado do motor que a tela — nunca um cálculo paralelo.
// O PDF é gerado pela impressão do navegador ("Salvar como PDF").

import { ESTADOS, ORIGEM, materialPorId } from '../domain/calc/index.ts'
import { Icon } from '../components'
import { TabelaDimensionamento } from '../screens/Dimensionamento'
import { fmt, fmtDataHora } from '../utils/format'

function Diagrama({ linhas }) {
  if (!linhas.length) return null
  // folhas em ordem vertical; nós internos centralizados nos filhos
  const filhos = new Map()
  linhas.forEach(l => { if (l.montanteId) filhos.set(l.montanteId, [...(filhos.get(l.montanteId) ?? []), l]) })
  const pos = new Map()
  let folha = 0
  const DX = 150, DY = 46, W = 118, H = 30
  const posicionar = l => {
    const fs = filhos.get(l.id) ?? []
    let y
    if (!fs.length) y = folha++ * DY
    else { const ys = fs.map(posicionar); y = (ys[0] + ys[ys.length - 1]) / 2 }
    pos.set(l.id, { x: l.nivel * DX, y })
    return y
  }
  linhas.filter(l => !l.montanteId).forEach(posicionar)
  const largura = (Math.max(...linhas.map(l => l.nivel)) + 1) * DX
  const altura = folha * DY
  const cor = { verde: '#16a34a', amarelo: '#ca8a04', vermelho: '#dc2626', ignorado: '#dc2626' }
  return (
    <svg viewBox={`-4 -4 ${largura + 8} ${altura + 8}`} style={{ width: '100%', maxWidth: largura + 8, maxHeight: 520 }} role="img" aria-label="Diagrama esquemático da rede">
      {linhas.filter(l => l.montanteId).map(l => {
        const a = pos.get(l.montanteId), b = pos.get(l.id)
        return <path key={`e-${l.id}`} d={`M${a.x + W} ${a.y + H / 2} H${a.x + W + (DX - W) / 2} V${b.y + H / 2} H${b.x}`} fill="none" stroke="#a8a29e" strokeWidth="1.5" />
      })}
      {linhas.map(l => {
        const p = pos.get(l.id)
        return (
          <g key={l.id} transform={`translate(${p.x} ${p.y})`}>
            <rect width={W} height={H} rx="6" fill="#fff" stroke={cor[l.situacao]} strokeWidth="1.5" />
            <text x="8" y="13" fontSize="10" fontWeight="700" fill="#1c1917">{l.nome.length > 16 ? `${l.nome.slice(0, 15)}…` : l.nome}</text>
            <text x="8" y="25" fontSize="9" fill="#57534e">DN {l.dn.split(' ')[0]} · {fmt(l.q, 2)} m³/h</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Memorial({ projeto, calc, usuario }) {
  const didatico = usuario.role === 'estudante'
  const material = materialPorId(projeto.materialId)
  const estado = ESTADOS.find(e => e.uf === projeto.estado)
  const residencial = projeto.uso === 'residencial'
  const justificativas = calc.linhas.flatMap(l => {
    const t = projeto.trechos.find(x => x.id === l.id)
    const out = []
    if (t?.fJustificativa?.trim() && t.fInformado != null) out.push(`Trecho ${l.nome}: F adotado ${fmt(t.fInformado, 2)}% — ${t.fJustificativa.trim()}`)
    if (t?.ignorar && t.justificativa?.trim()) out.push(`Trecho ${l.nome}: reprovação aceita — ${t.justificativa.trim()}`)
    return out
  })

  return (
    <div className="stack-2">
      <div className="row-between no-print">
        <div className="t-caption">Pré-visualização. Para gerar o PDF, clique no botão e escolha <strong>“Salvar como PDF”</strong> como impressora.</div>
        <button className="btn btn-primary" disabled={!calc.ok || !calc.linhas.length} onClick={() => window.print()}>
          <Icon name="printer" /> Gerar PDF
        </button>
      </div>
      {!calc.ok && <div className="card-danger no-print">Corrija os erros do projeto antes de gerar o memorial.</div>}

      <article className="memorial card" style={{ padding: 28 }}>
        {didatico && <div className="marca-dagua"><span>Uso didático<br />sem validade para ART/RRT</span></div>}

        <header className="row-between" style={{ alignItems: 'flex-start', borderBottom: '1px solid #ddd', paddingBottom: 12 }}>
          <div>
            <div className="t-micro">{usuario.organizacao}</div>
            <h1>Memorial descritivo e de cálculo — rede de distribuição interna de {projeto.gas}</h1>
            <div className="t-caption">{projeto.nome} · {projeto.municipio || '—'} / {projeto.estado}</div>
          </div>
          <div className="t-caption" style={{ textAlign: 'right' }}>
            Gerado em {fmtDataHora(new Date().toISOString())}<br />por {usuario.nome}<br />
            Situação: <strong>Rascunho — sem revisão emitida</strong>
          </div>
        </header>

        <section>
          <h2>1. Identificação</h2>
          <p>
            Obra: <strong>{projeto.nome}</strong>. Uso: {residencial ? 'residencial' : 'comercial'} ({projeto.tipoUso}),
            edificação {projeto.tipologia === 'vertical' ? 'vertical' : 'térrea'}. Localização: {projeto.municipio || '—'} / {estado?.nome}.
          </p>
          <p>Responsável técnico: {didatico ? <em>não aplicável em modo didático</em> : '______________________________  Registro CREA/CAU: ____________'}</p>
        </section>

        <section>
          <h2>2. Normas aplicadas</h2>
          <ul>
            <li>{residencial ? 'ABNT NBR 15526:2012 — redes de distribuição interna para uso residencial' : 'ABNT NBR 15358:2020 (versão corrigida 2021) — redes de distribuição interna para uso não residencial'}</li>
            <li>ABNT NBR 13103:2020 — instalação de aparelhos a gás</li>
            {projeto.gas === 'GLP' && <li>ABNT NBR 13523:2019 — central de GLP</li>}
            {estado?.normas.map(n => <li key={n}>Corpo de Bombeiros — {estado.uf}: {n}</li>)}
          </ul>
        </section>

        <section>
          <h2>3. Premissas e parâmetros</h2>
          <ul>
            <li>PCI do {projeto.gas}: {fmt(calc.params.pci, 0)} kcal/m³; densidade relativa ao ar: {fmt(calc.params.s, 1)} ({ORIGEM.parametrosGas}).</li>
            <li>Pressão de operação do 1º estágio: {fmt(Number(projeto.pressaoOperacao), 2)} kPa{projeto.trechos.some(t => t.reguladorSaida != null) ? '; estágios seguintes conforme reguladores indicados na planilha' : ''}.</li>
            <li>Perda de carga: {[...new Set(calc.linhas.map(l => l.origens.perda))].join('; ')}.</li>
            <li>Fator de simultaneidade: {residencial ? `${ORIGEM.fatorSimultaneidade}; F = 100% dentro das unidades (${ORIGEM.fatorBloqueioUnidade})` : `F = 100% (${ORIGEM.fatorComercial})`}.</li>
            <li>Critérios: perda acumulada até o aparelho ≤ 10%; até regulador ≤ {residencial ? '30%' : '20%'}; velocidade ≤ 20 m/s ({residencial ? 'NBR 15526:2012, 6.3' : 'NBR 15358:2020, A.1'}).</li>
            <li>Material: {material?.nome} — diâmetros internos e comprimentos equivalentes: {material?.origem}.</li>
          </ul>
        </section>

        <section>
          <h2>4. Descrição do sistema</h2>
          <p>
            Rede de {projeto.gas} em {material?.nome?.toLowerCase()}, com {calc.linhas.length} trechos
            e {[...new Set(calc.linhas.map(l => l.estagioId))].length} estágio(s) de pressão, atendendo
            {' '}{calc.linhas.filter(l => !l.montanteId).reduce((s, l) => s + l.aparelhosJusante, 0)} aparelho(s)
            com potência computada total de {fmt(calc.linhas.filter(l => !l.montanteId).reduce((s, l) => s + l.cKcalH, 0), 0)} kcal/h.
          </p>
          <h2>5. Diagrama esquemático da rede</h2>
          <Diagrama linhas={calc.linhas} />
        </section>

        <section>
          <h2>6. Planilha de dimensionamento trecho a trecho</h2>
          <TabelaDimensionamento calc={calc} compacta />
        </section>

        <section>
          <h2>7. Justificativas</h2>
          {justificativas.length ? <ul>{justificativas.map((j, i) => <li key={i}>{j}</li>)}</ul> : <p>Nenhum valor alterado ou reprovação aceita pelo projetista.</p>}
          <h2>8. Pendências</h2>
          {calc.pendencias.length ? <ul>{calc.pendencias.map((p, i) => <li key={i}>[{p.severidade}] Trecho {p.trecho}: {p.mensagem}</li>)}</ul> : <p>Sem pendências no dimensionamento da rede.</p>}
        </section>

        <section>
          <h2>9. Quadro de revisões</h2>
          <table className="tbl"><thead><tr><th>Revisão</th><th>Data</th><th>Autor</th><th>Motivo</th></tr></thead>
            <tbody><tr><td colSpan={4}>Projeto em rascunho — nenhuma revisão emitida.</td></tr></tbody></table>
          <h2>10. ART / RRT</h2>
          <p>{didatico ? 'Uso didático — sem validade para ART/RRT.' : 'Nº da ART/RRT: ______________________   Assinatura: ______________________________'}</p>
        </section>
      </article>
    </div>
  )
}
