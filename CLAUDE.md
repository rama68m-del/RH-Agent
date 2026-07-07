# CLAUDE.md — Agent Recruteur IA (OZ Solutions)

Ce fichier est la constitution du projet. Claude Code le lit à chaque session. En cas de conflit avec un prompt ponctuel, **ce fichier gagne**.

## Ce qu'on construit
Un copilote IA « sourcing-to-shortlist » pour cabinets de recrutement d'Afrique de l'Ouest (Mali d'abord). Il transforme un flux de candidatures désordonné (CV scannés, photos, PDF incohérents) en un vivier structuré, cherchable et présentable au client, en français, conforme à la loi malienne 2013-015 (APDP).

Cible : consultants de cabinets RH. Le détail complet est dans `/docs/PRD.md` — lis-le avant de planifier.

## Règles inviolables (YOU MUST / NEVER)
- **NEVER** implémenter de paiement ou de frais côté candidat, à aucune étape (illégal — loi 92-020). Le revenu vient de l'employeur/cabinet uniquement.
- **YOU MUST** recueillir et enregistrer le consentement du candidat AVANT de stocker ses données (champs `consent_at`, `consent_text`, `retention_until`).
- **YOU MUST** exiger une validation humaine explicite avant qu'un candidat soit présenté à un client. Pas de rejet automatique, pas d'envoi automatique.
- **YOU MUST** faire produire par le matching une justification lisible (« pourquoi ce candidat »), jamais un score opaque seul.
- **NEVER** implémenter d'analyse faciale ou d'évaluation de personnalité par vidéo/photo.
- **YOU MUST** journaliser les accès aux données candidat (table d'audit) pour l'APDP.
- **NEVER** mettre de secret/clé dans ce repo en clair. Tout passe par `.env` (voir `.env.example`).
- **YOU MUST** que toute l'interface utilisateur soit en français par défaut (EN en option), mobile-first et légère (basse bande passante).

## Stack (imposée)
- **Frontend + API** : Next.js (App Router), TypeScript, Tailwind. Déploiement Vercel.
- **DB / Auth / Storage** : Supabase (Postgres, Auth, Storage).
- **IA** : API Anthropic (Claude). Parsing de CV via capacité vision (PDF/photo → JSON structuré). Matching via Claude (poste + profils → classement + justification, en JSON).
- **PDF shortlist** : `@react-pdf/renderer`.
- Orchestration : dans le code pour le MVP. **Pas de n8n au MVP.**
- Canal d'entrée : formulaire web d'upload au MVP. **WhatsApp seulement en phase 7**, comme adaptateur de canal.

## Architecture en un coup d'œil
- Routes API Next.js = backend. Logique métier dans `/src/services`, jamais dans les composants.
- Appels Claude isolés dans `/src/services/ai/` (un module parsing, un module matching), avec sorties JSON strictement typées et parsées en sécurité.
- Accès DB via un client Supabase centralisé dans `/src/lib/supabase`.

## Modèle de données (tables Supabase)
- `agencies` (id, name, branding jsonb)
- `candidates` (id, agency_id, full_name, phone, email, location, languages[], skills[], experience jsonb, education jsonb, cv_file_url, source, status, consent_at, consent_text, retention_until, created_at)
- `mandates` (id, agency_id, title, client_name, description, requirements jsonb, status, created_at)
- `matches` (id, mandate_id, candidate_id, score, justification, recruiter_validated bool, stage, created_at)
- `shortlists` (id, mandate_id, candidate_ids[], pdf_url, language, created_at)
- `audit_log` (id, candidate_id, actor, action, created_at)
Toutes les tables sensibles sous Row Level Security, scoping par `agency_id`.

## Périmètre
**MVP (à construire) :** intake web + consentement • parsing/normalisation CV • CVthèque cherchable • matching explicable + validation humaine • shortlist PDF brandé (FR/EN) • conformité/audit • tableau de bord mandats.
**Hors périmètre :** HRIS/paie/onboarding • frais candidat • rejet ou envoi automatique • scraping LinkedIn • entretien vidéo • intégrations ATS occidentaux.

## Ordre de construction (milestones)
- **M0** Scaffold repo + schéma Supabase + Auth + `.env.example` + RLS.
- **M1** Intake web : upload CV + capture consentement → fichier en Storage + ligne `candidates`.
- **M2** Parsing Claude (PDF/photo → profil structuré) + écran de revue/édition humaine.
- **M3** CVthèque : recherche (filtres compétences/localisation/langue + sémantique).
- **M4** Mandat : création + matching Claude (classement + justification) + validation humaine.
- **M5** Shortlist PDF brandé (FR/EN) + export.
- **M6** Tableau de bord recruteur (mandats + pipeline par étape).
- **M7** (après validation WhatsApp) Adaptateur canal WhatsApp pour l'intake et les messages.

Construis un milestone à la fois. À chaque fin de milestone : tests, puis résumé de ce qui marche avant de passer au suivant.

## Conventions
- TypeScript strict, pas de `any`. Zod pour valider toute sortie de Claude et toute entrée API.
- Messages d'erreur et libellés UI en français.
- Commits petits et descriptifs. Demande avant toute action destructive (drop, migration cassante).
