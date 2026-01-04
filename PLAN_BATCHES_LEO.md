# Plan d'Implémentation Leo par Batch

## 📋 Structure des Batches

### Batch 1: Feuilles de Temps + Factures (Priorité Haute)
**Objectif**: Support TimeEntry et Invoice
- [ ] TimeEntry: Lazy import, mots-clés, fonction de récupération, formatage
- [ ] Invoice: Lazy import, mots-clés, fonction de récupération, formatage
- [ ] Détection temporelle basique ("ce mois", "cette semaine")
- [ ] Tests et validation

**Estimation**: 2-3 heures

---

### Batch 2: Devis + Événements Calendrier (Priorité Moyenne)
**Objectif**: Support Quote et CalendarEvent
- [ ] Quote: Lazy import, mots-clés, fonction de récupération, formatage
- [ ] CalendarEvent: Lazy import, mots-clés, fonction de récupération, formatage
- [ ] Détection temporelle avancée ("aujourd'hui", "demain", "l'année dernière")
- [ ] Tests et validation

**Estimation**: 2-3 heures

---

### Batch 3: Détection Améliorée (Priorité Moyenne)
**Objectif**: Améliorer la détection de requêtes
- [ ] Détection temporelle complète avec `_extract_time_range()`
- [ ] Détection de requêtes multiples (séparation par "et", "pour")
- [ ] Tolérance aux fautes améliorée (difflib, variations communes)
- [ ] Tests avec typos et requêtes complexes

**Estimation**: 2-3 heures

---

### Batch 4: Calculs Financiers (Priorité Moyenne)
**Objectif**: Prévisions de trésorerie et ratios
- [ ] Fonction `calculate_cash_flow_forecast()`
- [ ] Calculs de ratios (marge brute, taux de conversion)
- [ ] Intégration dans contexte pour questions financières
- [ ] Tests de prévisions

**Estimation**: 3-4 heures

---

### Batch 5: Optimisations Performance (Priorité Basse)
**Objectif**: Améliorer les performances
- [ ] Requêtes parallèles avec `asyncio.gather()`
- [ ] Limites adaptatives intelligentes
- [ ] Tests de performance

**Estimation**: 2-3 heures

---

### Batch 6: Améliorations UX (Priorité Basse)
**Objectif**: Améliorer l'expérience utilisateur
- [ ] Génération de tableaux markdown
- [ ] Suggestions d'actions
- [ ] Liens contextuels améliorés

**Estimation**: 2-3 heures

---

## 📊 Rapport de Progression

### Batch 1: ✅ TERMINÉ
- [x] TimeEntry
- [x] Invoice
- [x] Détection temporelle basique

### Batch 2: ✅ TERMINÉ
- [x] Quote
- [x] CalendarEvent
- [x] Détection temporelle avancée

### Batch 3: ⏳ En attente
- [ ] Détection améliorée

### Batch 4: ⏳ En attente
- [ ] Calculs financiers

### Batch 5: ⏳ En attente
- [ ] Optimisations

### Batch 6: ⏳ En attente
- [ ] Améliorations UX
