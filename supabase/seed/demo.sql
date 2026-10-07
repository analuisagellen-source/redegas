-- Dados fictícios de demonstração (seção 12). Gerado por gerar-seed.mjs.
do $$
declare org uuid;
begin
  select id into org from public.organizations where nome = 'Escritório Exemplo';
  if org is null then
    insert into public.organizations (nome) values ('Escritório Exemplo') returning id into org;
  end if;

  if not exists (select 1 from public.projects where organization_id = org and nome = 'Casa Modelo') then
    insert into public.projects (id, organization_id, nome, estado, municipio, uso, tipo_uso, tipologia, gas, material_id, pressao_operacao, created_by, updated_by)
    values ('65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 'Casa Modelo', 'GO', 'Município Exemplo', 'residencial', 'unifamiliar', 'terrea', 'GN', 'cobre_e', 2.5, null, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('28ab388c-9ab0-49c3-a3a1-fdf30ada9bd7', '65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 0, 'AB', null, 9.6, 0, 0, '{}'::jsonb, '[]'::jsonb, true, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('6a324cbf-1782-4340-b438-c0d70e29a5ac', '65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 1, 'BC', '28ab388c-9ab0-49c3-a3a1-fdf30ada9bd7', 4.3, 0, 0, '{}'::jsonb, '[]'::jsonb, true, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('6aa09e37-cd69-4048-8506-c84631640e18', '65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 2, 'CD', '6a324cbf-1782-4340-b438-c0d70e29a5ac', 6.92, 0, 0, '{}'::jsonb, '[{"nome":"Secadora de roupa","potencia":6020,"quantidade":1}]'::jsonb, true, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('db1ddf64-a64d-4170-a552-45ab51c1b48c', '65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 3, 'BB''', '28ab388c-9ab0-49c3-a3a1-fdf30ada9bd7', 2.92, 0, 0, '{}'::jsonb, '[{"nome":"Fogão 5 bocas com forno","potencia":13390,"quantidade":1}]'::jsonb, true, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('64b03896-1d89-41d5-a0f7-09fe49538f44', '65b41578-3d04-4e15-9a44-a99ff70ff60b', org, 4, 'CC''', '6a324cbf-1782-4340-b438-c0d70e29a5ac', 6.3, 0, 0, '{}'::jsonb, '[{"nome":"Aquecedor de acumulação 300 L","potencia":14998,"quantidade":1}]'::jsonb, true, null);
  end if;

  if not exists (select 1 from public.projects where organization_id = org and nome = 'Edifício Modelo') then
    insert into public.projects (id, organization_id, nome, estado, municipio, uso, tipo_uso, tipologia, gas, material_id, pressao_operacao, created_by, updated_by)
    values ('c0717919-164c-4f3e-937e-985165bd0694', org, 'Edifício Modelo', 'TO', 'Município Exemplo', 'residencial', 'multifamiliar', 'vertical', 'GLP', 'pex', 150, null, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('73d1e74a-9794-4727-a1b4-58bffd5aa30c', 'c0717919-164c-4f3e-937e-985165bd0694', org, 0, 'AB', null, 18, 0, 0, '{"joelho":3,"te_reto":0}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('2f153092-00ce-4305-b96a-f74581590333', 'c0717919-164c-4f3e-937e-985165bd0694', org, 1, 'BC', '73d1e74a-9794-4727-a1b4-58bffd5aa30c', 0, 3, 0, '{"te_reto":1}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('a1ad6649-c79a-4fac-aeba-a6a2776d4e54', 'c0717919-164c-4f3e-937e-985165bd0694', org, 2, 'CD', '2f153092-00ce-4305-b96a-f74581590333', 0, 3, 0, '{"te_reto":1}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('b586a415-ba4f-44c1-8171-fab6f31104bc', 'c0717919-164c-4f3e-937e-985165bd0694', org, 3, 'DE', 'a1ad6649-c79a-4fac-aeba-a6a2776d4e54', 0, 3, 0, '{"joelho":1}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('6e4f771e-b252-4ac5-9303-bb5e16ec0ffd', 'c0717919-164c-4f3e-937e-985165bd0694', org, 4, 'Apto 101', '2f153092-00ce-4305-b96a-f74581590333', 7, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('70b788be-c8e1-49c7-b1da-a4f3c2586fa1', 'c0717919-164c-4f3e-937e-985165bd0694', org, 5, 'Apto 102', '2f153092-00ce-4305-b96a-f74581590333', 9, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('dfbc238f-6a50-49ae-8204-1337cadf0498', 'c0717919-164c-4f3e-937e-985165bd0694', org, 6, 'Apto 201', 'a1ad6649-c79a-4fac-aeba-a6a2776d4e54', 7, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('a9d0b1e9-cf5d-43a8-9101-800ed94712a1', 'c0717919-164c-4f3e-937e-985165bd0694', org, 7, 'Apto 202', 'a1ad6649-c79a-4fac-aeba-a6a2776d4e54', 9, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('06246fcf-e785-4b57-9103-21f13ec0022b', 'c0717919-164c-4f3e-937e-985165bd0694', org, 8, 'Apto 301', 'b586a415-ba4f-44c1-8171-fab6f31104bc', 7, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('dcf4e1a5-4e6a-45d4-951f-6645f5944cfa', 'c0717919-164c-4f3e-937e-985165bd0694', org, 9, 'Apto 302', 'b586a415-ba4f-44c1-8171-fab6f31104bc', 9, 0, 0, '{"joelho":4}'::jsonb, '[{"nome":"Fogão 4 bocas com forno","potencia":9288,"quantidade":1},{"nome":"Aquecedor de passagem 8 L/min","potencia":12000,"quantidade":1}]'::jsonb, true, 2.8);
  end if;

  if not exists (select 1 from public.projects where organization_id = org and nome = 'Restaurante Modelo') then
    insert into public.projects (id, organization_id, nome, estado, municipio, uso, tipo_uso, tipologia, gas, material_id, pressao_operacao, created_by, updated_by)
    values ('369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 'Restaurante Modelo', 'SP', 'Município Exemplo', 'comercial', 'restaurante', 'terrea', 'GLP', 'pex', 2.8, null, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('3d4b049e-87dc-4c67-a190-e1042ab3423f', '369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 0, 'AB', null, 12, 0, 0, '{"joelho":2}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('3a5af8b0-4963-48f1-9cee-7dfd10a3a3f6', '369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 1, 'BC', '3d4b049e-87dc-4c67-a190-e1042ab3423f', 3, 0, 0, '{"te_reto":1}'::jsonb, '[]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('c0ebe39b-0983-4504-bf4e-b6d96fd9bf9b', '369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 2, 'CD', '3a5af8b0-4963-48f1-9cee-7dfd10a3a3f6', 2.5, 0, 0, '{"joelho":1}'::jsonb, '[{"nome":"Fogão industrial 6 bocas (fabricante fictício)","potencia":30000,"quantidade":1}]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('0e47b674-0dda-414a-9f79-10b5dace63c1', '369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 3, 'CE', '3a5af8b0-4963-48f1-9cee-7dfd10a3a3f6', 2, 0, 0, '{"joelho":1}'::jsonb, '[{"nome":"Fritadeira (fabricante fictício)","potencia":15000,"quantidade":1}]'::jsonb, false, null);
    insert into public.network_segments (id, project_id, organization_id, ordem, nome, montante_id, lh, lasc, ldesc, conexoes, aparelhos, dentro_unidade, regulador_saida)
    values ('ee40f44d-b01a-4cfe-bd83-7f7ec4950c82', '369ff97f-b671-4f6f-8aa7-ccfc189f28a6', org, 4, 'BF', '3d4b049e-87dc-4c67-a190-e1042ab3423f', 4, 0, 0, '{"joelho":2}'::jsonb, '[{"nome":"Forno combinado (fabricante fictício)","potencia":20000,"quantidade":1}]'::jsonb, false, null);
  end if;
end $$;
