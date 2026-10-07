// 6.11 — Central de GLP

import { ALERTA_VAPORIZACAO, PARAMETROS_GAS } from './catalogo.ts'
import { fatorSimultaneidade, potenciaAdotada, vazao, type ContextoF, type FInformado } from './formulas.ts'
import { ORIGEM } from './origens.ts'

/**
 * ρ_GLP = S × ρ_ar = 1,8 × 1,204 = 2,167 kg/m³ (20 °C e 1 atm).
 * Usa-se o valor declarado na especificação (6.11 e 6.13), com três decimais.
 */
export const RHO_GLP = 2.167

export interface EntradaCentral {
  potenciaComputada: number        // kcal/h
  contexto: ContextoF
  fInformado?: FInformado | null
  pci?: number
  vaporizacao: number              // kg/h por recipiente
  capacidadeKg: number             // kg por recipiente
  horasUsoDia?: number             // padrão 4 h
}

export interface ResultadoCentral {
  potenciaComputada: number
  f: number
  potenciaAdotada: number
  vazao: number                    // m³/h
  consumo: number                  // kg/h
  recipientesExato: number
  recipientes: number
  capacidadeTotal: number          // kg
  autonomiaHoras: number
  autonomiaDias: number
  alertas: string[]
  erros: string[]
  origem: string
}

export function calcularCentral(e: EntradaCentral): ResultadoCentral {
  const pci = e.pci ?? PARAMETROS_GAS.GLP.pci
  const rf = fatorSimultaneidade(e.potenciaComputada, e.contexto, e.fInformado)
  const a = potenciaAdotada(rf.f, e.potenciaComputada)
  const q = vazao(a, pci)
  const consumo = q * RHO_GLP
  const recipientesExato = consumo / e.vaporizacao
  // tolerância numérica para não arredondar 13,0000000001 para 14
  const recipientes = Math.ceil(recipientesExato - 1e-9)
  const capacidadeTotal = recipientes * e.capacidadeKg
  const autonomiaHoras = consumo > 0 ? capacidadeTotal / consumo : Infinity
  const horas = e.horasUsoDia ?? 4
  return {
    potenciaComputada: e.potenciaComputada,
    f: rf.f,
    potenciaAdotada: a,
    vazao: q,
    consumo,
    recipientesExato,
    recipientes,
    capacidadeTotal,
    autonomiaHoras,
    autonomiaDias: autonomiaHoras / horas,
    alertas: [ALERTA_VAPORIZACAO, ...rf.alertas],
    erros: rf.erros,
    origem: ORIGEM.central,
  }
}
