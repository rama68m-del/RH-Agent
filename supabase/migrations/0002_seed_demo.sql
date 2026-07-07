-- ============================================================
-- Seed de démarrage : une agence de démonstration.
-- Après création d'un utilisateur recruteur (Supabase Auth),
-- le rattacher à l'agence :
--   insert into public.profiles (id, agency_id, full_name)
--   values ('<user_uuid>', '00000000-0000-0000-0000-000000000001', 'Nom Recruteur');
-- ============================================================

insert into public.agencies (id, name, branding)
values (
  '00000000-0000-0000-0000-000000000001',
  'OZ Solutions — Cabinet Démo',
  '{"primaryColor": "#0f766e", "tagline": "Recrutement par compétences, Bamako"}'::jsonb
)
on conflict (id) do nothing;
