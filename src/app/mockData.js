// Dados fictícios de demonstração (seção 12). Mesmos nomes de campo que as
// tabelas do Supabase terão (`projects`, `network_segments`).

const ap = (nome, potencia, quantidade = 1) => ({ nome, potencia, quantidade })

const t = (id, nome, montanteId, lh, extra = {}) => ({
  id, nome, montanteId, lh, lasc: 0, ldesc: 0, conexoes: {}, aparelhos: [],
  dentroUnidade: false, reguladorSaida: null, dnForcado: null, ignorar: false, justificativa: '',
  fInformado: null, fJustificativa: '', ...extra,
})

const agora = '2026-10-07T12:00:00-03:00'

export const mockOrganizacao = { id: 'org-1', nome: 'Escritório Exemplo' }

export const mockUsuarios = [
  { id: 'u1', nome: 'Projetista Demonstração', email: 'projetista@example.com', role: 'projetista' },
  { id: 'u2', nome: 'Estudante Demonstração', email: 'estudante@example.com', role: 'estudante' },
  { id: 'u3', nome: 'Administrador Demonstração', email: 'admin@example.com', role: 'admin' },
  { id: 'u4', nome: 'Curador Demonstração', email: 'curador@example.com', role: 'curador' },
]

export const mockProjetos = [
  {
    id: 'p-casa',
    nome: 'Casa Modelo',
    estado: 'GO', municipio: 'Município Exemplo',
    uso: 'residencial', tipoUso: 'unifamiliar', tipologia: 'terrea',
    gas: 'GN', materialId: 'cobre_e', pressaoOperacao: 2.5,
    status: 'rascunho', criadoEm: agora, atualizadoEm: agora,
    trechos: [
      t('c1', 'AB', null, 9.6, { dentroUnidade: true }),
      t('c2', 'BC', 'c1', 4.3, { dentroUnidade: true }),
      t('c3', 'CD', 'c2', 6.92, { dentroUnidade: true, aparelhos: [ap('Secadora de roupa', 6020)] }),
      t('c4', "BB'", 'c1', 2.92, { dentroUnidade: true, aparelhos: [ap('Fogão 5 bocas com forno', 13390)] }),
      t('c5', "CC'", 'c2', 6.3, { dentroUnidade: true, aparelhos: [ap('Aquecedor de acumulação 300 L', 14998)] }),
    ],
  },
  {
    id: 'p-edificio',
    nome: 'Edifício Modelo',
    estado: 'TO', municipio: 'Município Exemplo',
    uso: 'residencial', tipoUso: 'multifamiliar', tipologia: 'vertical',
    gas: 'GLP', materialId: 'pex', pressaoOperacao: 150,
    status: 'rascunho', criadoEm: agora, atualizadoEm: agora,
    trechos: [
      t('e1', 'AB', null, 18, { conexoes: { joelho: 3, te_reto: 0 } }),
      t('e2', 'BC', 'e1', 0, { lasc: 3, conexoes: { te_reto: 1 } }),
      t('e3', 'CD', 'e2', 0, { lasc: 3, conexoes: { te_reto: 1 } }),
      t('e4', 'DE', 'e3', 0, { lasc: 3, conexoes: { joelho: 1 } }),
      t('e5', 'Apto 101', 'e2', 7, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
      t('e6', 'Apto 102', 'e2', 9, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
      t('e7', 'Apto 201', 'e3', 7, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
      t('e8', 'Apto 202', 'e3', 9, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
      t('e9', 'Apto 301', 'e4', 7, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
      t('e10', 'Apto 302', 'e4', 9, { dentroUnidade: true, reguladorSaida: 2.8, conexoes: { joelho: 4 }, aparelhos: [ap('Fogão 4 bocas com forno', 9288), ap('Aquecedor de passagem 8 L/min', 12000)] }),
    ],
  },
  {
    id: 'p-restaurante',
    nome: 'Restaurante Modelo',
    estado: 'SP', municipio: 'Município Exemplo',
    uso: 'comercial', tipoUso: 'restaurante', tipologia: 'terrea',
    gas: 'GLP', materialId: 'pex', pressaoOperacao: 2.8,
    status: 'rascunho', criadoEm: agora, atualizadoEm: agora,
    trechos: [
      t('r1', 'AB', null, 12, { conexoes: { joelho: 2 } }),
      t('r2', 'BC', 'r1', 3, { conexoes: { te_reto: 1 } }),
      t('r3', 'CD', 'r2', 2.5, { conexoes: { joelho: 1 }, aparelhos: [ap('Fogão industrial 6 bocas (fabricante fictício)', 30000)] }),
      t('r4', 'CE', 'r2', 2, { conexoes: { joelho: 1 }, aparelhos: [ap('Fritadeira (fabricante fictício)', 15000)] }),
      t('r5', 'BF', 'r1', 4, { conexoes: { joelho: 2 }, aparelhos: [ap('Forno combinado (fabricante fictício)', 20000)] }),
    ],
  },
]

export const novoTrecho = (id, nome, montanteId = null, base = {}) => t(id, nome, montanteId, 0, base)
