"""
Custom Widget Schemas
Pydantic schemas for custom widget API
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class CustomWidgetConfig(BaseModel):
    """Configuration d'un widget personnalisé"""
    title: Optional[str] = None
    period: Optional[str] = None
    refresh_interval: Optional[int] = None
    filters: Optional[Dict[str, Any]] = None
    # Config spécifique selon le type
    html_content: Optional[str] = None  # Pour type 'html'
    css_content: Optional[str] = None  # Pour type 'html'
    api_endpoint: Optional[str] = None  # Pour type 'api'
    chart_type: Optional[str] = None  # Pour type 'chart' (line, bar, pie, etc.)
    chart_config: Optional[Dict[str, Any]] = None  # Pour type 'chart'
    text_content: Optional[str] = None  # Pour type 'text'
    text_format: Optional[str] = "markdown"  # Pour type 'text' (markdown, html, plain)
    iframe_url: Optional[str] = None  # Pour type 'iframe'
    iframe_sandbox: Optional[list[str]] = None  # Pour type 'iframe'
    template: Optional[str] = None  # Template pour afficher les données (pour type 'api')


class CustomWidgetDataSource(BaseModel):
    """Source de données pour un widget personnalisé"""
    type: str = Field(..., description="Type de source: 'api', 'query', 'static'")
    endpoint: Optional[str] = Field(None, description="Endpoint API")
    method: Optional[str] = Field("GET", description="Méthode HTTP")
    headers: Optional[Dict[str, str]] = None
    params: Optional[Dict[str, Any]] = None
    body: Optional[Dict[str, Any]] = None
    transform: Optional[str] = Field(None, description="Code JavaScript pour transformer les données")
    data_path: Optional[str] = Field(None, description="Chemin JSON pour extraire les données (ex: 'data.items')")


class CustomWidgetStyle(BaseModel):
    """Styles personnalisés pour un widget"""
    backgroundColor: Optional[str] = None
    textColor: Optional[str] = None
    borderColor: Optional[str] = None
    borderRadius: Optional[int] = None
    padding: Optional[int] = None
    fontSize: Optional[int] = None
    fontFamily: Optional[str] = None
    borderWidth: Optional[int] = None
    boxShadow: Optional[str] = None


class CustomWidgetCreate(BaseModel):
    """Schéma pour créer un widget personnalisé"""
    name: str = Field(..., min_length=1, max_length=255, description="Nom du widget")
    description: Optional[str] = Field(None, description="Description du widget")
    type: str = Field(..., description="Type de widget: 'html', 'api', 'chart', 'text', 'iframe'")
    config: CustomWidgetConfig = Field(..., description="Configuration du widget")
    data_source: Optional[CustomWidgetDataSource] = Field(None, description="Source de données")
    style: Optional[CustomWidgetStyle] = Field(None, description="Styles personnalisés")
    is_public: bool = Field(False, description="Partager avec d'autres utilisateurs")


class CustomWidgetUpdate(BaseModel):
    """Schéma pour mettre à jour un widget personnalisé"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = None
    config: Optional[CustomWidgetConfig] = None
    data_source: Optional[CustomWidgetDataSource] = None
    style: Optional[CustomWidgetStyle] = None
    is_public: Optional[bool] = None


class CustomWidgetResponse(BaseModel):
    """Schéma de réponse pour un widget personnalisé"""
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

    class Config:
        from_attributes = True
