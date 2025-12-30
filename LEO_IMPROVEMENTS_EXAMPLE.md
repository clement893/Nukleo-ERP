# Exemples d'Implémentation - Améliorations Leo

Ce document contient des exemples de code pour implémenter les améliorations proposées dans l'audit.

## 1. Modèle de Données pour Conversations

```python
# backend/app/models/leo_conversation.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class LeoConversation(Base):
    """Modèle pour stocker les conversations avec Leo"""
    __tablename__ = "leo_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    user = relationship("User", backref="leo_conversations")
    messages = relationship("LeoMessage", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<LeoConversation(id={self.id}, user_id={self.user_id}, title='{self.title}')>"


class LeoMessage(Base):
    """Modèle pour stocker les messages d'une conversation"""
    __tablename__ = "leo_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("leo_conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    metadata = Column(JSON, nullable=True)  # Données supplémentaires (provider, tokens, etc.)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relations
    conversation = relationship("LeoConversation", back_populates="messages")
    
    def __repr__(self):
        return f"<LeoMessage(id={self.id}, conversation_id={self.conversation_id}, role='{self.role}')>"
```

## 2. Service Leo Agent

```python
# backend/app/services/leo_agent_service.py

from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.leo_conversation import LeoConversation, LeoMessage
from app.services.rbac_service import RBACService
from app.models.role import Role
from app.models.project import Project
from app.models.team import TeamMember


class LeoAgentService:
    """Service pour gérer les interactions avec Leo"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rbac_service = RBACService(db)
    
    async def get_user_context(self, user: User) -> Dict:
        """Récupère le contexte complet de l'utilisateur"""
        # Récupérer les rôles
        roles = await self.rbac_service.get_user_roles(user.id)
        role_names = [role.slug for role in roles]
        
        # Récupérer les permissions
        permissions = await self.rbac_service.get_user_permissions(user.id)
        
        # Récupérer les équipes
        teams_query = select(TeamMember).where(TeamMember.user_id == user.id)
        teams_result = await self.db.execute(teams_query)
        teams = teams_result.scalars().all()
        team_names = [team.team.name for team in teams if team.team]
        
        return {
            "user_id": user.id,
            "email": user.email,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email,
            "roles": role_names,
            "permissions": sorted(list(permissions)),
            "teams": team_names,
            "is_superadmin": user.is_superadmin,
        }
    
    async def get_relevant_data(self, query: str, user: User) -> Dict:
        """Récupère les données pertinentes selon la requête"""
        data = {}
        
        # Analyser la requête pour déterminer quelles données récupérer
        query_lower = query.lower()
        
        # Projets
        if any(word in query_lower for word in ['projet', 'project', 'mes projets']):
            projects_query = select(Project).where(Project.user_id == user.id)
            projects_result = await self.db.execute(projects_query)
            projects = projects_result.scalars().all()
            data['projects'] = [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "status": p.status,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in projects[:10]  # Limiter à 10
            ]
        
        # Ajouter d'autres types de données selon les besoins
        # - Clients
        # - Factures
        # - Commandes
        # - Tâches
        # etc.
        
        return data
    
    async def format_data_for_ai(self, data: Dict) -> str:
        """Formate les données pour le contexte IA"""
        context_parts = []
        
        if 'projects' in data:
            projects = data['projects']
            context_parts.append(f"=== PROJETS DE L'UTILISATEUR ===\n")
            for project in projects:
                context_parts.append(
                    f"- {project['name']} (ID: {project['id']}, Statut: {project['status']})\n"
                    f"  Description: {project.get('description', 'N/A')}\n"
                )
        
        return "\n".join(context_parts)
    
    async def create_conversation(self, user_id: int, title: Optional[str] = None) -> LeoConversation:
        """Crée une nouvelle conversation"""
        if not title:
            title = f"Conversation {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        
        conversation = LeoConversation(
            user_id=user_id,
            title=title,
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation
    
    async def add_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        metadata: Optional[Dict] = None,
    ) -> LeoMessage:
        """Ajoute un message à une conversation"""
        message = LeoMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata or {},
        )
        self.db.add(message)
        
        # Mettre à jour la date de modification de la conversation
        conversation = await self.db.get(LeoConversation, conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(message)
        return message
    
    async def get_conversation_messages(self, conversation_id: int) -> List[LeoMessage]:
        """Récupère tous les messages d'une conversation"""
        query = select(LeoMessage).where(
            LeoMessage.conversation_id == conversation_id
        ).order_by(LeoMessage.created_at.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_user_conversations(self, user_id: int, limit: int = 20) -> List[LeoConversation]:
        """Récupère les conversations d'un utilisateur"""
        query = select(LeoConversation).where(
            LeoConversation.user_id == user_id
        ).order_by(LeoConversation.updated_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
```

## 3. Endpoint API Amélioré

```python
# backend/app/api/v1/endpoints/leo_agent.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.leo_agent_service import LeoAgentService
from app.services.ai_service import AIService, AIProvider
from app.services.leo_documentation_service import get_documentation_service

router = APIRouter(prefix="/ai/leo", tags=["leo-agent"])


class LeoQueryRequest(BaseModel):
    """Requête pour Leo"""
    message: str = Field(..., min_length=1, description="Message de l'utilisateur")
    conversation_id: Optional[int] = Field(None, description="ID de la conversation (si continuation)")
    provider: str = Field("auto", description="Provider IA à utiliser")


class LeoQueryResponse(BaseModel):
    """Réponse de Leo"""
    content: str
    conversation_id: int
    message_id: int
    provider: str
    model: str
    usage: Optional[Dict[str, int]] = None


@router.post("/query", response_model=LeoQueryResponse)
async def leo_query(
    request: LeoQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint principal pour interagir avec Leo.
    Accède aux données ERP et génère des réponses contextuelles.
    """
    leo_service = LeoAgentService(db)
    
    # 1. Récupérer le contexte utilisateur
    user_context = await leo_service.get_user_context(current_user)
    
    # 2. Récupérer ou créer une conversation
    if request.conversation_id:
        conversation = await db.get(LeoConversation, request.conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    else:
        conversation = await leo_service.create_conversation(current_user.id)
    
    # 3. Sauvegarder le message utilisateur
    user_message = await leo_service.add_message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    
    # 4. Récupérer les données pertinentes
    relevant_data = await leo_service.get_relevant_data(request.message, current_user)
    data_context = await leo_service.format_data_for_ai(relevant_data)
    
    # 5. Charger la documentation active
    doc_service = get_documentation_service()
    documentation_context = doc_service.format_documentation_for_context(max_total_size=40000)
    
    # 6. Construire le system prompt enrichi
    system_prompt = f"""Tu es Leo, l'assistant IA de l'ERP Nukleo.

CONTEXTE UTILISATEUR:
- Nom: {user_context['name']}
- Email: {user_context['email']}
- Rôles: {', '.join(user_context['roles'])}
- Permissions: {', '.join(user_context['permissions'][:20])}  # Limiter pour éviter le dépassement
- Équipes: {', '.join(user_context['teams'])}

RÈGLES IMPORTANTES:
1. Adapte tes réponses selon les permissions de l'utilisateur
2. Ne mentionne que les fonctionnalités auxquelles l'utilisateur a accès
3. Utilise les données fournies pour répondre de manière précise
4. Sois concis mais complet
5. Réponds toujours en français sauf demande contraire

DONNÉES DISPONIBLES:
{data_context}

DOCUMENTATION:
{documentation_context}

Souviens-toi: Tu as accès aux données réelles de l'ERP. Utilise-les pour fournir des réponses précises et actionnables."""
    
    # 7. Récupérer l'historique de la conversation
    previous_messages = await leo_service.get_conversation_messages(conversation.id)
    api_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in previous_messages
    ]
    
    # 8. Appeler l'IA
    provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
    ai_service = AIService(provider=provider)
    
    try:
        response = await ai_service.chat_completion(
            messages=api_messages,
            system_prompt=system_prompt,
            model=None,  # Auto-select
            temperature=0.7,
            max_tokens=2000,
        )
        
        # 9. Sauvegarder la réponse
        assistant_message = await leo_service.add_message(
            conversation_id=conversation.id,
            role="assistant",
            content=response["content"],
            metadata={
                "provider": response.get("provider"),
                "model": response.get("model"),
                "usage": response.get("usage"),
            },
        )
        
        return LeoQueryResponse(
            content=response["content"],
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            provider=response.get("provider", "unknown"),
            model=response.get("model", "unknown"),
            usage=response.get("usage"),
        )
        
    except Exception as e:
        # En cas d'erreur, sauvegarder un message d'erreur
        error_message = await leo_service.add_message(
            conversation_id=conversation.id,
            role="assistant",
            content=f"Désolé, une erreur s'est produite: {str(e)}",
            metadata={"error": True},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de la réponse: {str(e)}"
        )


@router.get("/conversations", response_model=List[Dict])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Récupère les conversations de l'utilisateur"""
    leo_service = LeoAgentService(db)
    conversations = await leo_service.get_user_conversations(current_user.id, limit)
    
    return [
        {
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat(),
            "updated_at": conv.updated_at.isoformat(),
        }
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=List[Dict])
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Récupère les messages d'une conversation"""
    conversation = await db.get(LeoConversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    leo_service = LeoAgentService(db)
    messages = await leo_service.get_conversation_messages(conversation_id)
    
    return [
        {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "metadata": msg.metadata,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]
```

## 4. Migration Alembic

```python
# backend/alembic/versions/XXXX_add_leo_conversations.py

"""Add Leo conversations tables

Revision ID: xxxx
Revises: previous_revision
Create Date: 2025-01-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'xxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade():
    # Créer la table leo_conversations
    op.create_table(
        'leo_conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leo_conversations_id'), 'leo_conversations', ['id'], unique=False)
    op.create_index(op.f('ix_leo_conversations_user_id'), 'leo_conversations', ['user_id'], unique=False)
    
    # Créer la table leo_messages
    op.create_table(
        'leo_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['leo_conversations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_leo_messages_id'), 'leo_messages', ['id'], unique=False)
    op.create_index(op.f('ix_leo_messages_conversation_id'), 'leo_messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_leo_messages_created_at'), 'leo_messages', ['created_at'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_leo_messages_created_at'), table_name='leo_messages')
    op.drop_index(op.f('ix_leo_messages_conversation_id'), table_name='leo_messages')
    op.drop_index(op.f('ix_leo_messages_id'), table_name='leo_messages')
    op.drop_table('leo_messages')
    op.drop_index(op.f('ix_leo_conversations_user_id'), table_name='leo_conversations')
    op.drop_index(op.f('ix_leo_conversations_id'), table_name='leo_conversations')
    op.drop_table('leo_conversations')
```

## 5. Composant React Amélioré (Exemple)

```tsx
// apps/web/src/components/leo/LeoChat.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { Card, Button, Input } from '@/components/ui';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: any;
}

interface Conversation {
  id: number;
  title: string;
  updated_at: string;
}

export function LeoChat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, []);

  // Charger les messages si conversation sélectionnée
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId]);

  const loadConversations = async () => {
    try {
      const response = await apiClient.get('/v1/ai/leo/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (convId: number) => {
    try {
      const response = await apiClient.get(`/v1/ai/leo/conversations/${convId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/v1/ai/leo/query', {
        message: userMessage.content,
        conversation_id: conversationId,
      });

      const assistantMessage: Message = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.content,
        created_at: new Date().toISOString(),
        metadata: {
          provider: response.data.provider,
          model: response.data.model,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Mettre à jour la conversation ID si nouvelle conversation
      if (!conversationId) {
        setConversationId(response.data.conversation_id);
        loadConversations(); // Recharger la liste
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar des conversations */}
      <div className="w-64 border-r p-4">
        <Button onClick={startNewConversation} className="w-full mb-4">
          <MessageSquare className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
        
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setConversationId(conv.id)}
              className={`w-full text-left p-2 rounded ${
                conversationId === conv.id ? 'bg-primary-100' : 'hover:bg-muted'
              }`}
            >
              <div className="font-medium truncate">{conv.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(conv.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert">
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez votre question à Leo..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

**Note:** Ces exemples sont des illustrations. L'implémentation réelle nécessitera des ajustements selon votre architecture spécifique.
