"""
Leo Agent API Endpoints
Endpoints for managing Leo AI assistant conversations and messages
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.leo import (
    LeoConversation,
    LeoConversationListResponse,
    LeoMessage,
    LeoMessageListResponse,
    LeoQueryRequest,
    LeoQueryResponse,
)
from app.dependencies import get_current_user, get_db
from app.services.leo_agent_service import LeoAgentService
from app.services.ai_service import AIService, AIProvider
from app.services.documentation_service import get_documentation_service
from app.core.logging import logger

router = APIRouter(prefix="/ai/leo", tags=["leo-agent"])


@router.get("/conversations", response_model=LeoConversationListResponse)
async def get_conversations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get conversations for the current user
    
    Returns a paginated list of conversations ordered by most recently updated.
    """
    leo_service = LeoAgentService(db)
    conversations, total = await leo_service.get_user_conversations(
        user_id=current_user.id,
        limit=limit,
        skip=skip
    )
    
    return LeoConversationListResponse(
        items=[LeoConversation.model_validate(conv) for conv in conversations],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/conversations/{conversation_id}", response_model=LeoConversation)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific conversation
    
    Only returns the conversation if it belongs to the current user.
    """
    leo_service = LeoAgentService(db)
    conversation = await leo_service.get_conversation(conversation_id, current_user.id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return LeoConversation.model_validate(conversation)


@router.get("/conversations/{conversation_id}/messages", response_model=LeoMessageListResponse)
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all messages for a conversation
    
    Only returns messages if the conversation belongs to the current user.
    """
    leo_service = LeoAgentService(db)
    
    # Verify conversation belongs to user
    conversation = await leo_service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = await leo_service.get_conversation_messages(conversation_id)
    
    return LeoMessageListResponse(
        items=[LeoMessage.model_validate(msg) for msg in messages],
        total=len(messages),
        conversation_id=conversation_id
    )


@router.post("/query", response_model=LeoQueryResponse)
async def leo_query(
    request: LeoQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Query Leo AI assistant
    
    This endpoint handles the main interaction with Leo:
    - Creates or continues a conversation
    - Saves user message
    - Retrieves user context and relevant data
    - Generates AI response with enriched context
    - Saves AI response
    """
    # Check if AI service is configured
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    leo_service = LeoAgentService(db)
    
    try:
        # 1. Get or create conversation
        if request.conversation_id:
            conversation = await leo_service.get_conversation(request.conversation_id, current_user.id)
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conversation = await leo_service.create_conversation(current_user.id)
        
        # 2. Save user message
        user_message = await leo_service.add_message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        
        # 3. Get user context
        user_context = await leo_service.get_user_context(current_user)
        
        # 4. Get relevant data based on query
        relevant_data = await leo_service.get_relevant_data(request.message, current_user)
        data_context = await leo_service.format_data_for_ai(relevant_data)
        
        # 5. Load active documentation
        doc_service = get_documentation_service()
        documentation_context = ""
        try:
            documentation_context = doc_service.format_documentation_for_context(max_total_size=40000)
        except Exception as e:
            logger.warning(f"Failed to load Leo documentation context: {e}")
        
        # 6. Build enriched system prompt
        stats = user_context.get('statistics', {})
        stats_text = (
            f"- Projets: {stats.get('projects_count', 0)}\n"
            f"- Factures: {stats.get('invoices_count', 0)}\n"
            f"- Tâches assignées: {stats.get('tasks_count', 0)}\n"
            f"- Contacts assignés: {stats.get('contacts_count', 0)}"
        )
        
        system_prompt = f"""Tu es Leo, l'assistant IA de l'ERP Nukleo.

CONTEXTE UTILISATEUR:
- Nom: {user_context['name']}
- Email: {user_context['email']}
- Rôles: {', '.join(user_context['roles']) if user_context['roles'] else 'Aucun'}
- Permissions: {', '.join(user_context['permissions'][:20]) if user_context['permissions'] else 'Aucune'}  # Limité pour éviter le dépassement
- Équipes: {', '.join(user_context['teams']) if user_context['teams'] else 'Aucune'}
- Statistiques:
{stats_text}

RÈGLES IMPORTANTES:
1. Adapte tes réponses selon les permissions de l'utilisateur
2. Ne mentionne que les fonctionnalités auxquelles l'utilisateur a accès
3. Utilise les données fournies pour répondre de manière précise
4. Sois concis mais complet
5. Réponds toujours en français sauf demande contraire
6. Utilise les statistiques pour donner un contexte sur l'activité de l'utilisateur

DONNÉES DISPONIBLES:
{data_context}

DOCUMENTATION:
{documentation_context}

Souviens-toi: Tu as accès aux données réelles de l'ERP. Utilise-les pour fournir des réponses précises et actionnables."""
        
        # 7. Get conversation history
        previous_messages = await leo_service.get_conversation_messages(conversation.id)
        api_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in previous_messages
        ]
        
        # 8. Call AI service
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
            
            # 9. Save assistant response
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
                model=response.get("model"),
                usage=response.get("usage"),
            )
            
        except Exception as e:
            logger.error(f"AI service error: {e}")
            # Save error message
            error_message = await leo_service.add_message(
                conversation_id=conversation.id,
                role="assistant",
                content=f"Désolé, une erreur s'est produite lors de la génération de la réponse. Veuillez réessayer.",
                metadata={"error": True, "error_message": str(e)},
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la génération de la réponse: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in leo_query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur inattendue: {str(e)}"
        )
