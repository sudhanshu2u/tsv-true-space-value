-- TSV True Space Value — Supabase schema
-- Run this once in the Supabase SQL Editor (supabase.com → project → SQL Editor → New query)

-- ── Full report storage ──────────────────────────────────────────
create table if not exists tsv_reports (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- ── Lightweight index for browse / filter / search ───────────────
create table if not exists tsv_index (
  id                    text primary key,
  project_name          text not null,
  developer_name        text,
  unit_type             text,
  city                  text,
  locality              text,
  composite             integer not null,
  core_score            integer not null,
  building_score        integer not null,
  value_score           integer not null,
  is_plan_only          boolean not null default true,
  completeness_percent  integer not null default 0,
  value_rating          text,
  verdict_label         text not null,
  asking_price_per_sqft integer,
  created_at            timestamptz not null default now()
);

-- ── Indexes for common query patterns ────────────────────────────
create index if not exists tsv_index_city        on tsv_index (city);
create index if not exists tsv_index_unit_type   on tsv_index (unit_type);
create index if not exists tsv_index_composite   on tsv_index (composite desc);
create index if not exists tsv_index_created_at  on tsv_index (created_at desc);
create index if not exists tsv_index_price       on tsv_index (asking_price_per_sqft);

-- ── Row Level Security (allow server-side reads and writes) ───────
alter table tsv_reports enable row level security;
alter table tsv_index   enable row level security;

-- Service role key bypasses RLS automatically — no policies needed for server-side.
-- If you want to allow public read access (so anyone can view reports), add:
-- create policy "Public read" on tsv_reports for select using (true);
-- create policy "Public read" on tsv_index   for select using (true);
