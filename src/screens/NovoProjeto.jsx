import { useState } from 'react'
import { PageHeader, useToast } from '../components'
import { useProjetos } from '../app/ProjetosContext'
import { mensagemErro } from '../services/projetos'
import ProjetoForm, { PROJETO_VAZIO, validarProjeto } from './ProjetoForm'

export default function NovoProjeto({ goto }) {
  const { criar } = useProjetos()
  const [valor, setValor] = useState(PROJETO_VAZIO)
  const [erros, setErros] = useState({})
  const toast = useToast()

  const [enviando, setEnviando] = useState(false)

  const salvar = async () => {
    const e = validarProjeto(valor)
    setErros(e)
    if (Object.keys(e).length) { toast('Confira os campos destacados.', 'erro'); return }
    setEnviando(true)
    let id
    try { id = await criar({ ...valor, nome: valor.nome.trim() }) } catch (err) { toast(mensagemErro(err), 'erro'); setEnviando(false); return }
    toast('Projeto criado. Agora cadastre os trechos da rede.')
    goto('projeto', { id, aba: 'trechos' })
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <PageHeader titulo="Novo projeto" subtitulo="Dados básicos da edificação e da rede. Tudo pode ser alterado depois." />
      <div className="card">
        <ProjetoForm valor={valor} onChange={setValor} erros={erros} />
        <div className="row-flex" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => goto('projetos')}>Cancelar</button>
          <button className="btn btn-primary" disabled={enviando} onClick={salvar}>{enviando ? 'Criando…' : 'Criar projeto'}</button>
        </div>
      </div>
    </div>
  )
}
