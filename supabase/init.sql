-- Pokédex Tracker schema
-- Mounted into postgres container at /docker-entrypoint-initdb.d/

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- playthroughs: one row per save file / game tracking session
create table if not exists public.playthroughs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  game_id text not null,
  version text not null,
  name text not null,
  mode text not null default 'seen',
  created_at timestamptz default now(),
  setup_done boolean default false
);

-- dex_entries: sparse — only status 1 (seen) or 2 (caught) stored
create table if not exists public.dex_entries (
  playthrough_id uuid references public.playthroughs(id) on delete cascade,
  pokemon_id integer not null,
  status smallint not null check (status in (1, 2)),
  changed_at timestamptz,
  primary key (playthrough_id, pokemon_id)
);

create index if not exists idx_dex_entries_playthrough on public.dex_entries(playthrough_id);

-- RLS: users can only access their own data
alter table public.playthroughs enable row level security;
alter table public.dex_entries enable row level security;

drop policy if exists "own_playthroughs" on public.playthroughs;
create policy "own_playthroughs" on public.playthroughs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own_dex" on public.dex_entries;
create policy "own_dex" on public.dex_entries
  for all to authenticated
  using (
    exists (select 1 from public.playthroughs p
            where p.id = dex_entries.playthrough_id
            and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.playthroughs p
            where p.id = dex_entries.playthrough_id
            and p.user_id = auth.uid())
  );
