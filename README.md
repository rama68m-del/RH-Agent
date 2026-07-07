# Agent Recruteur IA — OZ Solutions

Copilote « sourcing-to-shortlist » pour cabinets de recrutement d'Afrique de l'Ouest (Mali d'abord). Il transforme un flux de candidatures désordonné (CV scannés, photos, PDF) en un vivier structuré, cherchable et présentable au client — en français, conforme à la loi malienne 2013-015 (APDP).

Documents de référence : [`CLAUDE.md`](./CLAUDE.md) (constitution du projet), [`docs/PRD.md`](./docs/PRD.md), [`docs/MVP_KICKOFF.md`](./docs/MVP_KICKOFF.md).

## Stack

- **Next.js 15** (App Router) + TypeScript strict + Tailwind CSS 4 — déployable sur Vercel
- **Supabase** : Postgres (RLS par agence), Auth, Storage (CV + shortlists)
- **Claude (API Anthropic)** : parsing de CV (vision PDF/photo), matching explicable, recherche en langage naturel — sorties JSON validées par Zod
- **@react-pdf/renderer** : shortlist PDF brandée FR/EN

## Démarrage

### 1. Prérequis

- Node.js 18+
- Un projet [Supabase](https://supabase.com)
- Une clé API [Anthropic](https://console.anthropic.com)

### 2. Base de données

Dans le SQL Editor de Supabase, exécuter dans l'ordre :

1. `supabase/migrations/0001_schema.sql` — tables, RLS, buckets Storage
2. `supabase/migrations/0002_seed_demo.sql` — agence de démonstration

### 3. Créer le premier recruteur

1. Supabase Dashboard → Authentication → Users → *Add user* (email + mot de passe, confirmer l'email).
2. Rattacher l'utilisateur à l'agence :

```sql
insert into public.profiles (id, agency_id, full_name)
values ('<uuid_utilisateur>', '00000000-0000-0000-0000-000000000001', 'Prénom Nom');
```

### 4. Variables d'environnement

```bash
cp .env.example .env.local
# puis remplir les clés Supabase et Anthropic
```

### 5. Lancer

```bash
npm install
npm run dev
```

- Espace recruteur : http://localhost:3000 (login → tableau de bord)
- Formulaire public de candidature : http://localhost:3000/postuler

## Parcours MVP

1. **Intake (M1)** — le candidat dépose son CV + consentement APDP sur `/postuler`. Fichier en Storage, ligne `candidates` avec `consent_at`, `consent_text`, `retention_until` (24 mois).
2. **Parsing (M2)** — sur la fiche candidat, « Extraire le profil avec l'IA » : Claude lit le PDF/la photo et propose un profil structuré ; le recruteur corrige puis enregistre (revue humaine obligatoire).
3. **CVthèque (M3)** — recherche par filtres ou en langage naturel (« comptable OHADA bilingue anglais à Bamako »), résultats dédupliqués.
4. **Matching (M4)** — sur un mandat, Claude classe le vivier par compétences avec justification lisible. Aucun candidat n'est présentable sans le clic « Valider » du recruteur. Pas de rejet automatique.
5. **Shortlist (M5)** — PDF brandé FR/EN (comparatif + « pourquoi ce candidat ») généré à partir des seuls candidats validés.
6. **Tableau de bord (M6)** — mandats ouverts, pipeline par étape, vivier.

## Conformité (APDP — loi 2013-015)

- Consentement explicite recueilli et enregistré **avant** tout stockage.
- Durée de conservation limitée (`retention_until`) + statut `a_purger` pour les demandes de suppression.
- Journal d'audit (`audit_log`) de tous les accès et traitements de données candidat.
- Aucun frais candidat, à aucune étape (loi 92-020) — rappelé dans l'UI et le PDF.
- Matching par compétences, explicable, sans critère discriminatoire ; validation humaine systématique.

## Hors périmètre MVP

WhatsApp (phase 7), n8n, paie/HRIS, entretien vidéo, scraping LinkedIn.
