# 🔧 Corrections : Problèmes d'Automatisation

## 🔍 Problèmes Identifiés

### 1. Automatisation ne se déclenche pas (0 exécutions)

**Problèmes potentiels identifiés** :

1. **Détection du changement de stage** : La logique de détection du changement de stage pourrait ne pas fonctionner correctement si `stage_id` n'est pas explicitement dans `update_data`
2. **Matching des conditions** : La comparaison des noms de stage pourrait échouer si les formats ne correspondent pas exactement
3. **Logs insuffisants** : Pas assez de logs pour diagnostiquer pourquoi l'automatisation ne se déclenche pas

### 2. Affichage des statistiques et logs manquants

**Problème** : La page d'automatisation n'affiche pas le nombre d'exécutions avec un modal pour voir les logs détaillés.

## ✅ Corrections Apportées

### 1. Amélioration de la Détection du Changement de Stage

**Fichier** : `backend/app/api/v1/endpoints/commercial/opportunities.py`

**Changements** :
- ✅ Amélioration de la logique de détection du changement de stage
- ✅ Utilisation de `db.flush()` pour obtenir le `stage_id` mis à jour
- ✅ Ajout de logs de debug pour tracer les changements de stage

**Code modifié** :
```python
# Avant
new_stage_id = opportunity.stage_id if 'stage_id' in update_data else old_stage_id
stage_changed = old_stage_id != new_stage_id

# Après
if 'stage_id' in update_data:
    new_stage_id = update_data['stage_id']
else:
    await db.flush()  # Flush to get updated stage_id if it was set
    new_stage_id = opportunity.stage_id

stage_changed = old_stage_id != new_stage_id

if stage_changed:
    logger.info(f"Stage change detected for opportunity {opportunity.id}: {old_stage_id} -> {new_stage_id}")
```

### 2. Amélioration du Matching des Conditions

**Fichier** : `backend/app/services/automation_service.py`

**Changements** :
- ✅ Amélioration de la logique de comparaison des noms de stage
- ✅ Support pour matching exact ET substring
- ✅ Normalisation améliorée des noms de stage
- ✅ Logs de debug détaillés pour chaque étape de matching

**Code modifié** :
```python
# Avant
normalized_expected = ' '.join(expected_stage.lower().split())
normalized_stage = ' '.join(stage_name.lower().split())
stage_match = normalized_expected in normalized_stage

# Après
def normalize_stage_name(name: str) -> str:
    normalized = ' '.join(name.lower().split())
    return normalized

normalized_expected = normalize_stage_name(expected_stage)
normalized_stage = normalize_stage_name(stage_name)

# Try exact match first (case-insensitive)
stage_match_exact = normalized_expected == normalized_stage
# Then try substring match
stage_match_substring = normalized_expected in normalized_stage or normalized_stage in normalized_expected
stage_match = stage_match_exact or stage_match_substring
```

### 3. Ajout de Logs de Debug

**Fichier** : `backend/app/services/automation_service.py`

**Changements** :
- ✅ Ajout de logs pour chaque règle évaluée
- ✅ Logs détaillés pour le matching des conditions
- ✅ Logs pour le chargement des règles
- ✅ Logs pour les erreurs d'exécution

### 4. Affichage des Statistiques et Logs

**Fichier** : `apps/web/src/components/settings/AutomationRulesList.tsx`

**Changements** :
- ✅ Ajout d'un bouton "Voir les logs" pour chaque règle avec exécutions
- ✅ Création d'un modal `AutomationRuleLogsModal` pour afficher les logs
- ✅ Affichage des statistiques (total, réussies, échouées)
- ✅ Liste détaillée des logs avec statut, date, erreurs et données d'exécution

**Fichier** : `apps/web/src/lib/api/automation.ts`

**Changements** :
- ✅ Ajout de la fonction `getAutomationRuleLogs()` pour récupérer les logs
- ✅ Ajout de l'interface `AutomationRuleExecutionLog`

## 📊 Fonctionnalités Ajoutées

### Modal de Logs

Le modal affiche :
- **Statistiques** : Total, Réussies, Échouées
- **Liste des logs** avec :
  - Statut (succès/échec) avec icône
  - Date et heure d'exécution
  - Message d'erreur (si échec)
  - Détails d'exécution (expandable) avec les données contextuelles

### Amélioration de l'Affichage

- Le nombre d'exécutions est maintenant cliquable (bouton "Voir les logs")
- Le bouton n'apparaît que si `trigger_count > 0`
- Design cohérent avec le reste de l'interface

## 🔍 Diagnostic

### Comment vérifier pourquoi l'automatisation ne fonctionne pas

1. **Vérifier les logs backend** :
   - Chercher les logs avec `"Found X enabled automation rules"`
   - Vérifier les logs de matching : `"Stage condition not met"` ou `"Stage condition met"`
   - Vérifier les logs d'exécution : `"Executing automation rule"`

2. **Vérifier les conditions** :
   - Le pipeline doit s'appeler exactement "MAIN" (case-insensitive)
   - Le stage doit contenir "05-Proposal to do" (normalisé)
   - La règle doit être activée (`enabled = True`)

3. **Vérifier le déclenchement** :
   - Le changement de stage doit être détecté (`stage_changed = True`)
   - Les logs doivent montrer : `"Stage change detected"`

## 🚀 Prochaines Étapes pour Déboguer

1. **Tester manuellement** :
   - Déplacer une opportunité vers le stage "05-Proposal to do"
   - Vérifier les logs backend
   - Vérifier si une tâche est créée

2. **Vérifier les données** :
   - Vérifier le nom exact du pipeline dans la base de données
   - Vérifier le nom exact du stage dans la base de données
   - Comparer avec les conditions de la règle

3. **Vérifier l'employé** :
   - Vérifier que "Clément Roy" existe dans la table `employees`
   - Vérifier que l'employé a un email (nécessaire pour créer un user)

## 📝 Notes Techniques

- Les règles d'automatisation sont chargées pour TOUS les utilisateurs (pas de filtre par user_id dans le service)
- Cela permet aux admins de créer des règles globales
- Les logs sont sauvegardés même en cas d'échec pour faciliter le débogage
