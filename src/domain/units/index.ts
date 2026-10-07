// Conversões de unidade. O motor calcula em kcal/h, m³/h, kPa, m e mm;
// as conversões abaixo só são usadas na apresentação ou onde a fórmula exige.

/** 1 kcal (Tabela Internacional) = 4,1868 kJ → 1 kW = 3600 / 4,1868 kcal/h */
export const KCAL_H_POR_KW = 3600 / 4.1868

/** 1 kgf/cm² = 98,0665 kPa (seção 6.8 da especificação) */
export const KPA_POR_KGF_CM2 = 98.0665

/** Pressão atmosférica padrão, editável por projeto (seção 6.6) */
export const PATM_PADRAO_KPA = 101.325

export const kcalHParaKw = (kcalH: number) => kcalH / KCAL_H_POR_KW
export const kwParaKcalH = (kw: number) => kw * KCAL_H_POR_KW
export const kPaParaKgfCm2 = (kPa: number) => kPa / KPA_POR_KGF_CM2
