// Formulário dos dados básicos do projeto (usado em "Novo projeto" e "Dados do projeto").
// O questionário completo em etapas (seção 5.3) chega na entrega 3.

import { ESTADOS, gasesDoEstado, MATERIAIS, diametrosDisponiveis, pressaoMaxima } from '../domain/calc/index.ts'
import { Field } from '../components'
import { parseNum } from '../utils/format'

const TIPOS = {
  residencial: [['unifamiliar', 'Unifamiliar (casa)'], ['multifamiliar', 'Multifamiliar (edifício)']],
  comercial: [['restaurante', 'Restaurante'], ['lanchonete', 'Lanchonete'], ['loja', 'Loja'], ['hotel', 'Hotel'], ['escola', 'Escola'], ['outro', 'Outro']],
}

export const PROJETO_VAZIO = {
  nome: '', estado: 'TO', municipio: '', uso: 'residencial', tipoUso: 'unifamiliar', tipologia: 'terrea',
  gas: 'GLP', materialId: 'pex', pressaoOperacao: 2.8,
}

export function validarProjeto(p) {
  const erros = {}
  if (!p.nome.trim()) erros.nome = 'Informe o nome do projeto.'
  if (!gasesDoEstado(p.estado).includes(p.gas)) erros.gas = 'Gás não disponível neste estado.'
  const pr = Number(p.pressaoOperacao)
  const max = pressaoMaxima(p.uso, p.gas)
  if (!(pr > 0)) erros.pressaoOperacao = 'Informe uma pressão maior que zero.'
  else if (pr > max) erros.pressaoOperacao = `Máximo de ${max} kPa para rede ${p.uso}${p.uso === 'comercial' && p.gas === 'GLP' ? ' de GLP' : ''}.`
  return erros
}

export default function ProjetoForm({ valor, onChange, erros = {} }) {
  const set = patch => onChange({ ...valor, ...patch })
  const gases = gasesDoEstado(valor.estado)
  const secundaria = valor.gas === 'GN' ? 2.0 : 2.8

  return (
    <div className="stack-3">
      <div className="grid-2">
        <Field label="Nome do projeto">
          <input className="ipt" value={valor.nome} onChange={e => set({ nome: e.target.value })} placeholder="Ex.: Edifício Modelo" autoFocus />
          {erros.nome && <small style={{ color: 'var(--danger)' }}>{erros.nome}</small>}
        </Field>
        <div className="grid-2">
          <Field label="Estado">
            <select className="ipt" value={valor.estado} onChange={e => {
              const g = gasesDoEstado(e.target.value)
              set({ estado: e.target.value, gas: g.includes(valor.gas) ? valor.gas : g[0] })
            }}>
              {ESTADOS.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>)}
            </select>
          </Field>
          <Field label="Município">
            <input className="ipt" value={valor.municipio} onChange={e => set({ municipio: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="grid-3">
        <Field label="Uso">
          <select className="ipt" value={valor.uso} onChange={e => set({ uso: e.target.value, tipoUso: TIPOS[e.target.value][0][0] })}>
            <option value="residencial">Residencial (NBR 15526)</option>
            <option value="comercial">Comercial (NBR 15358)</option>
          </select>
        </Field>
        <Field label="Tipo">
          <select className="ipt" value={valor.tipoUso} onChange={e => set({ tipoUso: e.target.value })}>
            {TIPOS[valor.uso].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Tipologia">
          <select className="ipt" value={valor.tipologia} onChange={e => set({ tipologia: e.target.value })}>
            <option value="terrea">Térrea</option>
            <option value="vertical">Vertical</option>
          </select>
        </Field>
      </div>

      <div className="grid-3">
        <Field label="Gás" dica={valor.estado === 'TO' ? 'Tocantins não tem gás natural canalizado (NT 23).' : undefined}>
          <select className="ipt" value={valor.gas} onChange={e => set({ gas: e.target.value })}>
            {gases.map(g => <option key={g} value={g}>{g === 'GN' ? 'GN — gás natural' : 'GLP — gás liquefeito de petróleo'}</option>)}
          </select>
          {erros.gas && <small style={{ color: 'var(--danger)' }}>{erros.gas}</small>}
        </Field>
        <Field label="Material da tubulação">
          <select className="ipt" value={valor.materialId} onChange={e => set({ materialId: e.target.value })}>
            {MATERIAIS.map(m => (
              <option key={m.id} value={m.id} disabled={diametrosDisponiveis(m).length === 0}>
                {m.nome}{diametrosDisponiveis(m).length === 0 ? ' — sem diâmetro interno cadastrado' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pressão de operação do 1º estágio (kPa)" dica="Pressão na saída do regulador que alimenta a rede.">
          <input className="ipt ipt-num" inputMode="decimal" defaultValue={String(valor.pressaoOperacao).replace('.', ',')}
            key={`${valor.gas}-${valor.pressaoOperacao}`}
            onBlur={e => { const n = parseNum(e.target.value); if (n != null) set({ pressaoOperacao: n }) }} />
          <div className="row-flex">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ pressaoOperacao: 150 })}>Primária 150</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ pressaoOperacao: secundaria })}>
              Secundária {String(secundaria).replace('.', ',')}
            </button>
          </div>
          {erros.pressaoOperacao && <small style={{ color: 'var(--danger)' }}>{erros.pressaoOperacao}</small>}
        </Field>
      </div>
    </div>
  )
}
