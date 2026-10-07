// Tabelas de referência iniciais (Anexo A da especificação).
// Na entrega com banco, estes dados passam a vir de `reference_tables`.

export type Gas = 'GN' | 'GLP'
export type Uso = 'residencial' | 'comercial'

export interface ParametrosGas { pci: number; s: number }

/** Seção 6.1 — PCI em kcal/m³ e densidade relativa ao ar (20 °C, 1 atm) */
export const PARAMETROS_GAS: Record<Gas, ParametrosGas> = {
  GN: { pci: 8600, s: 0.6 },
  GLP: { pci: 24000, s: 1.8 },
}

export interface TipoConexao { id: string; nome: string }

export interface Diametro {
  dn: string            // rótulo comercial, ex.: '22 (3/4")'
  dnMm: number
  /** Diâmetro interno em mm. null = sem DI cadastrado → nunca oferecido (6.10.4) */
  di: number | null
  /** Comprimento equivalente (m) por tipo de conexão */
  leq: Record<string, number>
}

export interface Material {
  id: string
  nome: string
  origem: string
  conexoes: TipoConexao[]
  diametros: Diametro[]
}

const cobreConexoes: TipoConexao[] = [
  { id: 'cotovelo90', nome: 'Cotovelo 90°' },
  { id: 'cotovelo45', nome: 'Cotovelo 45°' },
  { id: 'te90', nome: 'Tê 90°' },
  { id: 'valvula', nome: 'Válvula esfera' },
]

const cobre = (dn: string, dnMm: number, di: number | null, c90: number, c45: number, te: number, v: number): Diametro =>
  ({ dn, dnMm, di, leq: { cotovelo90: c90, cotovelo45: c45, te90: te, valvula: v } })

const acoConexoes: TipoConexao[] = [
  { id: 'cotovelo90', nome: 'Cotovelo 90°' },
  { id: 'cotovelo45', nome: 'Cotovelo 45°' },
  { id: 'te_reto', nome: 'Tê fluxo reto' },
  { id: 'te_angulo', nome: 'Tê fluxo em ângulo' },
  { id: 'te_duplo', nome: 'Tê fluxo duplo' },
  { id: 'valvula', nome: 'Válvula esfera' },
]

const aco = (dn: string, dnMm: number, c90: number, c45: number, tr: number, ta: number, td: number, v: number): Diametro =>
  ({ dn, dnMm, di: null, leq: { cotovelo90: c90, cotovelo45: c45, te_reto: tr, te_angulo: ta, te_duplo: td, valvula: v } })

const pexConexoes: TipoConexao[] = [
  { id: 'joelho', nome: 'Joelho de compressão' },
  { id: 'te_reto', nome: 'Tê de compressão (reto)' },
  { id: 'te_lateral', nome: 'Tê de compressão (lateral)' },
  { id: 'luva', nome: 'Luva de compressão' },
]

const pex = (dn: string, dnMm: number, di: number, joelho: number, teReto: number, teLateral: number, luva: number): Diametro =>
  ({ dn, dnMm, di, leq: { joelho, te_reto: teReto, te_lateral: teLateral, luva } })

export const MATERIAIS: Material[] = [
  {
    id: 'cobre_e',
    nome: 'Cobre classe E',
    origem: 'Anexo A.4; DI conforme NBR 15526:2012, Anexo C, Exemplo 1',
    conexoes: cobreConexoes,
    diametros: [
      cobre('10 (3/8")', 10, null, 1.1, 0.4, 2.3, 0.1),
      cobre('15 (1/2")', 15, 14.0, 1.1, 0.4, 2.3, 0.1),
      cobre('22 (3/4")', 22, 20.8, 1.2, 0.5, 2.4, 0.2),
      cobre('28 (1")', 28, 26.8, 1.5, 0.7, 3.1, 0.3),
      cobre('35 (1 1/4")', 35, 33.6, 2.0, 1.0, 4.6, 0.4),
      cobre('42 (1 1/2")', 42, null, 3.2, 1.0, 7.3, 0.7),
      cobre('54 (2")', 54, null, 3.4, 1.3, 7.6, 0.8),
      cobre('66 (2 1/2")', 66, null, 3.7, 1.7, 7.8, 0.8),
      cobre('79 (3")', 79, null, 3.9, 1.8, 8.0, 0.9),
      cobre('104 (4")', 104, null, 4.3, 1.9, 8.3, 1.0),
    ],
  },
  {
    id: 'pex',
    nome: 'PEX multicamada',
    origem: 'Anexo A.5 (catálogo de fabricante)',
    conexoes: pexConexoes,
    diametros: [
      pex('16 (1/2")', 16, 12.2, 1.25, 0.26, 0.40, 0.45),
      pex('20 (3/4")', 20, 16.0, 2.13, 0.90, 1.86, 0.90),
      pex('25 (1")', 25, 20.0, 2.64, 0.60, 2.74, 0.60),
      pex('32 (1 1/4")', 32, 26.0, 3.00, 0.66, 3.00, 0.60),
    ],
  },
  {
    id: 'aco_galv',
    nome: 'Aço galvanizado',
    origem: 'Anexo A.3 — sem DI cadastrado (aguarda curador)',
    conexoes: acoConexoes,
    diametros: [
      aco('10 (3/8")', 10, 0.35, 0.16, 0.06, 0.51, 0.62, 0.1),
      aco('15 (1/2")', 15, 0.47, 0.22, 0.08, 0.69, 0.83, 0.1),
      aco('20 (3/4")', 20, 0.70, 0.32, 0.12, 1.03, 1.25, 0.2),
      aco('25 (1")', 25, 0.94, 0.43, 0.17, 1.37, 1.66, 0.3),
      aco('32 (1 1/4")', 32, 1.17, 0.54, 0.21, 1.71, 2.08, 0.4),
      aco('40 (1 1/2")', 40, 1.41, 0.65, 0.25, 2.06, 2.50, 0.7),
      aco('50 (2")', 50, 1.88, 0.86, 0.33, 2.74, 3.33, 0.8),
      aco('65 (2 1/2")', 65, 2.35, 1.08, 0.41, 3.43, 4.16, 0.8),
      aco('80 (3")', 80, 2.82, 1.30, 0.50, 4.11, 4.99, 0.9),
      aco('100 (4")', 100, 3.76, 1.73, 0.66, 5.49, 6.65, 1.1),
      aco('150 (6")', 150, 5.64, 2.59, 0.99, 8.23, 9.98, 1.2),
    ],
  },
]

export const materialPorId = (id: string) => MATERIAIS.find(m => m.id === id)

/** Somente diâmetros com DI cadastrado, do menor para o maior (6.10.4) */
export function diametrosDisponiveis(material: Material): Diametro[] {
  return material.diametros.filter(d => d.di != null).sort((a, b) => (a.di as number) - (b.di as number))
}

export interface AparelhoRef { id: string; nome: string; kw: number; kcalH: number }

/** Anexo A.1 — NBR 15526, Anexo D (padrão na falta do dado do fabricante) */
export const APARELHOS_PADRAO: AparelhoRef[] = [
  { id: 'fogao2_portatil', nome: 'Fogão 2 bocas portátil', kw: 2.9, kcalH: 2494 },
  { id: 'fogao2_bancada', nome: 'Fogão 2 bocas de bancada', kw: 3.6, kcalH: 3096 },
  { id: 'fogao4_sem', nome: 'Fogão 4 bocas sem forno', kw: 8.1, kcalH: 6966 },
  { id: 'fogao4_com', nome: 'Fogão 4 bocas com forno', kw: 10.8, kcalH: 9288 },
  { id: 'fogao5_sem', nome: 'Fogão 5 bocas sem forno', kw: 11.6, kcalH: 9976 },
  { id: 'fogao5_com', nome: 'Fogão 5 bocas com forno', kw: 15.6, kcalH: 13390 },
  { id: 'fogao6_sem', nome: 'Fogão 6 bocas sem forno', kw: 11.6, kcalH: 9976 },
  { id: 'fogao6_com', nome: 'Fogão 6 bocas com forno', kw: 15.6, kcalH: 13390 },
  { id: 'forno_parede', nome: 'Forno de parede', kw: 3.5, kcalH: 3010 },
  { id: 'aq_pass_6', nome: 'Aquecedor de passagem 6 L/min', kw: 10.5, kcalH: 9000 },
  { id: 'aq_pass_8', nome: 'Aquecedor de passagem 8 L/min', kw: 14.0, kcalH: 12000 },
  { id: 'aq_pass_10', nome: 'Aquecedor de passagem 10 L/min', kw: 17.4, kcalH: 15000 },
  { id: 'aq_pass_12', nome: 'Aquecedor de passagem 12 L/min', kw: 20.9, kcalH: 18000 },
  { id: 'aq_pass_15', nome: 'Aquecedor de passagem 15 L/min', kw: 25.6, kcalH: 22000 },
  { id: 'aq_pass_18', nome: 'Aquecedor de passagem 18 L/min', kw: 30.2, kcalH: 26500 },
  { id: 'aq_pass_25', nome: 'Aquecedor de passagem 25 L/min', kw: 41.9, kcalH: 36000 },
  { id: 'aq_pass_30', nome: 'Aquecedor de passagem 30 L/min', kw: 52.3, kcalH: 45500 },
  { id: 'aq_pass_35', nome: 'Aquecedor de passagem 35 L/min', kw: 57.0, kcalH: 49000 },
  { id: 'aq_acum_50', nome: 'Aquecedor de acumulação 50 L', kw: 5.1, kcalH: 4360 },
  { id: 'aq_acum_75', nome: 'Aquecedor de acumulação 75 L', kw: 7.0, kcalH: 6003 },
  { id: 'aq_acum_100', nome: 'Aquecedor de acumulação 100 L', kw: 8.2, kcalH: 7078 },
  { id: 'aq_acum_150', nome: 'Aquecedor de acumulação 150 L', kw: 9.5, kcalH: 8153 },
  { id: 'aq_acum_200', nome: 'Aquecedor de acumulação 200 L', kw: 12.2, kcalH: 10501 },
  { id: 'aq_acum_300', nome: 'Aquecedor de acumulação 300 L', kw: 17.4, kcalH: 14998 },
  { id: 'secadora', nome: 'Secadora de roupa', kw: 7.0, kcalH: 6020 },
]

export interface Recipiente {
  id: string
  /** kg/h */
  vaporizacao: number
  /** kg de GLP; null quando a tabela não informa (usuário precisa informar) */
  capacidadeKg: number | null
}

/** Anexo A.2.1 — tabela padrão (P-190 = 3,5 kg/h) */
export const VAPORIZACAO_A21: Recipiente[] = [
  { id: 'P-13', vaporizacao: 0.6, capacidadeKg: 13 },
  { id: 'P-45', vaporizacao: 1.0, capacidadeKg: 45 },
  { id: 'P-190', vaporizacao: 3.5, capacidadeKg: 190 },
  { id: 'P-500', vaporizacao: 7.0, capacidadeKg: 500 },
  { id: 'P-1000', vaporizacao: 11.0, capacidadeKg: 1000 },
  { id: 'P-2000', vaporizacao: 16.0, capacidadeKg: 2000 },
  { id: 'P-4000', vaporizacao: 26.0, capacidadeKg: 4000 },
]

/** Anexo A.2.2 — tabela alternativa (capacidade em água; kg informado pelo usuário) */
export const VAPORIZACAO_A22: Recipiente[] = [
  { id: 'P 45', vaporizacao: 1.0, capacidadeKg: 45 },
  { id: 'P 90', vaporizacao: 2.0, capacidadeKg: 90 },
  { id: 'B 125', vaporizacao: 2.5, capacidadeKg: null },
  { id: 'B 190', vaporizacao: 3.0, capacidadeKg: null },
  { id: 'B 500', vaporizacao: 10.0, capacidadeKg: null },
  { id: 'B 1000', vaporizacao: 20.0, capacidadeKg: null },
]

export const ALERTA_VAPORIZACAO =
  'Taxa de vaporização de referência. Consulte a tabela da distribuidora de GLP da sua região, ' +
  'pois a vaporização varia com o fornecedor e com o clima.'

export interface Estado { uf: string; nome: string; gases: Gas[]; normas: string[] }

/** Seção 7.3 — se a norma estadual não trata de GN, GN não é oferecido */
export const ESTADOS: Estado[] = [
  { uf: 'TO', nome: 'Tocantins', gases: ['GLP'], normas: ['NT 23 (Portaria 13/2022/CAT, alt. Portaria 17/2024/CAT)'] },
  { uf: 'GO', nome: 'Goiás', gases: ['GLP', 'GN'], normas: ['NT 28/2022 Parte 1 (GLP)', 'NT 29/2022 (GN)'] },
  { uf: 'SP', nome: 'São Paulo', gases: ['GLP', 'GN'], normas: ['IT 28/2025 (GLP)', 'IT 29/2025 (GN)'] },
  { uf: 'RJ', nome: 'Rio de Janeiro', gases: ['GLP', 'GN'], normas: ['NT 3-02:2023, 2ª ed., alt. 2025'] },
]

export const gasesDoEstado = (uf: string): Gas[] => ESTADOS.find(e => e.uf === uf)?.gases ?? []
