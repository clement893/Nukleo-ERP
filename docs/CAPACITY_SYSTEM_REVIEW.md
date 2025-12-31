# 🔍 Révision du Système de Capacité - Analyse des Failles

## 🔴 Failles Critiques

### 1. **Incohérence de Mapping Employee/User**
**Problème** : 
- Les tâches utilisent `assignee_id` qui référence `users.id`
- Les vacances utilisent `employee_id` qui référence `employees.id`
- Le mapping dans `CapacityVisualization` utilise `employee.user_id || employee.id` comme clé, mais les tâches utilisent `task.assignee_id` (user_id)
- Si un employé n'a pas de `user_id`, les heures estimées ne seront jamais comptabilisées

**Code problématique** :
```typescript
// Ligne 109: Clé = user_id ou employee.id
const key = employee.user_id || employee.id;

// Ligne 128: Recherche avec assignee_id (qui est un user_id)
const capacity = capacityMap.get(task.assignee_id);
```

**Impact** : Les heures estimées peuvent ne pas être correctement associées aux employés.

**Solution** : Créer un mapping bidirectionnel entre employees et users.

### 2. **Calcul de Capacité Incorrect pour Semaines Partielles**
**Problème** :
```typescript
const capacityHours = workingDays * (capacityHoursPerWeek / 5);
```
Cette formule assume toujours 5 jours ouvrables par semaine, mais :
- Les semaines avec jours fériés ont moins de 5 jours
- Les semaines partielles (début/fin de période) sont mal calculées
- Ne prend pas en compte que certaines semaines peuvent avoir 4 jours ouvrables (ex: semaine avec 1 jour férié)

**Impact** : La capacité réelle peut être surestimée.

**Solution** : Calculer la capacité par semaine individuellement.

### 3. **Heures Estimées Non Filtrées par Période de Tâche**
**Problème** :
```typescript
filteredTasks.forEach((task) => {
  if (task.assignee_id && task.estimated_hours) {
    capacity.estimatedHours += task.estimated_hours;
  }
});
```
Les heures estimées sont sommées sans tenir compte de :
- La `due_date` de la tâche (si elle est en dehors de la période analysée)
- Le statut de la tâche (les tâches complétées ne devraient peut-être pas compter)
- La répartition temporelle des heures (si une tâche de 40h est due dans 2 semaines, elle ne devrait pas compter pour cette semaine)

**Impact** : Les heures prévues peuvent être incorrectes.

**Solution** : Filtrer les tâches par période et statut avant de sommer.

### 4. **Problème de Performance pour Longues Périodes**
**Problème** :
```typescript
while (current <= endDate) {
  if (isWorkingDay(current, holidays, absences)) {
    count++;
  }
  current.setDate(current.getDate() + 1);
}
```
Pour une période d'un an (365 jours), cette boucle s'exécute 365 fois avec plusieurs vérifications à chaque itération (weekend, holiday, absence).

**Impact** : Performance dégradée pour les analyses longues périodes.

**Solution** : Optimiser avec des calculs mathématiques et mise en cache.

## 🟡 Failles Modérées

### 5. **Gestion des Timezones**
**Problème** :
```typescript
const dateStr = date.toISOString().split('T')[0];
```
Les conversions de dates peuvent avoir des problèmes de timezone.

**Impact** : Un jour peut être compté deux fois ou ignoré selon le fuseau horaire.

### 6. **Absence de Validation des Dates**
**Problème** : Aucune validation que `start_date <= end_date` pour les vacances.

**Impact** : Des données invalides peuvent causer des calculs incorrects.

### 7. **Chargement des Vacances Non Optimisé**
**Problème** :
```typescript
const allVacations = await vacationRequestsAPI.list({ status: 'approved' });
```
Toutes les vacances de tous les employés sont chargées, même si seulement quelques employés sont analysés.

**Impact** : Requête API inutilement lourde, pas de cache.

### 8. **Pas de Gestion des Employés Sans User_ID**
**Problème** : Si un employé n'a pas de `user_id`, le mapping avec les tâches échouera.

**Impact** : Les heures estimées ne seront pas comptabilisées.

### 9. **Filtrage des Absences Incorrect**
**Problème** :
```typescript
const employeeAbsences = absences.filter(
  abs => abs.employee_id === employee.id || abs.employee_id === employee.user_id
);
```
Les vacances ont `employee_id` qui référence `employees.id`, mais le filtrage vérifie aussi `employee.user_id` ce qui ne correspondra jamais.

**Impact** : Les absences peuvent ne pas être correctement associées.

## 🟢 Améliorations Recommandées

### 10. **Pas de Tests Unitaires**
**Problème** : Aucun test pour valider les calculs.

### 11. **Pas de Gestion des Heures Partielles**
**Problème** : Le système ne gère pas les employés à temps partiel.

### 12. **Pas de Validation des Heures Estimées**
**Problème** : Aucune validation que `estimated_hours` est raisonnable.

### 13. **Pas de Gestion des Changements de Capacité**
**Problème** : Si la capacité change en cours de période, le calcul ne le prend pas en compte.
