"""
Leo Agent API Endpoints
Endpoints for managing Leo AI assistant conversations and messages
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.leo import (
    LeoConversation,
    LeoConversationListResponse,
    LeoConversationUpdate,
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
    user_id: Optional[int] = Query(None, description="Optional user ID to filter conversations (superadmin only)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get conversations for the current user or specified user (superadmin only)
    
    Returns a paginated list of conversations ordered by most recently updated.
    If user_id is provided, only superadmins can use it to view another user's conversations.
    """
    from app.dependencies import is_superadmin
    
    # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
    target_user_id = int(current_user.id) if current_user.id is not None else 0
    
    # If user_id is provided, check if current user is superadmin
    if user_id is not None:
        user_is_superadmin = await is_superadmin(current_user, db)
        if not user_is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only superadmins can view other users' conversations"
            )
        target_user_id = user_id
    
    leo_service = LeoAgentService(db)
    conversations, total = await leo_service.get_user_conversations(
        user_id=target_user_id,
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
    Superadmins can view any conversation.
    """
    from app.dependencies import is_superadmin
    
    leo_service = LeoAgentService(db)
    
    # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
    user_id = int(current_user.id) if current_user.id is not None else 0
    
    # Try to get conversation for current user first
    conversation = await leo_service.get_conversation(conversation_id, user_id)
    
    # If not found and user is superadmin, try to get conversation without user filter
    if not conversation:
        user_is_superadmin = await is_superadmin(current_user, db)
        if user_is_superadmin:
            # For superadmins, get conversation without user filter
            from app.modules.leo.models import LeoConversation as LeoConversationModel
            result = await db.execute(
                select(LeoConversationModel).where(LeoConversationModel.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
    
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
    Superadmins can view messages from any conversation.
    """
    from app.dependencies import is_superadmin
    
    leo_service = LeoAgentService(db)
    
    # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
    user_id = int(current_user.id) if current_user.id is not None else 0
    
    # Verify conversation belongs to user
    conversation = await leo_service.get_conversation(conversation_id, user_id)
    
    # If not found and user is superadmin, try to get conversation without user filter
    if not conversation:
        user_is_superadmin = await is_superadmin(current_user, db)
        if user_is_superadmin:
            # For superadmins, get conversation without user filter
            from app.modules.leo.models import LeoConversation as LeoConversationModel
            result = await db.execute(
                select(LeoConversationModel).where(LeoConversationModel.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = await leo_service.get_conversation_messages(conversation_id)
    
    # Convert messages to dict format to avoid greenlet_spawn errors
    # Ensure metadata is properly serialized as dict
    message_items = []
    for msg in messages:
        # Extract all attributes immediately while in async context
        msg_id = int(msg.id) if msg.id is not None else 0
        msg_conversation_id = int(msg.conversation_id) if msg.conversation_id is not None else 0
        msg_role = str(msg.role) if msg.role is not None else ""
        msg_content = str(msg.content) if msg.content is not None else ""
        msg_created_at = msg.created_at
        
        # Handle metadata - convert SQLAlchemy MetaData object to dict if needed
        msg_metadata = {}
        if msg.message_metadata is not None:
            if isinstance(msg.message_metadata, dict):
                msg_metadata = msg.message_metadata
            else:
                # Try to convert to dict if it's a SQLAlchemy object or other type
                try:
                    # If it has __dict__, use it
                    if hasattr(msg.message_metadata, '__dict__'):
                        msg_metadata = dict(msg.message_metadata.__dict__)
                    # If it's iterable (like a dict), convert it
                    elif hasattr(msg.message_metadata, 'items'):
                        msg_metadata = dict(msg.message_metadata)
                    # Otherwise, try to convert to string and parse if possible
                    else:
                        msg_metadata = {}
                except Exception:
                    msg_metadata = {}
        
        msg_dict = {
            "id": msg_id,
            "conversation_id": msg_conversation_id,
            "role": msg_role,
            "content": msg_content,
            "created_at": msg_created_at,
            "metadata": msg_metadata,
        }
        message_items.append(LeoMessage.model_validate(msg_dict))
    
    return LeoMessageListResponse(
        items=message_items,
        total=len(messages),
        conversation_id=conversation_id
    )


@router.put("/conversations/{conversation_id}", response_model=LeoConversation)
async def update_conversation(
    conversation_id: int,
    update_data: LeoConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a conversation (e.g., rename it)
    
    Only the owner can update their conversation.
    Superadmins can update any conversation.
    """
    from app.dependencies import is_superadmin
    
    leo_service = LeoAgentService(db)
    
    # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
    user_id = int(current_user.id) if current_user.id is not None else 0
    
    # Verify conversation belongs to user
    conversation = await leo_service.get_conversation(conversation_id, user_id)
    
    # If not found and user is superadmin, try to get conversation without user filter
    if not conversation:
        user_is_superadmin = await is_superadmin(current_user, db)
        if user_is_superadmin:
            from app.modules.leo.models import LeoConversation as LeoConversationModel
            result = await db.execute(
                select(LeoConversationModel).where(LeoConversationModel.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Update conversation
    if update_data.title is not None:
        conversation.title = update_data.title
        await db.commit()
        await db.refresh(conversation)
    
    return LeoConversation.model_validate(conversation)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a conversation and all its messages
    
    Only the owner can delete their conversation.
    Superadmins can delete any conversation.
    """
    from app.dependencies import is_superadmin
    
    leo_service = LeoAgentService(db)
    
    # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
    user_id = int(current_user.id) if current_user.id is not None else 0
    
    # Try to delete conversation for current user
    deleted = await leo_service.delete_conversation(conversation_id, user_id)
    
    # If not found and user is superadmin, try to delete without user filter
    if not deleted:
        user_is_superadmin = await is_superadmin(current_user, db)
        if user_is_superadmin:
            from app.modules.leo.models import LeoConversation as LeoConversationModel
            result = await db.execute(
                select(LeoConversationModel).where(LeoConversationModel.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
            if conversation:
                await db.delete(conversation)
                await db.commit()
                return None
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None


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
            detail="No AI provider is configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.",
        )
    
    leo_service = LeoAgentService(db)
    
    try:
        # CRITICAL: Extract user_id immediately to avoid greenlet_spawn errors
        # Access user.id while still in the async context where user was loaded
        user_id = int(current_user.id) if current_user.id is not None else 0
        
        # 1. Get or create conversation
        if request.conversation_id:
            conversation = await leo_service.get_conversation(request.conversation_id, user_id)
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conversation = await leo_service.create_conversation(user_id)
        
        # CRITICAL: Extract conversation.id immediately after getting/creating conversation
        conversation_id = int(conversation.id) if conversation.id is not None else 0
        
        # 2. Save user message
        user_message = await leo_service.add_message(
            conversation_id=conversation_id,
            role="user",
            content=request.message,
        )
        
        # 3. Get user context (pass user_id directly to avoid greenlet_spawn errors)
        user_context = await leo_service.get_user_context(user_id)
        
        # 4. Get relevant data based on query (pass user_id directly to avoid greenlet_spawn errors)
        relevant_data = await leo_service.get_relevant_data(request.message, user_id)
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
        
        # 7. Get conversation history (conversation_id already extracted above)
        previous_messages = await leo_service.get_conversation_messages(conversation_id)
        # Convert messages to dict format immediately to avoid greenlet_spawn errors
        api_messages = []
        for msg in previous_messages:
            # Extract all attributes immediately while in async context
            msg_role = str(msg.role) if msg.role is not None else ""
            msg_content = str(msg.content) if msg.content is not None else ""
            api_messages.append({
                "role": msg_role,
                "content": msg_content
            })
        
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
                conversation_id=conversation_id,
                role="assistant",
                content=response["content"],
                metadata={
                    "provider": response.get("provider"),
                    "model": response.get("model"),
                    "usage": response.get("usage"),
                },
            )
            
            # CRITICAL: Extract assistant_message.id immediately
            assistant_message_id = int(assistant_message.id) if assistant_message.id is not None else 0
            
            return LeoQueryResponse(
                content=response["content"],
                conversation_id=conversation_id,
                message_id=assistant_message_id,
                provider=response.get("provider", "unknown"),
                model=response.get("model"),
                usage=response.get("usage"),
            )
            
        except Exception as e:
            logger.error(f"AI service error: {e}")
            # Save error message (conversation_id already extracted above)
            error_message = await leo_service.add_message(
                conversation_id=conversation_id,
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
