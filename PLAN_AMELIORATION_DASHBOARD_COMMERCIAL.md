# Plan d'Amélioration du Dashboard Commercial

## Analyse de l'Existant

### Problèmes identifiés

1. **Critère de priorité non optimal**
   - Actuellement : Top 3 opportunités par montant uniquement
   - Problème : Ne reflète pas les besoins réels (opportunités nécessitant une action)
   - Les opportunités avec montant élevé mais déjà traitées sont affichées en priorité

2. **Manque de contexte actionnable**
   - Pas d'indication sur l'état de chaque opportunité (soumission nécessaire, en attente, etc.)
   - Pas de lien direct entre opportunités et soumissions
   - Pas d'alerte sur les deadlines ou actions requises

3. **Statistiques peu utiles**
   - Statistiques globales sans filtrage contextuel
   - Pas de distinction entre opportunités actives/inactives
   - Pas de vue sur les opportunités à risque

## Objectifs de l'Amélioration

1. **Focus sur l'actionnable** : Afficher les opportunités nécessitant une action (soumission, suivi, etc.)
2. **Contextualisation** : Montrer l'état réel de chaque opportunité et les actions requises
3. **Visibilité sur les deadlines** : Mettre en avant les opportunités avec dates limites approchantes
4. **Meilleure segmentation** : Organiser les opportunités par priorité métier plutôt que par montant seul

## Propositions d'Amélioration

### 1. Section "Opportunités Nécessitant une Action" (PRIORITAIRE)

**Critères pour identifier ces opportunités :**
- Opportunités au statut `PROPOSAL` ou `QUALIFIED` sans soumission associée
- Opportunités avec `expected_close_date` dans les 30 prochains jours sans soumission
- Opportunités avec probabilité > 50% sans soumission
- Opportunités assignées à l'utilisateur actuel nécessitant un suivi

**Affichage :**
- Liste avec indication claire de l'action requise ("Soumission nécessaire", "Suivi requis", etc.)
- Badge de priorité basé sur la date limite
- Lien direct pour créer une soumission depuis l'opportunité
- Compteur d'opportunités nécessitant une action

**Code suggéré :**
```typescript
const opportunitiesNeedingAction = useMemo(() => {
  return opportunities
    .filter(opp => {
      // Opportunités qualifiées ou en proposition sans soumission
      const isProposalStage = opp.status === 'proposal' || opp.stage_name?.toLowerCase().includes('proposition');
      const hasNoSubmission = !submissions.some(s => s.company_id === opp.company_id);
      
      // Opportunités avec deadline proche (30 jours)
      const hasCloseDate = opp.expected_close_date;
      const isDeadlineNear = hasCloseDate && 
        new Date(opp.expected_close_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Opportunités avec haute probabilité
      const hasHighProbability = opp.probability && opp.probability > 50;
      
      return (isProposalStage || isDeadlineNear || hasHighProbability) && 
             !['won', 'lost', 'cancelled'].includes(opp.status?.toLowerCase() || '');
    })
    .sort((a, b) => {
      // Prioriser par date limite, puis par probabilité, puis par montant
      const dateA = a.expected_close_date ? new Date(a.expected_close_date).getTime() : Infinity;
      const dateB = b.expected_close_date ? new Date(b.expected_close_date).getTime() : Infinity;
      
      if (dateA !== dateB) return dateA - dateB;
      if (a.probability !== b.probability) return (b.probability || 0) - (a.probability || 0);
      return (b.amount || 0) - (a.amount || 0);
    })
    .slice(0, 5); // Top 5 opportunités nécessitant une action
}, [opportunities, submissions]);
```

### 2. Section "Opportunités à Suivre"

**Critères :**
- Opportunités en négociation
- Opportunités avec dernière activité > 7 jours
- Opportunités avec soumission soumise mais en attente de réponse

**Affichage :**
- Liste avec dernière date d'activité
- Indicateur de temps depuis dernière mise à jour
- Lien vers la soumission associée si disponible

### 3. Section "Opportunités à Fort Potentiel"

**Critères :**
- Score composite : (Montant × Probabilité) / 100
- Opportunités avec montant élevé ET probabilité > 60%
- Top 5 par valeur attendue (Expected Value)

**Affichage :**
- Valeur attendue affichée : `Montant × (Probabilité / 100)`
- Tri par valeur attendue décroissante
- Indication visuelle de la probabilité

### 4. Amélioration des Statistiques

**Nouveaux indicateurs :**
- Opportunités nécessitant une action (compteur avec badge d'alerte)
- Taux de conversion par stage
- Valeur du pipeline par stage
- Opportunités à risque (deadline proche, pas de soumission)
- Temps moyen par stage

**Réorganisation :**
- Cards avec icônes d'alerte pour les indicateurs critiques
- Tooltips explicatifs sur chaque statistique
- Lien vers la liste filtrée depuis chaque card

### 5. Widget "Actions Rapides Contextuelles"

**Au lieu d'actions génériques, afficher :**
- "Créer soumission pour [Nom Opportunité]" - directement depuis les opportunités prioritaires
- "Suivre [Nom Opportunité]" - pour les opportunités nécessitant un suivi
- "Créer devis pour [Nom Entreprise]" - basé sur les entreprises actives

### 6. Timeline des Deadlines

**Nouveau widget :**
- Vue calendrier compacte des deadlines d'opportunités
- Alertes visuelles pour deadlines dans 7 jours (rouge), 30 jours (orange)
- Clic sur une date pour voir les opportunités correspondantes

## Structure Proposée du Dashboard Amélioré

```
┌─────────────────────────────────────────────────────────┐
│  Hero Header (Dashboard Commercial)                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Statistiques Améliorées (6 cards)                      │
│  - Total Opportunités                                    │
│  - Nécessitant Action (ALERTE)                          │
│  - Valeur Pipeline                                       │
│  - Soumissions en Cours                                  │
│  - Taux Conversion                                       │
│  - Opportunités à Risque                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬───────────────────┐
│  Opportunités Nécessitant Action    │  Actions Rapides  │
│  (Section principale, 5 items max)  │  Contextuelles    │
│  - Badge d'action requise           │                   │
│  - Lien direct création soumission  │  Timeline         │
│  - Indicateur deadline              │  Deadlines        │
│                                     │  (Widget compact) │
├─────────────────────────────────────┴───────────────────┤
│  Opportunités à Suivre (3-5 items)                      │
│  - Dernière activité                                   │
│  - Statut négociation                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Opportunités à Fort Potentiel (3 items)                │
│  - Tri par valeur attendue                              │
│  - Montant × Probabilité                                │
└─────────────────────────────────────────────────────────┘
```

## Plan d'Implémentation

### Phase 1 : Critères d'Opportunités Prioritaires (URGENT)
- [ ] Implémenter la logique de détection des opportunités nécessitant une action
- [ ] Remplacer la section "Top Opportunities" par "Opportunités Nécessitant une Action"
- [ ] Ajouter les badges d'action et indicateurs de deadline
- [ ] Ajouter le compteur dans les statistiques

**Fichiers à modifier :**
- `apps/web/src/app/[locale]/dashboard/commercial/page.tsx`
- Peut nécessiter une requête API pour vérifier les soumissions associées

### Phase 2 : Amélioration des Statistiques
- [ ] Ajouter les nouveaux indicateurs
- [ ] Implémenter les calculs de taux de conversion
- [ ] Ajouter les badges d'alerte pour indicateurs critiques
- [ ] Créer des liens filtrés depuis les cards

### Phase 3 : Sections Additionnelles
- [ ] Section "Opportunités à Suivre"
- [ ] Section "Opportunités à Fort Potentiel"
- [ ] Widget Timeline des Deadlines

### Phase 4 : Actions Contextuelles
- [ ] Implémenter les actions rapides contextuelles
- [ ] Lien direct création soumission depuis opportunité
- [ ] Pré-remplir les formulaires avec les données de l'opportunité

## Questions à Résoudre

1. **Relation Opportunité-Soumission**
   - Actuellement, les soumissions n'ont pas de `opportunity_id`
   - Options :
     a) Ajouter un champ `opportunity_id` au modèle Submission
     b) Faire la correspondance via `company_id` (moins précis)
     c) Créer une table de liaison (plus complexe mais plus flexible)

2. **Définition "Soumission Nécessaire"**
   - Quels stages/statuts nécessitent une soumission ?
   - Y a-t-il une règle métier spécifique ?
   - Faut-il permettre de marquer manuellement une opportunité comme "nécessite soumission" ?

3. **Priorisation**
   - Faut-il permettre à l'utilisateur de personnaliser les critères de priorité ?
   - Ou utiliser des critères fixes basés sur les meilleures pratiques ?

## Recommandations

1. **Court terme (à implémenter rapidement)** :
   - Remplacer le critère "top 3 par montant" par "opportunités nécessitant une soumission"
   - Ajouter un compteur d'opportunités nécessitant une action dans les stats
   - Ajouter les indicateurs de deadline

2. **Moyen terme** :
   - Implémenter les sections additionnelles
   - Améliorer les statistiques
   - Ajouter la timeline des deadlines

3. **Long terme** :
   - Personnalisation des critères de priorité
   - Tableau de bord configurable par l'utilisateur
   - Notifications push pour opportunités critiques

## Métriques de Succès

- Réduction du temps pour identifier les opportunités nécessitant une action
- Augmentation du taux de création de soumissions depuis le dashboard
- Réduction des opportunités avec deadlines manquées
- Amélioration de la satisfaction utilisateur (feedback)
