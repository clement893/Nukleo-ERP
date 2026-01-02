# Audit de la Page Feuilles de Temps

**Date**: 2025-01-27  
**Page**: `/fr/dashboard/management/feuilles-temps`  
**Fichier**: `apps/web/src/app/[locale]/dashboard/management/feuilles-temps/page.tsx`

## 📋 Résumé Exécutif

La page des feuilles de temps a été refactorisée avec une nouvelle UI mais plusieurs fonctionnalités existantes ne sont pas implémentées ou connectées correctement. Le système d'approbation/rejet est complètement mocké alors qu'il n'existe pas dans le backend.

---

## 🔴 Problèmes Critiques

### 1. **Statuts Mockés (Approved/Pending/Rejected)**
**Problème**: Les statistiques d'approbation sont calculées avec des valeurs mockées (60% approuvées, 30% en attente, 10% rejetées).

**Code concerné**:
```typescript
// Ligne 128-131
const approved = Math.floor(total * 0.6);
const pending = Math.floor(total * 0.3);
const rejected = total - approved - pending;
```

**Impact**: 
- Les statistiques affichées sont fausses
- Pas de système d'approbation réel dans le backend
- Le modèle `TimeEntry` n'a pas de champ `status`

**Recommandation**: 
- Soit ajouter un champ `status` au modèle `TimeEntry` avec un workflow d'approbation
- Soit retirer ces statistiques de l'interface

---

### 2. **Bouton "Nouvelle entrée" Non Fonctionnel**
**Problème**: Le bouton "Nouvelle entrée" ne fait rien (`onClick={() => {}}`).

**Code concerné**:
```typescript
// Ligne 184
<Button 
  className="bg-white text-[#523DC9] hover:bg-white/90"
  onClick={() => {}}
>
```

**Impact**: 
- Impossible de créer une nouvelle entrée depuis cette page
- Fonctionnalité de base manquante

**Recommandation**: 
- Créer un modal/formulaire pour créer une nouvelle entrée
- Utiliser `timeEntriesAPI.create()` pour sauvegarder

---

## ⚠️ Fonctionnalités Manquantes

### 3. **Pas de Vue Détaillée des Entrées**
**Problème**: Les entrées affichées ne sont pas cliquables pour voir les détails.

**Impact**: 
- Impossible de voir les détails d'une entrée (description complète, dates, etc.)
- Pas de possibilité d'éditer ou supprimer une entrée

**Recommandation**: 
- Ajouter un drawer ou modal pour afficher les détails
- Permettre l'édition et la suppression

---

### 4. **Pas de Filtres par Date**
**Problème**: Seule la recherche par nom est disponible, pas de filtres par période.

**Impact**: 
- Difficile de filtrer les entrées par période (semaine, mois, année)
- Pas de sélection de plage de dates

**Recommandation**: 
- Ajouter des filtres de date (date début, date fin)
- Utiliser les paramètres `start_date` et `end_date` de l'API

---

### 5. **Pas de Fonctionnalité d'Édition**
**Problème**: Aucun moyen d'éditer une entrée existante.

**Impact**: 
- Impossible de corriger une erreur dans une entrée
- Doit être fait manuellement en base de données ou via API

**Recommandation**: 
- Ajouter un bouton "Éditer" sur chaque entrée
- Créer un formulaire d'édition utilisant `timeEntriesAPI.update()`

---

### 6. **Pas de Fonctionnalité de Suppression**
**Problème**: Aucun moyen de supprimer une entrée.

**Impact**: 
- Impossible de supprimer une entrée erronée
- Doit être fait manuellement

**Recommandation**: 
- Ajouter un bouton "Supprimer" avec confirmation
- Utiliser `timeEntriesAPI.delete()`

---

### 7. **Pas d'Export des Données**
**Problème**: Aucune fonctionnalité d'export (CSV, Excel, PDF).

**Impact**: 
- Impossible d'exporter les données pour analyse externe
- Pas de rapports exportables

**Recommandation**: 
- Ajouter un bouton "Exporter"
- Générer CSV/Excel avec toutes les données filtrées

---

### 8. **Pas de Pagination**
**Problème**: Toutes les entrées sont chargées d'un coup (limit: 1000).

**Impact**: 
- Performance dégradée avec beaucoup d'entrées
- Temps de chargement long

**Recommandation**: 
- Implémenter une pagination réelle
- Charger par pages de 50-100 entrées

---

## 🔗 Connexions API Non Utilisées

### 9. **Paramètres de Filtrage Non Utilisés**
**Problème**: L'API supporte plusieurs filtres qui ne sont pas utilisés dans l'interface.

**Filtres disponibles mais non utilisés**:
- `start_date` / `end_date` - Filtrage par période
- `user_id` - Filtrage par employé spécifique
- `task_id` - Filtrage par tâche
- `project_id` - Filtrage par projet
- `client_id` - Filtrage par client

**Recommandation**: 
- Ajouter des filtres avancés dans l'interface
- Permettre la combinaison de plusieurs filtres

---

### 10. **Timer Status Non Affiché**
**Problème**: L'API a un endpoint `/timer/status` qui n'est pas utilisé.

**Impact**: 
- Pas d'indication si un timer est actif
- Pas de vue du temps en cours de suivi

**Recommandation**: 
- Afficher le statut du timer actif
- Montrer le temps accumulé en temps réel

---

## 📊 Données Manquantes dans l'Affichage

### 11. **Description Non Affichée**
**Problème**: La description des entrées n'est pas affichée dans les cartes.

**Impact**: 
- Impossible de voir ce qui a été fait sans ouvrir les détails
- Informations importantes cachées

**Recommandation**: 
- Afficher la description (tronquée) dans les cartes
- Afficher la description complète dans la vue détaillée

---

### 12. **Tâche Associée Non Affichée**
**Problème**: Le nom de la tâche (`task_title`) n'est pas toujours affiché.

**Impact**: 
- Difficile de savoir sur quelle tâche le temps a été passé
- Contexte manquant

**Recommandation**: 
- Toujours afficher le nom de la tâche si disponible
- Ajouter un lien vers la tâche

---

## 🎨 Améliorations UX Suggérées

### 13. **Vue Tableau Optionnelle**
**Problème**: Seule la vue par cartes est disponible.

**Recommandation**: 
- Ajouter une vue tableau pour une meilleure comparaison
- Permettre le tri par colonnes

---

### 14. **Tri et Tri Multi-Critères**
**Problème**: Pas de tri disponible.

**Recommandation**: 
- Ajouter un tri par date, durée, employé, client
- Permettre le tri multi-critères

---

### 15. **Actions en Masse**
**Problème**: Pas de sélection multiple pour actions en masse.

**Recommandation**: 
- Permettre la sélection multiple d'entrées
- Actions en masse : exporter, supprimer, approuver (si workflow ajouté)

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Affichage par Employé** - Fonctionne correctement
2. ✅ **Affichage par Client** - Fonctionne correctement
3. ✅ **Affichage par Semaine** - Fonctionne correctement
4. ✅ **Recherche par nom** - Fonctionne correctement
5. ✅ **Calcul des heures totales** - Correct
6. ✅ **Groupement des données** - Correct
7. ✅ **UI moderne et responsive** - Bien fait

---

## 📝 Plan d'Action Recommandé

### Priorité HAUTE
1. **Implémenter le bouton "Nouvelle entrée"** avec modal de création
2. **Ajouter vue détaillée** avec drawer/modal pour chaque entrée
3. **Ajouter fonctionnalité d'édition** des entrées
4. **Ajouter fonctionnalité de suppression** avec confirmation
5. **Retirer ou implémenter les statuts** d'approbation

### Priorité MOYENNE
6. **Ajouter filtres par date** (début/fin)
7. **Ajouter filtres avancés** (projet, tâche, client)
8. **Afficher la description** dans les cartes
9. **Afficher le nom de la tâche** systématiquement
10. **Ajouter pagination** pour améliorer les performances

### Priorité BASSE
11. **Ajouter fonctionnalité d'export** (CSV/Excel)
12. **Ajouter vue tableau** optionnelle
13. **Ajouter tri et tri multi-critères**
14. **Afficher le statut du timer** actif
15. **Ajouter actions en masse**

---

## 🔧 Modifications Backend Nécessaires (si workflow d'approbation)

Si un système d'approbation est souhaité, il faudrait :

1. **Ajouter un champ `status` au modèle `TimeEntry`**:
```python
class TimeEntryStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

status = Column(SQLEnum(TimeEntryStatus), default=TimeEntryStatus.PENDING, nullable=False)
```

2. **Ajouter des endpoints d'approbation**:
- `POST /time-entries/{entry_id}/approve`
- `POST /time-entries/{entry_id}/reject`
- `GET /time-entries?status=pending` (filtre par statut)

3. **Ajouter des permissions** pour l'approbation (seuls les managers peuvent approuver)

---

## 📌 Conclusion

La page a une belle interface mais manque de fonctionnalités essentielles :
- **Création** d'entrées (bouton non fonctionnel)
- **Édition** d'entrées (absente)
- **Suppression** d'entrées (absente)
- **Vue détaillée** (absente)
- **Statuts mockés** (à corriger ou implémenter)

Les connexions API de base fonctionnent (liste, récupération), mais les fonctionnalités CRUD complètes ne sont pas implémentées dans l'interface.
