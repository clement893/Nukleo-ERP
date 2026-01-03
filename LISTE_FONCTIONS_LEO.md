# 📋 Liste Complète des Fonctions Créées pour la Page Leo

## 🎯 Vue d'ensemble
Cette liste recense toutes les fonctions, endpoints, services, composants et utilitaires créés spécifiquement pour la fonctionnalité Leo (Assistant IA).

---

## 🔌 Backend - Endpoints API

### Fichier: `backend/app/api/v1/endpoints/leo_agent.py`

#### 1. `get_conversations`
- **Type**: GET `/api/v1/ai/leo/conversations`
- **Description**: Récupère la liste paginée des conversations de l'utilisateur
- **Paramètres**: `skip`, `limit`, `user_id` (optionnel pour superadmin)
- **Retourne**: `LeoConversationListResponse`

#### 2. `get_conversation`
- **Type**: GET `/api/v1/ai/leo/conversations/{conversation_id}`
- **Description**: Récupère une conversation spécifique
- **Paramètres**: `conversation_id`
- **Retourne**: `LeoConversation`

#### 3. `get_conversation_messages`
- **Type**: GET `/api/v1/ai/leo/conversations/{conversation_id}/messages`
- **Description**: Récupère tous les messages d'une conversation
- **Paramètres**: `conversation_id`
- **Retourne**: `LeoMessageListResponse`

#### 4. `update_conversation`
- **Type**: PUT `/api/v1/ai/leo/conversations/{conversation_id}`
- **Description**: Met à jour une conversation (ex: renommer)
- **Paramètres**: `conversation_id`, `update_data` (LeoConversationUpdate)
- **Retourne**: `LeoConversation`

#### 5. `delete_conversation`
- **Type**: DELETE `/api/v1/ai/leo/conversations/{conversation_id}`
- **Description**: Supprime une conversation et tous ses messages
- **Paramètres**: `conversation_id`
- **Retourne**: 204 No Content

#### 6. `leo_query`
- **Type**: POST `/api/v1/ai/leo/query`
- **Description**: Point d'entrée principal pour interagir avec Leo
- **Fonctionnalités**:
  - Crée ou continue une conversation
  - Sauvegarde le message utilisateur
  - Récupère le contexte utilisateur et les données pertinentes
  - Génère une réponse IA avec contexte enrichi
  - Sauvegarde la réponse de l'assistant
- **Paramètres**: `LeoQueryRequest` (message, conversation_id, provider)
- **Retourne**: `LeoQueryResponse`

---

## 🔧 Backend - Services

### Fichier: `backend/app/services/leo_agent_service.py`

#### 1. `get_user_context(user_id: int) -> Dict`
- **Description**: Récupère le contexte complet de l'utilisateur
- **Retourne**: Dict avec:
  - Informations utilisateur (email, nom, prénom)
  - Rôles et permissions
  - Équipes
  - Statistiques (projets, factures, tâches, contacts)

#### 2. `get_relevant_data(query: str, user_id: int) -> Dict`
- **Description**: Récupère les données pertinentes basées sur la requête
- **Retourne**: Dict avec données filtrées selon les mots-clés:
  - Projets
  - Tâches
  - Factures
  - Entreprises
  - Contacts

#### 3. `format_data_for_ai(data: Dict) -> str`
- **Description**: Formate les données pour le contexte IA
- **Retourne**: String formatée pour être incluse dans le prompt système

#### 4. `create_conversation(user_id: int, title: Optional[str]) -> LeoConversation`
- **Description**: Crée une nouvelle conversation
- **Retourne**: Conversation créée

#### 5. `add_message(conversation_id: int, role: str, content: str, metadata: Optional[Dict]) -> LeoMessage`
- **Description**: Ajoute un message à une conversation
- **Retourne**: Message créé

#### 6. `get_conversation_messages(conversation_id: int) -> List[LeoMessage]`
- **Description**: Récupère tous les messages d'une conversation
- **Retourne**: Liste de messages ordonnés par date

#### 7. `get_user_conversations(user_id: int, limit: int, skip: int) -> tuple[List[LeoConversation], int]`
- **Description**: Récupère les conversations d'un utilisateur avec pagination
- **Retourne**: Tuple (liste de conversations, total)

#### 8. `get_conversation(conversation_id: int, user_id: int) -> Optional[LeoConversation]`
- **Description**: Récupère une conversation spécifique (vérifie l'appartenance)
- **Retourne**: Conversation ou None

#### 9. `delete_conversation(conversation_id: int, user_id: int) -> bool`
- **Description**: Supprime une conversation et tous ses messages
- **Retourne**: True si supprimé, False sinon

---

### Fichier: `backend/app/modules/leo/services/agent_service.py`

#### 1. `get_user_context(user_id: int) -> Dict`
- **Description**: Version alternative du service (module Leo)
- **Même fonctionnalité que** `backend/app/services/leo_agent_service.py`

#### 2. `get_relevant_data(query: str, user_id: int) -> Dict`
- **Description**: Version alternative du service (module Leo)
- **Même fonctionnalité que** `backend/app/services/leo_agent_service.py`

#### 3. `format_data_for_ai(data: Dict) -> str`
- **Description**: Version alternative du service (module Leo)
- **Même fonctionnalité que** `backend/app/services/leo_agent_service.py`

---

## 🎨 Frontend - API Client

### Fichier: `apps/web/src/lib/api/leo-agent.ts`

#### 1. `listConversations(params?) -> Promise<LeoConversationListResponse>`
- **Description**: Liste les conversations de l'utilisateur
- **Paramètres optionnels**: `skip`, `limit`, `user_id`

#### 2. `getConversation(conversationId: number) -> Promise<LeoConversation>`
- **Description**: Récupère une conversation spécifique

#### 3. `getConversationMessages(conversationId: number) -> Promise<LeoMessageListResponse>`
- **Description**: Récupère les messages d'une conversation

#### 4. `query(request: LeoQueryRequest) -> Promise<LeoQueryResponse>`
- **Description**: Envoie une requête à Leo
- **Paramètres**: `message`, `conversation_id?`, `provider?`

#### 5. `updateConversation(conversationId: number, updateData: LeoConversationUpdate) -> Promise<LeoConversation>`
- **Description**: Met à jour une conversation

#### 6. `deleteConversation(conversationId: number) -> Promise<void>`
- **Description**: Supprime une conversation

---

## 🧩 Frontend - Composants React

### Fichier: `apps/web/src/components/leo/LeoContainer.tsx`

#### 1. `LeoContainer({ userId? })`
- **Description**: Composant conteneur principal qui gère l'état
- **Fonctionnalités**:
  - Charge les conversations
  - Gère la sélection de conversation
  - Charge les messages
  - Envoie les messages
  - Gère la sidebar

#### 2. `loadConversations()`
- **Description**: Charge la liste des conversations

#### 3. `loadMessages(conversationId: number)`
- **Description**: Charge les messages d'une conversation

#### 4. `sendMessage(text: string, conversationId?: number)`
- **Description**: Envoie un message à Leo

#### 5. `createNewConversation()`
- **Description**: Crée une nouvelle conversation

#### 6. `deleteConversation(conversationId: number)`
- **Description**: Supprime une conversation

---

### Fichier: `apps/web/src/components/leo/LeoChat.tsx`

#### 1. `LeoChat({ messages, onSend, isLoading, conversationId? })`
- **Description**: Composant d'interface de chat
- **Fonctionnalités**:
  - Affiche les messages
  - Zone de saisie
  - Bouton d'envoi
  - Gestion du scroll automatique

#### 2. `MarkdownContent({ content })`
- **Description**: Composant pour afficher le contenu markdown
- **Fonctionnalités**:
  - Formatage inline (gras, italique, code)
  - Liens
  - Listes
  - Blocs de code

#### 3. `processInlineFormatting(text: string)`
- **Description**: Traite le formatage inline markdown

#### 4. `processCodeBlocks(text: string)`
- **Description**: Traite les blocs de code markdown

---

### Fichier: `apps/web/src/components/leo/LeoSidebar.tsx`

#### 1. `LeoSidebar({ conversations, selectedId, onSelect, onDelete, onNew })`
- **Description**: Composant sidebar pour la liste des conversations
- **Fonctionnalités**:
  - Liste des conversations
  - Recherche
  - Création de nouvelle conversation
  - Suppression de conversation

---

## 📄 Frontend - Page

### Fichier: `apps/web/src/app/[locale]/dashboard/leo/page.tsx`

#### 1. `LeoPage()`
- **Description**: Page principale Leo (actuellement simplifiée)
- **État**: Simplifiée pour n'afficher que "LEO" centré

---

## 🗄️ Backend - Modèles de Base de Données

### Fichier: `backend/app/modules/leo/models/leo_conversation.py`

#### Modèle: `LeoConversation`
- **Champs**:
  - `id`: int
  - `user_id`: int
  - `title`: str
  - `created_at`: datetime
  - `updated_at`: datetime

### Fichier: `backend/app/modules/leo/models/leo_documentation.py`

#### Modèle: `LeoMessage`
- **Champs**:
  - `id`: int
  - `conversation_id`: int
  - `role`: str ('user' | 'assistant')
  - `content`: str
  - `message_metadata`: JSON
  - `created_at`: datetime

---

## 📝 Backend - Schémas Pydantic

### Fichier: `backend/app/schemas/leo.py`

#### 1. `LeoConversation`
- **Description**: Schéma pour une conversation

#### 2. `LeoConversationListResponse`
- **Description**: Schéma pour la réponse de liste de conversations

#### 3. `LeoConversationUpdate`
- **Description**: Schéma pour la mise à jour d'une conversation

#### 4. `LeoMessage`
- **Description**: Schéma pour un message

#### 5. `LeoMessageListResponse`
- **Description**: Schéma pour la réponse de liste de messages

#### 6. `LeoQueryRequest`
- **Description**: Schéma pour une requête à Leo

#### 7. `LeoQueryResponse`
- **Description**: Schéma pour la réponse de Leo

---

## 🔄 Migrations de Base de Données

### Fichier: `backend/alembic/versions/038_add_leo_conversations.py`
- **Description**: Migration pour créer les tables `leo_conversations` et `leo_messages`

### Fichier: `backend/alembic/versions/030_add_leo_documentation_table.py`
- **Description**: Migration pour créer la table `leo_documentation`

---

## 📊 Résumé des Fonctions

### Backend
- **Endpoints API**: 6 fonctions
- **Services**: 9 fonctions principales
- **Modèles**: 2 modèles SQLAlchemy
- **Schémas**: 7 schémas Pydantic

### Frontend
- **API Client**: 6 fonctions
- **Composants**: 3 composants principaux avec plusieurs fonctions internes
- **Page**: 1 page (simplifiée)

### Total
- **~35+ fonctions/méthodes** créées spécifiquement pour Leo
- **2 migrations** de base de données
- **Plusieurs fichiers** de configuration et utilitaires

---

## 📁 Fichiers Liés à Leo

### Backend
- `backend/app/api/v1/endpoints/leo_agent.py`
- `backend/app/services/leo_agent_service.py`
- `backend/app/modules/leo/api/endpoints/agent.py`
- `backend/app/modules/leo/services/agent_service.py`
- `backend/app/modules/leo/models/leo_conversation.py`
- `backend/app/modules/leo/models/leo_documentation.py`
- `backend/app/schemas/leo.py`
- `backend/app/schemas/leo_documentation.py`
- `backend/alembic/versions/038_add_leo_conversations.py`
- `backend/alembic/versions/030_add_leo_documentation_table.py`

### Frontend
- `apps/web/src/app/[locale]/dashboard/leo/page.tsx`
- `apps/web/src/lib/api/leo-agent.ts`
- `apps/web/src/components/leo/LeoContainer.tsx`
- `apps/web/src/components/leo/LeoChat.tsx`
- `apps/web/src/components/leo/LeoSidebar.tsx`
- `apps/web/src/components/leo/index.ts`

---

## ⚠️ Notes Importantes

1. **Duplication de services**: Il existe deux services Leo similaires:
   - `backend/app/services/leo_agent_service.py`
   - `backend/app/modules/leo/services/agent_service.py`
   - Les deux ont des fonctionnalités similaires mais sont utilisés par différents endpoints

2. **Endpoints dupliqués**: Il existe deux sets d'endpoints:
   - `backend/app/api/v1/endpoints/leo_agent.py`
   - `backend/app/modules/leo/api/endpoints/agent.py`

3. **Erreurs greenlet_spawn**: Plusieurs corrections ont été apportées pour résoudre les erreurs `greenlet_spawn` en:
   - Extrayant les `user_id` immédiatement
   - Rechargeant les objets User dans le contexte async
   - Convertissant les attributs SQLAlchemy en types primitifs

---

*Document généré le: 2026-01-03*
