// Interface principal: menu lateral recolhível + conteúdo. Roteamento por estado.

import { useMemo, useState } from 'react'
import { Icon } from '../components'
import { useProjetos, USAR_MOCK } from './ProjetosContext'
import { calcularProjeto } from './calculo'
import Inicio from '../screens/Inicio'
import Projetos from '../screens/Projetos'
import NovoProjeto from '../screens/NovoProjeto'
import Projeto from '../screens/Projeto'
import Biblioteca from '../screens/Biblioteca'
import Equipe from '../screens/Equipe'

const PAPEL = { projetista: 'Projetista', estudante: 'Estudante', admin: 'Administrador', curador: 'Curador técnico' }

export default function Shell({ usuario, onSair }) {
  const [route, setRoute] = useState({ screen: 'inicio', params: {} })
  const [recolhido, setRecolhido] = useState(false)
  const goto = (screen, params = {}) => setRoute({ screen, params })
  const { projetos, carregando, erroCarga, salvando, recarregar } = useProjetos()

  const projetoAberto = route.screen === 'projeto' ? projetos.find(p => p.id === route.params.id) : null
  const calc = useMemo(() => (projetoAberto ? calcularProjeto(projetoAberto) : null), [projetoAberto])
  const nPendencias = calc ? calc.erros.length + calc.pendencias.length : 0

  let body
  switch (route.screen) {
    case 'projetos': body = <Projetos goto={goto} />; break
    case 'novo': body = <NovoProjeto goto={goto} />; break
    case 'projeto':
      body = projetoAberto
        ? <Projeto key={projetoAberto.id} projeto={projetoAberto} calc={calc} aba={route.params.aba ?? 'dimensionamento'}
            goto={goto} usuario={usuario} />
        : <div className="page">Projeto não encontrado.</div>
      break
    case 'biblioteca': body = <Biblioteca />; break
    case 'equipe': body = <Equipe usuario={usuario} />; break
    default: body = <Inicio goto={goto} usuario={usuario} />
  }

  const NavBtn = ({ screen, params, icon, label, badge, sub }) => {
    const atual = route.screen === screen && (!params?.aba || (route.params.aba ?? 'dimensionamento') === params.aba)
    return (
      <button className={`nav-btn ${sub ? 'nav-sub' : ''}`} aria-current={atual} title={label}
        onClick={() => goto(screen, params)}>
        <Icon name={icon} />
        <span className="hide-collapsed">{label}</span>
        {badge > 0 && <span className="badge hide-collapsed">{badge}</span>}
      </button>
    )
  }

  return (
    <div className="app" data-collapsed={recolhido ? '1' : '0'} style={{ background: 'transparent' }}>
      <nav className="sidebar no-print" aria-label="Menu principal">
        <div className="brand" style={{ color: 'var(--primary)' }}>
          <Icon name="flame" size={24} />
          <span className="hide-collapsed" style={{ color: 'var(--text)' }}>RedeGás</span>
        </div>
        <NavBtn screen="inicio" icon="home" label="Início" />
        <NavBtn screen="projetos" icon="folder" label="Projetos" />
        {projetoAberto && (
          <>
            <div className="t-micro section-label hide-collapsed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {projetoAberto.nome}
            </div>
            <NavBtn screen="projeto" params={{ id: projetoAberto.id, aba: 'dados' }} icon="list" label="Dados do projeto" sub />
            <NavBtn screen="projeto" params={{ id: projetoAberto.id, aba: 'trechos' }} icon="table" label="Trechos" sub />
            <NavBtn screen="projeto" params={{ id: projetoAberto.id, aba: 'dimensionamento' }} icon="gauge" label="Dimensionamento" sub badge={nPendencias} />
            <NavBtn screen="projeto" params={{ id: projetoAberto.id, aba: 'memorial' }} icon="file" label="Memorial" sub />
          </>
        )}
        <div className="t-micro section-label hide-collapsed">Referência</div>
        <NavBtn screen="biblioteca" icon="book" label="Biblioteca técnica" />
        {(usuario.role === 'admin' || usuario.role === 'curador') && !USAR_MOCK && <NavBtn screen="equipe" icon="list" label="Equipe" />}

        <div style={{ marginTop: 'auto' }} className="stack-1">
          <div className="hide-collapsed" style={{ padding: '0 10px' }}>
            <div className="t-strong" style={{ fontSize: 13 }}>{usuario.nome}</div>
            <div className="t-caption">{PAPEL[usuario.role]}</div>
          </div>
          <button className="nav-btn" onClick={onSair} title="Sair"><Icon name="logout" /><span className="hide-collapsed">Sair</span></button>
          <button className="nav-btn" onClick={() => setRecolhido(r => !r)} title={recolhido ? 'Expandir menu' : 'Recolher menu'}>
            <Icon name="menu" /><span className="hide-collapsed">Recolher menu</span>
          </button>
        </div>
      </nav>

      <div className="app-body">
        <header className="topbar no-print">
          {projetoAberto ? (
            <>
              <span className="t-caption">Projeto aberto:</span>
              <span className="t-strong">{projetoAberto.nome}</span>
              <span className="chip">{projetoAberto.revisao ?? 'Rascunho — sem revisão emitida'}</span>
              {nPendencias > 0 && <span className="chip danger">{nPendencias} pendência{nPendencias > 1 ? 's' : ''}</span>}
            </>
          ) : <span className="t-caption">Nenhum projeto aberto</span>}
          <span style={{ marginLeft: 'auto' }} />
          {usuario.role === 'estudante' && <span className="chip warn">Modo didático</span>}
          {!USAR_MOCK && <span className="t-caption">{salvando ? 'Salvando…' : 'Tudo salvo'}</span>}
          {USAR_MOCK && <span className="chip">Modo demonstração</span>}
          <span className="chip primary">{usuario.organizacao}</span>
        </header>
        {carregando ? <div className="page t-caption">Carregando projetos…</div>
          : erroCarga ? <div className="page"><div className="card-danger stack-1"><span>{erroCarga}</span><div><button className="btn btn-secondary btn-sm" onClick={recarregar}>Tentar de novo</button></div></div></div>
          : body}
      </div>
    </div>
  )
}
