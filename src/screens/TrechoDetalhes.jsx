// Painel lateral de um trecho: aparelhos no ponto, F adotado, diâmetro e "ignorar".

import { useState } from 'react'
import { APARELHOS_PADRAO, diametrosDisponiveis, materialPorId, potenciaDoAparelho } from '../domain/calc/index.ts'
import { Field, Icon, Sheet } from '../components'
import { fmt, fmtInt, novoId, parseNum } from '../utils/format'

export default function TrechoDetalhes({ projeto, trecho, onSalvar, onClose }) {
  // chave estável por aparelho para os campos editáveis não trocarem de linha ao remover
  const [t, setT] = useState(() => ({ ...trecho, aparelhos: trecho.aparelhos.map(a => ({ _k: novoId(), ...a })) }))
  const set = patch => setT(x => ({ ...x, ...patch }))
  const material = materialPorId(projeto.materialId)
  const diams = material ? diametrosDisponiveis(material) : []
  const comercial = projeto.uso === 'comercial'

  const setAp = (i, patch) => set({ aparelhos: t.aparelhos.map((a, j) => (j === i ? { ...a, ...patch } : a)) })
  const addAp = ref => set({ aparelhos: [...t.aparelhos, ref
    ? { _k: novoId(), nome: ref.nome, potencia: ref.kcalH, quantidade: 1 }
    : { _k: novoId(), nome: 'Aparelho (dado do fabricante)', potencia: 0, quantidade: 1 }] })
  const total = t.aparelhos.reduce((s, a) => s + potenciaDoAparelho(a), 0)

  const erroIgnorar = t.ignorar && !t.justificativa?.trim()
  const erroF = t.fInformado != null && comercial && t.fInformado < 100 && !t.fJustificativa?.trim()

  return (
    <Sheet titulo={`Trecho ${t.nome}`} subtitulo="Aparelhos no ponto final e ajustes de projeto" onClose={onClose}
      rodape={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" disabled={erroIgnorar || erroF} onClick={() => onSalvar(t)}>Aplicar</button>
      </>}>
      <div className="stack-3">
        <div className="stack-2">
          <div className="row-between">
            <div className="t-strong">Aparelhos ligados no fim do trecho</div>
            <span className="chip primary">{fmtInt(total)} kcal/h</span>
          </div>
          {t.aparelhos.length === 0 && <div className="t-caption">Nenhum aparelho neste ponto. Trechos intermediários normalmente ficam sem aparelhos.</div>}
          {t.aparelhos.map((a, i) => (
            <div key={a._k} className="card-flat stack-1" style={{ padding: 12 }}>
              <div className="row-flex">
                <input className="ipt ipt-cell" style={{ flex: 1 }} value={a.nome} onChange={e => setAp(i, { nome: e.target.value })} aria-label="Nome do aparelho" />
                <button className="btn btn-danger btn-sm" onClick={() => set({ aparelhos: t.aparelhos.filter((_, j) => j !== i) })} aria-label="Remover aparelho">
                  <Icon name="trash" size={16} />
                </button>
              </div>
              <div className="grid-3" style={{ gap: 8 }}>
                <Field label="Potência (kcal/h)">
                  <input className="ipt ipt-cell ipt-num" defaultValue={fmt(a.potencia, 0)}
                    onBlur={e => setAp(i, { potencia: parseNum(e.target.value) ?? 0 })} />
                </Field>
                <Field label="Quantidade">
                  <input className="ipt ipt-cell ipt-num" type="number" min="1" value={a.quantidade}
                    onChange={e => setAp(i, { quantidade: Math.max(0, Number(e.target.value)) })} />
                </Field>
                {comercial && (
                  <Field label="Eficiência (0–1)" dica="Se informar potência útil">
                    <input className="ipt ipt-cell ipt-num" defaultValue={a.eficiencia ?? ''}
                      onBlur={e => setAp(i, { eficiencia: parseNum(e.target.value) })} />
                  </Field>
                )}
              </div>
              {comercial && (
                <Field label="Potência útil do fabricante (kcal/h) — opcional" dica="Consumo = potência útil ÷ eficiência (NBR 15358, 6.3)">
                  <input className="ipt ipt-cell ipt-num" defaultValue={a.potenciaUtil ?? ''}
                    onBlur={e => setAp(i, { potenciaUtil: parseNum(e.target.value) })} />
                </Field>
              )}
            </div>
          ))}
          <div className="row-flex wrap">
            {!comercial && (
              <select className="ipt" style={{ flex: 1 }} value="" onChange={e => { const r = APARELHOS_PADRAO.find(x => x.id === e.target.value); if (r) addAp(r) }}>
                <option value="">+ Aparelho da tabela padrão (NBR 15526, Anexo D)…</option>
                {APARELHOS_PADRAO.map(a => <option key={a.id} value={a.id}>{a.nome} — {fmtInt(a.kcalH)} kcal/h</option>)}
              </select>
            )}
            <button className="btn btn-secondary" onClick={() => addAp(null)}><Icon name="plus" /> Dado do fabricante</button>
          </div>
          {comercial && <div className="t-caption">Equipamentos comerciais exigem obrigatoriamente a potência do fabricante.</div>}
        </div>

        <div className="stack-2">
          <div className="t-strong">Fator de simultaneidade</div>
          <div className="t-caption">
            {comercial ? 'Comercial: F = 100% por padrão. Reduzir exige justificativa, que vai para o memorial (NBR 15358, 6.3).'
              : t.dentroUnidade ? 'Dentro da unidade: F = 100%, sem redução (NBR 15526, E.1).'
                : 'Calculado pela curva do Anexo E. Você pode adotar um F maior, nunca menor.'}
          </div>
          <div className="grid-2">
            <Field label="F adotado (%) — vazio = automático">
              <input className="ipt ipt-num" defaultValue={t.fInformado ?? ''} onBlur={e => set({ fInformado: parseNum(e.target.value) })} />
            </Field>
            <Field label="Justificativa do F">
              <input className="ipt" value={t.fJustificativa ?? ''} onChange={e => set({ fJustificativa: e.target.value })} />
            </Field>
          </div>
          {erroF && <small style={{ color: 'var(--danger)' }}>Redução de F em rede comercial exige justificativa.</small>}
        </div>

        <div className="stack-2">
          <div className="t-strong">Diâmetro</div>
          <Field label="Diâmetro (vazio = o motor escolhe o menor que atende)">
            <select className="ipt" value={t.dnForcado ?? ''} onChange={e => set({ dnForcado: e.target.value || null })}>
              <option value="">Automático</option>
              {diams.map(d => <option key={d.dn} value={d.dn}>DN {d.dn} — DI {fmt(d.di, 1)} mm</option>)}
            </select>
          </Field>
          <label className="check"><input type="checkbox" checked={!!t.ignorar} onChange={e => set({ ignorar: e.target.checked })} />
            Aceitar este trecho mesmo reprovando (ignorar)</label>
          {t.ignorar && (
            <Field label="Justificativa (obrigatória — vira pendência e vai para o memorial)">
              <textarea className="ipt" rows={3} value={t.justificativa ?? ''} onChange={e => set({ justificativa: e.target.value })} />
            </Field>
          )}
          {erroIgnorar && <small style={{ color: 'var(--danger)' }}>Informe a justificativa para ignorar.</small>}
        </div>
      </div>
    </Sheet>
  )
}
