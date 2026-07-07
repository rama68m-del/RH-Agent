# PRD — Agent Recruteur IA pour cabinets RH d'Afrique de l'Ouest

**Produit :** Copilote IA « sourcing-to-shortlist » pour agences de recrutement
**Éditeur :** OZ Solutions / OmniaZenith Solutions
**Marché cible :** Mali (Bamako) → Côte d'Ivoire, Burkina Faso, Sénégal (zone UEMOA/CEDEAO)
**Version du document :** 1.0
**Date :** Juillet 2026

---

## 1. Résumé exécutif

L'agent recruteur IA n'est **pas** un ATS occidental. C'est un copilote conçu pour le goulot d'étranglement réel des cabinets ouest-africains : transformer un flux de candidatures informel et désordonné (WhatsApp, CV scannés, photos, formats incohérents) en un **vivier structuré, cherchable et présentable au client** — vite, en français, et conforme à la loi malienne 2013-015 (APDP).

Positionnement en une phrase : *« De la conversation WhatsApp au shortlist client, sans ressaisie, par compétences, en français. »*

Le produit se lance d'abord comme **service opéré** (recrutement-as-a-service auprès de 2-3 cabinets pilotes) avant d'évoluer vers un **SaaS licencié**, afin de résoudre simultanément le démarrage à froid du vivier, la conformité et la trésorerie.

---

## 2. Problème & contexte marché

### 2.1 Le problème
- Les cabinets **sourcent** manuellement (WhatsApp, Facebook, bouche-à-oreille, candidatures spontanées, walk-ins). Le tri de volume entrant — problème central en Occident — n'est pas leur douleur principale.
- Les CV reçus sont hétérogènes : scans, photos, PDF mal formatés, informations incohérentes et peu lisibles. Constituer une CVthèque exploitable est laborieux.
- Le livrable qui se vend, c'est le **shortlist présenté au client** (souvent 3 CV + garantie de remplacement). Le produire est chronophage.
- Décalage compétences/diplômes : les employeurs peinent à trouver des compétences réelles, pas des candidats. Le matching doit être **par compétences**, pas par diplôme.

### 2.2 Chiffres de cadrage
- Adoption RH digitale en Afrique de l'Ouest : ~45% (vs 58% en Afrique australe, 52% en Afrique de l'Est).
- ~30% des entreprises africaines ont intégré l'IA au recrutement.
- Marché du recrutement africain projeté à ~32 Md$ d'ici 2031 (TCAC ~8,7%).
- Pénétration mobile > 70% → mobile-first obligatoire.
- WhatsApp : ~95% des messages ouverts en < 5 min ; déjà canal principal de recrutement volumique chez Manpower/Adecco.

### 2.3 Concurrence
| Catégorie | Exemples | Ce qu'ils font | Ce qui manque |
|---|---|---|---|
| Job boards locaux (côté candidat) | Emploimali, Ikabara, Emploi et Moi, Projobivoire | Diffusion d'offres, dépôt de CV | Pas de workflow cabinet, pas d'IA de matching, pas de livrable client |
| Cabinets locaux | SMGMO, Mali RH Consulting, TPA, RMO, Staff Services | Recrutement, intérim, portage, paie | Process manuels ; ce sont des clients potentiels, pas des concurrents produit |
| Bases panafricaines | AfricaWork (~4M CV, 37 pays), Talent2Africa (executive search) | Sourcing large / chasse | Généralistes ; pas d'outil-copilote localisé francophone WhatsApp-natif |
| Outils occidentaux | Greenhouse, Manatal, Recruit CRM, Eightfold, GoPerfect | ATS + IA, sourcing 800M-1Md profils, scoring, vidéo | USD, LinkedIn-centrés, anglais, pas de WhatsApp/hors-ligne, zéro conformité APDP |

**Espace blanc :** copilote de workflow IA pour cabinet, français d'abord, WhatsApp-natif, conforme APDP. Personne ne l'occupe.

---

## 3. Personas cibles

1. **Le consultant recruteur (utilisateur principal).** Gère plusieurs mandats en parallèle, source à la main, perd du temps à mettre au propre des CV et à monter des shortlists. Veut gagner du temps par mandat et impressionner le client.
2. **Le dirigeant de cabinet (acheteur/décideur).** Sensible au prix (FCFA), veut plus de placements, une image pro et zéro risque juridique (APDP, non-discrimination).
3. **Le client employeur / ONG (bénéficiaire final).** Attend un shortlist clair, justifié, rapide. Les ONG/organisations internationales attendent en plus rigueur, conformité et souvent bilingue FR/EN.
4. **Le candidat (fournisseur de données, jamais payeur).** Postule via WhatsApp, veut simplicité et respect (pas d'arnaque, pas de frais).

---

## 4. Objectifs & indicateurs de succès (KPIs)

| Objectif | Indicateur | Cible MVP (3 mois pilote) |
|---|---|---|
| Réduire le temps par mandat | Heures de la demande au shortlist | −50% vs manuel |
| Structurer le vivier | % de CV parsés correctement sans correction manuelle | ≥ 80% |
| Qualité du matching | % de candidats du shortlist retenus en entretien par le client | ≥ 60% |
| Adoption | Nb de cabinets pilotes actifs | 2–3 |
| Conformité | % de candidats avec consentement enregistré | 100% |
| Revenu | Mandats facturés via l'outil | ≥ 10 sur le pilote |

---

## 5. Périmètre

### Dans le périmètre (V1)
Intake WhatsApp • parsing/normalisation CV • CVthèque cherchable • matching explicable + validation humaine • livrable shortlist client • consentement/conformité APDP • tableau de bord mandats • bilingue FR/EN • mobile-first.

### Hors périmètre (explicitement exclu)
- Suite HRIS / paie / onboarding / gestion administrative du personnel.
- Facturation ou frais côté candidat (interdit par la loi 92-020).
- Rejet automatique sans revue humaine ; décision d'embauche automatisée ; scoring opaque.
- Scraping LinkedIn comme source principale.
- Analyse faciale / évaluation de personnalité par vidéo.
- Entretien vidéo intégré au lancement (repoussé).
- Intégrations profondes vers ATS occidentaux (personne ne les utilise localement).

---

## 6. Fonctionnalités & user stories

### 6.1 Must-have (MVP)

**F1 — Intake WhatsApp conversationnel**
> En tant que candidat, je postule via WhatsApp et l'agent me guide en français pour transmettre mon CV et mes infos clés, afin de postuler sans formulaire long.
- Bouton/QR code WhatsApp sur les offres.
- Agent conversationnel : collecte poste visé, compétences, expérience, localisation, langues, disponibilité, consentement.
- Réception du CV en pièce jointe (PDF/photo).

**F2 — Parsing & normalisation de CV** *(cœur de valeur)*
> En tant que recruteur, je veux que chaque CV reçu soit converti en profil structuré propre, afin de ne plus ressaisir.
- Extraction depuis PDF, photo, scan (OCR si nécessaire).
- Normalisation en champs : identité, compétences, expériences, formation, langues, contact.
- Détection d'incohérences / champs manquants signalés au recruteur.

**F3 — CVthèque cherchable**
> En tant que recruteur, je recherche dans mon vivier par compétence/expérience/localisation/langue en langage naturel.
- Recherche sémantique + filtres.
- Déduplication des profils.

**F4 — Matching poste ↔ candidat explicable**
> En tant que recruteur, je décris un poste en langage naturel et l'agent me propose les meilleurs profils **avec justification**, que je valide.
- Score de correspondance **par compétences** + résumé du « pourquoi ».
- **Validation humaine obligatoire** avant toute présentation client (human-in-the-loop).

**F5 — Livrable shortlist prêt-client**
> En tant que recruteur, je génère un shortlist PDF de marque (top N candidats, comparatif, justification) à envoyer au client.
- Modèle brandé cabinet, FR ou EN.
- Tableau comparatif + synthèse par candidat.

**F6 — Consentement & conformité APDP**
> En tant que dirigeant, je veux que chaque traitement de données soit conforme à la loi 2013-015.
- Recueil du consentement au dépôt.
- Politique de conservation + droit d'accès/rectification/suppression.
- Registre des traitements ; support à la déclaration APDP.

**F7 — Tableau de bord mandats**
> En tant que recruteur, je pilote mes mandats et pipelines par étape.
- Postes ouverts, candidats par étape, statut, relances.

**F8 — Bilingue FR/EN + mobile-first / basse bande passante.**

### 6.2 Should-have (V2)
- Questionnaire de présélection automatisé (compétences + soft skills) via WhatsApp.
- Planification d'entretiens + rappels automatiques (réduction des no-shows).
- Vérification de références semi-automatisée.
- Alertes candidats (nouveau poste correspondant à un profil du vivier).
- Portail client léger (le client voit le shortlist et donne un feedback oui/non).

### 6.3 Could-have (V3)
- Analytics de recrutement (délai moyen, taux de placement, sources).
- Multi-cabinets / multi-utilisateurs avec rôles.
- Entretien vidéo asynchrone (une fois la bande passante non bloquante).
- Marque employeur / diffusion multicanale d'offres.

---

## 7. Parcours utilisateur (flux principaux)

**Flux A — Nouveau candidat**
Offre (QR/bouton WhatsApp) → conversation agent → CV + consentement → parsing → profil ajouté à la CVthèque.

**Flux B — Nouveau mandat**
Le recruteur décrit le poste → l'agent propose des candidats du vivier + sourcing conversationnel → recruteur valide → génération du shortlist → envoi client → suivi du pipeline.

**Flux C — Conformité**
Chaque profil porte : date de consentement, finalité, durée de conservation, statut (actif/à purger). Purge automatique en fin de durée.

---

## 8. Architecture technique proposée

Alignée sur ta stack existante, dimensionnée pour un MVP solo.

| Couche | Choix proposé | Rôle |
|---|---|---|
| Canal | API WhatsApp Business (via fournisseur type Meta Cloud API / agrégateur) | Intake & communication |
| Orchestration | n8n | Workflows (intake → parsing → notif → relances) |
| IA | LLM (Claude) via API | Conversation, parsing/normalisation, matching explicable, génération shortlist |
| Backend / DB | Supabase (Postgres + storage + auth) | CVthèque, mandats, consentements, registre |
| Frontend | Vercel (web app légère, responsive) | Tableau de bord recruteur |
| Génération docs | Modèle PDF (shortlist brandé) | Livrable client |

**Points de vigilance techniques**
- Basse bande passante : interfaces légères, pas de vidéo lourde.
- Robustesse du parsing : la qualité des CV entrants est le principal risque de sortie. Prévoir une **revue humaine rapide** post-parsing.
- **Transfert transfrontalier** : Supabase/Vercel hébergent hors Mali → base légale requise (consentement explicite + information APDP). À cadrer dès le départ.

---

## 9. Conformité & sécurité

- **Cadre légal :** Loi n°2013-015 du 21 mai 2013 (modifiée 2017), régulateur **APDP** ; Acte additionnel CEDEAO A/SA.1/01/10 ; équivalents régionaux (Côte d'Ivoire loi 2013-450 / ARTCI ; Sénégal loi 2008-12 ; Burkina loi 010-2004).
- **Obligations clés :**
  - Déclaration préalable du traitement à l'APDP (récépissé).
  - Consentement explicite et éclairé du candidat.
  - Finalité déterminée, durée de conservation limitée, droits d'accès/rectification/suppression.
  - Prospection directe encadrée (pas de messages automatisés 19h–08h, dimanches, jours fériés).
  - Base légale pour tout transfert hors Mali.
- **Anti-arnaque / éthique :** jamais de frais candidat (loi 92-020, art. L.304) ; message clair « aucun paiement exigé pour postuler ».
- **Anti-biais :** matching explicable, validation humaine, pas de rejet automatique, pas d'analyse faciale. (Rappel de risque : class action contre Eightfold AI en janvier 2026 sur l'impact de l'IA sur les candidats.)
- **Sécurité :** auth, chiffrement au repos/en transit, journalisation des accès.

---

## 10. Modèle économique (FCFA)

Le revenu vient de l'agence/employeur, **jamais du candidat**.

**Phase 1 — Service opéré (recrutement-as-a-service)**
- OZ Solutions opère l'agent pour 2-3 cabinets pilotes.
- Facturation au mandat / à la réussite, avec garantie « paiement après validation » (cohérent avec ton offre ONG).
- Objectif : construire le vivier + les preuves + la trésorerie.

**Phase 2 — SaaS licencié**
- Abonnement mensuel FCFA par cabinet, palier selon nb de mandats/utilisateurs.
- Option « done-with-you » (accompagnement) en up-sell.

Fixer les prix après le pilote (données réelles de valeur/temps gagné). Éviter le SaaS pur au lancement : adoption trop lente sur ce marché.

---

## 11. Risques & mitigations

| Risque | Gravité | Mitigation |
|---|---|---|
| Démarrage à froid (vivier vide) | Élevée | Phase service opéré ; import des CVthèques des cabinets pilotes (avec consentement) |
| Faible volonté de payer / adoption SaaS lente | Élevée | Modèle service d'abord, à la réussite ; prix FCFA ; ROI démontré |
| Qualité de parsing (CV désordonnés) | Élevée | Revue humaine post-parsing ; amélioration continue des prompts |
| Non-conformité APDP / transfert transfrontalier | Élevée | Déclaration APDP, consentement, hébergement/base légale cadrés dès J0 |
| Biais / risque juridique du scoring | Moyenne | Explicabilité + validation humaine + pas de rejet auto |
| Moat technique mince | Moyenne | Moat = données localisées + WhatsApp + relation client + conformité |
| Capacité solo | Moyenne | Périmètre MVP strict ; automatiser via n8n ; refuser le scope creep |
| Confusion avec les arnaques du secteur | Moyenne | Transparence, marque, « zéro frais candidat » visible |

---

## 12. Roadmap / phasage

**MVP (0–3 mois) :** F1–F8 sur 2-3 pilotes, mode service opéré.
**V2 (3–6 mois) :** présélection auto, planification entretiens, références, portail client léger ; bascule SaaS licencié.
**V3 (6–12 mois) :** analytics, multi-cabinets/rôles, vidéo asynchrone, diffusion multicanale.

---

## 13. Critères d'acceptation du MVP

- Un candidat peut postuler de bout en bout via WhatsApp, avec consentement enregistré.
- ≥ 80% des CV sont parsés en profils structurés exploitables sans correction manuelle.
- Le recruteur génère un shortlist client brandé (FR/EN) en < 30 min à partir d'un mandat.
- Chaque profil du vivier porte consentement, finalité et durée de conservation.
- Le matching fournit une justification lisible et exige une validation humaine avant présentation.
- Aucun frais n'est jamais demandé au candidat à aucune étape.

---

*Document de travail — à itérer après le pilote avec les données réelles de temps gagné et de taux de placement.*
