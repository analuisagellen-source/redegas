# RedeGás

Dimensionamento de redes internas de gás (GLP e GN). Especificação completa em
`../ESPECIFICACAO_APP_GAS.md`; resumo em `BRIEFING.md`.

## Como rodar no seu computador

1. Abra a pasta `redegas` no Cursor ou VS Code (Arquivo → Abrir Pasta).
2. Abra o terminal (Terminal → Novo Terminal).
3. Na primeira vez: `npm install`
4. Para abrir o app: `npm run dev` e clique com Ctrl no endereço `http://localhost:5173`.
5. Para parar: Ctrl+C no terminal.

## Comandos

- `npm test`: roda os testes do motor de cálculo (casos da seção 14.2).
- `npm run typecheck`: confere os tipos do motor (TypeScript).
- `npm run build`: gera a versão final em `dist/`.

## Onde fica cada coisa

- `src/domain/calc/`: motor de cálculo (fórmulas, rede em árvore, central, estanqueidade, tabelas do Anexo A).
- `src/app/`: login, menu, estado dos projetos e `calculo.js` (a ponte única entre as telas e o motor).
- `src/screens/`: telas. `src/exports/`: memorial.
- `tests/unit/`: testes automáticos.

Os dados ficam no banco Supabase (projeto `redegas`, região São Paulo). Sem as
variáveis de ambiente, o app abre em modo demonstração, com dados no navegador.

## Publicação

- Código: GitHub `analuisagellen-source/redegas` (privado).
- Site: https://redegas-kappa.vercel.app (Vercel, projeto `redegas`). Cada `git push` na branch `main` publica sozinho.
- Variáveis na Vercel (tipo Config): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
