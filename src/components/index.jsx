import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fmt } from '../utils/format'

const PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
  gauge: 'M12 14l4-4M4 18a9 9 0 1 1 16 0',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  book: 'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  x: 'M6 6l12 12M18 6L6 18',
  flame: 'M12 3c3 5 7 8 7 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 2 3 3 4-1-3 0-6 1-9z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2',
  printer: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
}

export function Icon({ name, size = 18, stroke = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}

export function PageHeader({ titulo, subtitulo, acoes }) {
  return (
    <div className="row-between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
      <div>
        <h1 className="t-display">{titulo}</h1>
        {subtitulo && <div className="t-caption" style={{ marginTop: 4 }}>{subtitulo}</div>}
      </div>
      {acoes && <div className="row-flex no-print">{acoes}</div>}
    </div>
  )
}

const ROTULO_SITUACAO = { verde: 'Atende', amarelo: 'Atende (> 90% do limite)', vermelho: 'Reprova', ignorado: 'Reprova — ignorado com justificativa' }

export function Semaforo({ situacao }) {
  return <span className={`sem ${situacao}`} title={ROTULO_SITUACAO[situacao]} aria-label={ROTULO_SITUACAO[situacao]} />
}

/** Valor técnico com unidade e origem ao passar o mouse (seção 4) */
export function Val({ v, casas = 2, un, origem }) {
  return (
    <span data-origem={origem ? '' : undefined} title={origem}>
      {fmt(v, casas)}{un && <span className="unit"> {un}</span>}
    </span>
  )
}

export function Sheet({ titulo, subtitulo, onClose, children, rodape }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-label={titulo}>
        <div className="sheet-head row-between">
          <div>
            <div className="t-title">{titulo}</div>
            {subtitulo && <div className="t-caption">{subtitulo}</div>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {rodape && <div className="sheet-foot">{rodape}</div>}
      </aside>
    </>
  )
}

export function ConfirmDialog({ titulo, texto, confirmar = 'Confirmar', perigo, onConfirm, onCancel }) {
  return (
    <>
      <div className="overlay" onClick={onCancel} />
      <div className="dialog" role="alertdialog" aria-label={titulo}>
        <div className="t-title" style={{ marginBottom: 8 }}>{titulo}</div>
        <p className="t-caption" style={{ margin: '0 0 18px', fontSize: 14 }}>{texto}</p>
        <div className="row-flex" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={perigo ? { background: 'var(--danger)' } : undefined}
            onClick={onConfirm}>{confirmar}</button>
        </div>
      </div>
    </>
  )
}

export function Empty({ titulo, texto, acao }) {
  return (
    <div className="empty">
      <div className="t-title">{titulo}</div>
      <div style={{ marginBottom: acao ? 16 : 0 }}>{texto}</div>
      {acao}
    </div>
  )
}

export function Field({ label, children, dica }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {dica && <small className="t-caption">{dica}</small>}
    </label>
  )
}

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const mostrar = useCallback((texto, tipo = 'ok') => {
    setToast({ texto, tipo, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      {toast && <div className={`toast ${toast.tipo === 'erro' ? 'erro' : ''}`} role="status">{toast.texto}</div>}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
