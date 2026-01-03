# Plan d'Amélioration Leo - Version 2.0

## 📊 État Actuel (Janvier 2025)

### ✅ Données Implémentées (Sprint 1 + Extensions)
- ✅ **Contacts** - Recherche, comptage, détails
- ✅ **Entreprises (Companies)** - Recherche, comptage, détails
- ✅ **Opportunités** - Recherche, comptage, filtrage par stage (Closed Won/Lost), totaux
- ✅ **Projets** - Recherche, comptage, détails
- ✅ **Employés** - Recherche, comptage, anniversaires, dates d'embauche
- ✅ **Pipelines** - Liste des pipelines de vente
- ✅ **Tâches (ProjectTask)** - Recherche, filtrage par statut, assignation
- ✅ **Demandes de vacances (VacationRequest)** - Filtrage par statut, dates
- ✅ **Comptes de dépenses (ExpenseAccount)** - Filtrage par statut, montants
- ✅ **Transactions** - Dépenses/revenus, totaux, filtrage par type

### ⚠️ Problèmes Identifiés et Corrigés
- ✅ **Tenant scoping** - Corrigé pour VacationRequest et ExpenseAccount (via Employee)
- ✅ **Filtrage statuts** - Amélioré pour vacances en attente
- ✅ **Closed Won/Lost** - Support ajouté avec calculs de totaux
- ✅ **Listing détaillé** - Amélioré pour répondre aux demandes "nomme", "liste"
- ✅ **Anniversaires/embauche** - Support ajouté dans contexte employés
- ✅ **Prompt système** - Instructions améliorées pour calculs et listing

### ❌ Données Manquantes (Priorité)
- ❌ **Feuilles de temps (TimeEntry)** - "combien d'heures travaillées ce mois?"
- ❌ **Factures (Invoice)** - "quelles factures sont en attente de paiement?"
- ❌ **Devis (Quote)** - "quels devis sont en attente de signature?"
- ❌ **Événements calendrier (CalendarEvent)** - "quels événements cette semaine?"
- ❌ **Soumissions (Submission)** - "quelles soumissions sont en cours?"

### 🔴 Problèmes Restants Identifiés

#### 1. Calculs Financiers Avancés
- ❌ **Prévisions de trésorerie** - "quand allons-nous manquer d'argent?"
- ❌ **Projections** - Calculs basés sur revenus/dépenses prévus
- ❌ **Ratios financiers** - Marges, rentabilité, etc.

#### 2. Détection de Requêtes
- ⚠️ **Typo tolerance** - Améliorable (ex: "combiend e cleint?" fonctionne mais peut être mieux)
- ⚠️ **Requêtes complexes** - "combien de ventes réussies pour combien d'argent?" (2 questions en 1)
- ⚠️ **Contexte temporel** - "ce mois", "cette semaine", "l'année dernière"

#### 3. Performance et Optimisation
- ⚠️ **Cache** - Pas encore implémenté
- ⚠️ **Limites adaptatives** - Partiellement implémenté
- ⚠️ **Requêtes parallèles** - Sérialisées actuellement

#### 4. Format de Réponse
- ⚠️ **Tableaux** - Leo ne génère pas de tableaux structurés
- ⚠️ **Graphiques** - Pas de suggestions de visualisations
- ⚠️ **Actions** - Pas de suggestions d'actions basées sur les données

---

## 🎯 Plan d'Amélioration - Sprint 2

### Phase 1: Compléter les Données Manquantes (Priorité Haute)

#### 1.1 Feuilles de Temps (TimeEntry) - PRIORITÉ HAUTE
**Objectif**: Répondre aux questions sur le temps travaillé

**Requêtes cibles**:
- "combien d'heures travaillées ce mois?"
- "qui a travaillé le plus cette semaine?"
- "combien d'heures sur le projet X?"

**Implémentation**:
```python
async def get_relevant_time_entries(
    self,
    user_id: int,
    query: str,
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    - Détection: "feuille de temps", "time entry", "heures", "temps travaillé"
    - Filtrage par: employé, projet, date (ce mois, cette semaine)
    - Agrégation: totaux par employé, par projet
    - Tenant scoping via Employee
    """
```

**Mots-clés**:
```python
time_entry_keywords = [
    "feuille de temps", "time entry", "time entries",
    "heures", "heures travaillées", "temps travaillé",
    "timesheet", "timesheets", "régie", "régies"
]
```

**Format de contexte**:
```
=== FEUILLES DE TEMPS ===
Total heures ce mois: 320h
Par employé:
- Jean Dupont: 80h (Projet A: 50h, Projet B: 30h)
- Marie Martin: 75h (Projet A: 75h)
...
```

#### 1.2 Factures (Invoice) - PRIORITÉ HAUTE
**Objectif**: Répondre aux questions sur les factures et paiements

**Requêtes cibles**:
- "quelles factures sont en attente de paiement?"
- "combien d'argent en factures impayées?"
- "quelle est la facture la plus élevée?"

**Implémentation**:
```python
async def get_relevant_invoices(
    self,
    user_id: int,
    query: str,
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    - Détection: "facture", "invoice", "facturation"
    - Filtrage par: statut (open, paid, void), client, montant
    - Calculs: totaux par statut, montants dus
    """
```

**Mots-clés**:
```python
invoice_keywords = [
    "facture", "factures", "invoice", "invoices",
    "facturation", "facturé", "facturée",
    "impayé", "impayée", "unpaid", "en attente de paiement"
]
```

**Format de contexte**:
```
=== FACTURES ===
Total: 45 factures
- Ouvertes (12): 45,000€
- Payées (30): 120,000€
- Annulées (3): 5,000€

Factures en attente (12):
- FACT-2025-001: 5,000€ - Client ABC - Échéance: 2025-01-15
...
```

#### 1.3 Devis (Quote) - PRIORITÉ MOYENNE
**Objectif**: Répondre aux questions sur les devis

**Requêtes cibles**:
- "quels devis sont en attente?"
- "combien de devis avons-nous envoyés ce mois?"
- "quel est le montant total des devis en attente?"

**Implémentation**:
```python
async def get_relevant_quotes(
    self,
    user_id: int,
    query: str,
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    - Détection: "devis", "quote", "quotation"
    - Filtrage par: statut (draft, sent, accepted, rejected), client
    - Calculs: totaux par statut
    """
```

#### 1.4 Événements Calendrier (CalendarEvent) - PRIORITÉ MOYENNE
**Objectif**: Répondre aux questions sur les événements

**Requêtes cibles**:
- "quels événements cette semaine?"
- "qui a un rendez-vous demain?"
- "quels sont les prochains événements?"

**Implémentation**:
```python
async def get_relevant_calendar_events(
    self,
    user_id: int,
    query: str,
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    - Détection: "événement", "event", "calendrier", "rendez-vous", "meeting"
    - Filtrage par: date (aujourd'hui, demain, cette semaine), participant
    - Tri: par date croissante
    """
```

---

### Phase 2: Améliorer la Détection et l'Analyse (Priorité Moyenne)

#### 2.1 Détection Temporelle
**Objectif**: Comprendre les références temporelles

**Exemples**:
- "ce mois" → `datetime.now().replace(day=1)` à `datetime.now()`
- "cette semaine" → lundi de cette semaine à dimanche
- "l'année dernière" → année précédente
- "le mois dernier" → mois précédent

**Implémentation**:
```python
def _extract_time_range(self, query: str) -> Optional[Tuple[datetime, datetime]]:
    """
    Extrait une plage de dates de la requête
    Retourne (start_date, end_date) ou None
    """
    query_lower = query.lower()
    
    if "ce mois" in query_lower or "this month" in query_lower:
        now = datetime.now()
        start = now.replace(day=1, hour=0, minute=0, second=0)
        end = now
        return (start, end)
    
    # ... autres patterns
```

#### 2.2 Détection de Requêtes Multiples
**Objectif**: Détecter et traiter plusieurs questions en une

**Exemples**:
- "combien de ventes réussies pour combien d'argent?" → 2 questions
- "qui sont mes employés et combien de projets avons-nous?" → 2 questions

**Stratégie**:
1. Détecter les connecteurs ("et", "pour", "ainsi que")
2. Séparer en sous-requêtes
3. Traiter chaque sous-requête
4. Combiner les résultats

#### 2.3 Amélioration Tolérance aux Fautes
**Objectif**: Meilleure détection malgré les typos

**Stratégie**:
- Utiliser `difflib.SequenceMatcher` pour similarité
- Liste de variations communes (ex: "proejt" → "projet")
- Distance de Levenshtein pour mots-clés

---

### Phase 3: Calculs Financiers Avancés (Priorité Moyenne)

#### 3.1 Prévisions de Trésorerie
**Objectif**: Répondre à "quand allons-nous manquer d'argent?"

**Approche**:
1. Calculer le solde actuel (revenus - dépenses)
2. Projeter les revenus futurs (factures à recevoir, opportunités)
3. Projeter les dépenses futures (factures à payer, salaires)
4. Calculer le point de rupture

**Implémentation**:
```python
async def calculate_cash_flow_forecast(
    self,
    user_id: int,
    months_ahead: int = 6
) -> Dict[str, Any]:
    """
    Calcule les prévisions de trésorerie
    
    Retourne:
    {
        "current_balance": float,
        "monthly_projections": [
            {"month": "2025-01", "income": float, "expenses": float, "balance": float}
        ],
        "break_even_date": Optional[datetime],
        "risk_level": "low" | "medium" | "high"
    }
    """
```

#### 3.2 Ratios et Métriques Financières
**Objectif**: Calculer marges, rentabilité, etc.

**Métriques**:
- Marge brute = (Revenus - Coûts directs) / Revenus
- Taux de conversion = Opportunités gagnées / Opportunités totales
- Temps moyen de paiement = Moyenne des délais de paiement

---

### Phase 4: Optimisations et Performance (Priorité Basse)

#### 4.1 Système de Cache
**Objectif**: Réduire les temps de réponse

**Stratégie**:
- Cache Redis pour requêtes fréquentes
- TTL: 5 minutes pour données dynamiques, 1 heure pour données statiques
- Invalidation: lors de modifications (via webhooks ou polling)

**Implémentation**:
```python
from functools import lru_cache
import redis
import hashlib
import json

class LeoContextCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 300  # 5 minutes
    
    def get_cache_key(self, user_id: int, query: str) -> str:
        """Génère une clé de cache unique"""
        query_hash = hashlib.md5(query.encode()).hexdigest()
        return f"leo:context:{user_id}:{query_hash}"
    
    async def get(self, key: str) -> Optional[str]:
        """Récupère du cache"""
        return await self.redis.get(key)
    
    async def set(self, key: str, value: str):
        """Met en cache"""
        await self.redis.setex(key, self.ttl, value)
```

#### 4.2 Requêtes Parallèles
**Objectif**: Réduire le temps total de récupération

**Stratégie**:
- Utiliser `asyncio.gather()` pour exécuter plusieurs requêtes en parallèle
- Limiter le nombre de requêtes parallèles (max 5-10)

**Implémentation**:
```python
async def get_relevant_data(self, user_id: int, query: str) -> Dict[str, Any]:
    """Récupère toutes les données pertinentes en parallèle"""
    data_types = self.analyze_query(query)
    
    # Préparer toutes les coroutines
    tasks = []
    if data_types.get("contacts"):
        tasks.append(("contacts", self.get_relevant_contacts(user_id, query)))
    if data_types.get("companies"):
        tasks.append(("companies", self.get_relevant_companies(user_id, query)))
    # ... etc
    
    # Exécuter en parallèle
    results = await asyncio.gather(*[task[1] for task in tasks], return_exceptions=True)
    
    # Assembler les résultats
    data = {}
    for (key, _), result in zip(tasks, results):
        if isinstance(result, Exception):
            logger.error(f"Error fetching {key}: {result}")
            data[key] = []
        else:
            data[key] = result
    
    return data
```

#### 4.3 Limites Adaptatives Intelligentes
**Objectif**: Optimiser le nombre de résultats selon le contexte

**Stratégie**:
- Requêtes de comptage: limite élevée (500+)
- Requêtes de listing: limite modérée (20-50)
- Requêtes de recherche: limite faible (10-20)
- Détection automatique du type de requête

---

### Phase 5: Amélioration UX et Format de Réponse (Priorité Basse)

#### 5.1 Génération de Tableaux
**Objectif**: Leo peut suggérer des tableaux structurés

**Approche**:
- Détecter quand une réponse serait mieux en tableau
- Générer du markdown table
- Exemple: "liste des employés" → tableau avec colonnes Nom, Email, Équipe

#### 5.2 Suggestions d'Actions
**Objectif**: Proposer des actions basées sur les données

**Exemples**:
- "Vous avez 5 factures en retard" → "Souhaitez-vous envoyer des rappels?"
- "3 demandes de vacances en attente" → "Voulez-vous les examiner?"

#### 5.3 Liens Contextuels Améliorés
**Objectif**: Générer des liens plus pertinents

**Stratégie**:
- Liens vers pages spécifiques avec filtres
- Exemple: "Voir les factures en attente" → `/dashboard/factures?status=open`

---

## 📋 Checklist d'Implémentation Sprint 2

### Phase 1: Données Manquantes
- [ ] **TimeEntry**
  - [ ] Lazy import `_get_time_entry_model()`
  - [ ] Mots-clés dans `analyze_query()`
  - [ ] Implémenter `get_relevant_time_entries()`
  - [ ] Détection temporelle (ce mois, cette semaine)
  - [ ] Agrégation par employé/projet
  - [ ] Intégration dans `get_relevant_data()` et `build_context_string()`
  - [ ] Tests: "combien d'heures travaillées ce mois?"

- [ ] **Invoice**
  - [ ] Lazy import `_get_invoice_model()`
  - [ ] Mots-clés dans `analyze_query()`
  - [ ] Implémenter `get_relevant_invoices()`
  - [ ] Filtrage par statut (open, paid, void)
  - [ ] Calculs totaux par statut
  - [ ] Intégration complète
  - [ ] Tests: "quelles factures sont en attente?"

- [ ] **Quote**
  - [ ] Lazy import `_get_quote_model()`
  - [ ] Mots-clés dans `analyze_query()`
  - [ ] Implémenter `get_relevant_quotes()`
  - [ ] Filtrage par statut
  - [ ] Intégration complète
  - [ ] Tests: "quels devis sont en attente?"

- [ ] **CalendarEvent**
  - [ ] Lazy import `_get_calendar_event_model()`
  - [ ] Mots-clés dans `analyze_query()`
  - [ ] Implémenter `get_relevant_calendar_events()`
  - [ ] Détection temporelle (aujourd'hui, demain, cette semaine)
  - [ ] Intégration complète
  - [ ] Tests: "quels événements cette semaine?"

### Phase 2: Détection Améliorée
- [ ] **Détection temporelle**
  - [ ] Fonction `_extract_time_range()`
  - [ ] Patterns: "ce mois", "cette semaine", "l'année dernière"
  - [ ] Intégration dans toutes les fonctions de récupération

- [ ] **Requêtes multiples**
  - [ ] Détection de connecteurs
  - [ ] Séparation en sous-requêtes
  - [ ] Combinaison des résultats

- [ ] **Tolérance aux fautes**
  - [ ] Utilisation de `difflib` pour similarité
  - [ ] Liste de variations communes
  - [ ] Tests avec typos

### Phase 3: Calculs Financiers
- [ ] **Prévisions de trésorerie**
  - [ ] Calcul solde actuel
  - [ ] Projection revenus futurs
  - [ ] Projection dépenses futures
  - [ ] Calcul point de rupture
  - [ ] Intégration dans contexte

- [ ] **Ratios financiers**
  - [ ] Marge brute
  - [ ] Taux de conversion
  - [ ] Temps moyen de paiement

### Phase 4: Optimisations
- [ ] **Cache**
  - [ ] Intégration Redis
  - [ ] Clés de cache uniques
  - [ ] TTL adaptatif
  - [ ] Invalidation

- [ ] **Requêtes parallèles**
  - [ ] Refactoring `get_relevant_data()` avec `asyncio.gather()`
  - [ ] Limite de parallélisme
  - [ ] Gestion d'erreurs

- [ ] **Limites adaptatives**
  - [ ] Détection type de requête
  - [ ] Ajustement automatique des limites

### Phase 5: UX
- [ ] **Tableaux markdown**
  - [ ] Détection besoin de tableau
  - [ ] Génération markdown table

- [ ] **Suggestions d'actions**
  - [ ] Détection opportunités d'action
  - [ ] Génération suggestions

- [ ] **Liens contextuels**
  - [ ] Génération liens avec filtres
  - [ ] Intégration dans réponses

---

## 🚀 Plan d'Exécution Recommandé

### Sprint 2.1 (Immédiat - 1-2 semaines)
1. ✅ Implémenter TimeEntry
2. ✅ Implémenter Invoice
3. ✅ Améliorer détection temporelle

### Sprint 2.2 (Court terme - 2-3 semaines)
4. ✅ Implémenter Quote
5. ✅ Implémenter CalendarEvent
6. ✅ Améliorer tolérance aux fautes

### Sprint 2.3 (Moyen terme - 3-4 semaines)
7. ✅ Prévisions de trésorerie
8. ✅ Ratios financiers
9. ✅ Requêtes parallèles

### Sprint 2.4 (Long terme - 4+ semaines)
10. ✅ Système de cache
11. ✅ Améliorations UX (tableaux, actions)
12. ✅ Optimisations finales

---

## 📊 Métriques de Succès Sprint 2

- ✅ **Couverture données**: 100% des entités principales supportées
- ✅ **Précision**: 95%+ de réponses correctes
- ✅ **Performance**: Temps de réponse < 1.5 secondes (avec cache)
- ✅ **Détection**: 90%+ de requêtes correctement détectées (même avec typos)
- ✅ **Calculs**: Prévisions de trésorerie précises à ±5%
- ✅ **UX**: Réponses structurées et actionnables

---

## 🔄 Améliorations Continues

### Monitoring
- Logs détaillés de toutes les requêtes
- Métriques de performance (temps, cache hit rate)
- Taux d'erreur par type de requête
- Feedback utilisateur

### Itérations
- Ajuster les mots-clés basés sur l'usage réel
- Optimiser les limites selon les patterns
- Améliorer la détection basée sur les échecs
- Ajouter de nouvelles entités selon les besoins

---

## 📝 Notes Techniques

### Tenant Scoping
- **Règle**: TOUTES les requêtes doivent utiliser `scope_query()`
- **Exception**: Models sans `team_id` doivent scoper via relation (ex: Employee)

### Lazy Imports
- **Règle**: TOUS les imports de modèles doivent être lazy pour éviter MetaData conflicts
- **Pattern**: Fonctions `_get_X_model()` qui retournent le modèle ou None

### Format de Contexte
- **Règle**: Toujours inclure compteurs dans les en-têtes
- **Règle**: Grouper par statut quand pertinent
- **Règle**: Limiter le nombre d'éléments détaillés (max 20 pour listing)

### Gestion d'Erreurs
- **Règle**: Jamais faire échouer toute la requête si un module échoue
- **Pattern**: Try/except par fonction, retourner liste vide en cas d'erreur
