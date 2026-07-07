# Démarrage MVP avec Claude Code — Guide de lancement

Ce document te dit exactement quoi préparer et quoi coller dans Claude Code. Garde-le dans `/docs/` du repo.

---

## Étape 0 — Prérequis (à faire TOI, avant de lancer Claude Code)

Claude Code écrit le code, mais il ne peut pas créer tes comptes ni valider ton numéro WhatsApp. Prépare :

**Comptes & clés**
- [ ] Projet Supabase créé → récupère `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Clé API Anthropic → `ANTHROPIC_API_KEY` (console.anthropic.com).
- [ ] Compte Vercel (pour déployer plus tard).
- [ ] Node.js 18+ et Claude Code installés (`claude --version`).
- [ ] (Phase 7 seulement) Compte Meta Business + numéro WhatsApp Cloud API validé → `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.

**Dépose dans le repo, avant de lancer :**
- [ ] `CLAUDE.md` à la racine.
- [ ] Le PRD dans `/docs/PRD.md`.
- [ ] Ce fichier dans `/docs/MVP_KICKOFF.md`.

**Fichier `.env`** (Claude Code créera un `.env.example`, mais tes vraies clés vont dans `.env`, jamais commité) :
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## Étape 1 — Le prompt de lancement (à coller tel quel)

> Lis `CLAUDE.md` et `/docs/PRD.md` en entier. Nous construisons le MVP décrit, un milestone à la fois, en commençant par M0.
> Reste en **mode plan** : ne code rien pour l'instant. Propose-moi le plan détaillé de **M0 (scaffold + schéma Supabase + Auth + RLS + .env.example)** : structure des dossiers, fichiers à créer, migrations SQL, et comment tu valideras que M0 fonctionne. Attends ma validation avant de coder.

Tu valides → il code M0 → tu testes → tu passes à M1.

## Prompt pour enchaîner chaque milestone

> M0 est validé et fonctionne. Passe à **M1 (intake web : upload CV + consentement)**. Reste d'abord en mode plan, montre-moi les fichiers et la logique, puis attends ma validation avant de coder.

(Remplace M1 par M2, M3, etc. à chaque étape.)

---

## Critères d'acceptation par milestone

**M0** — `npm run dev` démarre ; les 6 tables existent dans Supabase avec RLS ; `.env.example` présent ; auth recruteur fonctionne (login/logout).

**M1** — Un candidat peut, via un formulaire web, uploader un CV et cocher un consentement clair ; le fichier est en Storage ; une ligne `candidates` est créée avec `consent_at` et `retention_until`.

**M2** — À partir d'un CV uploadé, Claude renvoie un profil structuré (identité, compétences, expériences, formation, langues) ; le recruteur voit l'écran de revue et peut corriger avant enregistrement ; ≥ 80% des champs corrects sur un lot de test.

**M3** — Le recruteur cherche dans la CVthèque par compétence / localisation / langue et en langage naturel ; les résultats sont pertinents et dédupliqués.

**M4** — Le recruteur crée un mandat (poste + exigences) ; Claude propose un classement de candidats **avec justification lisible** ; rien n'est présentable au client sans un clic de validation humaine.

**M5** — Le recruteur génère un shortlist PDF brandé (FR ou EN) avec comparatif et justification, en moins de 30 min à partir d'un mandat.

**M6** — Tableau de bord : mandats ouverts, candidats par étape, statut, relances visibles d'un coup d'œil.

**M7** — Un candidat peut faire tout le parcours d'intake via WhatsApp, consentement inclus ; les messages arrivent dans le système sans ressaisie.

---

## Rappels pièges (à ne pas laisser passer)

- Si Claude Code veut brancher WhatsApp ou n8n avant M7 → recadre : cœur d'abord, canal ensuite.
- Si une sortie de Claude (parsing/matching) n'est pas validée par Zod → exige-le, sinon des données cassées entreront en base.
- Vérifie à chaque milestone que le consentement et l'audit APDP sont bien câblés — c'est plus dur à rajouter après.
- Aucune clé ne doit apparaître dans `CLAUDE.md` ni dans un commit.
