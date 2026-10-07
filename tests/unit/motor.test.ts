// Casos obrigatórios da seção 14.2 da especificação.

import { describe, expect, it } from 'vitest'
import {
  calcularCentral, dimensionarRede, estanqueidade, fatorSimultaneidade, gasesDoEstado,
  diametrosDisponiveis, materialPorId, perdaPorSubida, volumeHidraulico, VAPORIZACAO_A21,
  ALERTA_VAPORIZACAO, type TrechoRede,
} from '../../src/domain/calc/index.ts'

const trecho = (id: string, montanteId: string | null, l: number, extra: Partial<TrechoRede> = {}): TrechoRede => ({
  id, nome: id, montanteId, lh: l, lasc: 0, ldesc: 0, conexoes: {}, aparelhos: [], ...extra,
})

describe('Caso 1 — NBR 15526, Anexo C, Exemplo 1 (casa, GN, cobre classe E, 2,5 kPa)', () => {
  // Vazões da tabela → potência no ponto = Q × PCI (8.600 kcal/m³)
  const ap = (q: number) => [{ nome: 'ponto', potencia: q * 8600, quantidade: 1 }]
  const trechos: TrechoRede[] = [
    trecho('AB', null, 9.60, { dnForcado: '22 (3/4")', dentroUnidade: true }),
    trecho('BC', 'AB', 4.30, { dnForcado: '15 (1/2")', dentroUnidade: true }),
    trecho('CD', 'BC', 6.92, { dnForcado: '15 (1/2")', dentroUnidade: true, aparelhos: ap(0.70) }),
    trecho("BB'", 'AB', 2.92, { dnForcado: '15 (1/2")', dentroUnidade: true, aparelhos: ap(1.56) }),
    trecho("CC'", 'BC', 6.30, { dnForcado: '15 (1/2")', dentroUnidade: true, aparelhos: ap(1.74) }),
  ]
  const r = dimensionarRede({ gas: 'GN', uso: 'residencial', pressaoOperacao: 2.5, materialId: 'cobre_e' }, trechos)
  const esperado: Record<string, [number, number, number, number]> = {
    AB: [4.00, 20.8, 2.50, 2.43],
    BC: [2.44, 14.0, 2.43, 2.33],
    CD: [0.70, 14.0, 2.33, 2.32],
    "BB'": [1.56, 14.0, 2.43, 2.40],
    "CC'": [1.74, 14.0, 2.33, 2.26],
  }
  for (const [nome, [q, di, pi, pf]] of Object.entries(esperado)) {
    it(`trecho ${nome}`, () => {
      const l = r.linhas.find(x => x.nome === nome)!
      expect(l.q).toBeCloseTo(q, 2)
      expect(l.di).toBe(di)
      expect(Math.abs(l.pi - pi)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(l.pf - pf)).toBeLessThanOrEqual(0.01)
      expect(l.f).toBe(100)
    })
  }
  it('todos os trechos atendem (nenhum vermelho)', () => {
    expect(r.linhas.every(l => l.situacao !== 'vermelho')).toBe(true)
  })
  it('dimensionamento automático encontra uma solução que atende', () => {
    const auto = dimensionarRede({ gas: 'GN', uso: 'residencial', pressaoOperacao: 2.5, materialId: 'cobre_e' },
      trechos.map(t => ({ ...t, dnForcado: null })))
    expect(auto.linhas.every(l => l.utilizacao <= 1)).toBe(true)
  })
})

describe('Caso 2 — NBR 15526, Anexo C, Exemplo 2 (fator de simultaneidade)', () => {
  it('C = 214.240 kcal/h → F = 46,77%', () => {
    expect(Math.abs(fatorSimultaneidade(214240, 'coletivo').f - 46.77)).toBeLessThan(0.01)
  })
  it('C = 26.780 kcal/h → F = 94,88%', () => {
    expect(fatorSimultaneidade(26780, 'coletivo').f).toBeCloseTo(94.88, 2)
  })
})

describe('Caso 3 — Central de GLP, 88 apartamentos', () => {
  const c = 88 * (9976 + 3010 + 12000)
  const p190 = VAPORIZACAO_A21.find(r => r.id === 'P-190')!
  const r = calcularCentral({ potenciaComputada: c, contexto: 'coletivo', vaporizacao: p190.vaporizacao, capacidadeKg: p190.capacidadeKg! })
  it('potência computada', () => expect(r.potenciaComputada).toBe(2198768))
  it('F = 23%', () => expect(r.f).toBe(23))
  it('potência adotada', () => expect(Math.round(r.potenciaAdotada)).toBe(505717))
  it('vazão 21,07 m³/h', () => expect(r.vazao).toBeCloseTo(21.07, 2))
  it('consumo 45,66 kg/h', () => expect(r.consumo).toBeCloseTo(45.66, 2))
  it('14 recipientes P190 (13,05 arredondado para cima)', () => {
    expect(r.recipientesExato).toBeCloseTo(13.05, 2)
    expect(r.recipientes).toBe(14)
  })
  it('alerta de vaporização regional exibido', () => expect(r.alertas).toContain(ALERTA_VAPORIZACAO))
})

describe('Caso 4 — Regras e bloqueios', () => {
  it('F dentro de uma unidade = 100%, mesmo com C > 21.000 kcal/h', () => {
    expect(fatorSimultaneidade(50000, 'unidade').f).toBe(100)
    expect(fatorSimultaneidade(50000, 'unidade', { f: 60 }).erros.length).toBeGreaterThan(0)
  })

  it('F em comércio = 100% por padrão; redução só com justificativa', () => {
    expect(fatorSimultaneidade(500000, 'comercial').f).toBe(100)
    const semJust = fatorSimultaneidade(500000, 'comercial', { f: 70 })
    expect(semJust.f).toBe(100)
    expect(semJust.erros.length).toBe(1)
    const comJust = fatorSimultaneidade(500000, 'comercial', { f: 70, justificativa: 'turnos distintos' })
    expect(comJust.f).toBe(70)
    expect(comJust.alertas.length).toBe(1)
  })

  it('projetista pode adotar F maior que o calculado, nunca menor', () => {
    expect(fatorSimultaneidade(214240, 'coletivo', { f: 60, justificativa: 'folga' }).f).toBe(60)
    expect(fatorSimultaneidade(214240, 'coletivo', { f: 30 }).f).toBeCloseTo(46.77, 1)
  })

  // Rede de dois estágios: AB termina num regulador que alimenta BC
  const redeReguladores = (perdaAlvoPct: number, uso: 'residencial' | 'comercial') => {
    // Busca o comprimento de AB que produz a perda desejada até o regulador
    let lo = 0.1, hi = 2000
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      const r = dimensionarRede({ gas: 'GLP', uso, pressaoOperacao: 50, materialId: 'pex' }, [
        trecho('AB', null, mid, { dnForcado: '20 (3/4")' }),
        trecho('BC', 'AB', 1, { reguladorSaida: 2.8, aparelhos: [{ nome: 'x', potencia: 100000, quantidade: 1 }] }),
      ])
      if (r.linhas[0].perdaAcumPct < perdaAlvoPct) lo = mid; else hi = mid
    }
    return dimensionarRede({ gas: 'GLP', uso, pressaoOperacao: 50, materialId: 'pex' }, [
      trecho('AB', null, lo, { dnForcado: '20 (3/4")' }),
      trecho('BC', 'AB', 1, { reguladorSaida: 2.8, aparelhos: [{ nome: 'x', potencia: 100000, quantidade: 1 }] }),
    ]).linhas[0]
  }

  it('regulador em rede comercial reprova com perda acima de 20%', () => {
    const l = redeReguladores(25, 'comercial')
    expect(l.limitePct).toBe(20)
    expect(l.situacao).toBe('vermelho')
  })

  it('regulador em rede residencial só reprova acima de 30%', () => {
    const l25 = redeReguladores(25, 'residencial')
    expect(l25.limitePct).toBe(30)
    expect(l25.situacao).not.toBe('vermelho')
    expect(redeReguladores(31, 'residencial').situacao).toBe('vermelho')
  })

  it('rede comercial de GLP acima de 150 kPa é recusada', () => {
    const r = dimensionarRede({ gas: 'GLP', uso: 'comercial', pressaoOperacao: 200, materialId: 'pex' }, [trecho('AB', null, 5)])
    expect(r.ok).toBe(false)
    expect(r.erros[0]).toMatch(/150 kPa/)
    const gn = dimensionarRede({ gas: 'GN', uso: 'comercial', pressaoOperacao: 200, materialId: 'pex' }, [trecho('AB', null, 5)])
    expect(gn.ok).toBe(true)
  })

  it('desnível: 10 m subindo reduz 0,105 kPa em GLP e aumenta 0,053 kPa em GN', () => {
    expect(perdaPorSubida(10, 1.8)).toBeCloseTo(0.105, 3)
    expect(-perdaPorSubida(10, 0.6)).toBeCloseTo(0.053, 3)
  })

  it('estanqueidade residencial com 2,8 kPa: 1ª etapa = 20 kPa', () => {
    const e = estanqueidade('residencial', 2.8, 2.8, [])
    expect(e.etapas[0].pressaoEnsaio).toBe(20)
    expect(e.etapas[1].pressaoEnsaio).toBe(2.8)
  })

  it('volume hidráulico de 30 m com DI 26 mm = 15,9 L, sem purga com inerte', () => {
    expect(volumeHidraulico([{ di: 26, l: 30 }])).toBeCloseTo(15.9, 1)
    expect(estanqueidade('residencial', 2.8, 2.8, [{ di: 26, l: 30 }]).purgaInerte).toBe(false)
  })

  it('projeto em Tocantins não oferece GN', () => {
    expect(gasesDoEstado('TO')).toEqual(['GLP'])
    expect(gasesDoEstado('GO')).toContain('GN')
  })

  it('diâmetro sem DI cadastrado nunca é oferecido', () => {
    const cobre = diametrosDisponiveis(materialPorId('cobre_e')!)
    expect(cobre.every(d => d.di != null)).toBe(true)
    expect(cobre.map(d => d.dn)).not.toContain('42 (1 1/2")')
    const aco = dimensionarRede({ gas: 'GLP', uso: 'residencial', pressaoOperacao: 2.8, materialId: 'aco_galv' }, [trecho('AB', null, 5)])
    expect(aco.ok).toBe(false)
    const forcadoSemDi = dimensionarRede({ gas: 'GN', uso: 'residencial', pressaoOperacao: 2.5, materialId: 'cobre_e' },
      [trecho('AB', null, 5, { dnForcado: '42 (1 1/2")' })])
    expect(forcadoSemDi.linhas[0].dn).not.toBe('42 (1 1/2")')
  })
})

describe('Comportamentos da rede', () => {
  const projeto = { gas: 'GLP' as const, uso: 'residencial' as const, pressaoOperacao: 2.8, materialId: 'pex' }
  const base: TrechoRede[] = [
    trecho('AB', null, 10),
    trecho('BC', 'AB', 5, { aparelhos: [{ nome: 'fogão', potencia: 13390, quantidade: 1 }] }),
    trecho('BD', 'AB', 8, { aparelhos: [{ nome: 'aquecedor', potencia: 22000, quantidade: 1 }] }),
  ]

  it('mudar um comprimento recalcula os trechos a jusante', () => {
    const r1 = dimensionarRede(projeto, base.map(t => ({ ...t, dnForcado: '25 (1")' })))
    const r2 = dimensionarRede(projeto, base.map(t => ({ ...t, dnForcado: '25 (1")', lh: t.id === 'AB' ? 30 : t.lh })))
    const pf = (r: typeof r1, id: string) => r.linhas.find(l => l.id === id)!.pf
    expect(pf(r2, 'BC')).toBeLessThan(pf(r1, 'BC'))
    expect(pf(r2, 'BD')).toBeLessThan(pf(r1, 'BD'))
  })

  it('ramais paralelos partem do mesmo nó com a mesma pressão', () => {
    const r = dimensionarRede(projeto, base)
    const ab = r.linhas.find(l => l.id === 'AB')!
    expect(r.linhas.find(l => l.id === 'BC')!.pi).toBe(ab.pf)
    expect(r.linhas.find(l => l.id === 'BD')!.pi).toBe(ab.pf)
  })

  it('diâmetro forçado que reprova só é aceito com ignorar + justificativa, e vira pendência', () => {
    const longo = [trecho('AB', null, 200, { dnForcado: '16 (1/2")', aparelhos: [{ nome: 'aq', potencia: 49000, quantidade: 1 }] })]
    const r1 = dimensionarRede(projeto, longo)
    expect(r1.linhas[0].situacao).toBe('vermelho')
    expect(r1.pendencias[0].severidade).toBe('impeditiva')
    const r2 = dimensionarRede(projeto, [{ ...longo[0], ignorar: true, justificativa: 'rede existente' }])
    expect(r2.linhas[0].situacao).toBe('ignorado')
    expect(r2.pendencias.length).toBe(1)
  })

  it('pressão acima de 7,5 kPa dentro da unidade reprova', () => {
    const r = dimensionarRede({ ...projeto, pressaoOperacao: 50 }, [trecho('AB', null, 5, { dentroUnidade: true })])
    expect(r.linhas[0].situacao).toBe('vermelho')
  })

  it('ciclo na árvore é detectado', () => {
    const r = dimensionarRede(projeto, [trecho('AB', 'BC', 1), trecho('BC', 'AB', 1)])
    expect(r.ok).toBe(false)
  })
})
