# Plan : Application du fonctionnement des opportunités à la page individuelle des contacts

## 📋 Vue d'ensemble

Ce plan décrit les étapes pour créer une page individuelle pour les contacts, en s'inspirant du fonctionnement de la page individuelle des opportunités récemment mise à jour.

## 🎯 Objectifs

1. Créer une page individuelle dédiée pour les contacts (`/dashboard/reseau/contacts/[id]`)
2. Implémenter un système d'onglets similaire aux opportunités (Vue d'ensemble, Activités, Documents, Notes)
3. Créer des composants réutilisables pour l'édition inline des contacts
4. Intégrer le système d'activités pour les contacts
5. Ajouter la gestion des documents et notes pour les contacts

---

## 📁 Structure des fichiers à créer/modifier

### 1. Page principale individuelle
- **Fichier**: `apps/web/src/app/[locale]/dashboard/reseau/contacts/[id]/page.tsx`
- **Description**: Page principale avec système d'onglets, header, stats cards

### 2. Composants à créer

#### 2.1. Éditeur de vue d'ensemble
- **Fichier**: `apps/web/src/components/commercial/ContactOverviewEditor.tsx`
- **Description**: Composant pour éditer les informations du contact avec édition inline (mode lecture avec crayon pour éditer)
- **Basé sur**: `OpportunityOverviewEditor.tsx`

#### 2.2. Activités du contact
- **Fichier**: `apps/web/src/components/commercial/ContactActivities.tsx`
- **Description**: Timeline des activités du contact (création, modifications, notes, documents)
- **Basé sur**: `OpportunityActivities.tsx`

#### 2.3. Documents du contact
- **Fichier**: `apps/web/src/components/commercial/ContactDocuments.tsx`
- **Description**: Gestion des documents (upload fichiers, liens externes)
- **Basé sur**: `OpportunityDocuments.tsx`

#### 2.4. Éditeur de notes
- **Fichier**: `apps/web/src/components/commercial/ContactNotesEditor.tsx`
- **Description**: Éditeur de notes avec sauvegarde automatique
- **Basé sur**: `OpportunityNotesEditor.tsx`

### 3. Hooks personnalisés

#### 3.1. Hook d'édition de contact
- **Fichier**: `apps/web/src/hooks/useContactEditor.ts`
- **Description**: Hook pour gérer l'édition et la sauvegarde automatique d'un contact
- **Basé sur**: `useOpportunityEditor.ts`

#### 3.2. Hook de notes de contact
- **Fichier**: `apps/web/src/hooks/useContactNotes.ts`
- **Description**: Hook pour gérer l'édition et la sauvegarde automatique des notes
- **Basé sur**: `useOpportunityNotes.ts`

### 4. API et types

#### 4.1. Vérifier/Étendre l'API contacts
- **Fichier**: `apps/web/src/lib/api/contacts.ts`
- **Action**: Vérifier que l'API supporte les champs `notes` et les documents
- **Vérifier**: Endpoints pour documents et notes si nécessaire

#### 4.2. Types Contact
- **Fichier**: `apps/web/src/lib/api/contacts.ts`
- **Action**: Ajouter le champ `notes` au type `Contact` si absent

---

## 🔧 Étapes d'implémentation

### Phase 0 : Backend - Tracking des modifications (CRITIQUE)

#### Étape 0.1 : Modifier le endpoint `update_contact` dans le backend
1. **Fichier à modifier** : `backend/app/api/v1/endpoints/commercial/contacts.py`
2. **Fonction** : `update_contact()`

3. **Modifications à apporter** :
   - Avant de modifier les champs, stocker les anciennes valeurs dans un dictionnaire
   - Après la modification, comparer chaque champ modifié
   - Pour chaque champ modifié, enregistrer une activité avec `SecurityAuditLogger.log_event()`
   - Inclure dans `event_metadata` :
     ```python
     {
         "entity_type": "contact",
         "entity_id": str(contact_id),
         "field": "nom_du_champ",  # ex: "email", "phone", "first_name"
         "old_value": ancienne_valeur,
         "new_value": nouvelle_valeur
     }
     ```

4. **Exemple de code à ajouter** :
   ```python
   # Avant la modification (ligne ~661)
   old_values = {
       'first_name': contact.first_name,
       'last_name': contact.last_name,
       'email': contact.email,
       'phone': contact.phone,
       'position': contact.position,
       'company_id': contact.company_id,
       'circle': contact.circle,
       'city': contact.city,
       'country': contact.country,
       'birthday': contact.birthday.isoformat() if contact.birthday else None,
       'language': contact.language,
       'linkedin': contact.linkedin,
       'employee_id': contact.employee_id,
   }
   
   # Après la modification et avant le commit (ligne ~670)
   from app.core.security_audit import SecurityAuditLogger, SecurityEventType
   
   # Enregistrer les activités pour chaque champ modifié
   for field, new_value in update_data.items():
       old_value = old_values.get(field)
       # Convertir les nouvelles valeurs pour la comparaison
       if field == 'birthday' and new_value:
           new_value_str = new_value.isoformat() if hasattr(new_value, 'isoformat') else str(new_value)
           old_value_str = old_values.get(field)
           if old_value_str != new_value_str:
               await SecurityAuditLogger.log_event(
                   db=db,
                   event_type=SecurityEventType.DATA_MODIFIED,
                   description=f"Contact {contact_id} - {field} modified",
                   user_id=current_user.id,
                   ip_address=request.client.host if request.client else None,
                   event_metadata={
                       "entity_type": "contact",
                       "entity_id": str(contact_id),
                       "field": field,
                       "old_value": old_value_str,
                       "new_value": new_value_str
                   }
               )
       elif old_value != new_value:
           await SecurityAuditLogger.log_event(
               db=db,
               event_type=SecurityEventType.DATA_MODIFIED,
               description=f"Contact {contact_id} - {field} modified",
               user_id=current_user.id,
               ip_address=request.client.host if request.client else None,
               event_metadata={
                   "entity_type": "contact",
                   "entity_id": str(contact_id),
                   "field": field,
                   "old_value": old_value,
                   "new_value": new_value
               }
           )
   ```

5. **Vérifier que l'endpoint `/activities` filtre correctement** :
   - S'assurer que le filtre `entity_type: 'contact'` fonctionne
   - Vérifier que `entity_id` est correctement utilisé dans les filtres

### Phase 1 : Infrastructure de base

#### Étape 1.1 : Créer les hooks personnalisés
1. **Créer `useContactEditor.ts`**
   - Copier la structure de `useOpportunityEditor.ts`
   - Adapter pour les champs de Contact :
     - `first_name`, `last_name`
     - `email`, `phone`
     - `position`, `company_id`
     - `circle` (tags)
     - `city`, `country`
     - `birthday`, `language`
     - `linkedin`
     - `employee_id`
   - Utiliser `contactsAPI.update()` au lieu de `opportunitiesAPI.update()`
   - Adapter les query keys pour les contacts

2. **Créer `useContactNotes.ts`**
   - Copier la structure de `useOpportunityNotes.ts`
   - Adapter pour utiliser `contactsAPI.update()` avec le champ `notes`
   - Adapter les query keys

#### Étape 1.2 : Vérifier/Étendre l'API
1. **Vérifier le type Contact**
   - S'assurer que `Contact` inclut le champ `notes` (string | null)
   - Si absent, l'ajouter au type et vérifier le backend

2. **Vérifier les endpoints**
   - Vérifier que `contactsAPI.update()` supporte le champ `notes`
   - Vérifier les endpoints pour les documents (si nécessaire)

3. **Vérifier/Implémenter le tracking des modifications**
   - **IMPORTANT** : Vérifier que le backend enregistre les activités lors des modifications de contacts
   - Le backend doit enregistrer une activité avec `event_metadata` contenant :
     - `old_value` : valeur précédente du champ modifié
     - `new_value` : nouvelle valeur du champ modifié
     - `field` : nom du champ modifié (ex: "email", "phone", "first_name", etc.)
   - Si le tracking n'existe pas, l'implémenter dans `update_contact()` du backend
   - Utiliser `SecurityAuditLogger.log_event()` avec `event_type="DATA_MODIFIED"` et `event_metadata` approprié
   - S'assurer que `entity_type` est défini comme "contact" dans les activités

### Phase 2 : Composants d'édition

#### Étape 2.1 : Créer `ContactOverviewEditor.tsx`
1. **Structure de base**
   - Copier la structure de `OpportunityOverviewEditor.tsx`
   - Adapter les champs pour les contacts :
     - **Section 1 - Informations principales** :
       - Prénom (required)
       - Nom (required)
       - Email
       - Téléphone
       - Position
     - **Section 2 - Informations professionnelles** :
       - Entreprise (Select avec liste des entreprises)
       - Cercle/Tags (MultiSelect ou input avec tags)
       - Employé lié (Select avec liste des employés)
     - **Section 3 - Informations personnelles** :
       - Ville
       - Pays
       - Date de naissance (DatePicker)
       - Langue (Select)
       - LinkedIn (Input URL)
     - **Section 4 - Métadonnées** :
       - Créé le (readonly)
       - Créé par (readonly)
       - Dernière modification (readonly)

2. **Fonctionnalités**
   - Édition inline avec bouton crayon (hover)
   - Sauvegarde automatique avec debounce
   - Indicateur de statut (saving/saved/error)
   - Gestion des erreurs

3. **Intégrations**
   - Fetch des entreprises (companiesAPI)
   - Fetch des employés (employeesAPI ou usersAPI)
   - Utiliser `useContactEditor` hook

#### Étape 2.2 : Créer `ContactActivities.tsx`
1. **Structure de base**
   - Copier la structure de `OpportunityActivities.tsx`
   - Adapter pour `entity_type: 'contact'`
   - Utiliser `activitiesAPI.getTimeline()` avec `entity_type: 'contact'`

2. **Types d'activités**
   - Création du contact
   - Modifications de champs (avec tracking old_value/new_value) :
     - Prénom (`first_name`)
     - Nom (`last_name`)
     - Email (`email`)
     - Téléphone (`phone`)
     - Position (`position`)
     - Entreprise (`company_id`)
     - Cercle/Tags (`circle`)
     - Ville (`city`)
     - Pays (`country`)
     - Date de naissance (`birthday`)
     - Langue (`language`)
     - LinkedIn (`linkedin`)
     - Employé lié (`employee_id`)
   - Ajout de notes
   - Ajout de documents
   - Changement de tags/cercle

3. **Fonctionnalités**
   - Timeline chronologique groupée par date
   - Filtres par type d'activité
   - Affichage des métadonnées (ancienne/nouvelle valeur) depuis `event_metadata`
   - Formatage intelligent des changements :
     - Pour les champs texte : "Ancienne valeur → Nouvelle valeur"
     - Pour les dates : formatage des dates
     - Pour les IDs (entreprise, employé) : afficher les noms au lieu des IDs
   - Formatage des dates (Aujourd'hui, Hier, Cette semaine, etc.)
   - Gestion des cas où `event_metadata` n'est pas disponible (fallback)

#### Étape 2.3 : Créer `ContactDocuments.tsx`
1. **Structure de base**
   - Copier la structure de `OpportunityDocuments.tsx`
   - Adapter pour les contacts

2. **Fonctionnalités**
   - Upload de fichiers (PDF, JPG, PNG)
   - Ajout de liens externes (Google Drive, etc.)
   - Liste des documents avec preview
   - Suppression de documents
   - Utiliser `mediaAPI` pour l'upload

3. **Intégration**
   - Lier les documents au contact via `entity_type: 'contact'` et `entity_id`

#### Étape 2.4 : Créer `ContactNotesEditor.tsx`
1. **Structure de base**
   - Copier la structure de `OpportunityNotesEditor.tsx`
   - Adapter pour utiliser `useContactNotes` hook

2. **Fonctionnalités**
   - Textarea avec auto-resize
   - Sauvegarde automatique avec debounce
   - Indicateur de statut (saving/saved/error)
   - Affichage de la date de dernière modification

### Phase 3 : Page principale

#### Étape 3.1 : Créer la page `[id]/page.tsx`
1. **Structure de base**
   - Copier la structure de `opportunites/[id]/page.tsx`
   - Adapter pour les contacts

2. **Header**
   - Bouton retour (flèche)
   - Nom complet du contact (Prénom + Nom)
   - Photo du contact (si disponible)
   - Badge pour le cercle/tags principaux
   - Nom de l'entreprise (si disponible)

3. **Stats Cards** (optionnel, adapté aux contacts)
   - Total opportunités liées
   - Dernière activité
   - Nombre de documents
   - Nombre de notes

4. **Système d'onglets**
   - **Vue d'ensemble** : `ContactOverviewEditor`
   - **Activités** : `ContactActivities`
   - **Documents** : `ContactDocuments`
   - **Notes** : `ContactNotesEditor`

5. **Gestion d'état**
   - Loading state
   - Error state
   - Fetch du contact via `contactsAPI.get(contactId)`
   - Rafraîchissement après modifications

6. **Métadonnées**
   - Card avec informations de création/modification
   - Utilisateur assigné (si applicable)

### Phase 4 : Intégration et navigation

#### Étape 4.1 : Mettre à jour la page de liste
1. **Modifier `contacts/page.tsx`**
   - Ajouter un lien vers la page individuelle dans le drawer
   - Ou remplacer le drawer par une navigation directe vers la page individuelle
   - Mettre à jour le bouton "Voir la page complète" dans le drawer

#### Étape 4.2 : Vérifier les routes
1. **Vérifier la structure de routes**
   - S'assurer que la route `/dashboard/reseau/contacts/[id]` est accessible
   - Vérifier les permissions si nécessaire

---

## 🎨 Design et UX

### Principes de design
1. **Cohérence visuelle**
   - Utiliser les mêmes classes CSS que la page des opportunités
   - Glass-card, gradients, animations similaires
   - Même système de couleurs et badges

2. **Édition inline**
   - Mode lecture par défaut
   - Bouton crayon visible au hover
   - Mode édition avec boutons Enregistrer/Annuler
   - Sauvegarde automatique avec indicateur

3. **Responsive**
   - Mobile-friendly
   - Grid adaptatif pour les stats cards
   - Tabs scrollables sur mobile

---

## 🔍 Points d'attention

### 1. API Backend
- **Vérifier** : Le backend supporte-t-il le champ `notes` pour les contacts ?
- **Vérifier** : Les endpoints de documents supportent-ils `entity_type: 'contact'` ?
- **Vérifier** : Les activités sont-elles enregistrées pour les contacts ?
- **CRITIQUE** : Le backend enregistre-t-il les modifications de champs avec `old_value` et `new_value` dans `event_metadata` ?
  - Si non, il faut modifier `update_contact()` dans le backend pour :
    - Comparer les valeurs avant/après modification
    - Enregistrer une activité pour chaque champ modifié avec `SecurityAuditLogger.log_event()`
    - Inclure dans `event_metadata` : `{ "field": "nom_du_champ", "old_value": ancienne_valeur, "new_value": nouvelle_valeur }`
    - Définir `entity_type` comme "contact" et `entity_id` comme l'ID du contact

### 2. Types TypeScript
- S'assurer que tous les types sont correctement définis
- Ajouter les types manquants si nécessaire

### 3. Gestion des erreurs
- Gérer les cas où le contact n'existe pas (404)
- Gérer les erreurs de sauvegarde
- Afficher des messages d'erreur clairs

### 4. Performance
- Utiliser React Query pour le cache
- Optimistic updates pour une meilleure UX
- Debounce pour les sauvegardes automatiques

### 5. Accessibilité
- Labels ARIA appropriés
- Navigation au clavier
- Contraste des couleurs
- Messages d'erreur accessibles

---

## 📝 Checklist de validation

### Phase 0 : Backend
- [ ] Endpoint `update_contact` modifié pour enregistrer les activités
- [ ] Tracking des modifications avec `old_value` et `new_value` implémenté
- [ ] Test du tracking : modifier un contact et vérifier qu'une activité est créée
- [ ] Vérifier que les activités sont récupérables avec `entity_type: 'contact'`

### Phase 1 : Infrastructure
- [ ] Hook `useContactEditor` créé et testé
- [ ] Hook `useContactNotes` créé et testé
- [ ] API contacts vérifiée et étendue si nécessaire
- [ ] Types Contact mis à jour

### Phase 2 : Composants
- [ ] `ContactOverviewEditor` créé avec tous les champs
- [ ] `ContactActivities` créé avec timeline
- [ ] `ContactDocuments` créé avec upload
- [ ] `ContactNotesEditor` créé avec sauvegarde auto

### Phase 3 : Page principale
- [ ] Page `[id]/page.tsx` créée
- [ ] Header avec photo et infos
- [ ] Stats cards (si applicable)
- [ ] Système d'onglets fonctionnel
- [ ] Gestion des états (loading, error)

### Phase 4 : Intégration
- [ ] Navigation depuis la liste des contacts
- [ ] Routes vérifiées
- [ ] Permissions vérifiées (si applicable)

### Tests
- [ ] Test de création/modification de contact
- [ ] Test d'ajout de documents
- [ ] Test d'ajout de notes
- [ ] Test de la timeline d'activités
- [ ] Test responsive (mobile/tablet/desktop)
- [ ] Test d'accessibilité

---

## 🚀 Ordre d'exécution recommandé

1. **Commencer par le backend** (Phase 0) - **CRITIQUE**
   - Modifier `update_contact()` pour enregistrer les activités
   - Tester que les modifications créent bien des activités avec `old_value` et `new_value`
   - Vérifier que les activités sont récupérables via l'API

2. **Ensuite les hooks** (Phase 1)
   - Créer `useContactEditor.ts`
   - Créer `useContactNotes.ts`
   - Tester avec la console

2. **Créer les composants un par un** (Phase 2)
   - `ContactOverviewEditor` (le plus complexe)
   - `ContactActivities`
   - `ContactDocuments`
   - `ContactNotesEditor`

3. **Assembler dans la page** (Phase 3)
   - Créer la page principale
   - Intégrer tous les composants
   - Tester le flux complet

4. **Intégration finale** (Phase 4)
   - Mettre à jour la navigation
   - Tests finaux
   - Corrections de bugs

---

## 📚 Références

- Page opportunités : `apps/web/src/app/[locale]/dashboard/commercial/opportunites/[id]/page.tsx`
- Composant overview : `apps/web/src/components/commercial/OpportunityOverviewEditor.tsx`
- Composant activités : `apps/web/src/components/commercial/OpportunityActivities.tsx`
- Composant documents : `apps/web/src/components/commercial/OpportunityDocuments.tsx`
- Composant notes : `apps/web/src/components/commercial/OpportunityNotesEditor.tsx`
- Hook éditeur : `apps/web/src/hooks/useOpportunityEditor.ts`
- Hook notes : `apps/web/src/hooks/useOpportunityNotes.ts`
- API contacts : `apps/web/src/lib/api/contacts.ts`
- API activités : `apps/web/src/lib/api/activities.ts`

---

## ⚠️ Notes importantes

1. **Champ notes** : Si le backend ne supporte pas encore le champ `notes` pour les contacts, il faudra l'ajouter au modèle backend également.

2. **Documents** : Vérifier que le système de documents/media supporte les contacts comme entité.

3. **Activités et tracking des modifications** : 
   - **CRITIQUE** : S'assurer que les activités sont bien enregistrées lors des modifications de contacts
   - **CRITIQUE** : Le backend doit enregistrer les modifications de champs avec `old_value` et `new_value` dans `event_metadata`
   - Si le tracking n'existe pas, modifier `update_contact()` dans `backend/app/api/v1/endpoints/commercial/contacts.py` :
     ```python
     # Avant la modification, stocker les anciennes valeurs
     old_values = {
         'first_name': contact.first_name,
         'last_name': contact.last_name,
         'email': contact.email,
         # ... autres champs
     }
     
     # Après la modification, comparer et enregistrer les activités
     for field, new_value in update_data.items():
         old_value = old_values.get(field)
         if old_value != new_value:
             await SecurityAuditLogger.log_event(
                 db=db,
                 event_type=SecurityEventType.DATA_MODIFIED,
                 description=f"Contact {contact_id} - {field} modified",
                 user_id=current_user.id,
                 event_metadata={
                     "entity_type": "contact",
                     "entity_id": str(contact_id),
                     "field": field,
                     "old_value": old_value,
                     "new_value": new_value
                 }
             )
     ```

4. **Migration** : Si des contacts existent déjà sans notes, gérer le cas `null` correctement.

5. **Formatage des valeurs** : Dans le composant `ContactActivities`, formater intelligemment les valeurs :
   - Pour les IDs d'entreprise : récupérer et afficher le nom de l'entreprise
   - Pour les IDs d'employé : récupérer et afficher le nom de l'employé
   - Pour les dates : formater en français
   - Pour les valeurs null : afficher "Non renseigné" ou "-"

---

**Date de création** : 2024
**Auteur** : Plan généré pour l'application du fonctionnement des opportunités aux contacts
