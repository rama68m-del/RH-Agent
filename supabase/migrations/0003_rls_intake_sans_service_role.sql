-- ============================================================
-- Le parcours d'intake public fonctionne avec la clé ANON (RLS),
-- sans clé service_role. Moindre privilège : plus aucun secret
-- Supabase côté serveur applicatif.
-- ============================================================

-- Le formulaire public doit pouvoir afficher le nom/branding du cabinet.
create policy "agencies_select_public" on public.agencies
  for select to anon using (true);

-- Dépôt de candidature : insertion seule (jamais de lecture/modif côté anon),
-- et uniquement avec un consentement non vide (APDP).
create policy "candidates_insert_public_intake" on public.candidates
  for insert to anon
  with check (consent_text is not null and char_length(consent_text) > 0);

-- Journal d'audit : écriture depuis l'intake public et depuis les
-- parcours recruteur (la lecture reste limitée à l'agence).
create policy "audit_insert_public" on public.audit_log
  for insert to anon with check (true);

create policy "audit_insert_authenticated" on public.audit_log
  for insert to authenticated with check (true);

-- Dépôt du CV par le candidat (bucket privé, insertion seule).
create policy "cvs_insert_public_intake" on storage.objects
  for insert to anon with check (bucket_id = 'cvs');

-- Dépôt des PDF shortlists par les recruteurs de l'agence.
create policy "shortlists_insert_own_agency" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'shortlists'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );

-- Anti-abus : limites du bucket CV (10 Mo, PDF/images uniquement).
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'cvs';

-- Détection de doublon à l'intake sans exposer les candidats à l'anon :
-- fonction étroite en security definer qui ne renvoie qu'un booléen.
create or replace function public.intake_phone_exists(p_agency_id uuid, p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.candidates
    where agency_id = p_agency_id and phone = p_phone
  );
$$;

grant execute on function public.intake_phone_exists(uuid, text) to anon;
