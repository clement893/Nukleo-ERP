# Plan : Onglet Activités pour les Opportunités

## 📋 Vue d'ensemble

L'onglet "Activités" d'une opportunité devrait afficher un historique chronologique de toutes les actions et événements liés à cette opportunité.

## 🎯 Types d'Activités à Afficher

### 1. **Historique des Modifications** (Priorité 1 - MVP)
- ✅ Changement de stage/étape
- ✅ Modification du montant
- ✅ Changement de probabilité
- ✅ Modification de la date de clôture prévue
- ✅ Changement d'assignation (assigné à)
- ✅ Ajout/retrait de contacts
- ✅ Modification du statut
- ✅ Création de l'opportunité
- ✅ Modification de la description

**Source** : Comparer les valeurs actuelles avec les timestamps (`created_at`, `updated_at`) et utiliser l'API d'activités système si disponible.

### 2. **Activités Système** (Priorité 2)
- ✅ Notes ajoutées/modifiées (référence vers l'onglet Notes)
- ✅ Documents ajoutés/supprimés (référence vers l'onglet Documents)
- ✅ Soumissions créées (si relation existe)
- ✅ Devis créés/modifiés (si relation existe)

**Source** : API `/v1/activities` avec filtres `entity_type="opportunity"` et `entity_id={opportunity_id}`

### 3. **Événements Calendrier** (Priorité 3 - Si relation ajoutée)
- ✅ Réunions liées à l'opportunité
- ✅ Appels téléphoniques planifiés
- ✅ Rappels/Deadlines

**Source** : Requête sur `calendar_events` avec relation vers opportunité (nécessite ajout de champ `opportunity_id`)

### 4. **Tâches** (Priorité 3 - Si relation ajoutée)
- ✅ Tâches créées pour cette opportunité
- ✅ Tâches complétées
- ✅ Tâches assignées

**Source** : Requête sur `project_tasks` avec relation vers opportunité (nécessite ajout de champ `opportunity_id`)

### 5. **Activités Futures** (Priorité 4)
- ✅ Emails envoyés/reçus (si intégration email)
- ✅ Appels téléphoniques (si intégration téléphonie)
- ✅ Visites/rencontres
- ✅ Présentations/démos

## 🏗️ Implémentation Recommandée

### Phase 1 : MVP - Historique des Modifications

#### Option A : Utiliser l'API Activities existante
```typescript
GET /v1/activities?entity_type=opportunity&entity_id={opportunity_id}
```

**Avantages** :
- Utilise l'infrastructure existante
- Déjà en place avec SecurityAuditLog

**Inconvénients** :
- Nécessite que les modifications soient loggées dans SecurityAuditLog
- Peut ne pas capturer tous les changements

#### Option B : Créer un historique basé sur les timestamps
```typescript
// Comparer les valeurs actuelles avec les champs updated_at/created_at
// Afficher les changements détectés
```

**Avantages** :
- Simple à implémenter
- Fonctionne immédiatement

**Inconvénients** :
- Ne montre que les dernières valeurs
- Pas d'historique détaillé des changements intermédiaires

#### Option C : Créer une table d'historique dédiée (Recommandé pour long terme)
```sql
CREATE TABLE opportunity_history (
  id SERIAL PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunites(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Avantages** :
- Historique complet et précis
- Traçabilité complète
- Performance optimale

**Inconvénients** :
- Nécessite modification backend
- Plus complexe à implémenter

### Phase 2 : Intégration avec autres modules

1. **Ajouter relation opportunity_id aux tables existantes** :
   - `calendar_events` : Ajouter `opportunity_id`
   - `project_tasks` : Ajouter `opportunity_id` (ou créer table de liaison)
   - `submissions` : Vérifier si relation existe déjà
   - `quotes` : Vérifier si relation existe déjà

2. **Créer composant ActivityTimeline** :
   - Afficher toutes les activités dans une timeline chronologique
   - Grouper par date
   - Filtrer par type d'activité

## 📝 Structure de Code

### Composant : `OpportunityActivities.tsx`

```tsx
interface Activity {
  id: string;
  type: 'modification' | 'note' | 'document' | 'submission' | 'quote' | 'calendar' | 'task';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    id: number;
    name: string;
  };
  metadata?: Record<string, unknown>;
}

<OpportunityActivities
  opportunityId={opportunity.id}
  opportunity={opportunity}
/>
```

### Fonctionnalités

1. **Timeline chronologique** :
   - Activités triées par date (plus récentes en premier)
   - Groupement par date (Aujourd'hui, Hier, Cette semaine, etc.)
   - Indicateurs visuels par type d'activité

2. **Filtres** :
   - Par type d'activité
   - Par utilisateur
   - Par période (date range)

3. **Affichage** :
   - Icônes par type d'activité
   - Badges de couleur
   - Lien vers les éléments liés (documents, notes, etc.)

## 🎨 Design UI/UX

### Layout de l'onglet Activités

```
┌─────────────────────────────────────┐
│  Activités                          │
├─────────────────────────────────────┤
│  [Filtres: Type | Utilisateur | Date]│
├─────────────────────────────────────┤
│  📅 Aujourd'hui                     │
│  ┌─────────────────────────────────┐ │
│  │ 🏷️  Stage changé                │ │
│  │    Qualifié → Proposition       │ │
│  │    par Jean Dupont il y a 2h    │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ 📝 Note ajoutée                  │ │
│  │    "Appel client prévu..."       │ │
│  │    par Marie Martin il y a 3h    │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  📅 Hier                            │
│  ┌─────────────────────────────────┐ │
│  │ 💰 Montant modifié               │ │
│  │    50,000€ → 75,000€             │ │
│  │    par Jean Dupont               │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Types d'activités et icônes

- **Modification** : 🔄 (changement de champ)
- **Note** : 📝
- **Document** : 📄
- **Soumission** : 📋
- **Devis** : 💼
- **Calendrier** : 📅
- **Tâche** : ✅
- **Création** : ✨
- **Suppression** : 🗑️

## 🔄 Flux Utilisateur

1. **Ouverture de l'onglet Activités**
   - Charge les activités depuis l'API
   - Affiche la timeline chronologique
   - Groupe par date

2. **Filtrage**
   - L'utilisateur sélectionne un filtre
   - La timeline se met à jour en temps réel

3. **Navigation**
   - Clic sur une activité → Affiche les détails
   - Clic sur un lien → Ouvre l'élément lié (document, note, etc.)

## 🚀 Étapes d'Implémentation

### Phase 1 : MVP (Historique basique)
1. ✅ Créer le composant `OpportunityActivities`
2. ✅ Utiliser l'API `/v1/activities` avec filtres
3. ✅ Afficher les activités dans une timeline
4. ✅ Grouper par date
5. ✅ Ajouter filtres basiques

### Phase 2 : Améliorations
1. Ajouter historique des modifications de champs
2. Intégrer avec documents et notes
3. Ajouter relations avec calendrier et tâches
4. Améliorer les filtres et la recherche

## 📊 Métriques de Succès

- ✅ Timeline chargée rapidement (< 1s)
- ✅ Activités affichées chronologiquement
- ✅ Filtres fonctionnels
- ✅ Navigation fluide vers éléments liés

## 🔐 Sécurité & Permissions

- Vérifier que l'utilisateur peut voir les activités
- Filtrer les activités selon les permissions
- Masquer les informations sensibles si nécessaire

---

## 🎯 Recommandation Finale

**Commencer par Phase 1 - MVP** :
1. Utiliser l'API `/v1/activities` existante
2. Afficher les activités système liées à l'opportunité
3. Créer une timeline simple avec groupement par date
4. Ajouter des filtres basiques

**Puis étendre avec** :
- Historique des modifications de champs (si backend supporte)
- Intégration avec documents/notes (références)
- Relations avec calendrier et tâches (si ajoutées)
