# Plan : Accès de Leo aux Données ERP

## 📋 Vue d'ensemble

Donner accès à Leo à toutes les informations de l'ERP (contacts, entreprises, opportunités, projets, etc.) pour qu'il puisse répondre aux questions des utilisateurs en se basant sur les données réelles de l'application.

---

## 🎯 Objectifs

1. **Accès aux données** : Leo doit pouvoir accéder aux données de l'ERP selon les permissions de l'utilisateur
2. **Réponses contextuelles** : Leo doit pouvoir répondre aux questions en utilisant les données réelles
3. **Performance** : Les requêtes doivent être rapides et ne pas surcharger le système
4. **Sécurité** : Respecter les permissions utilisateur (un utilisateur ne doit voir que ce qu'il a le droit de voir)
5. **Intelligence** : Leo doit comprendre les questions et récupérer les bonnes données

---

## 🏗️ Architecture

### Approche : RAG (Retrieval-Augmented Generation) avec Context Builder

L'approche choisie est de :
1. Analyser la question de l'utilisateur pour déterminer quelles données sont pertinentes
2. Récupérer ces données depuis la base de données (avec respect des permissions)
3. Formater les données en contexte lisible
4. Inclure ce contexte dans le system prompt ou dans les messages

### Avantages de cette approche :
- ✅ Simple à implémenter
- ✅ Pas besoin de vector database
- ✅ Contrôle total sur les données récupérées
- ✅ Respect des permissions existantes
- ✅ Facile à déboguer et maintenir

---

## 📊 Données à rendre accessibles

### 1. Contacts (`contacts`)
- Nom, prénom, email, téléphone
- Entreprise associée
- Position, cercle (client, prospect, etc.)
- Ville, pays
- Date de naissance
- Employé responsable

### 2. Entreprises (`companies`)
- Nom, description
- Site web, email, téléphone
- Adresse, ville, pays
- Logo
- Statut client
- Entreprise parente
- Réseaux sociaux

### 3. Opportunités (`opportunites`)
- Nom, description
- Montant, probabilité
- Statut, étape du pipeline
- Entreprise associée
- Contacts associés
- Date de création, date de clôture prévue

### 4. Projets (`projects`)
- Nom, description
- Statut (actif, archivé, complété)
- Client associé
- Responsable
- Budget
- Dates (début, fin prévue)
- Équipe, étape

### 5. Tâches de projet (`project_tasks`)
- Titre, description
- Statut, priorité
- Projet associé
- Assigné à
- Dates (échéance)

### 6. Factures (`invoices`)
- Numéro, montant
- Statut (brouillon, envoyée, payée)
- Client
- Date d'émission, date d'échéance

### 7. Événements (`events`)
- Titre, description
- Date, heure
- Type d'événement
- Participants

### 8. Employés (`employees`)
- Nom, prénom, email
- Poste, département
- Équipe

---

## 🔧 Implémentation

### Phase 1 : Service de Context Builder

#### 1.1 Créer `LeoContextService`

**Fichier** : `backend/app/services/leo_context_service.py`

```python
class LeoContextService:
    """Service pour construire le contexte ERP pour Leo"""
    
    async def analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyse la question pour déterminer quelles données récupérer"""
        # Retourne un dict avec les types de données à récupérer
        # Ex: {"contacts": True, "companies": True, "projects": False}
    
    async def get_relevant_data(
        self, 
        user_id: int, 
        data_types: Dict[str, bool],
        query: str
    ) -> Dict[str, List[Dict]]:
        """Récupère les données pertinentes selon les permissions utilisateur"""
        # Retourne un dict avec les données formatées
        # Ex: {"contacts": [...], "companies": [...]}
    
    async def build_context_string(
        self, 
        data: Dict[str, List[Dict]],
        query: str
    ) -> str:
        """Formate les données en chaîne de contexte lisible"""
        # Retourne une chaîne formatée avec toutes les données pertinentes
```

#### 1.2 Méthodes de récupération de données

Pour chaque type de données, créer une méthode qui :
- Respecte les permissions utilisateur
- Filtre les données pertinentes selon la question
- Limite le nombre de résultats (ex: max 20 par type)
- Formate les données de manière lisible

**Exemple pour les contacts** :
```python
async def get_relevant_contacts(
    self, 
    user_id: int, 
    query: str,
    limit: int = 20
) -> List[Dict]:
    """Récupère les contacts pertinents"""
    # 1. Analyser la query pour extraire des mots-clés
    # 2. Faire une recherche dans la base de données
    # 3. Respecter les permissions (via RBAC si nécessaire)
    # 4. Formater les résultats
    # 5. Retourner la liste limitée
```

### Phase 2 : Intégration avec Leo

#### 2.1 Modifier `LeoSettingsService.build_system_prompt()`

Ajouter une section dans le system prompt qui explique à Leo qu'il a accès aux données ERP :

```python
async def build_system_prompt(self, user_id: int, include_data_context: bool = False) -> str:
    # ... code existant ...
    
    if include_data_context:
        base_prompt += """
        
Tu as accès aux données de l'ERP Nukleo. Tu peux répondre aux questions sur :
- Les contacts et leurs informations
- Les entreprises et leurs détails
- Les opportunités commerciales
- Les projets en cours et terminés
- Les factures et leur statut
- Les événements du calendrier
- Les employés et leurs rôles

Quand un utilisateur te pose une question sur ces données, utilise les informations fournies dans le contexte pour répondre précisément.
"""
```

#### 2.2 Modifier le endpoint `/v1/ai/chat`

**Fichier** : `backend/app/api/ai.py`

```python
@router.post("/chat", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # ... code existant pour Leo settings ...
    
    # Nouveau : Récupérer le contexte ERP si nécessaire
    try:
        from app.services.leo_context_service import LeoContextService
        
        context_service = LeoContextService(db)
        
        # Analyser la dernière question de l'utilisateur
        last_user_message = None
        for msg in reversed(request.messages):
            if msg.role == "user":
                last_user_message = msg.content
                break
        
        if last_user_message:
            # Déterminer quelles données sont pertinentes
            data_types = await context_service.analyze_query(last_user_message)
            
            # Récupérer les données pertinentes
            relevant_data = await context_service.get_relevant_data(
                current_user.id,
                data_types,
                last_user_message
            )
            
            # Construire le contexte
            context_string = await context_service.build_context_string(
                relevant_data,
                last_user_message
            )
            
            # Ajouter le contexte au system prompt ou comme message système
            if context_string:
                # Option 1: Ajouter au system prompt
                system_prompt += f"\n\n=== DONNÉES ERP DISPONIBLES ===\n{context_string}\n=== FIN DES DONNÉES ===\n"
                
                # Option 2: Ajouter comme message système (recommandé)
                messages.insert(0, {
                    "role": "system",
                    "content": f"Contexte ERP:\n{context_string}"
                })
    except Exception as e:
        logger.warning(f"Could not load ERP context: {e}")
        # Continuer sans contexte si erreur
```

### Phase 3 : Analyse intelligente des questions

#### 3.1 Créer un système d'analyse de requête

**Méthode 1 : Analyse par mots-clés (simple)**
```python
def analyze_query_simple(query: str) -> Dict[str, bool]:
    """Analyse simple basée sur des mots-clés"""
    query_lower = query.lower()
    
    return {
        "contacts": any(word in query_lower for word in ["contact", "personne", "client", "prospect"]),
        "companies": any(word in query_lower for word in ["entreprise", "company", "société", "client"]),
        "opportunities": any(word in query_lower for word in ["opportunité", "deal", "affaire", "vente"]),
        "projects": any(word in query_lower for word in ["projet", "project"]),
        "invoices": any(word in query_lower for word in ["facture", "invoice", "facturation"]),
        "events": any(word in query_lower for word in ["événement", "event", "rdv", "réunion"]),
        "employees": any(word in query_lower for word in ["employé", "employee", "collègue", "équipe"]),
    }
```

**Méthode 2 : Utiliser l'IA pour analyser (plus intelligent)**
```python
async def analyze_query_with_ai(query: str) -> Dict[str, bool]:
    """Utilise l'IA pour analyser la question et déterminer les données pertinentes"""
    # Appel à l'IA pour analyser la question
    # Retourne un dict avec les types de données pertinentes
```

### Phase 4 : Récupération et formatage des données

#### 4.1 Créer des méthodes de récupération pour chaque type

**Exemple pour les contacts** :
```python
async def get_relevant_contacts(
    self,
    user_id: int,
    query: str,
    limit: int = 20
) -> List[Dict]:
    """Récupère les contacts pertinents"""
    from app.models.contact import Contact
    from sqlalchemy import select, or_, func
    
    # Extraire des mots-clés de la query
    keywords = self._extract_keywords(query)
    
    # Construire la requête
    stmt = select(Contact)
    
    # Filtrer par mots-clés (nom, prénom, email, entreprise)
    if keywords:
        conditions = []
        for keyword in keywords:
            conditions.extend([
                Contact.first_name.ilike(f"%{keyword}%"),
                Contact.last_name.ilike(f"%{keyword}%"),
                Contact.email.ilike(f"%{keyword}%"),
            ])
        stmt = stmt.where(or_(*conditions))
    
    # Limiter les résultats
    stmt = stmt.limit(limit)
    
    # Exécuter
    result = await self.db.execute(stmt)
    contacts = result.scalars().all()
    
    # Formater les résultats
    formatted = []
    for contact in contacts:
        formatted.append({
            "id": contact.id,
            "nom_complet": f"{contact.first_name} {contact.last_name}",
            "email": contact.email,
            "telephone": contact.phone,
            "position": contact.position,
            "entreprise": contact.company.name if contact.company else None,
            "ville": contact.city,
            "pays": contact.country,
        })
    
    return formatted
```

#### 4.2 Formatage du contexte

```python
async def build_context_string(
    self,
    data: Dict[str, List[Dict]],
    query: str
) -> str:
    """Formate les données en contexte lisible"""
    context_parts = []
    
    if data.get("contacts"):
        context_parts.append("=== CONTACTS ===")
        for contact in data["contacts"][:10]:  # Limiter à 10
            context_parts.append(
                f"- {contact['nom_complet']} ({contact['email']})"
                f" - {contact['position']} chez {contact['entreprise'] or 'N/A'}"
            )
        context_parts.append("")
    
    if data.get("companies"):
        context_parts.append("=== ENTREPRISES ===")
        for company in data["companies"][:10]:
            context_parts.append(
                f"- {company['name']} - {company['city']}, {company['country']}"
                f" - {'Client' if company['is_client'] else 'Prospect'}"
            )
        context_parts.append("")
    
    # ... autres types de données ...
    
    return "\n".join(context_parts)
```

---

## 🔒 Sécurité et Permissions

### Respect des permissions utilisateur

1. **Utiliser les services existants** : Utiliser les services qui respectent déjà les permissions (ex: `ContactService`, `CompanyService`)

2. **RBAC** : Vérifier les permissions via le système RBAC existant

3. **Filtrage par utilisateur** : Si les données sont liées à un utilisateur, filtrer par `user_id` ou `employee_id`

4. **Limites** : Limiter le nombre de résultats pour éviter de surcharger le contexte

### Exemple de vérification de permissions

```python
async def get_relevant_contacts_with_permissions(
    self,
    user_id: int,
    query: str
) -> List[Dict]:
    """Récupère les contacts avec vérification des permissions"""
    from app.services.rbac_service import RBACService
    
    rbac_service = RBACService(self.db)
    
    # Vérifier si l'utilisateur a la permission de voir les contacts
    can_view_contacts = await rbac_service.has_permission(
        user_id,
        "contacts:read"
    )
    
    if not can_view_contacts:
        return []
    
    # Récupérer les contacts (le service respecte déjà les permissions)
    # ...
```

---

## 📝 Structure des fichiers

### Backend

```
backend/app/
├── services/
│   ├── leo_context_service.py          # Nouveau : Service de contexte ERP
│   └── leo_settings_service.py         # Existant (modifier)
├── api/
│   └── ai.py                           # Modifier pour intégrer le contexte
└── models/                             # Existant (utiliser)
    ├── contact.py
    ├── company.py
    ├── project.py
    └── ...
```

### Frontend

Aucune modification nécessaire côté frontend. Le système fonctionne automatiquement.

---

## 🚀 Plan d'implémentation

### Phase 1 : Service de contexte (Base)
1. Créer `LeoContextService` avec méthode `analyze_query()` simple (mots-clés)
2. Créer méthode `get_relevant_contacts()` avec récupération basique
3. Créer méthode `build_context_string()` pour formater les contacts
4. Tester avec des questions simples sur les contacts

### Phase 2 : Intégration avec Leo
1. Modifier `build_system_prompt()` pour inclure la mention des données ERP
2. Modifier `/v1/ai/chat` pour récupérer et inclure le contexte
3. Tester avec des questions sur les contacts

### Phase 3 : Ajouter d'autres types de données
1. Ajouter `get_relevant_companies()`
2. Ajouter `get_relevant_opportunities()`
3. Ajouter `get_relevant_projects()`
4. Mettre à jour `build_context_string()` pour inclure tous les types
5. Tester avec des questions variées

### Phase 4 : Amélioration de l'analyse
1. Améliorer `analyze_query()` pour être plus intelligent
2. Optionnel : Utiliser l'IA pour analyser les questions
3. Ajouter la gestion des questions complexes (ex: "combien de clients avons-nous ?")

### Phase 5 : Optimisation et sécurité
1. Ajouter la vérification des permissions
2. Optimiser les requêtes (index, limites)
3. Ajouter la mise en cache si nécessaire
4. Tests de performance

### Phase 6 : Types de données supplémentaires
1. Ajouter les factures
2. Ajouter les événements
3. Ajouter les employés
4. Ajouter les tâches de projet

---

## 🎯 Exemples d'utilisation

### Exemple 1 : Question sur les contacts
**Question utilisateur** : "Quels sont mes contacts à Paris ?"

**Processus** :
1. `analyze_query()` détecte : `{"contacts": True, "companies": False, ...}`
2. `get_relevant_contacts()` récupère les contacts avec `city = "Paris"`
3. `build_context_string()` formate les résultats
4. Le contexte est ajouté au prompt
5. Leo répond avec les contacts réels

### Exemple 2 : Question sur les projets
**Question utilisateur** : "Quels projets sont en cours ?"

**Processus** :
1. `analyze_query()` détecte : `{"projects": True, ...}`
2. `get_relevant_projects()` récupère les projets avec `status = "active"`
3. `build_context_string()` formate les résultats
4. Leo répond avec la liste des projets actifs

### Exemple 3 : Question complexe
**Question utilisateur** : "Combien de clients avons-nous à Montréal ?"

**Processus** :
1. `analyze_query()` détecte : `{"companies": True, ...}`
2. `get_relevant_companies()` récupère les entreprises avec `is_client = True` et `city = "Montréal"`
3. `build_context_string()` formate les résultats avec le count
4. Leo répond : "Vous avez X clients à Montréal : [liste]"

---

## ⚙️ Configuration

### Paramètres dans `LeoSettingsService`

Ajouter des paramètres pour contrôler l'accès aux données :

```python
DEFAULT_SETTINGS = {
    # ... paramètres existants ...
    "enable_erp_context": True,  # Activer/désactiver l'accès aux données ERP
    "max_context_items": 20,  # Nombre maximum d'items par type de données
    "include_all_data_types": True,  # Inclure tous les types ou seulement ceux pertinents
}
```

### Limites de performance

- **Max items par type** : 20 (configurable)
- **Max types de données** : Tous ceux détectés comme pertinents
- **Taille max du contexte** : ~2000 tokens (à ajuster selon le modèle)

---

## 🧪 Tests

### Tests unitaires
- Test `analyze_query()` avec différentes questions
- Test `get_relevant_contacts()` avec différents filtres
- Test `build_context_string()` avec différents types de données

### Tests d'intégration
- Test du flux complet : question → contexte → réponse
- Test des permissions (un utilisateur ne voit que ses données)
- Test de performance avec beaucoup de données

### Tests manuels
- Poser des questions variées à Leo
- Vérifier que les réponses sont basées sur les vraies données
- Vérifier que les permissions sont respectées

---

## 📋 Checklist de validation

- [ ] Le service `LeoContextService` est créé
- [ ] L'analyse de requête fonctionne correctement
- [ ] La récupération des contacts fonctionne
- [ ] La récupération des entreprises fonctionne
- [ ] La récupération des opportunités fonctionne
- [ ] La récupération des projets fonctionne
- [ ] Le formatage du contexte est lisible
- [ ] L'intégration avec `/v1/ai/chat` fonctionne
- [ ] Les permissions sont respectées
- [ ] Les performances sont acceptables
- [ ] Les tests passent
- [ ] La documentation est à jour

---

## 🔮 Évolutions futures

1. **Vector Search** : Utiliser des embeddings pour une recherche plus intelligente
2. **Cache** : Mettre en cache les résultats fréquents
3. **Analytics** : Tracker quelles données sont les plus utilisées
4. **Suggestions** : Suggérer des questions pertinentes à l'utilisateur
5. **GraphQL-like queries** : Permettre à Leo de faire des requêtes complexes
6. **Real-time updates** : Mettre à jour le contexte en temps réel

---

**Date de création** : 2025-01-27
**Auteur** : Assistant IA
**Statut** : Plan initial
