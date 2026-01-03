# Plan : Page de Paramètres pour Leo

## 📋 Vue d'ensemble

Création d'une page de paramètres dédiée à Leo permettant de personnaliser son comportement, son ton, son approche, et de gérer des instructions personnalisées via des fichiers Markdown.

---

## 🎯 Objectifs

1. **Personnalisation du ton** : Permettre à l'utilisateur de choisir le ton de Leo (professionnel, décontracté, technique, amical, etc.)
2. **Configuration de l'approche** : Définir comment Leo doit répondre (concis, détaillé, avec exemples, etc.)
3. **Consignes personnalisées** : Ajouter des instructions spécifiques pour guider Leo
4. **Gestion de fichiers Markdown** : Upload, téléchargement et gestion de fichiers .md contenant des instructions détaillées
5. **Intégration transparente** : Les paramètres doivent être appliqués automatiquement lors des conversations avec Leo

---

## 🏗️ Architecture

### 1. Backend

#### 1.1 Modèle de données
**Utilisation du système existant `UserPreference`**

Les préférences Leo seront stockées dans la table `user_preferences` avec les clés suivantes :

```python
# Structure des préférences Leo
{
    "leo_settings": {
        "tone": "professionnel" | "decontracte" | "technique" | "amical" | "formel",
        "approach": "concis" | "detaille" | "avec_exemples" | "pas_a_pas",
        "language": "fr" | "en" | "auto",
        "custom_instructions": "string",  # Instructions personnalisées en texte libre
        "markdown_file_id": int | null,  # ID du fichier markdown uploadé
        "markdown_file_name": string | null,  # Nom du fichier pour affichage
        "markdown_content": string | null,  # Contenu du fichier (optionnel, peut être stocké séparément)
        "temperature": float,  # 0.0 - 2.0 (défaut: 0.7)
        "max_tokens": int,  # Limite de tokens (défaut: null = auto)
        "provider_preference": "auto" | "openai" | "anthropic",
        "model_preference": string | null,  # Modèle spécifique préféré
        "enable_context_memory": boolean,  # Activer la mémoire de contexte (futur)
        "created_at": "datetime",
        "updated_at": "datetime"
    }
}
```

#### 1.2 Service Backend
**Fichier** : `backend/app/services/leo_settings_service.py`

```python
class LeoSettingsService:
    """Service pour gérer les paramètres Leo"""
    
    async def get_leo_settings(user_id: int) -> Dict[str, Any]
    async def update_leo_settings(user_id: int, settings: Dict[str, Any]) -> Dict[str, Any]
    async def get_default_leo_settings() -> Dict[str, Any]
    async def build_system_prompt(user_id: int) -> str  # Construit le system_prompt à partir des settings
    async def upload_markdown_file(user_id: int, file_content: str, filename: str) -> Dict[str, Any]
    async def download_markdown_file(user_id: int) -> Optional[str]
    async def delete_markdown_file(user_id: int) -> bool
```

#### 1.3 Endpoints API
**Fichier** : `backend/app/api/v1/endpoints/leo_settings.py`

```python
# GET /v1/leo/settings
# Récupère les paramètres Leo de l'utilisateur

# PUT /v1/leo/settings
# Met à jour les paramètres Leo

# POST /v1/leo/settings/markdown/upload
# Upload un fichier Markdown avec instructions

# GET /v1/leo/settings/markdown/download
# Télécharge le fichier Markdown actuel

# DELETE /v1/leo/settings/markdown
# Supprime le fichier Markdown

# GET /v1/leo/settings/system-prompt
# Récupère le system_prompt généré à partir des paramètres
```

#### 1.4 Intégration avec le système AI existant
**Modification** : `backend/app/api/v1/endpoints/ai.py` ou `backend/app/api/ai.py`

Le endpoint `/v1/ai/chat` devra :
1. Vérifier si l'utilisateur a des paramètres Leo configurés
2. Si oui, utiliser `LeoSettingsService.build_system_prompt()` pour construire le system_prompt
3. Sinon, utiliser le system_prompt par défaut ou celui fourni dans la requête

---

### 2. Frontend

#### 2.1 Structure des fichiers

```
apps/web/src/
├── app/[locale]/
│   └── settings/
│       └── leo/
│           └── page.tsx                    # Page principale des paramètres Leo
├── components/
│   ├── settings/
│   │   └── LeoSettings.tsx                # Composant principal des paramètres
│   │   └── LeoToneSelector.tsx             # Sélecteur de ton
│   │   └── LeoApproachSelector.tsx         # Sélecteur d'approche
│   │   └── LeoCustomInstructions.tsx      # Zone de texte pour consignes
│   │   └── LeoMarkdownUpload.tsx           # Composant upload/téléchargement .md
│   └── leo/
│       └── LeoSettingsPreview.tsx          # Aperçu des paramètres (optionnel)
└── lib/
    └── api/
        └── leo-settings.ts                 # Client API pour les paramètres Leo
```

#### 2.2 Page de paramètres
**Fichier** : `apps/web/src/app/[locale]/settings/leo/page.tsx`

Structure de la page :
- Header avec titre "Paramètres Leo"
- Sections organisées en onglets ou accordéons :
  1. **Ton et Style** : Sélection du ton, approche, langue
  2. **Consignes Personnalisées** : Zone de texte pour instructions
  3. **Fichier Markdown** : Upload/téléchargement/suppression de fichier .md
  4. **Paramètres Avancés** : Temperature, max_tokens, provider, modèle
  5. **Aperçu** : Prévisualisation du system_prompt généré

#### 2.3 Composants UI

**LeoSettings.tsx** : Composant principal avec gestion d'état
- Utilise `useState` pour les paramètres locaux
- Utilise `useMutation` (TanStack Query) pour sauvegarder
- Affiche les sous-composants organisés en sections

**LeoToneSelector.tsx** : 
- Radio buttons ou Select pour choisir le ton
- Options : Professionnel, Décontracté, Technique, Amical, Formel
- Description de chaque ton

**LeoApproachSelector.tsx** :
- Radio buttons ou Select pour l'approche
- Options : Concis, Détaillé, Avec exemples, Pas à pas
- Description de chaque approche

**LeoCustomInstructions.tsx** :
- Textarea avec placeholder
- Compteur de caractères
- Suggestions d'exemples

**LeoMarkdownUpload.tsx** :
- Zone de drag & drop pour upload
- Bouton "Choisir un fichier"
- Affichage du fichier actuel (nom, taille, date)
- Boutons : Télécharger, Supprimer
- Validation : uniquement fichiers .md

**LeoAdvancedSettings.tsx** :
- Slider pour temperature (0.0 - 2.0)
- Input pour max_tokens
- Select pour provider
- Select pour modèle (dynamique selon provider)

#### 2.3 Client API
**Fichier** : `apps/web/src/lib/api/leo-settings.ts`

```typescript
export const leoSettingsAPI = {
  getSettings: () => Promise<LeoSettings>
  updateSettings: (settings: Partial<LeoSettings>) => Promise<LeoSettings>
  uploadMarkdown: (file: File) => Promise<{ success: boolean, filename: string }>
  downloadMarkdown: () => Promise<Blob>
  deleteMarkdown: () => Promise<{ success: boolean }>
  getSystemPrompt: () => Promise<{ system_prompt: string }>
}
```

#### 2.4 Intégration avec la page Leo
**Modification** : `apps/web/src/app/[locale]/dashboard/leo/page.tsx`

- Charger les paramètres Leo au montage du composant
- Utiliser `leoSettingsAPI.getSystemPrompt()` pour obtenir le system_prompt personnalisé
- Passer ce system_prompt à l'API `/v1/ai/chat` au lieu du system_prompt codé en dur
- Ajouter un lien vers les paramètres dans le header (icône Settings)

---

## 🎨 Design Nukleo

### Style général
- Utiliser les composants Nukleo existants (`PageContainer`, `NukleoPageHeader`, `Card`, `Button`, etc.)
- Appliquer le design system avec `glass-card`, `bg-nukleo-gradient`, etc.
- Couleurs primaires : `primary-500`, `nukleo-lavender`
- Espacements cohérents avec le reste de l'application

### Layout de la page
```
┌─────────────────────────────────────────┐
│  NukleoPageHeader                      │
│  "Paramètres Leo"                      │
│  [Breadcrumbs]                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Card (glass-card)                     │
│  ┌───────────────────────────────────┐ │
│  │ Tabs:                             │ │
│  │ [Ton] [Consignes] [Markdown] [Avancé] │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Contenu de l'onglet actif         │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Aperçu du System Prompt          │ │
│  │ (expandable/collapsible)          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Sauvegarder] [Réinitialiser]         │
└─────────────────────────────────────────┘
```

---

## 📝 Fonctionnalités détaillées

### 1. Ton de Leo

**Options disponibles** :
- **Professionnel** : "Réponds de manière professionnelle et formelle, en utilisant un vocabulaire adapté au contexte professionnel."
- **Décontracté** : "Réponds de manière décontractée et amicale, en utilisant un ton plus informel et accessible."
- **Technique** : "Réponds de manière technique et précise, en utilisant la terminologie appropriée et en fournissant des détails techniques."
- **Amical** : "Réponds de manière chaleureuse et amicale, en créant une atmosphère conviviale."
- **Formel** : "Réponds de manière formelle et respectueuse, en utilisant un langage soutenu."

**Implémentation** :
- Radio buttons avec icônes et descriptions
- Prévisualisation du ton sélectionné

### 2. Approche de réponse

**Options disponibles** :
- **Concis** : "Sois concis dans tes réponses, va droit au but sans détours."
- **Détaillé** : "Fournis des réponses détaillées et complètes, en expliquant chaque point."
- **Avec exemples** : "Inclus toujours des exemples concrets dans tes réponses pour illustrer tes points."
- **Pas à pas** : "Structure tes réponses en étapes claires et numérotées."

**Implémentation** :
- Radio buttons avec descriptions
- Possibilité de combiner plusieurs approches (checkboxes) ?

### 3. Consignes personnalisées

**Fonctionnalités** :
- Zone de texte multiligne (Textarea)
- Placeholder avec exemples :
  ```
  Exemples :
  - "Toujours mentionner les numéros de version"
  - "Utiliser le format ISO pour les dates"
  - "Référencer la documentation officielle"
  ```
- Compteur de caractères (max 2000 caractères recommandé)
- Sauvegarde automatique en brouillon (localStorage) ?

### 4. Fichier Markdown

**Fonctionnalités** :
- **Upload** :
  - Zone de drag & drop
  - Bouton "Choisir un fichier"
  - Validation : uniquement .md, max 500KB
  - Affichage d'un loader pendant l'upload
  - Message de succès/erreur
  
- **Affichage** :
  - Nom du fichier actuel
  - Taille du fichier
  - Date d'upload
  - Aperçu du contenu (premières lignes, expandable)
  
- **Téléchargement** :
  - Bouton "Télécharger" qui télécharge le fichier .md
  - Nom de fichier : `leo-instructions-YYYY-MM-DD.md`
  
- **Suppression** :
  - Bouton "Supprimer" avec confirmation
  - Message de confirmation : "Êtes-vous sûr de vouloir supprimer ce fichier ?"

**Stockage** :
- Option 1 : Stocker le contenu dans `user_preferences` (JSON)
- Option 2 : Utiliser un système de fichiers/media existant si disponible
- Option 3 : Stocker dans une table dédiée `leo_markdown_files`

**Recommandation** : Option 1 pour simplicité, avec limite de taille (500KB max)

### 5. Paramètres avancés

**Temperature** :
- Slider de 0.0 à 2.0
- Valeur par défaut : 0.7
- Description : "Contrôle la créativité des réponses (0 = déterministe, 2 = très créatif)"

**Max Tokens** :
- Input numérique
- Valeur par défaut : null (auto)
- Description : "Limite le nombre de tokens dans la réponse"

**Provider** :
- Select : Auto, OpenAI, Anthropic
- Description : "Choisissez le fournisseur d'IA préféré"

**Modèle** :
- Select dynamique selon le provider sélectionné
- Options OpenAI : gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo
- Options Anthropic : claude-3-haiku, claude-3-sonnet, claude-3-opus
- Valeur par défaut : null (auto)

### 6. Aperçu du System Prompt

**Fonctionnalités** :
- Section expandable/collapsible
- Affiche le system_prompt généré à partir de tous les paramètres
- Format : Zone de texte en lecture seule avec copie possible
- Mise à jour en temps réel lors des modifications
- Bouton "Copier" pour copier le prompt dans le presse-papiers

**Structure du prompt généré** :
```
Tu es Leo, l'assistant IA de l'ERP Nukleo.

[Ton sélectionné]
[Approche sélectionnée]
[Consignes personnalisées]
[Contenu du fichier Markdown si présent]

Réponds toujours en français sauf demande contraire.
```

---

## 🔄 Flux de données

### Chargement des paramètres
1. Page `/settings/leo` se charge
2. Appel API `GET /v1/leo/settings`
3. Si aucune préférence : utiliser les valeurs par défaut
4. Remplir le formulaire avec les valeurs récupérées
5. Appel API `GET /v1/leo/settings/system-prompt` pour l'aperçu

### Sauvegarde des paramètres
1. Utilisateur modifie un paramètre
2. État local mis à jour (optimistic update)
3. Appel API `PUT /v1/leo/settings` avec les nouveaux paramètres
4. En cas de succès : afficher message de succès
5. En cas d'erreur : restaurer l'état précédent et afficher erreur
6. Mettre à jour l'aperçu du system_prompt

### Upload de fichier Markdown
1. Utilisateur sélectionne/dépose un fichier .md
2. Validation : extension .md, taille < 500KB
3. Lecture du contenu du fichier
4. Appel API `POST /v1/leo/settings/markdown/upload` avec le contenu
5. En cas de succès : afficher le nom du fichier et mettre à jour l'aperçu
6. En cas d'erreur : afficher message d'erreur

### Application dans la conversation
1. Page Leo (`/dashboard/leo`) se charge
2. Appel API `GET /v1/leo/settings/system-prompt` (ou récupération des settings)
3. Utiliser ce system_prompt dans les appels à `/v1/ai/chat`
4. Si aucun paramètre configuré : utiliser le system_prompt par défaut

---

## 🧪 Tests à prévoir

### Backend
- [ ] Test `LeoSettingsService.get_leo_settings()` avec et sans préférences
- [ ] Test `LeoSettingsService.update_leo_settings()`
- [ ] Test `LeoSettingsService.build_system_prompt()` avec différentes configurations
- [ ] Test upload/download/suppression de fichier Markdown
- [ ] Test validation des fichiers (extension, taille)
- [ ] Test intégration avec `/v1/ai/chat` (utilisation du system_prompt personnalisé)

### Frontend
- [ ] Test affichage des paramètres par défaut
- [ ] Test modification et sauvegarde des paramètres
- [ ] Test upload de fichier Markdown (drag & drop et bouton)
- [ ] Test téléchargement de fichier Markdown
- [ ] Test suppression de fichier avec confirmation
- [ ] Test aperçu du system_prompt (mise à jour en temps réel)
- [ ] Test application des paramètres dans la page Leo
- [ ] Test validation des formulaires
- [ ] Test gestion des erreurs (réseau, validation, etc.)

---

## 📦 Dépendances

### Backend
- ✅ `UserPreference` model (existant)
- ✅ `UserPreferenceService` (existant)
- ✅ `AIService` (existant)
- Nouveau : `LeoSettingsService`

### Frontend
- ✅ `PageContainer`, `NukleoPageHeader` (existant)
- ✅ `Card`, `Button`, `Input`, `Textarea`, `Select` (existant)
- ✅ `useToast` (existant)
- ✅ `apiClient` (existant)
- ✅ TanStack Query (existant)
- Nouveau : Composants Leo spécifiques

---

## 🚀 Plan d'implémentation

### Phase 1 : Backend (Base)
1. Créer `LeoSettingsService` avec méthodes de base
2. Créer endpoints API `/v1/leo/settings`
3. Tester les endpoints avec Postman/curl

### Phase 2 : Frontend (Base)
1. Créer la page `/settings/leo`
2. Créer le composant `LeoSettings` avec sections de base
3. Créer le client API `leo-settings.ts`
4. Intégrer avec TanStack Query

### Phase 3 : Fonctionnalités principales
1. Implémenter sélecteurs de ton et approche
2. Implémenter zone de consignes personnalisées
3. Implémenter upload/téléchargement Markdown
4. Implémenter aperçu du system_prompt

### Phase 4 : Paramètres avancés
1. Ajouter section paramètres avancés
2. Implémenter sliders et inputs pour temperature, max_tokens, etc.

### Phase 5 : Intégration
1. Modifier la page Leo pour utiliser les paramètres personnalisés
2. Ajouter lien vers les paramètres dans le header de la page Leo
3. Tester le flux complet

### Phase 6 : Polish et tests
1. Améliorer l'UI/UX
2. Ajouter des messages d'aide et tooltips
3. Tests end-to-end
4. Documentation

---

## 📚 Fichiers à créer/modifier

### Backend
- ✅ `backend/app/services/leo_settings_service.py` (nouveau)
- ✅ `backend/app/api/v1/endpoints/leo_settings.py` (nouveau)
- ✅ `backend/app/api/v1/router.py` (modifier : ajouter leo_settings.router)
- ✅ `backend/app/api/ai.py` ou `backend/app/api/v1/endpoints/ai.py` (modifier : intégrer Leo settings)

### Frontend
- ✅ `apps/web/src/app/[locale]/settings/leo/page.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoSettings.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoToneSelector.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoApproachSelector.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoCustomInstructions.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoMarkdownUpload.tsx` (nouveau)
- ✅ `apps/web/src/components/settings/LeoAdvancedSettings.tsx` (nouveau)
- ✅ `apps/web/src/lib/api/leo-settings.ts` (nouveau)
- ✅ `apps/web/src/app/[locale]/dashboard/leo/page.tsx` (modifier : utiliser settings)
- ✅ `apps/web/src/components/settings/SettingsNavigation.tsx` (modifier : ajouter entrée Leo)
- ✅ `apps/web/src/config/sitemap.ts` (modifier : ajouter page Leo settings)

---

## 🎯 Points d'attention

1. **Performance** : Le system_prompt peut devenir long avec le fichier Markdown. Limiter la taille du fichier (500KB max).

2. **Sécurité** : 
   - Valider le contenu des fichiers Markdown uploadés
   - Sanitizer le contenu avant de l'inclure dans le system_prompt
   - Limiter la taille des consignes personnalisées

3. **UX** :
   - Sauvegarde automatique en brouillon (localStorage) pour éviter la perte de données
   - Messages de confirmation pour actions destructives (suppression fichier)
   - Feedback visuel lors des opérations (upload, sauvegarde)

4. **Compatibilité** :
   - Gérer les cas où les paramètres n'existent pas encore (valeurs par défaut)
   - Gérer les erreurs de manière gracieuse
   - Assurer la rétrocompatibilité avec le système actuel

5. **Internationalisation** :
   - Traduire tous les textes de l'interface
   - Gérer les traductions pour les descriptions de ton/approche

---

## 📋 Checklist de validation

- [ ] Les paramètres sont sauvegardés correctement dans la base de données
- [ ] Le system_prompt est généré correctement à partir des paramètres
- [ ] Le system_prompt personnalisé est utilisé dans les conversations Leo
- [ ] L'upload de fichier Markdown fonctionne
- [ ] Le téléchargement de fichier Markdown fonctionne
- [ ] La suppression de fichier fonctionne avec confirmation
- [ ] L'aperçu du system_prompt se met à jour en temps réel
- [ ] Les valeurs par défaut sont appliquées si aucun paramètre n'est configuré
- [ ] La page est accessible depuis la navigation des paramètres
- [ ] Le design est cohérent avec le reste de l'application Nukleo
- [ ] Les erreurs sont gérées et affichées correctement
- [ ] Les tests passent (backend et frontend)

---

## 🔮 Évolutions futures possibles

1. **Templates de paramètres** : Proposer des templates pré-configurés (ex: "Assistant technique", "Assistant commercial", etc.)

2. **Historique des modifications** : Garder un historique des changements de paramètres

3. **Paramètres par conversation** : Permettre de définir des paramètres spécifiques pour certaines conversations

4. **Partage de configurations** : Permettre de partager des configurations entre utilisateurs

5. **A/B Testing** : Tester différents tons/approches pour optimiser les réponses

6. **Analytics** : Analyser quels paramètres donnent les meilleures réponses

---

## 📝 Notes supplémentaires

- Le système de `UserPreference` existant est parfait pour stocker les paramètres Leo
- Pas besoin de créer de nouvelles tables ou migrations
- L'intégration avec le système AI existant devrait être relativement simple
- Le design Nukleo est déjà bien établi, il suffit de suivre les patterns existants

---

**Date de création** : 2025-01-27
**Auteur** : Assistant IA
**Statut** : Plan initial
