# Plan d'Implémentation - Création de Widgets Personnalisés

**Date**: 2026-01-02  
**Objectif**: Permettre aux utilisateurs de créer leurs propres widgets personnalisés pour le dashboard

---

## 📋 Vue d'Ensemble

Actuellement, les widgets sont définis de manière statique dans `widgetRegistry.ts`. Ce plan propose d'ajouter un système permettant aux utilisateurs de créer, configurer et sauvegarder leurs propres widgets personnalisés.

---

## 🎯 Objectifs

1. **Créer un éditeur de widgets visuel** permettant aux utilisateurs de créer des widgets personnalisés
2. **Sauvegarder les widgets personnalisés** en base de données
3. **Permettre différents types de widgets personnalisés**:
   - Widget HTML/CSS personnalisé
   - Widget basé sur une requête API
   - Widget de visualisation de données (graphiques)
   - Widget de texte/markdown
   - Widget iframe (intégration externe)
4. **Intégrer les widgets personnalisés** dans la bibliothèque de widgets existante
5. **Permettre le partage de widgets** entre utilisateurs (optionnel)

---

## 🏗️ Architecture Proposée

### 1. Modèle de Données Backend

#### Table `custom_widgets`

```sql
CREATE TABLE custom_widgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'html', 'api', 'chart', 'text', 'iframe'
    config JSONB NOT NULL, -- Configuration du widget
    data_source JSONB, -- Source de données (API endpoint, query, etc.)
    style JSONB, -- Styles personnalisés
    is_public BOOLEAN DEFAULT FALSE, -- Partage avec autres utilisateurs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_widgets_user_id ON custom_widgets(user_id);
CREATE INDEX idx_custom_widgets_public ON custom_widgets(is_public) WHERE is_public = TRUE;
```

#### Schéma Pydantic

```python
# backend/app/schemas/custom_widget.py

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class CustomWidgetConfig(BaseModel):
    title: Optional[str] = None
    period: Optional[str] = None
    refresh_interval: Optional[int] = None
    filters: Optional[Dict[str, Any]] = None
    # Config spécifique selon le type
    html_content: Optional[str] = None  # Pour type 'html'
    api_endpoint: Optional[str] = None  # Pour type 'api'
    chart_type: Optional[str] = None  # Pour type 'chart'
    text_content: Optional[str] = None  # Pour type 'text'
    iframe_url: Optional[str] = None  # Pour type 'iframe'

class CustomWidgetDataSource(BaseModel):
    type: str  # 'api', 'query', 'static'
    endpoint: Optional[str] = None
    method: Optional[str] = 'GET'
    headers: Optional[Dict[str, str]] = None
    params: Optional[Dict[str, Any]] = None
    transform: Optional[str] = None  # JavaScript pour transformer les données

class CustomWidgetStyle(BaseModel):
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    borderColor: Optional[str] = None
    borderRadius: Optional[int] = None
    padding: Optional[int] = None
    fontSize: Optional[int] = None

class CustomWidgetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # 'html', 'api', 'chart', 'text', 'iframe'
    config: CustomWidgetConfig
    data_source: Optional[CustomWidgetDataSource] = None
    style: Optional[CustomWidgetStyle] = None
    is_public: bool = False

class CustomWidgetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[CustomWidgetConfig] = None
    data_source: Optional[CustomWidgetDataSource] = None
    style: Optional[CustomWidgetStyle] = None
    is_public: Optional[bool] = None

class CustomWidgetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    type: str
    config: Dict[str, Any]
    data_source: Optional[Dict[str, Any]]
    style: Optional[Dict[str, Any]]
    is_public: bool
    created_at: datetime
    updated_at: datetime
```

---

### 2. Endpoints API Backend

#### Fichier: `backend/app/api/v1/endpoints/custom_widgets.py`

```python
"""
Custom Widgets API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.custom_widget import (
    CustomWidgetCreate,
    CustomWidgetUpdate,
    CustomWidgetResponse
)

router = APIRouter(prefix="/custom-widgets", tags=["custom-widgets"])

@router.get("/", response_model=List[CustomWidgetResponse])
async def list_custom_widgets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_public: bool = False
):
    """Liste tous les widgets personnalisés de l'utilisateur + widgets publics si demandé"""
    pass

@router.get("/{widget_id}", response_model=CustomWidgetResponse)
async def get_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un widget personnalisé par ID"""
    pass

@router.post("/", response_model=CustomWidgetResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_widget(
    widget_data: CustomWidgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau widget personnalisé"""
    pass

@router.put("/{widget_id}", response_model=CustomWidgetResponse)
async def update_custom_widget(
    widget_id: int,
    widget_data: CustomWidgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un widget personnalisé"""
    pass

@router.delete("/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un widget personnalisé"""
    pass

@router.post("/{widget_id}/duplicate", response_model=CustomWidgetResponse)
async def duplicate_custom_widget(
    widget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Duplique un widget personnalisé"""
    pass
```

---

### 3. Composants Frontend

#### 3.1. Éditeur de Widget (`WidgetEditor.tsx`)

**Fichier**: `apps/web/src/components/dashboard/WidgetEditor.tsx`

**Fonctionnalités**:
- Formulaire pour créer/modifier un widget personnalisé
- Sélection du type de widget
- Configuration selon le type:
  - **HTML**: Éditeur de code HTML/CSS avec preview
  - **API**: Configuration d'endpoint, méthode, headers, params
  - **Chart**: Sélection du type de graphique, mapping des données
  - **Text**: Éditeur markdown avec preview
  - **Iframe**: Configuration d'URL et paramètres
- Personnalisation du style (couleurs, bordures, padding, etc.)
- Preview en temps réel
- Validation des données

#### 3.2. Composant Widget Personnalisé (`CustomWidget.tsx`)

**Fichier**: `apps/web/src/components/dashboard/widgets/CustomWidget.tsx`

**Fonctionnalités**:
- Rendu dynamique selon le type de widget
- Gestion des données (fetch depuis API si nécessaire)
- Application des styles personnalisés
- Gestion d'erreur et états de chargement
- Support du rafraîchissement automatique

#### 3.3. Intégration dans la Bibliothèque

**Modifications**:
- Ajouter une section "Mes Widgets" dans `WidgetLibrary.tsx`
- Charger les widgets personnalisés depuis l'API
- Afficher les widgets personnalisés avec une icône spéciale
- Permettre l'édition/suppression des widgets personnalisés

---

## 📝 Phases d'Implémentation

### Phase 1: Backend - Modèle et API (2-3 jours)

**Tâches**:
1. ✅ Créer le modèle SQLAlchemy `CustomWidget`
2. ✅ Créer les schémas Pydantic
3. ✅ Créer les endpoints API
4. ✅ Ajouter les migrations de base de données
5. ✅ Tests unitaires des endpoints

**Livrables**:
- Modèle de données fonctionnel
- API REST complète pour CRUD des widgets personnalisés
- Documentation API

---

### Phase 2: Frontend - Composants de Base (3-4 jours)

**Tâches**:
1. ✅ Créer le composant `CustomWidget.tsx`
2. ✅ Créer l'éditeur de widgets `WidgetEditor.tsx`
3. ✅ Créer l'API client `customWidgetsAPI.ts`
4. ✅ Intégrer dans le store Zustand
5. ✅ Ajouter les widgets personnalisés dans la bibliothèque

**Livrables**:
- Composant de rendu de widget personnalisé
- Éditeur de widgets fonctionnel
- Intégration dans le dashboard

---

### Phase 3: Types de Widgets - HTML et Text (2 jours)

**Tâches**:
1. ✅ Implémenter le rendu HTML personnalisé
2. ✅ Implémenter le rendu Markdown/Text
3. ✅ Éditeur de code avec syntax highlighting
4. ✅ Preview en temps réel
5. ✅ Validation et sanitization du HTML

**Livrables**:
- Widgets HTML fonctionnels
- Widgets Text/Markdown fonctionnels
- Éditeurs avec preview

---

### Phase 4: Types de Widgets - API et Chart (3-4 jours)

**Tâches**:
1. ✅ Implémenter le fetch de données depuis API
2. ✅ Configuration d'endpoint avec authentification
3. ✅ Transformation des données (JavaScript)
4. ✅ Implémenter les graphiques personnalisés
5. ✅ Mapping des données pour les graphiques

**Livrables**:
- Widgets API fonctionnels
- Widgets Chart fonctionnels
- Système de transformation de données

---

### Phase 5: Types de Widgets - Iframe et Avancé (2 jours)

**Tâches**:
1. ✅ Implémenter le rendu iframe
2. ✅ Configuration de sécurité (sandbox)
3. ✅ Communication iframe ↔ parent (optionnel)
4. ✅ Widgets composites (combinaison de types)

**Livrables**:
- Widgets iframe fonctionnels
- Sécurité et sandboxing

---

### Phase 6: Améliorations et Polish (2-3 jours)

**Tâches**:
1. ✅ Gestion d'erreur robuste
2. ✅ Loading states
3. ✅ Validation avancée
4. ✅ Documentation utilisateur
5. ✅ Tests E2E
6. ✅ Optimisations de performance

**Livrables**:
- Système complet et robuste
- Documentation
- Tests

---

## 🎨 Interface Utilisateur

### Modal d'Édition de Widget

```
┌─────────────────────────────────────────────┐
│  Créer un Widget Personnalisé          [X]  │
├─────────────────────────────────────────────┤
│                                             │
│  Nom du widget: [________________]          │
│  Description:  [________________]          │
│                                             │
│  Type de widget:                            │
│  ○ HTML/CSS                                 │
│  ○ Requête API                              │
│  ○ Graphique                                │
│  ○ Texte/Markdown                           │
│  ○ Iframe                                   │
│                                             │
│  [Configuration selon le type]             │
│                                             │
│  Style:                                     │
│  Couleur de fond: [____]                    │
│  Couleur du texte: [____]                   │
│  ...                                        │
│                                             │
│  [Preview]                                  │
│                                             │
│  [Annuler]  [Enregistrer]                  │
└─────────────────────────────────────────────┘
```

### Bibliothèque de Widgets (Mise à Jour)

```
┌─────────────────────────────────────────────┐
│  Bibliothèque de Widgets              [X]   │
├─────────────────────────────────────────────┤
│  [Rechercher...]                            │
│                                             │
│  [Tous] [Commercial] [Projets] [Mes Widgets]│
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Widget 1 │  │ Widget 2 │  │ Widget 3 │ │
│  │          │  │          │  │          │ │
│  │ [Ajouter]│  │ [Ajouter]│  │ [Ajouter]│ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ Mon      │  │ Mon      │                │
│  │ Widget 1 │  │ Widget 2 │                │
│  │ [✏️] [🗑️]│  │ [✏️] [🗑️]│                │
│  └──────────┘  └──────────┘                │
│                                             │
│  [+ Créer un Widget Personnalisé]          │
└─────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

### Mesures de Sécurité

1. **Sanitization HTML**: 
   - Utiliser `DOMPurify` pour nettoyer le HTML
   - Bloquer les scripts et iframes malveillants

2. **Validation API**:
   - Valider les endpoints API (whitelist de domaines autorisés)
   - Limiter les méthodes HTTP autorisées
   - Rate limiting sur les requêtes API

3. **Sandboxing Iframe**:
   - Utiliser l'attribut `sandbox` sur les iframes
   - Restreindre les permissions

4. **Isolation des Données**:
   - Chaque utilisateur ne peut voir/modifier que ses widgets
   - Validation côté serveur de la propriété

5. **Validation des Données**:
   - Validation stricte des schémas Pydantic
   - Limites de taille pour le contenu HTML/CSS

---

## 📊 Types de Widgets Détailés

### 1. Widget HTML/CSS

**Configuration**:
```json
{
  "type": "html",
  "config": {
    "html_content": "<div>...</div>",
    "css_content": ".widget { ... }"
  }
}
```

**Utilisation**: Pour créer des widgets entièrement personnalisés avec HTML/CSS/JavaScript.

---

### 2. Widget API

**Configuration**:
```json
{
  "type": "api",
  "data_source": {
    "endpoint": "/v1/projects",
    "method": "GET",
    "headers": {},
    "params": {},
    "transform": "return data.items.map(item => ({ name: item.name }))"
  },
  "config": {
    "template": "<div>{{#each items}}<p>{{name}}</p>{{/each}}</div>"
  }
}
```

**Utilisation**: Pour afficher des données depuis une API avec un template personnalisé.

---

### 3. Widget Chart

**Configuration**:
```json
{
  "type": "chart",
  "data_source": {
    "endpoint": "/v1/finances/revenue",
    "transform": "return data.data.map(d => ({ x: d.month, y: d.value }))"
  },
  "config": {
    "chart_type": "line",
    "x_axis": "x",
    "y_axis": "y"
  }
}
```

**Utilisation**: Pour créer des graphiques personnalisés à partir de données API.

---

### 4. Widget Text/Markdown

**Configuration**:
```json
{
  "type": "text",
  "config": {
    "text_content": "# Titre\n\nContenu en markdown...",
    "format": "markdown"
  }
}
```

**Utilisation**: Pour afficher du texte formaté ou des notes.

---

### 5. Widget Iframe

**Configuration**:
```json
{
  "type": "iframe",
  "config": {
    "iframe_url": "https://example.com/dashboard",
    "sandbox": ["allow-scripts", "allow-same-origin"]
  }
}
```

**Utilisation**: Pour intégrer des outils externes ou des dashboards tiers.

---

## 🧪 Tests

### Tests Backend

1. **Tests unitaires**:
   - Création, lecture, mise à jour, suppression de widgets
   - Validation des schémas
   - Gestion des permissions

2. **Tests d'intégration**:
   - Endpoints API complets
   - Gestion des erreurs

### Tests Frontend

1. **Tests unitaires**:
   - Composants d'édition
   - Composant de rendu
   - Transformation de données

2. **Tests E2E**:
   - Création complète d'un widget
   - Ajout au dashboard
   - Affichage et rafraîchissement

---

## 📚 Documentation

### Documentation Utilisateur

1. **Guide de création de widgets**
2. **Exemples de widgets pour chaque type**
3. **Bonnes pratiques**
4. **FAQ**

### Documentation Technique

1. **Architecture du système**
2. **API Reference**
3. **Guide de développement de nouveaux types**

---

## 🚀 Déploiement

### Étapes de Déploiement

1. **Migration de base de données**
2. **Déploiement backend**
3. **Déploiement frontend**
4. **Tests de régression**
5. **Communication aux utilisateurs**

---

## 📈 Métriques de Succès

- **Adoption**: % d'utilisateurs créant au moins un widget personnalisé
- **Engagement**: Nombre moyen de widgets personnalisés par utilisateur
- **Performance**: Temps de chargement des widgets personnalisés
- **Erreurs**: Taux d'erreur des widgets personnalisés

---

## 🔄 Améliorations Futures

1. **Marketplace de widgets**: Partage et vente de widgets
2. **Templates de widgets**: Bibliothèque de templates prêts à l'emploi
3. **Widgets collaboratifs**: Édition en temps réel à plusieurs
4. **Widgets avec IA**: Génération automatique de widgets
5. **Export/Import**: Sauvegarde et restauration de widgets

---

## ⏱️ Estimation Totale

- **Phase 1**: 2-3 jours
- **Phase 2**: 3-4 jours
- **Phase 3**: 2 jours
- **Phase 4**: 3-4 jours
- **Phase 5**: 2 jours
- **Phase 6**: 2-3 jours

**Total**: 14-18 jours de développement

---

## ✅ Checklist de Démarrage

- [ ] Valider le plan avec l'équipe
- [ ] Créer les issues GitHub
- [ ] Préparer l'environnement de développement
- [ ] Créer la branche de développement
- [ ] Commencer Phase 1

---

**Note**: Ce plan est une proposition initiale et peut être ajusté selon les besoins et contraintes du projet.
