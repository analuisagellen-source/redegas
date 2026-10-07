import { useState } from 'react'
import { PageHeader, useToast } from '../components'
import { useProjetos } from '../app/ProjetosContext'
import ProjetoForm, { validarProjeto } from './ProjetoForm'
import Trechos from './Trechos'
import Dimensionamento from './Dimensionamento'
import Memorial from '../exports/Memorial'

const CAMPOS = ['nome', 'estado', 'municipio', 'uso', 'tipoUso', 'tipologia', 'gas', 'materialId', 'pressaoOperacao']

const ABAS = [['dados', 'Dados do projeto'], ['trechos', 'Trechos'], ['dimensionamento', 'Dimensionamento'], ['memorial', 'Memorial']]

function Dados({ projeto }) {
  const { atualizar } = useProjetos()
  const [valor, setValor] = useState(projeto)
  const [erros, setErros] = useState({})
  const toast = useToast()
  const mudou = CAMPOS.some(k => valor[k] !== projeto[k])

  const salvar = () => {
    const e = validarProjeto(valor)
    setErros(e)
    if (Object.keys(e).length) { toast('Confira os campos destacados.', 'erro'); return }
    const patch = Object.fromEntries(CAMPOS.map(k => [k, valor[k]]))
    patch.nome = patch.nome.trim()
    // Trocar de material invalida diâmetros forçados do material anterior
    if (valor.materialId !== projeto.materialId) {
      patch.trechos = projeto.trechos.map(t => ({ ...t, dnForcado: null, conexoes: {} }))
    }
    atualizar(projeto.id, patch)
    toast('Dados salvos. O dimensionamento foi recalculado.')
  }

  return (
    <div className="card">
      <ProjetoForm valor={valor} onChange={setValor} erros={erros} />
      {valor.materialId !== projeto.materialId && (
        <div className="card-warn t-caption" style={{ marginTop: 16 }}>
          Ao trocar o material, os diâmetros forçados e as conexões informadas nos trechos serão limpos, porque dependem do catálogo do material.
        </div>
      )}
      <div className="row-flex" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-secondary" disabled={!mudou} onClick={() => { setValor(projeto); setErros({}) }}>Descartar alterações</button>
        <button className="btn btn-primary" disabled={!mudou} onClick={salvar}>Salvar dados</button>
      </div>
    </div>
  )
}

export default function Projeto({ projeto, calc, aba, goto, usuario }) {
  return (
    <div className="page">
      <div className="no-print">
        <PageHeader titulo={projeto.nome}
          subtitulo={`${projeto.municipio || '—'} / ${projeto.estado} · ${projeto.uso === 'residencial' ? 'Residencial — NBR 15526:2012' : 'Comercial — NBR 15358:2020 (corr. 2021)'} · ${projeto.gas}`} />
        <div className="tabs" role="tablist" style={{ marginBottom: 20 }}>
          {ABAS.map(([id, rotulo]) => (
            <button key={id} role="tab" aria-selected={aba === id} onClick={() => goto('projeto', { id: projeto.id, aba: id })}>
              {rotulo}
              {id === 'dimensionamento' && calc.pendencias.length + calc.erros.length > 0 && (
                <span className="chip danger" style={{ marginLeft: 8, height: 20 }}>{calc.pendencias.length + calc.erros.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {aba === 'dados' && <Dados projeto={projeto} />}
      {aba === 'trechos' && <Trechos projeto={projeto} calc={calc} goto={goto} />}
      {aba === 'dimensionamento' && <Dimensionamento projeto={projeto} calc={calc} goto={goto} />}
      {aba === 'memorial' && <Memorial projeto={projeto} calc={calc} usuario={usuario} />}
    </div>
  )
}
