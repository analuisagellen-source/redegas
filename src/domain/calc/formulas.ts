// Fórmulas puras da seção 6. Unidades internas: kcal/h, m³/h, kPa, m, mm.

import { kPaParaKgfCm2 } from '../units/index.ts'
import { ORIGEM } from './origens.ts'
import type { Gas } from './catalogo.ts'

// ── 6.3 Fator de simultaneidade ─────────────────────────────────────────

/** Curva do Anexo E da NBR 15526, com C em kcal/h. Retorna F em %. */
export function fatorCurva(cKcalH: number): number {
  const m = cKcalH / 60
  if (m < 350) return 100
  if (m < 9612) return 100 / (1 + 0.001 * Math.pow(m - 349, 0.8712))
  if (m < 20000) return 100 / (1 + 0.4705 * Math.pow(m - 1055, 0.19931))
  return 23
}

/**
 * coletivo  → rede que atende várias unidades residenciais (curva do Anexo E)
 * unidade   → dentro de um apartamento ou casa (F = 100%, sem redução)
 * comercial → NBR 15358 (F = 100% por padrão; redução só com justificativa)
 */
export type ContextoF = 'coletivo' | 'unidade' | 'comercial'

export interface FInformado { f: number; justificativa?: string }

export interface ResultadoF {
  f: number
  fCalculado: number
  origem: string
  alertas: string[]
  erros: string[]
}

export function fatorSimultaneidade(cKcalH: number, contexto: ContextoF, informado?: FInformado | null): ResultadoF {
  const alertas: string[] = []
  const erros: string[] = []
  const temInformado = informado != null && Number.isFinite(informado.f)
  const justificativa = informado?.justificativa?.trim()

  if (contexto === 'unidade') {
    if (temInformado && informado!.f < 100) erros.push('Dentro de uma unidade F = 100%: redução não permitida.')
    return { f: 100, fCalculado: 100, origem: ORIGEM.fatorBloqueioUnidade, alertas, erros }
  }

  if (contexto === 'comercial') {
    if (temInformado && informado!.f < 100) {
      if (!justificativa) {
        erros.push('Redução de F em rede comercial exige justificativa.')
        return { f: 100, fCalculado: 100, origem: ORIGEM.fatorComercial, alertas, erros }
      }
      alertas.push(`F reduzido para ${informado!.f}% por eventual simultaneidade: ${justificativa}`)
      return { f: informado!.f, fCalculado: 100, origem: ORIGEM.informado, alertas, erros }
    }
    return { f: 100, fCalculado: 100, origem: ORIGEM.fatorComercial, alertas, erros }
  }

  const fCalculado = fatorCurva(cKcalH)
  if (temInformado) {
    if (informado!.f < fCalculado) {
      erros.push(`F informado (${informado!.f}%) é menor que o mínimo da norma; mantido o calculado.`)
      return { f: fCalculado, fCalculado, origem: ORIGEM.fatorSimultaneidade, alertas, erros }
    }
    if (!justificativa) alertas.push('F adotado acima do calculado: registre a justificativa para o memorial.')
    return { f: Math.min(informado!.f, 100), fCalculado, origem: ORIGEM.informado, alertas, erros }
  }
  return { f: fCalculado, fCalculado, origem: ORIGEM.fatorSimultaneidade, alertas, erros }
}

// ── 6.4 Potência adotada e vazão ────────────────────────────────────────

export const potenciaAdotada = (f: number, cKcalH: number) => (f * cKcalH) / 100
export const vazao = (aKcalH: number, pci: number) => aKcalH / pci

// ── 6.6 Perda de carga por atrito ───────────────────────────────────────

/** Até 7,5 kPa. Q em m³/h, D interno em mm, L em m. Retorna ΔP em kPa. */
export function perdaAtritoBaixa(gas: Gas, q: number, d: number, l: number, s: number): number {
  if (gas === 'GN') return (2029.05 * Math.pow(q, 1.8) * Math.pow(s, 0.8) * l) / Math.pow(d, 4.8)
  return (2273 * s * l * Math.pow(q, 1.82)) / Math.pow(d, 4.82)
}

/**
 * Acima de 7,5 kPa: PA_abs² − PB_abs² = 4,67×10⁵ × S × L × Q^1,82 / D^4,82.
 * Recebe e devolve pressões manométricas (kPa). NaN quando a pressão se esgota.
 */
export function pressaoFinalAlta(piMan: number, q: number, d: number, l: number, s: number, patm: number): number {
  const pa = piMan + patm
  const k = (4.67e5 * s * l * Math.pow(q, 1.82)) / Math.pow(d, 4.82)
  const pb2 = pa * pa - k
  if (pb2 <= 0) return NaN
  return Math.sqrt(pb2) - patm
}

export const origemPerda = (gas: Gas, alta: boolean) =>
  alta ? ORIGEM.perdaAlta : gas === 'GN' ? ORIGEM.perdaBaixaGN : ORIGEM.perdaBaixaGLP

// ── 6.7 Desnível ────────────────────────────────────────────────────────

/** Variação de pressão ao SUBIR H metros (kPa). Positivo = perde pressão. */
export const perdaPorSubida = (h: number, s: number) => 0.01318 * h * (s - 1)

// ── 6.8 Velocidade ──────────────────────────────────────────────────────

/** V em m/s; P manométrica em kPa (convertida para kgf/cm²), D interno em mm */
export function velocidade(q: number, d: number, pKPa: number): number {
  return (354 * q) / ((kPaParaKgfCm2(pKPa) + 1.033) * d * d)
}

// ── Cálculo de um trecho ────────────────────────────────────────────────

export interface EntradaTrecho {
  gas: Gas
  s: number
  q: number
  d: number
  lTotal: number
  lAsc: number
  lDesc: number
  pi: number
  /** true quando a pressão de operação do estágio é maior que 7,5 kPa */
  regimeAlto: boolean
  patm: number
}

export interface ResultadoTrecho {
  dpAtrito: number
  dpDesnivel: number
  pf: number
  v: number
}

export function calcularTrecho(e: EntradaTrecho): ResultadoTrecho {
  let pfAtrito: number
  if (e.regimeAlto) pfAtrito = pressaoFinalAlta(e.pi, e.q, e.d, e.lTotal, e.s, e.patm)
  else pfAtrito = e.pi - perdaAtritoBaixa(e.gas, e.q, e.d, e.lTotal, e.s)
  const dpAtrito = e.pi - pfAtrito
  const dpDesnivel = perdaPorSubida(e.lAsc, e.s) - perdaPorSubida(e.lDesc, e.s)
  const pf = pfAtrito - dpDesnivel
  // Velocidade avaliada na pressão final do trecho (ponto mais desfavorável)
  const v = Number.isFinite(pf) ? velocidade(e.q, e.d, Math.max(pf, 0)) : NaN
  return { dpAtrito, dpDesnivel, pf, v }
}

// ── 6.12 Estanqueidade ──────────────────────────────────────────────────

export interface Estanqueidade {
  etapas: { nome: string; pressaoEnsaio: number; tempo: string }[]
  fundoEscalaMin: number
  fundoEscalaMax: number
  volumeLitros: number
  purgaInerte: boolean
  origem: string
}

/** Volume hidráulico em litros: Σ(π × DI²/4 × L), DI em mm e L em m */
export function volumeHidraulico(trechos: { di: number; l: number }[]): number {
  return trechos.reduce((soma, t) => soma + (Math.PI * Math.pow(t.di / 1000, 2) / 4) * t.l, 0) * 1000
}

export function estanqueidade(uso: 'residencial' | 'comercial', pTrabalhoMax: number, pOperacao: number,
  trechos: { di: number; l: number }[]): Estanqueidade {
  const volumeLitros = volumeHidraulico(trechos)
  const purgaInerte = volumeLitros > 50
  if (uso === 'residencial') {
    const p1 = Math.max(1.5 * pTrabalhoMax, 20)
    return {
      etapas: [
        { nome: '1ª etapa — rede exposta, após a montagem', pressaoEnsaio: p1, tempo: '≥ 60 min + 15 min de estabilização' },
        { nome: '2ª etapa — rede completa, antes da liberação', pressaoEnsaio: pOperacao, tempo: '≥ 5 min + 1 min de estabilização' },
      ],
      fundoEscalaMin: p1 / 0.75,
      fundoEscalaMax: p1 / 0.25,
      volumeLitros,
      purgaInerte,
      origem: ORIGEM.estanqueidadeRes,
    }
  }
  const p = 1.5 * pTrabalhoMax
  return {
    etapas: [{ nome: 'Etapa única — rede exposta, após a montagem', pressaoEnsaio: p, tempo: '≥ 60 min + 15 min de estabilização' }],
    fundoEscalaMin: p / 0.75,
    fundoEscalaMax: p / 0.25,
    volumeLitros,
    purgaInerte,
    origem: ORIGEM.estanqueidadeCom,
  }
}
