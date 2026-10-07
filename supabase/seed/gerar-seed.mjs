// Gera supabase/seed/demo.sql a partir de src/app/mockData.js (mesma fonte do modo demo).
import { writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { mockProjetos } from '../../src/app/mockData.js'

const q = v => (v == null ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
const j = v => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`

let sql = `-- Dados fictícios de demonstração (seção 12). Gerado por gerar-seed.mjs.
do $$
declare org uuid;
begin
  select id into org from public.organizations where nome = 'Escritório Exemplo';
  if org is null then
    insert into public.organizations (nome) values ('Escritório Exemplo') returning id into org;
  end if;
`
for (const p of mockProjetos) {
  const pid = randomUUID()
  const ids = new Map(p.trechos.map(t => [t.id, randomUUID()]))
  sql += `
  if not exists (select 1 from public.projects where organization_id = org and nome = ${q(p.nome)}) then
    insert into public.projects (id, organization_id, nome, estado, municipio, uso, tipo_uso, tipologia, gas, material_id, pressao_operacao, created_by, updated_by)
    values (${q(pid)}, org, ${q(p.nome)}, ${q(p.estado)}, ${q(p.municipio)}, ${q(p.uso)}, ${q(p.tipoUso)}, ${q(p.tipologia)}, ${q(p.gas)}, ${q(p.materialId)}, ${p.pressaoOperacao}, null, null);
`
  // montantes antes dos filhos (a lista já está nessa ordem)
  p.trechos.forEach((t, i) => {
    sql += `    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values (${q(ids.get(t.id))}, ${q(pid)}, org, ${i}, ${q(t.nome)}, ${t.montanteId ? q(ids.get(t.montanteId)) : 'null'}, ${t.lh}, ${t.lasc}, ${t.ldesc}, ${j(t.conexoes)}, ${j(t.aparelhos)}, ${t.dentroUnidade}, ${q(t.reguladorSaida)});
`
  })
  sql += `  end if;
`
}
sql += `end $$;
`
writeFileSync(new URL('./demo.sql', import.meta.url), sql)
console.log('ok', sql.length)
