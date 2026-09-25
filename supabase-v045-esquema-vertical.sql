-- Core Orça V045 — Esquema Vertical
-- Execute após o SQL da V044.

alter table public.obras_eletricas
  add column if not exists dados jsonb not null default '{}'::jsonb;

alter table public.obra_eletrica_estruturas
  add column if not exists detalhes jsonb not null default '{}'::jsonb;

comment on column public.obras_eletricas.dados is 'Carga, demanda, quantidades e dados técnicos do esquema vertical';
comment on column public.obra_eletrica_estruturas.detalhes is 'Carga instalada, demanda e parâmetros específicos do quadro/equipamento';
