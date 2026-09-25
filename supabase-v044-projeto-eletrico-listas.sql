-- Core Orça V044 — Projeto elétrico estruturado + tópicos da lista de materiais
create extension if not exists pgcrypto;

create table if not exists public.obras_eletricas (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
 cliente_id uuid references public.clientes(id) on delete set null, nome text not null, observacoes text,
 opcoes jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.obra_eletrica_pavimentos (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
 obra_id uuid not null references public.obras_eletricas(id) on delete cascade, nome text not null, ordem integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.obra_eletrica_estruturas (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
 obra_id uuid not null references public.obras_eletricas(id) on delete cascade, pavimento_id uuid not null references public.obra_eletrica_pavimentos(id) on delete cascade,
 tipo text not null, nome text not null, sistema text, observacoes text, ordem integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.obra_eletrica_componentes (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
 obra_id uuid not null references public.obras_eletricas(id) on delete cascade, pavimento_id uuid not null references public.obra_eletrica_pavimentos(id) on delete cascade,
 estrutura_id uuid not null references public.obra_eletrica_estruturas(id) on delete cascade, tipo text not null,
 material_id uuid not null references public.materiais(id) on delete restrict, quantidade numeric(14,3) not null default 1,
 identificacao text, observacoes text, ordem integer not null default 0, created_at timestamptz not null default now()
);

alter table public.listas_materiais add column if not exists topicos jsonb not null default '["Geral"]'::jsonb;
alter table public.lista_materiais_itens add column if not exists topico text not null default 'Geral';

alter table public.obras_eletricas enable row level security;
alter table public.obra_eletrica_pavimentos enable row level security;
alter table public.obra_eletrica_estruturas enable row level security;
alter table public.obra_eletrica_componentes enable row level security;

do $$ declare t text; begin
 foreach t in array array['obras_eletricas','obra_eletrica_pavimentos','obra_eletrica_estruturas','obra_eletrica_componentes'] loop
   execute format('drop policy if exists %I on public.%I', t||'_empresa', t);
   execute format('create policy %I on public.%I for all to authenticated using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())', t||'_empresa', t);
 end loop;
end $$;

create index if not exists idx_obras_eletricas_empresa on public.obras_eletricas(empresa_id);
create index if not exists idx_oe_pav_obra on public.obra_eletrica_pavimentos(obra_id,ordem);
create index if not exists idx_oe_est_obra on public.obra_eletrica_estruturas(obra_id,pavimento_id,ordem);
create index if not exists idx_oe_comp_obra on public.obra_eletrica_componentes(obra_id,estrutura_id,ordem);
