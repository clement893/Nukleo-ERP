# Cahier des charges - Importation des témoignages

**Date** : 31 décembre 2025  
**Projet** : Nukleo-ERP  
**Module** : Commercial / Témoignages  
**Branche** : Manus  

---

## 1. Contexte et objectif

L'utilisateur dispose d'un fichier Excel contenant 20 témoignages clients qu'il souhaite importer dans le système Nukleo-ERP. Le système possède déjà une infrastructure d'importation complète pour les témoignages, mais il est nécessaire de vérifier la compatibilité du fichier Excel avec le format attendu et d'effectuer l'importation.

**Objectif principal** : Importer les 20 témoignages du fichier `temoignages_remplis.xlsx` dans la base de données via l'endpoint API existant `/api/v1/commercial/testimonials/import`.

---

## 2. Analyse du fichier Excel source

### 2.1 Structure du fichier

Le fichier `temoignages_remplis.xlsx` contient les colonnes suivantes :

| Colonne Excel | Type | Obligatoire | Valeurs manquantes |
|---------------|------|-------------|-------------------|
| Entreprise | string | Oui | 0 |
| ID Entreprise | string | Oui | 0 |
| Prénom Contact | string | Oui | 0 |
| Nom Contact | string | Oui | 0 |
| ID Contact | string | Oui | 0 |
| Titre | string | Non | 7 |
| Témoignage FR | text | Oui | 0 |
| Témoignage EN | text | Oui | 0 |
| Langue | string | Oui | 0 |
| Nom Fichier Logo | string | Non | 20 (tous vides) |
| URL Logo | string | Non | 20 (tous vides) |
| Publié | boolean | Oui | 0 |
| Note | integer | Oui | 0 |

### 2.2 Observations importantes

Le fichier source présente plusieurs particularités qui nécessitent une attention particulière lors de l'importation :

**Données complètes** : Tous les témoignages possèdent les informations essentielles (entreprise, contact, témoignages en français et anglais, statut de publication et note). Cette complétude garantit que l'importation peut se faire sans création de données manquantes.

**Statut de publication** : L'ensemble des 20 témoignages sont marqués comme publiés (valeur `True`). Cela signifie qu'ils seront immédiatement visibles dans l'interface après importation, sans nécessiter de validation manuelle supplémentaire.

**Notes uniformes** : Tous les témoignages ont reçu la note maximale de 5/5, ce qui reflète une satisfaction client élevée et homogène.

**Logos absents** : Aucun logo n'est fourni dans le fichier Excel (colonnes `Nom Fichier Logo` et `URL Logo` vides). Le système devra donc s'appuyer sur les logos d'entreprise déjà présents dans la base de données, s'ils existent.

**Titres optionnels** : Sept témoignages ne possèdent pas de titre pour le contact. Cette information n'étant pas obligatoire dans le modèle de données, cela ne bloquera pas l'importation.

**Langue principale** : Tous les témoignages ont le français comme langue principale (`langue = "fr"`), bien que des traductions anglaises soient disponibles pour la plupart.

---

## 3. Analyse du système existant

### 3.1 Modèle de données backend

Le modèle `Testimonial` dans le backend utilise SQLAlchemy et possède la structure suivante :

**Table** : `testimonials`

**Champs principaux** :
- `id` (Integer, clé primaire)
- `contact_id` (Integer, clé étrangère vers `contacts.id`, nullable)
- `company_id` (Integer, clé étrangère vers `companies.id`, nullable)
- `title` (String 255, nullable)
- `testimonial_fr` (Text, nullable)
- `testimonial_en` (Text, nullable)
- `logo_url` (String 1000, nullable)
- `logo_filename` (String 500, nullable)
- `language` (String 10, nullable, indexé)
- `is_published` (String 20, défaut "draft")
- `rating` (Integer, nullable)
- `created_at` (DateTime avec timezone)
- `updated_at` (DateTime avec timezone)

**Relations** :
- Relation avec `Contact` via `contact_id`
- Relation avec `Company` via `company_id`

**Index** : Des index sont créés sur `company_id`, `contact_id`, `created_at`, `updated_at` et `language` pour optimiser les performances des requêtes.

### 3.2 Endpoint d'importation existant

L'endpoint `/api/v1/commercial/testimonials/import` est déjà implémenté et supporte deux formats d'importation :

**Format 1 - Fichier Excel seul** : Un fichier `.xlsx` ou `.xls` contenant les données des témoignages avec éventuellement des URLs de logos.

**Format 2 - Archive ZIP** : Un fichier `.zip` contenant un fichier Excel et un dossier `logos/` avec les images des logos, permettant un upload groupé des données et des fichiers associés.

L'endpoint effectue automatiquement les opérations suivantes :

**Normalisation des noms de colonnes** : Le système accepte plusieurs variantes pour chaque colonne (avec ou sans accents, en français ou anglais), ce qui offre une grande flexibilité dans le format du fichier source.

**Matching intelligent des entreprises** : Le système recherche les entreprises existantes dans la base de données en utilisant des algorithmes de correspondance qui ignorent les variations (majuscules/minuscules, formes juridiques comme SARL, SA, etc.).

**Matching intelligent des contacts** : Les contacts sont recherchés par prénom et nom, avec possibilité de filtrage par entreprise pour améliorer la précision.

**Upload automatique des logos vers S3** : Si des logos sont fournis dans un ZIP, ils sont automatiquement uploadés vers Amazon S3 et les URLs générées sont stockées dans la base de données.

**Gestion des logs en temps réel** : L'importation génère des logs détaillés accessibles via Server-Sent Events (SSE), permettant un suivi en temps réel de la progression.

**Validation des données** : Les données sont validées via les schémas Pydantic avant insertion en base de données.

### 3.3 Colonnes acceptées par l'endpoint

L'endpoint reconnaît les variantes suivantes pour chaque colonne (insensible à la casse et aux accents) :

| Champ cible | Variantes acceptées |
|-------------|-------------------|
| company_name | company_name, company, entreprise, nom_entreprise |
| company_id | company_id, id_entreprise, entreprise_id |
| contact_first_name | contact_first_name, contact_prenom, contact_firstname, prénom contact |
| contact_last_name | contact_last_name, contact_nom, contact_lastname, nom contact |
| contact_id | contact_id, id_contact |
| title | title, titre |
| testimonial_fr | testimonial_fr, témoignage_fr, temoignage_fr, témoignage français |
| testimonial_en | testimonial_en, témoignage_en, temoignage_en, témoignage anglais |
| language | language, langue |
| logo_filename | logo_filename, nom_fichier_logo |
| logo_url | logo_url, logo, url_logo |
| is_published | is_published, publié, published |
| rating | rating, note, étoiles |

---

## 4. Mapping des colonnes

Le fichier Excel doit être adapté pour correspondre aux colonnes attendues par l'endpoint. Voici le mapping nécessaire :

| Colonne Excel actuelle | Colonne attendue par l'API | Action requise |
|------------------------|---------------------------|----------------|
| Entreprise | company_name | ✅ Compatible (variante acceptée) |
| ID Entreprise | company_id | ✅ Compatible |
| Prénom Contact | contact_first_name | ⚠️ Renommer en "Prénom Contact" ou ajouter reconnaissance |
| Nom Contact | contact_last_name | ⚠️ Renommer en "Nom Contact" ou ajouter reconnaissance |
| ID Contact | contact_id | ✅ Compatible |
| Titre | title | ✅ Compatible (variante acceptée) |
| Témoignage FR | testimonial_fr | ✅ Compatible |
| Témoignage EN | testimonial_en | ✅ Compatible |
| Langue | language | ✅ Compatible (variante acceptée) |
| Nom Fichier Logo | logo_filename | ✅ Compatible |
| URL Logo | logo_url | ✅ Compatible |
| Publié | is_published | ✅ Compatible (variante acceptée) |
| Note | rating | ✅ Compatible (variante acceptée) |

### 4.1 Problèmes de mapping identifiés

Les colonnes "Prénom Contact" et "Nom Contact" du fichier Excel ne correspondent pas exactement aux variantes reconnues par l'endpoint. Deux solutions sont possibles :

**Solution A (Recommandée)** : Modifier le fichier Excel pour utiliser des noms de colonnes reconnus par l'API, par exemple "Contact Prénom" et "Contact Nom".

**Solution B** : Étendre la liste des variantes acceptées dans le code backend pour inclure "Prénom Contact" et "Nom Contact".

---

## 5. Plan d'implémentation

### 5.1 Étape 1 : Préparation du fichier Excel

**Action** : Créer une copie du fichier Excel avec les noms de colonnes adaptés.

**Modifications nécessaires** :
- Renommer "Prénom Contact" en "Contact Prénom"
- Renommer "Nom Contact" en "Contact Nom"
- Vérifier que la colonne "Publié" contient des valeurs booléennes (TRUE/FALSE) ou textuelles ("published"/"draft")

**Livrable** : Fichier `temoignages_remplis_import.xlsx` prêt pour l'importation.

### 5.2 Étape 2 : Vérification des entreprises et contacts

**Action** : S'assurer que les entreprises et contacts référencés dans le fichier Excel existent dans la base de données.

**Méthode** : Exécuter une requête SQL ou utiliser l'API pour lister toutes les entreprises et contacts, puis vérifier la correspondance avec les données du fichier Excel.

**Gestion des cas non trouvés** :
- Si une entreprise n'existe pas, elle doit être créée manuellement ou via l'API avant l'importation
- Si un contact n'existe pas, il doit être créé manuellement ou via l'API avant l'importation
- L'endpoint d'importation tentera de faire un matching intelligent, mais il ne créera pas automatiquement de nouvelles entreprises ou contacts

**Livrable** : Liste des entreprises et contacts manquants (si applicable).

### 5.3 Étape 3 : Importation via l'API

**Action** : Utiliser l'endpoint `/api/v1/commercial/testimonials/import` pour importer le fichier Excel.

**Méthode** :
- Effectuer une requête POST multipart/form-data
- Inclure le fichier Excel dans le champ `file`
- Inclure un token d'authentification valide dans le header `Authorization: Bearer <token>`
- Optionnellement, fournir un `import_id` dans les query parameters pour suivre les logs

**Exemple de requête** :
```
POST /api/v1/commercial/testimonials/import
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: temoignages_remplis_import.xlsx
```

**Suivi de l'importation** : Utiliser l'endpoint `/api/v1/commercial/testimonials/import/{import_id}/logs` pour suivre la progression en temps réel via Server-Sent Events.

**Livrable** : Résultat de l'importation avec le nombre de témoignages créés, les erreurs et les avertissements.

### 5.4 Étape 4 : Vérification post-importation

**Action** : Vérifier que les 20 témoignages ont été correctement importés dans la base de données.

**Méthode** :
- Utiliser l'endpoint GET `/api/v1/commercial/testimonials` pour lister les témoignages
- Vérifier que le nombre de témoignages a augmenté de 20
- Vérifier que les données (entreprise, contact, texte, note, statut) sont correctes
- Vérifier que les témoignages sont marqués comme publiés

**Tests à effectuer** :
- Affichage correct dans l'interface frontend (`/dashboard/commercial/temoignages`)
- Présence des noms d'entreprise et de contact
- Affichage des logos d'entreprise (si disponibles)
- Affichage des notes (5/5)
- Filtrage par langue (français)

**Livrable** : Rapport de vérification confirmant le succès de l'importation.

### 5.5 Étape 5 : Gestion des logos (optionnel)

**Action** : Si des logos d'entreprise sont manquants, les ajouter manuellement après l'importation.

**Méthode** :
- Identifier les entreprises sans logo
- Récupérer les logos depuis les sites web des entreprises ou d'autres sources
- Uploader les logos via l'interface d'administration des entreprises
- Les témoignages hériteront automatiquement des logos d'entreprise

**Livrable** : Liste des logos ajoutés (si applicable).

---

## 6. Gestion des erreurs potentielles

### 6.1 Entreprises non trouvées

**Problème** : Une ou plusieurs entreprises mentionnées dans le fichier Excel n'existent pas dans la base de données.

**Solution** : Créer les entreprises manquantes avant l'importation via l'endpoint `/api/v1/commercial/companies` ou l'interface d'administration.

**Impact** : Si l'entreprise n'est pas trouvée, le témoignage sera créé avec `company_id = NULL`, ce qui peut poser des problèmes d'affichage.

### 6.2 Contacts non trouvés

**Problème** : Un ou plusieurs contacts mentionnés dans le fichier Excel n'existent pas dans la base de données.

**Solution** : Créer les contacts manquants avant l'importation via l'endpoint `/api/v1/commercial/contacts` ou l'interface d'administration.

**Impact** : Si le contact n'est pas trouvé, le témoignage sera créé avec `contact_id = NULL`, ce qui peut poser des problèmes d'affichage.

### 6.3 Format de colonne incorrect

**Problème** : Les noms de colonnes du fichier Excel ne correspondent pas aux variantes acceptées par l'API.

**Solution** : Renommer les colonnes dans le fichier Excel selon le mapping défini dans la section 4.

**Impact** : Les données ne seront pas importées correctement, certains champs resteront vides.

### 6.4 Valeurs de "Publié" incorrectes

**Problème** : La colonne "Publié" contient des valeurs booléennes (TRUE/FALSE) alors que le modèle attend des chaînes de caractères ("published"/"draft").

**Solution** : Vérifier le code de l'endpoint d'importation pour voir comment il gère la conversion des valeurs booléennes. Si nécessaire, modifier le fichier Excel pour utiliser "published" au lieu de TRUE.

**Impact** : Les témoignages pourraient être importés avec un statut incorrect (draft au lieu de published).

### 6.5 Témoignages EN vides

**Problème** : Certains témoignages anglais sont vides ou contiennent juste un espace.

**Solution** : Accepter les valeurs vides pour `testimonial_en` car ce champ est nullable dans le modèle.

**Impact** : Aucun impact bloquant, mais les témoignages ne seront pas affichables en anglais.

---

## 7. Tests recommandés

### 7.1 Test d'importation sur un échantillon

**Objectif** : Valider le processus d'importation avant d'importer les 20 témoignages.

**Méthode** :
- Créer un fichier Excel de test avec 2-3 témoignages
- Effectuer l'importation via l'API
- Vérifier les résultats dans la base de données et l'interface
- Corriger les problèmes identifiés

**Critères de succès** :
- Les témoignages sont créés avec les bonnes données
- Les entreprises et contacts sont correctement liés
- Les témoignages sont marqués comme publiés
- Les notes sont correctes (5/5)

### 7.2 Test d'affichage frontend

**Objectif** : Vérifier que les témoignages importés s'affichent correctement dans l'interface.

**Méthode** :
- Accéder à la page `/dashboard/commercial/temoignages`
- Vérifier l'affichage de la liste des témoignages
- Cliquer sur un témoignage pour voir les détails
- Vérifier l'affichage du logo, du nom d'entreprise, du contact, du texte et de la note

**Critères de succès** :
- Tous les témoignages sont visibles dans la liste
- Les détails s'affichent correctement
- Les logos d'entreprise sont visibles (si disponibles)
- Les notes sont affichées (5/5)

### 7.3 Test de filtrage et recherche

**Objectif** : Vérifier que les témoignages importés sont correctement indexés et recherchables.

**Méthode** :
- Utiliser les filtres de la page témoignages (par entreprise, par contact, par langue)
- Effectuer une recherche par nom d'entreprise ou de contact
- Vérifier que les résultats sont corrects

**Critères de succès** :
- Les filtres fonctionnent correctement
- La recherche retourne les bons résultats
- Les témoignages en français sont filtrables

---

## 8. Livrables attendus

### 8.1 Fichier Excel préparé

Un fichier Excel `temoignages_remplis_import.xlsx` avec les noms de colonnes adaptés et prêt pour l'importation.

### 8.2 Script d'importation (optionnel)

Un script Python ou un fichier de commandes permettant d'automatiser l'importation via l'API, incluant l'authentification et la gestion des erreurs.

### 8.3 Rapport d'importation

Un document récapitulant les résultats de l'importation avec les informations suivantes :
- Nombre de témoignages importés avec succès
- Liste des erreurs rencontrées (si applicable)
- Liste des avertissements (entreprises ou contacts non trouvés)
- Captures d'écran de l'interface montrant les témoignages importés

### 8.4 Documentation de mise à jour (si modifications du code)

Si des modifications du code backend sont nécessaires (par exemple pour ajouter des variantes de noms de colonnes), documenter ces changements dans un fichier séparé avec les instructions pour Cursor.

---

## 9. Recommandations

### 9.1 Validation des données avant importation

Il est fortement recommandé de valider les données du fichier Excel avant l'importation en vérifiant que toutes les entreprises et contacts existent dans la base de données. Cela permettra d'éviter des témoignages orphelins (sans entreprise ou contact associé).

### 9.2 Sauvegarde de la base de données

Avant d'effectuer l'importation en production, il est recommandé de créer une sauvegarde de la base de données pour pouvoir restaurer l'état précédent en cas de problème.

### 9.3 Import en environnement de staging

Si un environnement de staging est disponible, effectuer d'abord l'importation dans cet environnement pour valider le processus avant de l'exécuter en production.

### 9.4 Gestion des logos

Après l'importation, prévoir un temps pour ajouter les logos manquants des entreprises afin d'améliorer la présentation visuelle des témoignages.

### 9.5 Extension future : Import automatique

Pour faciliter les futures importations, envisager de créer une interface frontend permettant d'uploader directement le fichier Excel et de suivre la progression de l'importation en temps réel.

---

## 10. Conclusion

Le système Nukleo-ERP dispose déjà d'une infrastructure complète et robuste pour l'importation de témoignages. Le fichier Excel fourni est globalement compatible avec le format attendu, moyennant quelques ajustements mineurs sur les noms de colonnes.

L'importation des 20 témoignages peut être réalisée en suivant le plan d'implémentation décrit dans ce cahier des charges, avec une attention particulière portée à la vérification de l'existence des entreprises et contacts dans la base de données avant l'importation.

Le processus d'importation est conçu pour être flexible et tolérant aux variations de format, ce qui facilitera les futures importations de données similaires.
