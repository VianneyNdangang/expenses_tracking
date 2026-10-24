# Plateforme de Contrôle des Dépenses — Abdouraman Expenses

Solution complète, souveraine et hautement sécurisée de gestion et de contrôle des dépenses de chantier et d'approvisionnement pour chef d'entreprise (mono-utilisateur / patron), développée avec **Nuxt 4**, **Nuxt UI**, **Nitro** et **MySQL 8**.

---

## 🎯 Vue d'ensemble du Projet

Dans le contexte des entreprises de BTP, de commerce ou de prestation de services en Afrique subsaharienne (notamment au Cameroun), la gestion des avances de fonds confiées aux ouvriers et prestataires présente des risques élevés de dérives budgétaires, de surfacturation et de perte de traçabilité.

Cette plateforme permet au patron :
1. **D'enregistrer des engagements de dépenses** avec contrôle automatique et instantané des prix unitaires déclarés par rapport à un catalogue de prix de référence gelés.
2. **De visualiser instantanément les anomalies** grâce à un système de tolérance à 3 niveaux (Conforme, À vérifier, Suspect).
3. **De générer et imprimer des lettres d'engagement officielles A4** prêtes pour signature manuscrite conjointe (Patron, Employé, Témoin 1, Témoin 2), avec montant en toutes lettres en français et accord grammatical dynamique.
4. **D'enregistrer les décaissements réels** dans une transaction atomique.
5. **De contrôler la justification des dépenses réelles**, avec calcul strict du reliquat dû à l'entreprise (`Reliquat = Montant payé - Montant réellement dépensé`) et enregistrement du scan de la lettre signée.
6. **D'auditer chaque action** dans un journal infalsifiable et non modifiable.

---

## 🛡️ Architecture de Sécurité & Confidentialité

L'application respecte les principes de sécurité les plus stricts :

- **Authentification par hachage Argon2id** : Protection maximale contre les attaques par force brute et par dictionnaire avec coût mémoire calibré.
- **Gestion des sessions sans JWT client** : Cookie de session `abd_session_id` configuré en `HttpOnly`, `SameSite=Strict`, `Secure` (en production), avec identifiant opaque et expiration contrôlée par l'application en base MySQL.
- **Chiffrement fort des données personnelles (AES-256-GCM)** : Les numéros de CNI et téléphones des employés et des témoins sont systématiquement chiffrés au repos en base de données. Seuls les 4 derniers chiffres sont visibles à l'écran sous forme masquée (`•••• 1234`).
- **Transactions ACID** : Les flux financiers (création d'engagement avec compteur séquentiel, paiement, justification avec reliquat) utilisent des transactions MySQL.
- **Protection CSRF & En-têtes stricts** : Vérification des requêtes de mutation (`POST`, `PUT`, `PATCH`, `DELETE`) et en-têtes HTTP de sécurité (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **Journal d'audit non modifiable** : Traçabilité intégrale de toutes les opérations patronales (action, entité, horodatage, adresse IP, User-Agent, instantanés avant/après).

---

## 💻 Stack Technique

| Composant | Technologie | Description |
|---|---|---|
| **Framework Fullstack** | [Nuxt 4](https://nuxt.com/) | Architecture SSR/Nitro moderne avec rendu optimisé |
| **Composants & Design** | [Nuxt UI](https://ui.nuxt.com/) + Tailwind CSS | Interface épurée, responsive, accessible, mode sombre/clair |
| **Typographie** | Google Font *Public Sans* | Typographie institutionnelle, sobre et hautement lisible |
| **Base de données** | [MySQL 8.0+](https://www.mysql.com/) | Stockage relationnel et transactions ACID |
| **Validation de données** | [Zod](https://zod.dev/) | Validation isomorphique partagée entre le frontend et l'API Nitro |
| **Chiffrement & Sécurité** | Node.js `crypto` + `argon2` | AES-256-GCM (clé 256 bits) et Argon2id |
| **Exports & Rapports** | [SheetJS (xlsx)](https://sheetjs.com/) | Génération directe de classeurs Excel (.xlsx) et fichiers CSV |
| **Tests automatisés** | [Vitest](https://vitest.dev/) | 24 tests unitaires et E2E couvrant 100% des règles critiques |

---

## 📋 Prérequis

- **Node.js** : `^22.21.0`, `^24.11.0` ou `>=26.0.0` (Node 25 n'est pas pris en charge par Nuxt)
- **Gestionnaire de paquets** : **`npm`** *(utilisation stricte de npm)*
- **MySQL 8.0+** (installation locale ou conteneur Docker Compose fourni)

---

## 🚀 Installation & Démarrage

### 1. Cloner et installer les dépendances
```bash
git clone <url-du-depot>
cd projet_abdouraman
npm install
```

### 2. Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```

Vérifiez ou adaptez les variables dans `.env` :
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=controle_depense
DB_USER=root
DB_PASSWORD=changez_ce_mot_de_passe
FIELD_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SESSION_SECRET=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
NODE_ENV=development
```

> La base MySQL doit être démarrée avant le serveur. Les données MongoDB existantes ne sont pas transférées. Définissez `PATRON_INITIAL_PASSWORD` dans `.env` avec un mot de passe d'au moins 12 caractères, puis exécutez `npm run db:migrate` pour créer les tables manquantes et le compte patron.

### 3. Démarrer MySQL avec Docker
Le fichier Compose démarre MySQL et conserve les données dans un volume Docker :
```bash
docker compose up -d
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application est accessible à l'adresse : **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Compte d'accès Patron

La commande `npm run db:migrate` crée le compte initial avec l'identifiant `patron`. Le mot de passe est celui défini localement dans `PATRON_INITIAL_PASSWORD` et n'est ni codé dans le dépôt ni affiché dans les logs. Le script ne réinitialise pas le mot de passe d'un compte existant.

---

## 🛠️ Commandes d'Exploitation (npm)

| Commande | Action |
|---|---|
| `npm run dev` | Lance le serveur Nuxt en mode développement avec rechargement à chaud |
| `npm run build` | Compile l'application pour la production (`.output/`) |
| `npm run start` | Démarre le serveur Nitro compilé (`.output/server/index.mjs`) |
| `npm run preview` | Prévisualise la version de production compilée |
| `npm run test` | Exécute la suite complète des 24 tests Vitest (unitaires + cycle E2E) |
| `npm run db:migrate` | Crée les tables manquantes et le compte patron initial |
| `npm run seed` | Réinitialise et alimente la base de données avec des données de référence complètes |
| `npm run backup` | Exporte les tables MySQL dans un fichier JSON horodaté (`backups/`) |
| `npm run restore` | Restaure la dernière sauvegarde JSON MySQL (ou via `--file <chemin>`) |

En production, configurez `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET` et `FIELD_ENCRYPTION_KEY` dans le gestionnaire de secrets de l'hébergeur. Après `npm ci` et `npm run build`, démarrez l'application avec `npm run start`. N'utilisez pas les valeurs d'exemple pour les secrets.

---

## 🧪 Tests Automatisés

La suite de tests automatisée valide la totalité du cahier des charges :
```bash
npm run test
```

### Détail des suites de test :
1. **`tests/currency.test.ts`** :
   - Formatage des montants en FCFA (`1 500 000 FCFA`).
   - Conversion en toutes lettres en français avec respect des règles d'invariabilité de *cent* et *mille* (ex: `cinq cent mille FCFA` sans "s" à cent).
   - Validation des accords féminins/masculins.
2. **`tests/priceComparison.test.ts`** :
   - Évaluation des seuils d'alerte : *Conforme*, *À vérifier* (dépassement tolérance), *Suspect* (dépassement seuil critique).
   - Calcul des écarts en valeur absolue et en pourcentage.
3. **`tests/businessRules.test.ts`** :
   - Calcul du reliquat : `reliquat = montant payé - montant dépensé`.
   - Règle d'invariabilité de l'engagement après signature.
   - Accord grammatical dynamique de la lettre d'engagement ("le soussigné" vs "la soussignée").
4. **`tests/crypto.test.ts`** :
   - Chiffrement symétrique authentifié AES-256-GCM et déchiffrement.
   - Masquage des CNI et numéros de téléphone.
   - Hachage et vérification de mot de passe par Argon2id.
   - Génération de token de session opaque et empreinte SHA-256.
5. **`tests/e2e-api.test.ts`** :
   - Rejet des mauvais identifiants.
   - Authentification et dépôt du cookie `HttpOnly; SameSite=Strict`.
   - Consultation du tableau de bord et des KPIs.
   - Création d'engagement avec incrément atomique séquentiel (`ENG-2026-XXXX`).
   - Décision patronale (Validation / Refus).
   - Décaissement et paiement atomique.
   - Justification réelle et calcul du reliquat.
   - Enregistrement dans le journal d'audit.
   - Export Excel et CSV avec filtres.

---

## 📄 Fonctionnalités & Pages de l'Application

### 1. Tableau de bord (`/`)
- 4 indicateurs financiers clés : Total engagé, Total décaissé, Dépenses réelles justifiées, Reliquat total à recouvrer.
- Alerte dynamique des justifications en retard (dépassement du délai de 7 jours).
- Graphique de répartition des engagements par statut.
- Tableau des engagements récents avec accès direct.

### 2. Saisie d'un nouvel engagement (`/engagements/nouveau`)
- Sélection de l'employé avec civilité et informations masquées.
- Choix de témoins optionnels.
- Lignes de dépenses dynamiques avec autocomplétion des articles du catalogue.
- **Comparaison en temps réel** du prix déclaré avec le prix de référence et affichage immédiat du badge de conformité.
- **Calcul automatique du montant en toutes lettres en français** sous le total.
- Validation Zod bloquant toute soumission incomplète ou incohérente.

### 3. Fiche détaillée de l'engagement (`/engagements/:id`)
- Frise chronologique visuelle d'avancement du dossier : *Demandé → Validé → Payé → Justifié*.
- Modale d'approbation patronale (avec ajustement du montant approuvé) ou de refus avec motif.
- Modale d'enregistrement du décaissement (mode de paiement, référence, date).
- Modale de justification finale (saisie des montants réels justificatifs à l'appui, calcul automatique et instantané du reliquat).
- Téléversement du scan de la lettre d'engagement contresignée (image JPG/PNG ou PDF jusqu'à 10 Mo).

### 4. Lettre d'engagement A4 imprimable (`/engagements/:id/lettre`)
- Mise en page officielle selon le modèle légal de décharge de responsabilité.
- Accord grammatical dynamique selon le genre de l'employé (*"Je soussigné..."* ou *"Je soussignée..."*).
- Mention du montant en chiffres et en toutes lettres.
- **Garantie absolue d'impression sur une seule page A4** (`page-break-inside: avoid` sur le bloc des 4 signatures : Employé, Patron, Témoin 1, Témoin 2).
- Bouton d'impression automatique (`window.print()`).

### 5. Gestion des Articles & Prix (`/articles`)
- Liste des articles avec unités (Sac, Barre, Camion, Fût, etc.).
- Gestion de l'historique des prix de référence : chaque modification clôture le prix précédent avec une date de fin et initialise un nouveau prix actif sans altérer les anciens engagements.
- Définition de la tolérance spécifique par article (ex: 8%, 10%, 15%).

### 6. Gestion des Employés & Témoins (`/employes`, `/temoins`)
- Gestion des bénéficiaires et témoins avec civilité (M., Mme, Mlle).
- Chiffrement immédiat AES-256-GCM des CNI et téléphones.
- Possibilité d'archivage sans suppression physique pour préserver l'historique.

### 7. Paramètres & Modèle de lettre (`/parametres`)
- Coordonnées de l'entreprise et du patron.
- Délais réglementaires de justification (7 jours par défaut).
- Seuils de tolérance et de suspicion par défaut.
- Éditeur du modèle de lettre officiel avec prévisualisation des balises dynamiques (`{{civilite}}`, `{{nom}}`, `{{montant_lettres}}`, etc.).
- Changement sécurisé du mot de passe patron avec validation de l'ancien mot de passe.

### 8. Journal d'Audit (`/audit`)
- Liste exhaustive et chronologique des actions administratives.
- Filtrage par action (`LOGIN`, `CREATE_COMMITMENT`, `DECISION_COMMITMENT`, `PAY_COMMITMENT`, `JUSTIFY_COMMITMENT`, etc.).
- Inspection détaillée des données avant/après (`diff`).

---

## 🔒 Procédure de Sauvegarde & Restauration

### Sauvegarde automatique :
```bash
npm run backup
```
Génère un instantané complet au format JSON dans le dossier `./backups/` :
`backups/backup-YYYY-MM-DDTHH-mm-ss.json`

### Restauration :
```bash
# Restaure automatiquement la sauvegarde la plus récente :
npm run restore

# Ou spécifiez un fichier précis :
npm run restore -- --file backups/backup-2026-10-22T13-54-23.json
```

---

## 📜 Licence & Propriété

Application conçue et développée exclusivement pour M. Abdouraman. Tous droits réservés.
