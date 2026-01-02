# Audit Complet - Page Calendrier

**Date:** 2025-01-15  
**URL:** https://modeleweb-production-f341.up.railway.app/fr/dashboard/calendrier  
**Statut:** Audit complet - Rapport uniquement

---

## 📋 Vue d'Ensemble

La page calendrier actuelle (`/fr/dashboard/calendrier`) affiche un calendrier mensuel avec plusieurs types d'événements, mais manque de quickfilters et de certains éléments importants.

---

## 🔍 État Actuel

### Page Analysée: `/fr/dashboard/calendrier`

**Fichier:** `apps/web/src/app/[locale]/dashboard/calendrier/page.tsx`

### Éléments Actuellement Présents

#### 1. **Types d'Événements Affichés**
- ✅ **Projets** (début et fin)
- ✅ **Deadlines** (fin de projets)
- ✅ **Vacances** (demandes approuvées)
- ✅ **Feuilles de temps** (agrégées par jour)

#### 2. **Filtres Actuels**
- ❌ **Uniquement un dropdown simple** avec options:
  - Tous les événements
  - Projets
  - Deadlines
  - Vacances
  - Feuilles de temps

#### 3. **Statistiques Affichées**
- ✅ Total événements
- ✅ Projets (début + fin)
- ✅ Vacances
- ✅ Feuilles de temps

#### 4. **Navigation**
- ✅ Navigation mois précédent/suivant
- ✅ Bouton "Aujourd'hui"
- ✅ Affichage mois/année

---

## ❌ Éléments Manquants

### 1. **Quickfilters Manquants**

La page n'a **PAS de quickfilters visuels** comme les autres pages du système. Les quickfilters devraient être des boutons visuels avec compteurs, similaires à ceux trouvés dans:
- `/dashboard/contacts-demo` (exemple de quickfilters avec icônes et compteurs)
- `/dashboard/clients-demo` (quickfilters avec badges)
- `/dashboard/reseau/contacts` (quickfilters personnalisables)

**Quickfilters Recommandés:**
1. 🎯 **Tous** (avec compteur total)
2. 📅 **Jours fériés** (actuellement absent de cette page)
3. 🏖️ **Vacances** (avec compteur)
4. 📊 **Projets** (avec compteur)
5. ⏰ **Deadlines** (avec compteur urgent)
6. 🎂 **Anniversaires** (actuellement absent)
7. 🎉 **Dates d'embauche** (actuellement absent)
8. 📝 **Événements** (actuellement absent)
9. ☀️ **Vacances d'été** (actuellement absent)
10. ⏱️ **Feuilles de temps** (avec compteur)

### 2. **Éléments Non Présentés**

#### A. **Jours Fériés** ❌
- **Statut:** Absent de `/dashboard/calendrier`
- **Note:** Présent dans `/dashboard/agenda/calendrier` mais pas dans la page principale
- **Recommandation:** Ajouter les jours fériés du Québec (calculés dynamiquement)

#### B. **Anniversaires** ❌
- **Statut:** Absent de `/dashboard/calendrier`
- **Note:** Présent dans `/dashboard/agenda/calendrier` via `CalendarView.tsx`
- **Source de données:** `employeesAPI` avec champ `birthday`
- **Recommandation:** Afficher les anniversaires des employés avec icône 🎂

#### C. **Dates d'Embauche** ❌
- **Statut:** Absent de `/dashboard/calendrier`
- **Note:** Présent dans `/dashboard/agenda/calendrier` via `CalendarView.tsx`
- **Source de données:** `employeesAPI` avec champ `hire_date`
- **Recommandation:** Afficher les anniversaires d'embauche avec nombre d'années de service

#### D. **Événements Généraux** ❌
- **Statut:** Absent de `/dashboard/calendrier`
- **Note:** Présent dans `/dashboard/agenda/calendrier` via `agendaAPI`
- **Source de données:** `agendaAPI.list()` avec types: meeting, appointment, reminder, other
- **Recommandation:** Afficher les événements créés via l'API agenda

#### E. **Vacances d'Été** ❌
- **Statut:** Absent de `/dashboard/calendrier`
- **Note:** Présent dans `/dashboard/agenda/calendrier` (1er juillet - 31 août)
- **Recommandation:** Afficher la période de vacances d'été

#### F. **Vacances en Attente** ⚠️
- **Statut:** Partiellement présent (seulement approuvées)
- **Recommandation:** Ajouter un filtre pour voir les vacances en attente d'approbation

---

## 📊 Comparaison avec `/dashboard/agenda/calendrier`

### Page Alternative Analysée: `/dashboard/agenda/calendrier`

**Fichier:** `apps/web/src/app/[locale]/dashboard/agenda/calendrier/page.tsx`  
**Composant:** `apps/web/src/components/agenda/CalendarView.tsx`

### Éléments Présents dans CalendarView.tsx

#### ✅ **Filtres Disponibles (Checkboxes)**
1. Jours fériés
2. Vacances d'été
3. Vacances employés
4. Deadlines
5. Événements
6. Anniversaires
7. Dates d'embauche

#### ✅ **Types d'Événements**
1. **Jours fériés du Québec** (calculés dynamiquement)
   - Jour de l'an
   - Vendredi saint
   - Lundi de Pâques
   - Fête des Patriotes
   - Fête nationale du Québec
   - Fête du Canada
   - Fête du travail
   - Action de grâce
   - Noël

2. **Vacances d'été** (1er juillet - 31 août)

3. **Vacances approuvées** (depuis `vacationRequestsAPI`)

4. **Deadlines de projets** (depuis `projectsAPI`)

5. **Événements généraux** (depuis `agendaAPI`)

6. **Anniversaires** (depuis `employeesAPI.birthday`)

7. **Dates d'embauche** (depuis `employeesAPI.hire_date`)

---

## 🎯 Recommandations

### 1. **Ajouter des Quickfilters Visuels**

**Format Recommandé:**
```typescript
const quickFilters = [
  { id: 'all', label: 'Tous', icon: CalendarIcon, count: totalEvents, color: '#523DC9' },
  { id: 'holidays', label: 'Jours fériés', icon: Star, count: holidaysCount, color: '#EF4444' },
  { id: 'vacations', label: 'Vacances', icon: Plane, count: vacationsCount, color: '#10B981' },
  { id: 'projects', label: 'Projets', icon: Briefcase, count: projectsCount, color: '#523DC9' },
  { id: 'deadlines', label: 'Deadlines', icon: AlertCircle, count: deadlinesCount, color: '#6B1817' },
  { id: 'birthdays', label: 'Anniversaires', icon: Cake, count: birthdaysCount, color: '#EC4899' },
  { id: 'hiredates', label: 'Dates embauche', icon: Users, count: hireDatesCount, color: '#06B6D4' },
  { id: 'events', label: 'Événements', icon: Clock, count: eventsCount, color: '#3B82F6' },
  { id: 'summer', label: 'Vacances été', icon: Sun, count: summerDays, color: '#F59E0B' },
  { id: 'timesheets', label: 'Feuilles temps', icon: Clock, count: timesheetsCount, color: '#8B5CF6' },
];
```

**Affichage:** Boutons avec badges de compteur, similaire à `/dashboard/contacts-demo`

### 2. **Intégrer les Données Manquantes**

#### A. **Charger les Jours Fériés**
```typescript
// Utiliser la fonction existante de CalendarView.tsx
const getQuebecHolidays = (year: number) => { ... }
```

#### B. **Charger les Anniversaires**
```typescript
const employees = await employeesAPI.list(0, 1000);
employees.forEach(emp => {
  if (emp.birthday) {
    // Créer événement anniversaire
  }
});
```

#### C. **Charger les Dates d'Embauche**
```typescript
employees.forEach(emp => {
  if (emp.hire_date) {
    // Créer événement date d'embauche avec années de service
  }
});
```

#### D. **Charger les Événements Généraux**
```typescript
const apiEvents = await agendaAPI.list();
// Convertir en événements calendrier
```

#### E. **Ajouter Vacances d'Été**
```typescript
const SUMMER_VACATION = {
  start: '2025-07-01',
  end: '2025-08-31',
  name: 'Vacances d\'été',
};
```

### 3. **Améliorer l'Interface**

#### A. **Remplacer le Dropdown par des Quickfilters**
- Supprimer le `<select>` actuel
- Ajouter une section de quickfilters avec badges
- Style similaire à `/dashboard/contacts-demo`

#### B. **Ajouter une Légende Visuelle**
- Afficher les couleurs et types d'événements
- Position: En bas du calendrier ou dans la sidebar

#### C. **Améliorer les Statistiques**
- Ajouter des statistiques pour:
  - Jours fériés
  - Anniversaires
  - Dates d'embauche
  - Événements

### 4. **Fonctionnalités Supplémentaires**

#### A. **Filtres Multiples**
- Permettre la sélection de plusieurs quickfilters simultanément
- Afficher l'intersection des événements

#### B. **Filtres par Employé**
- Ajouter un filtre pour voir uniquement les événements d'un employé spécifique
- Utile pour les vacances et anniversaires

#### C. **Filtres par Période**
- Cette semaine
- Ce mois
- Ce trimestre
- Cette année

#### D. **Recherche d'Événements**
- Barre de recherche pour trouver des événements par titre
- Filtrage en temps réel

---

## 📝 Checklist d'Amélioration

### Priorité Haute 🔴
- [ ] Ajouter des quickfilters visuels (remplacer le dropdown)
- [ ] Intégrer les jours fériés du Québec
- [ ] Intégrer les anniversaires des employés
- [ ] Intégrer les dates d'embauche
- [ ] Intégrer les événements généraux (agendaAPI)
- [ ] Ajouter les vacances d'été

### Priorité Moyenne 🟡
- [ ] Améliorer les statistiques (ajouter jours fériés, anniversaires, etc.)
- [ ] Ajouter une légende visuelle
- [ ] Améliorer le style des quickfilters (badges, icônes)
- [ ] Ajouter filtres par employé

### Priorité Basse 🟢
- [ ] Filtres multiples simultanés
- [ ] Filtres par période (semaine, trimestre, année)
- [ ] Barre de recherche d'événements
- [ ] Export du calendrier (PDF, CSV)

---

## 🔗 Références Techniques

### Fichiers à Modifier
1. `apps/web/src/app/[locale]/dashboard/calendrier/page.tsx`
   - Ajouter quickfilters
   - Intégrer données manquantes
   - Améliorer l'interface

### Fichiers de Référence
1. `apps/web/src/app/[locale]/dashboard/contacts-demo/page.tsx`
   - Exemple de quickfilters avec badges et compteurs

2. `apps/web/src/components/agenda/CalendarView.tsx`
   - Logique pour jours fériés, anniversaires, dates d'embauche
   - Fonction `getQuebecHolidays()`

3. `apps/web/src/app/[locale]/dashboard/agenda/calendrier/page.tsx`
   - Exemple d'implémentation complète avec tous les types d'événements

### APIs à Utiliser
1. `employeesAPI.list()` - Pour anniversaires et dates d'embauche
2. `agendaAPI.list()` - Pour événements généraux
3. `vacationRequestsAPI.list()` - Pour vacances (déjà utilisé)
4. `projectsAPI.list()` - Pour deadlines (déjà utilisé)
5. `timeEntriesAPI.list()` - Pour feuilles de temps (déjà utilisé)

---

## 📊 Résumé

### État Actuel
- ✅ Calendrier fonctionnel avec projets, deadlines, vacances, feuilles de temps
- ❌ Pas de quickfilters visuels
- ❌ Manque jours fériés, anniversaires, dates d'embauche, événements généraux
- ❌ Interface basique avec dropdown simple

### Objectif
- ✅ Quickfilters visuels avec badges et compteurs
- ✅ Tous les types d'événements présents
- ✅ Interface moderne et intuitive
- ✅ Statistiques complètes

### Complexité Estimée
- **Quickfilters:** Moyenne (2-3h)
- **Intégration données manquantes:** Moyenne (3-4h)
- **Amélioration interface:** Faible (1-2h)
- **Total:** ~6-9h de développement

---

**Fin du Rapport d'Audit**
