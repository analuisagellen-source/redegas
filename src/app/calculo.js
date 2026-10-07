// Ponte única entre o projeto (como a tela guarda) e o motor de cálculo.
// Tela e memorial chamam SÓ esta função — a mesma conta em todo lugar.

import { dimensionarRede, PARAMETROS_GAS } from '../domain/calc/index.ts'

export function paraRede(p) {
  return {
    gas: p.gas,
    uso: p.uso,
    pressaoOperacao: Number(p.pressaoOperacao),
    materialId: p.materialId,
    pci: p.pci ?? undefined,
    s: p.s ?? undefined,
  }
}

export function calcularProjeto(p) {
  const rede = dimensionarRede(paraRede(p), p.trechos ?? [])
  const params = { pci: p.pci ?? PARAMETROS_GAS[p.gas].pci, s: p.s ?? PARAMETROS_GAS[p.gas].s }
  return { ...rede, params }
}
