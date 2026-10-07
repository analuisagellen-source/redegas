# Plano da 1ª entrega — Fundação + Motor de cálculo + 1ª fatia

Junta as etapas 1 e 2 da seção 13 da especificação, ainda **sem banco** (dados de
teste no próprio app). O Supabase entra na entrega seguinte.

## O que será construído

1. **Esqueleto do app**: React 19 + Vite, design system laranja #EA580C, menu
   lateral recolhível, aviso para telas pequenas, login de demonstração (escolhe o
   perfil e entra, sem senha real por enquanto).
2. **Motor de cálculo** (`src/domain/calc`, TypeScript, sem tela e sem banco):
   - parâmetros GN/GLP (6.1); potência computada (6.2);
   - fator de simultaneidade com bloqueios (6.3);
   - potência adotada e vazão (6.4); comprimento total (6.5);
   - perda de carga: GN ≤ 7,5 kPa, GLP ≤ 7,5 kPa e > 7,5 kPa com pressão absoluta (6.6);
   - desnível (6.7); velocidade (6.8); critérios residencial/comercial (6.9);
   - rede em árvore, perda acumulada por estágio e escolha automática do menor
     diâmetro que atende (6.10);
   - central de GLP (6.11) e estanqueidade/purga (6.12).
   Cada resultado leva a sua origem (norma, edição, item).
3. **Testes automáticos** com todos os casos da seção 14.2.
4. **Telas**: Início · Lista de projetos · Novo projeto (dados básicos: estado, uso,
   gás, material, pressão do estágio) · Trechos (entrada tabular, duplicar linha,
   herdar material) · Dimensionamento (tabela do Anexo A.6 com semáforo).
5. **Memorial PDF simples**: gerado pela impressão do navegador ("Salvar como PDF"),
   usando os mesmos componentes e as mesmas funções da tela.

## Modelo de dados (por enquanto em memória; vira tabela no Supabase depois)

- `projects`: id, nome, estado, uso, gás, material, pressão do estágio, status.
- `network_segments`: id, project_id, nome (AB…), trecho de montante, L horizontal,
  L ascendente, L descendente, conexões (tipo × quantidade), aparelhos/potência a
  jusante, regulador no início, diâmetro forçado, ignorar + justificativa.
- Catálogo de materiais (Anexo A): cobre classe E (DI 14,0 / 20,8 / 26,8 / 33,6),
  PEX multicamada (DI 12,2 / 16,0 / 20,0 / 26,0). Aço galvanizado **não** é
  oferecido até ter DI cadastrado (regra 6.10.4).

## Critérios de aceite (dado / quando / então)

- Dado o Exemplo 1 da NBR 15526, quando calculo AB, BC, CD, BB', CC', então as
  pressões finais batem com 2,43 / 2,33 / 2,32 / 2,40 / 2,26 kPa (±0,01).
- Dado C = 214.240 kcal/h, quando calculo F, então F = 46,77%; C = 26.780 → 94,88%.
- Dado 88 apartamentos (cooktop 9.976 + forno 3.010 + aquecedor 12.000), quando
  calculo a central, então C = 2.198.768, F = 23%, Q = 21,07 m³/h, 45,66 kg/h,
  14 P190 e o alerta de vaporização aparece.
- Dado um trecho dentro de uma unidade ou em comércio, então F = 100%.
- Dado um regulador, quando a perda passa de 20% (comercial) ou 30%
  (residencial), então reprova.
- Dado GLP comercial acima de 150 kPa, então é recusado.
- Dado 10 m subindo, então GLP perde 0,105 kPa e GN ganha 0,053 kPa.
- Dado pressão de trabalho 2,8 kPa residencial, então ensaio da 1ª etapa = 20 kPa.
- Dado 30 m com DI 26 mm, então volume = 15,9 L e não exige purga com inerte.
- Dado um projeto em TO, então GN não é oferecido.
- Dado que mudo um comprimento, então todos os trechos a jusante recalculam.

## Dúvidas abertas (não vou inventar)

1. **Exemplo 2 da NBR 15526**: a especificação não traz a Tabela C.9 (diâmetros).
   Nesta entrega testo só os valores de F; a tabela entra quando a pasta
   `referencias/` for adicionada.
2. **Pasta `referencias/`** (normas e normas dos Bombeiros) não está no computador.
   Só será necessária na entrega do checklist dos Bombeiros.

## Bibliotecas extras que peço para aprovar

- **Vitest** (só para rodar os testes automáticos; não vai para o app publicado).
- **TypeScript** (só no motor de cálculo, como pede a especificação).
- PDF nesta entrega: **nenhuma** biblioteca (impressão do navegador).
  Leitores/escritores de DXF e XLSX serão apresentados nas entregas deles.
