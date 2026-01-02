# Plan de création de la page d'accueil du module Opération

## Objectif
Créer une page d'accueil intelligente et intéligible pour le module Opération qui offre une vue d'ensemble complète et actionnable des projets, tâches, équipes et clients. Cette page doit permettre aux utilisateurs de comprendre rapidement l'état de leurs opérations et d'identifier les actions prioritaires.

## Structure proposée

### 1. En-tête Hero (Section principale)
- **Titre**: "Module Opération" avec description
- **Statistiques clés en temps réel** (4 cartes principales):
  - **Projets actifs**: Nombre total de projets en cours avec indicateur de tendance
  - **Tâches en cours**: Nombre de tâches actives avec pourcentage de complétion
  - **Équipes actives**: Nombre d'équipes avec membres actifs
  - **Clients actifs**: Nombre de clients avec projets en cours

### 2. Section "Actions prioritaires" (Section intelligente)
- **Projets nécessitant une attention**:
  - Projets en retard (deadline dépassée)
  - Projets avec deadline dans les 7 prochains jours
  - Projets bloqués ou en pause nécessitant une action
  - Projets sans équipe assignée
- **Tâches urgentes**:
  - Tâches en retard
  - Tâches avec deadline dans les 3 prochains jours
  - Tâches bloquées ou nécessitant une validation
- **Alertes et notifications**:
  - Clients sans projet actif depuis X jours
  - Équipes surchargées (trop de tâches assignées)
  - Projets sans budget défini

### 3. Section "Vue d'ensemble des projets" (Section intelligente)
- **Répartition par statut**:
  - Actifs, Terminés, Archivés, En pause
  - Graphique en donut ou barres
- **Répartition par étape**:
  - Visualisation des projets par étape du pipeline
  - Indicateur de progression
- **Projets récents**:
  - Liste des 5-10 derniers projets créés/modifiés
  - Avec statut, client, équipe, et progression

### 4. Section "Performance et métriques" (Section intelligente)
- **Taux de complétion des projets**:
  - Pourcentage moyen de complétion
  - Projets les plus avancés
  - Projets nécessitant un suivi
- **Charge de travail par équipe**:
  - Nombre de tâches par équipe
  - Heures estimées vs réelles (si disponible)
  - Équipes surchargées ou sous-utilisées
- **Timeline des deadlines**:
  - Calendrier des deadlines à venir (30 prochains jours)
  - Indicateur visuel des deadlines critiques

### 5. Section "Activité récente" (Section informative)
- **Dernières modifications**:
  - Projets modifiés récemment
  - Tâches complétées
  - Nouvelles affectations d'équipes
- **Créations récentes**:
  - Nouveaux projets
  - Nouvelles tâches
  - Nouveaux clients

### 6. Section "Accès rapide" (Section navigation)
- **Cartes de navigation** vers les sous-modules:
  - **Projets**: Lien vers la liste des projets avec indicateur du nombre de projets actifs
  - **Tâches**: Lien vers la liste des tâches avec indicateur du nombre de tâches en cours
  - **Équipes**: Lien vers la liste des équipes avec indicateur du nombre d'équipes actives
  - **Clients**: Lien vers la liste des clients avec indicateur du nombre de clients actifs
- **Actions rapides**:
  - Bouton "Nouveau projet"
  - Bouton "Nouvelle tâche"
  - Bouton "Nouvelle équipe"
  - Bouton "Nouveau client"

### 7. Section "Graphiques et visualisations" (Section analytique)
- **Graphique de progression des projets**:
  - Évolution du nombre de projets par statut sur les 6 derniers mois
  - Graphique en ligne ou barres empilées
- **Répartition des projets par client**:
  - Top 5-10 clients avec le plus de projets
  - Graphique en barres horizontales
- **Répartition des tâches par priorité**:
  - Haute, Moyenne, Basse
  - Graphique en donut

## Phases d'implémentation

### Phase 1: Structure de base et statistiques (Estimation: 2-3 heures)
- **Créer la page**: `apps/web/src/app/[locale]/dashboard/projets/page.tsx`
- **En-tête Hero**: Implémenter l'en-tête avec le titre et la description
- **Cartes de statistiques**: Créer 4 cartes principales avec les statistiques clés
  - Utiliser les hooks existants (`useInfiniteProjects`, etc.)
  - Calculer les statistiques en temps réel
  - Ajouter des indicateurs de tendance si possible
- **Layout responsive**: S'assurer que le layout s'adapte aux différentes tailles d'écran

### Phase 2: Section "Actions prioritaires" (Estimation: 3-4 heures)
- **Projets nécessitant une attention**:
  - Filtrer les projets en retard, avec deadline proche, bloqués, sans équipe
  - Créer une liste avec badges de priorité (urgent, important, normal)
  - Ajouter des liens vers les projets concernés
- **Tâches urgentes**:
  - Filtrer les tâches en retard, avec deadline proche, bloquées
  - Créer une liste similaire avec priorités
  - Ajouter des liens vers les tâches concernées
- **Alertes et notifications**:
  - Détecter les situations problématiques (clients inactifs, équipes surchargées, etc.)
  - Afficher des alertes avec des recommandations d'action
- **Composants réutilisables**: Créer des composants pour les listes d'actions prioritaires

### Phase 3: Vue d'ensemble et métriques (Estimation: 2-3 heures)
- **Répartition par statut**:
  - Créer un graphique en donut ou barres pour les statuts
  - Utiliser une bibliothèque de graphiques (Recharts déjà utilisée dans le projet)
- **Répartition par étape**:
  - Visualiser les projets par étape
  - Ajouter un indicateur de progression
- **Projets récents**:
  - Afficher les 5-10 derniers projets
  - Inclure les informations essentielles (statut, client, équipe, progression)
- **Taux de complétion**:
  - Calculer le pourcentage moyen de complétion
  - Identifier les projets nécessitant un suivi

### Phase 4: Performance et charge de travail (Estimation: 2-3 heures)
- **Charge de travail par équipe**:
  - Calculer le nombre de tâches par équipe
  - Identifier les équipes surchargées ou sous-utilisées
  - Créer une visualisation (graphique en barres)
- **Timeline des deadlines**:
  - Créer un calendrier ou une timeline des deadlines à venir
  - Indicateur visuel des deadlines critiques (rouge pour urgent, orange pour proche)
- **Métriques de performance**:
  - Taux de complétion dans les temps
  - Délai moyen de complétion des projets
  - Taux de réussite des projets

### Phase 5: Activité récente et accès rapide (Estimation: 1-2 heures)
- **Activité récente**:
  - Afficher les dernières modifications (projets, tâches, équipes)
  - Afficher les créations récentes
  - Limiter à 10-15 éléments récents
- **Accès rapide**:
  - Créer des cartes de navigation vers les sous-modules
  - Ajouter des indicateurs (badges) avec le nombre d'éléments actifs
  - Ajouter des boutons d'actions rapides (créer projet, tâche, etc.)

### Phase 6: Graphiques et visualisations avancées (Estimation: 2-3 heures)
- **Graphique de progression**:
  - Évolution du nombre de projets par statut sur 6 mois
  - Utiliser Recharts pour créer un graphique en ligne ou barres empilées
- **Répartition par client**:
  - Top 5-10 clients avec le plus de projets
  - Graphique en barres horizontales
- **Répartition des tâches par priorité**:
  - Graphique en donut pour les priorités
- **Optimisation des performances**:
  - Utiliser `useMemo` pour les calculs coûteux
  - Implémenter le chargement progressif des données
  - Ajouter des états de chargement (skeletons)

### Phase 7: Backend API (si nécessaire) (Estimation: 2-3 heures)
- **Créer un endpoint de statistiques** (si les calculs sont trop lourds côté client):
  - `GET /v1/projects/dashboard/stats`
  - Retourner les statistiques agrégées (projets, tâches, équipes, clients)
  - Inclure les métriques de performance
  - Inclure les alertes et actions prioritaires
- **Optimiser les requêtes**:
  - Utiliser des requêtes SQL optimisées avec agrégations
  - Mettre en cache les statistiques si nécessaire

### Phase 8: Polish et améliorations UX (Estimation: 1-2 heures)
- **Animations**:
  - Ajouter des animations d'entrée pour les sections (MotionDiv)
  - Transitions fluides entre les états
- **États vides**:
  - Gérer les cas où il n'y a pas de données
  - Afficher des messages encourageants et des actions suggérées
- **Responsive design**:
  - S'assurer que tout est responsive sur mobile, tablette et desktop
  - Adapter les graphiques pour les petits écrans
- **Accessibilité**:
  - Ajouter les attributs ARIA nécessaires
  - S'assurer que la navigation au clavier fonctionne
  - Contraste des couleurs conforme WCAG

## Données nécessaires

### APIs existantes à utiliser:
- `useInfiniteProjects()` - Liste des projets
- `useInfiniteTasks()` ou équivalent - Liste des tâches
- APIs pour équipes et clients
- APIs de statistiques si disponibles

### Données à calculer:
- Nombre de projets par statut (ACTIVE, COMPLETED, ARCHIVED, ON_HOLD)
- Nombre de projets par étape
- Projets en retard (deadline < aujourd'hui)
- Projets avec deadline dans les 7 prochains jours
- Tâches en retard
- Tâches avec deadline dans les 3 prochains jours
- Charge de travail par équipe
- Taux de complétion moyen
- Activité récente (modifications, créations)

## Composants à créer/réutiliser

### Nouveaux composants:
- `OperationsDashboardStats.tsx` - Cartes de statistiques
- `PriorityActionsList.tsx` - Liste des actions prioritaires
- `ProjectsOverview.tsx` - Vue d'ensemble des projets
- `TeamWorkload.tsx` - Charge de travail par équipe
- `DeadlineTimeline.tsx` - Timeline des deadlines
- `RecentActivity.tsx` - Activité récente
- `QuickAccessCards.tsx` - Cartes d'accès rapide

### Composants existants à réutiliser:
- `Card` - Pour les cartes de statistiques
- `Badge` - Pour les badges de statut/priorité
- `Button` - Pour les actions
- `Loading` - Pour les états de chargement
- `MotionDiv` - Pour les animations
- Graphiques Recharts - Pour les visualisations

## Design et style

### Style cohérent avec le reste de l'application:
- Utiliser le système de design Nukleo existant
- Glassmorphism pour les cartes
- Couleurs de la palette Nukleo (#523DC9, etc.)
- Typographie Space Grotesk pour les titres
- Espacement cohérent avec les autres pages

### Layout:
- Grid responsive pour les sections
- Cartes avec ombres et bordures subtiles
- Espacement généreux entre les sections
- Hiérarchie visuelle claire

## Estimation totale: 13-21 heures

## Avantages de cette approche

1. **Vue d'ensemble complète**: Les utilisateurs voient immédiatement l'état de leurs opérations
2. **Actions prioritaires**: Identification rapide des éléments nécessitant une attention
3. **Navigation facilitée**: Accès rapide aux différentes sections du module
4. **Métriques intelligentes**: Données actionnables plutôt que juste des nombres
5. **Expérience utilisateur optimale**: Design moderne et responsive
6. **Performance**: Calculs optimisés et chargement progressif

## Notes importantes

- S'assurer que les calculs sont performants même avec beaucoup de données
- Implémenter le chargement progressif pour améliorer les temps de chargement initiaux
- Gérer les cas d'erreur et les états de chargement
- Tester avec différentes quantités de données (peu de projets vs beaucoup de projets)
- S'assurer que les données sont à jour en temps réel (refetch périodique si nécessaire)
