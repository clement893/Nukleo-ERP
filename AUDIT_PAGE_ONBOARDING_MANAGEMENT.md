# Audit de la page Onboarding - Module Management

**URL**: `/fr/dashboard/management/onboarding`  
**Date**: 2024  
**Contexte**: Audit après refactor UI

## Résumé exécutif

La page Onboarding du module Management présente plusieurs problèmes majeurs : elle utilise des données simulées au lieu de l'API backend, plusieurs boutons sont non fonctionnels, et il manque des fonctionnalités critiques pour gérer l'onboarding des employés.

---

## 🔴 Problèmes critiques

### 1. Données simulées au lieu de l'API backend

**Problème**: La page calcule le statut d'onboarding, les tâches et le mentor côté client au lieu d'utiliser l'API backend.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 84-107, 118-142)

**Code concerné**:
```typescript
// ❌ Calcul simulé côté client
const getOnboardingStatus = (hireDate: string): { status: OnboardingStatus, progress: number, tasks: OnboardingTask[] } => {
  const daysSinceHire = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));
  // Simulation basée sur les jours depuis l'embauche
  if (daysSinceHire < 0) {
    return { status: 'pending', progress: 0, tasks: standardTasks };
  } else if (daysSinceHire < 30) {
    // ...
  }
};

// ❌ Tâches hardcodées
const standardTasks: OnboardingTask[] = [
  { id: 1, title: 'Signature du contrat', completed: false },
  // ...
];

// ❌ Mentor assigné aléatoirement
const mentor = otherEmployees.length > 0 
  ? (() => {
      const mentorEmp = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
      return mentorEmp ? `${mentorEmp.first_name} ${mentorEmp.last_name}` : 'Non assigné';
    })()
  : 'Non assigné';
```

**Impact**: 
- Données non persistées dans la base de données
- Pas de synchronisation entre utilisateurs
- Impossible de gérer réellement l'onboarding
- Données perdues au rechargement
- Pas de traçabilité

**Solution recommandée**: 
- Créer des endpoints API pour l'onboarding des employés :
  - `GET /v1/employees/{employee_id}/onboarding` - Obtenir le statut d'onboarding d'un employé
  - `POST /v1/employees/{employee_id}/onboarding/initialize` - Initialiser l'onboarding
  - `POST /v1/employees/{employee_id}/onboarding/tasks/{task_id}/complete` - Marquer une tâche comme complétée
  - `PUT /v1/employees/{employee_id}/onboarding/mentor` - Assigner un mentor
- Ou adapter l'API d'onboarding existante pour supporter les employés

---

### 2. Bouton "Nouveau processus" non fonctionnel

**Problème**: Le bouton "Nouveau processus" a un `onClick` vide.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (ligne 200)

**Code concerné**:
```typescript
<Button 
  className="bg-white text-[#523DC9] hover:bg-white/90"
  onClick={() => {}} // ❌ Ne fait rien
>
  <Plus className="w-4 h-4 mr-2" />
  Nouveau processus
</Button>
```

**Impact**: 
- Fonctionnalité annoncée mais non disponible
- Impossible de créer un nouveau processus d'onboarding
- Mauvaise expérience utilisateur

**Solution recommandée**: 
- Créer un modal pour sélectionner un employé et initialiser son onboarding
- Utiliser l'API pour créer le processus

---

### 3. Boutons de ressources non fonctionnels

**Problème**: Les boutons "Voir les documents", "Voir les formations", et "Voir les outils" n'ont pas d'actions.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 431, 446, 461)

**Code concerné**:
```typescript
<Button variant="outline" size="sm" className="w-full">
  Voir les documents {/* ❌ Pas d'onClick */}
</Button>
<Button variant="outline" size="sm" className="w-full">
  Voir les formations {/* ❌ Pas d'onClick */}
</Button>
<Button variant="outline" size="sm" className="w-full">
  Voir les outils {/* ❌ Pas d'onClick */}
</Button>
```

**Impact**: 
- Fonctionnalités annoncées mais non disponibles
- Pas d'accès aux ressources d'onboarding
- Interface trompeuse

**Solution recommandée**: 
- Implémenter la navigation vers des pages de ressources
- Ou créer des modals avec les ressources
- Ou retirer ces sections si non implémentées

---

### 4. Pas de possibilité de marquer des tâches comme complétées

**Problème**: Les tâches d'onboarding sont affichées mais ne peuvent pas être marquées comme complétées depuis cette page.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 386-399)

**Code concerné**:
```typescript
{process.tasks.map((task) => (
  <div key={task.id} className="flex items-center gap-2">
    {task.completed ? (
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
    )}
    <span className={`text-sm ${task.completed ? 'line-through' : ''}`}>
      {task.title}
    </span>
    {/* ❌ Pas de bouton pour marquer comme complété */}
  </div>
))}
```

**Impact**: 
- Impossible de mettre à jour le statut des tâches
- Données statiques
- Pas de gestion réelle de l'onboarding

**Solution recommandée**: 
- Ajouter un bouton/clic pour marquer une tâche comme complétée
- Utiliser l'API pour mettre à jour le statut

---

### 5. Pas de connexion avec l'API d'onboarding existante

**Problème**: L'API d'onboarding existe (`/v1/onboarding/*`) mais elle est conçue pour les utilisateurs, pas pour les employés. La page ne l'utilise pas.

**Localisation**: 
- `backend/app/api/v1/endpoints/onboarding.py` (endpoints existants)
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (pas d'utilisation)

**Endpoints API disponibles mais non utilisés**:
- `GET /v1/onboarding/steps` - Obtenir les étapes d'onboarding
- `GET /v1/onboarding/progress` - Obtenir la progression
- `POST /v1/onboarding/initialize` - Initialiser l'onboarding
- `POST /v1/onboarding/steps/{step_key}/complete` - Compléter une étape

**Impact**: 
- API backend non exploitée
- Duplication de logique
- Données non synchronisées

**Solution recommandée**: 
- Adapter l'API pour supporter les employés (via `employee.user_id`)
- Ou créer une API spécifique pour l'onboarding des employés
- Utiliser les endpoints existants si possible

---

## 🟡 Problèmes modérés

### 6. Pas de possibilité d'assigner un mentor

**Problème**: Le mentor est assigné aléatoirement côté client et ne peut pas être modifié.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 123-130)

**Code concerné**:
```typescript
// ❌ Assignation aléatoire
const mentor = otherEmployees.length > 0 
  ? (() => {
      const mentorEmp = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
      return mentorEmp ? `${mentorEmp.first_name} ${mentorEmp.last_name}` : 'Non assigné';
    })()
  : 'Non assigné';
```

**Impact**: 
- Pas de contrôle sur l'assignation du mentor
- Mentor différent à chaque chargement
- Pas de persistance

**Solution recommandée**: 
- Ajouter un champ `mentor_id` dans le modèle Employee ou créer une table de relation
- Permettre l'assignation/édition du mentor depuis l'UI
- Persister dans la base de données

---

### 7. Tâches hardcodées au lieu d'être configurables

**Problème**: Les tâches d'onboarding sont définies dans le code au lieu d'être configurables.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 66-72)

**Code concerné**:
```typescript
// ❌ Tâches hardcodées
const standardTasks: OnboardingTask[] = [
  { id: 1, title: 'Signature du contrat', completed: false },
  { id: 2, title: 'Configuration email', completed: false },
  // ...
];
```

**Impact**: 
- Impossible de personnaliser les tâches par équipe/département
- Modification nécessite un changement de code
- Pas de flexibilité

**Solution recommandée**: 
- Utiliser l'API `/v1/onboarding/steps` pour obtenir les tâches configurables
- Ou créer un endpoint pour gérer les tâches d'onboarding des employés
- Permettre la configuration depuis l'interface admin

---

### 8. Pas de vue détaillée d'un processus d'onboarding

**Problème**: Il n'y a pas de page de détail pour voir/modifier un processus d'onboarding spécifique.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (pas de navigation vers détail)

**Impact**: 
- Impossible de voir les détails d'un onboarding
- Pas de gestion fine des tâches
- Expérience utilisateur limitée

**Solution recommandée**: 
- Créer une page de détail `/dashboard/management/onboarding/[employee_id]`
- Permettre la gestion complète du processus depuis cette page

---

### 9. Pas de filtrage par équipe ou département

**Problème**: Le filtrage est limité au statut et à la recherche par nom.

**Localisation**: 
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx` (lignes 271-315)

**Impact**: 
- Difficile de gérer l'onboarding par équipe
- Pas de vue d'ensemble par département
- Filtrage limité

**Solution recommandée**: 
- Ajouter des filtres par équipe et département
- Utiliser les données `employee.team_id` et `employee.department`

---

## 🟢 Améliorations suggérées

### 10. Pas de pagination

**Problème**: Tous les employés sont chargés d'un coup (limite à 1000).

**Impact**: 
- Performance dégradée avec beaucoup d'employés

**Solution recommandée**: 
- Implémenter la pagination ou le chargement infini

---

### 11. Pas d'export des données

**Problème**: Impossible d'exporter la liste des processus d'onboarding.

**Impact**: 
- Pas de reporting possible
- Difficile de partager les données

**Solution recommandée**: 
- Ajouter un bouton d'export Excel/CSV

---

### 12. Pas de notifications/rappels

**Problème**: Pas de système de notifications pour les processus en retard.

**Impact**: 
- Risque d'oublier les onboarding en cours
- Pas de suivi proactif

**Solution recommandée**: 
- Ajouter des notifications pour les processus en retard
- Système de rappels automatiques

---

## ✅ Fonctionnalités fonctionnelles

Les fonctionnalités suivantes sont correctement implémentées :

1. ✅ Affichage de la liste des processus d'onboarding
2. ✅ Calcul et affichage des statistiques (Total, En attente, En cours, Terminés, Progression moyenne)
3. ✅ Filtrage par statut (Tous, En attente, En cours, Terminés)
4. ✅ Recherche par nom d'employé
5. ✅ Affichage des tâches d'onboarding
6. ✅ Affichage du mentor assigné
7. ✅ Affichage de la date de début
8. ✅ Barre de progression visuelle
9. ✅ Connexion API pour charger les employés (`useInfiniteEmployees`)

---

## 📋 Checklist de correction

- [ ] Créer/Adapter l'API pour l'onboarding des employés
- [ ] Remplacer les données simulées par des appels API réels
- [ ] Implémenter le bouton "Nouveau processus"
- [ ] Implémenter les boutons de ressources (Documents, Formations, Outils)
- [ ] Ajouter la possibilité de marquer des tâches comme complétées
- [ ] Permettre l'assignation/édition du mentor
- [ ] Utiliser les tâches configurables depuis l'API
- [ ] Créer une page de détail pour chaque processus
- [ ] Ajouter le filtrage par équipe/département
- [ ] Implémenter la pagination
- [ ] Ajouter l'export des données

---

## 🔗 Fichiers concernés

### Frontend
- `apps/web/src/app/[locale]/dashboard/management/onboarding/page.tsx`
- `apps/web/src/lib/api/employees.ts` ✅ (fonctionnel)
- `apps/web/src/lib/query/employees.ts` ✅ (fonctionnel)

### Backend
- `backend/app/api/v1/endpoints/onboarding.py` ✅ (existe mais pour users, pas employees)
- `backend/app/services/onboarding_service.py` ✅ (existe mais pour users)
- `backend/app/models/onboarding.py` ✅ (existe mais pour users)

---

## Notes techniques

- L'API d'onboarding existante est conçue pour les utilisateurs (`UserOnboarding`), pas pour les employés
- Il faudrait soit adapter l'API pour supporter les employés (via `employee.user_id`), soit créer une nouvelle API spécifique
- Les données sont actuellement entièrement simulées côté client
- Le mentor devrait être stocké dans la base de données (peut-être dans le modèle Employee ou une table de relation)

---

**Priorité de correction recommandée**:
1. 🔴 Créer/Adapter l'API pour l'onboarding des employés (critique)
2. 🔴 Remplacer les données simulées par l'API (critique)
3. 🔴 Implémenter le bouton "Nouveau processus" (critique)
4. 🔴 Implémenter les boutons de ressources (modéré)
5. 🔴 Ajouter la possibilité de marquer des tâches comme complétées (modéré)
6. 🟡 Permettre l'assignation du mentor (modéré)
7. 🟡 Utiliser les tâches configurables (amélioration)
8. 🟢 Autres améliorations (optionnel)
