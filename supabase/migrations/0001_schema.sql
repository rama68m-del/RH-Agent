-- ============================================================
-- Agent Recruteur IA — Schéma initial (M0)
-- Tables : agencies, profiles (liaison auth), candidates,
--          mandates, matches, shortlists, audit_log
-- Toutes les tables sensibles sous RLS, scoping par agency_id.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Agences (cabinets de recrutement)
-- ------------------------------------------------------------
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Profils recruteurs : liaison auth.users -> agence
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Agence de l'utilisateur courant (utilisée par toutes les politiques RLS)
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Candidats (vivier / CVthèque)
-- ------------------------------------------------------------
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  location text,
  languages text[] not null default '{}',
  skills text[] not null default '{}',
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  cv_file_url text,
  source text not null default 'web',
  status text not null default 'nouveau'
    check (status in ('nouveau', 'a_revoir', 'valide', 'archive', 'a_purger')),
  -- Conformité APDP (loi 2013-015) : consentement obligatoire AVANT stockage
  consent_at timestamptz not null,
  consent_text text not null,
  retention_until date not null,
  created_at timestamptz not null default now()
);

create index candidates_agency_idx on public.candidates (agency_id);
create index candidates_skills_idx on public.candidates using gin (skills);
create index candidates_languages_idx on public.candidates using gin (languages);

-- ------------------------------------------------------------
-- Mandats (postes à pourvoir pour un client)
-- ------------------------------------------------------------
create table public.mandates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  title text not null,
  client_name text not null,
  description text not null default '',
  requirements jsonb not null default '{}'::jsonb,
  status text not null default 'ouvert'
    check (status in ('ouvert', 'shortlist_envoyee', 'gagne', 'perdu', 'ferme')),
  created_at timestamptz not null default now()
);

create index mandates_agency_idx on public.mandates (agency_id);

-- ------------------------------------------------------------
-- Matches (proposition IA + validation humaine obligatoire)
-- ------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  justification text not null,
  -- Jamais présenté au client sans validation humaine explicite
  recruiter_validated boolean not null default false,
  stage text not null default 'propose'
    check (stage in ('propose', 'valide', 'presente', 'entretien', 'retenu', 'ecarte')),
  created_at timestamptz not null default now(),
  unique (mandate_id, candidate_id)
);

create index matches_mandate_idx on public.matches (mandate_id);
create index matches_candidate_idx on public.matches (candidate_id);

-- ------------------------------------------------------------
-- Shortlists (livrable client)
-- ------------------------------------------------------------
create table public.shortlists (
  id uuid primary key default gen_random_uuid(),
  mandate_id uuid not null references public.mandates (id) on delete cascade,
  candidate_ids uuid[] not null default '{}',
  pdf_url text,
  language text not null default 'fr' check (language in ('fr', 'en')),
  created_at timestamptz not null default now()
);

create index shortlists_mandate_idx on public.shortlists (mandate_id);

-- ------------------------------------------------------------
-- Journal d'audit (APDP) : tout accès aux données candidat
-- ------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates (id) on delete set null,
  actor text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index audit_log_candidate_idx on public.audit_log (candidate_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.agencies enable row level security;
alter table public.profiles enable row level security;
alter table public.candidates enable row level security;
alter table public.mandates enable row level security;
alter table public.matches enable row level security;
alter table public.shortlists enable row level security;
alter table public.audit_log enable row level security;

-- Agences : un recruteur ne voit que la sienne
create policy "agencies_select_own" on public.agencies
  for select using (id = public.current_agency_id());

-- Profils : chacun voit le sien
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

-- Candidats : CRUD limité à l'agence du recruteur
create policy "candidates_all_own_agency" on public.candidates
  for all using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());

-- Mandats : idem
create policy "mandates_all_own_agency" on public.mandates
  for all using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());

-- Matches : via le mandat de l'agence
create policy "matches_all_own_agency" on public.matches
  for all using (
    exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.agency_id = public.current_agency_id()
    )
  )
  with check (
    exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.agency_id = public.current_agency_id()
    )
  );

-- Shortlists : via le mandat de l'agence
create policy "shortlists_all_own_agency" on public.shortlists
  for all using (
    exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.agency_id = public.current_agency_id()
    )
  )
  with check (
    exists (
      select 1 from public.mandates m
      where m.id = mandate_id and m.agency_id = public.current_agency_id()
    )
  );

-- Audit : lecture limitée aux candidats de l'agence ; écriture côté serveur
create policy "audit_select_own_agency" on public.audit_log
  for select using (
    candidate_id is null or exists (
      select 1 from public.candidates c
      where c.id = candidate_id and c.agency_id = public.current_agency_id()
    )
  );

-- ============================================================
-- Storage : bucket privé pour les CV
-- ============================================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('shortlists', 'shortlists', false)
on conflict (id) do nothing;

-- Lecture des CV limitée aux recruteurs de l'agence
-- (chemin des fichiers : {agency_id}/{candidate_id}.{ext})
create policy "cvs_read_own_agency" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );

-- Lecture des shortlists limitée aux recruteurs de l'agence
-- (chemin des fichiers : {agency_id}/{shortlist_id}.pdf)
create policy "shortlists_read_own_agency" on storage.objects
  for select using (
    bucket_id = 'shortlists'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );
