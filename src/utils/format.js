// Formatação pt-BR (vírgula decimal). Arredonda só na apresentação.

export function fmt(n, casas = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

export const fmtInt = n => fmt(n, 0)

/** Lê número digitado em pt-BR ("1.234,5" ou "1234.5"). Vazio → null. */
export function parseNum(txt) {
  if (txt == null) return null
  const s = String(txt).trim()
  if (s === '') return null
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  const n = Number(norm)
  return Number.isFinite(n) ? n : null
}

const TZ = 'America/Sao_Paulo'

export const fmtData = iso => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ }) : '—')
export const fmtDataHora = iso =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }) : '—'

export const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))
