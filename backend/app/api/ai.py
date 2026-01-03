"""AI endpoints using OpenAI and Anthropic (Claude)."""

from typing import Optional, List, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models import User
from app.services.ai_service import AIService, AIProvider
from app.services.documentation_service import get_documentation_service
from app.core.database import get_db
from app.core.logging import logger

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    """Chat message schema."""
    role: str = Field(..., pattern="^(system|user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Chat completion request schema."""
    messages: List[ChatMessage] = Field(..., min_items=1)
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(default="auto", description="AI provider to use")
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=4000)
    system_prompt: Optional[str] = None


class SimpleChatRequest(BaseModel):
    """Simple chat request schema."""
    message: str = Field(..., min_length=1)
    provider: Optional[Literal["openai", "anthropic", "auto"]] = Field(default="auto", description="AI provider to use")
    system_prompt: Optional[str] = None
    model: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat completion response schema."""
    content: str
    model: str
    provider: str
    usage: dict
    finish_reason: str


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a chat completion using OpenAI or Anthropic (Claude)."""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Try to get Leo settings and build system prompt
        system_prompt = request.system_prompt
        provider_preference = request.provider
        temperature = request.temperature
        max_tokens = request.max_tokens
        model = request.model
        
        try:
            from app.services.leo_settings_service import LeoSettingsService
            from app.services.leo_context_service import LeoContextService
            
            leo_service = LeoSettingsService(db)
            leo_settings = await leo_service.get_leo_settings(current_user.id)
            
            # Use Leo settings if no system_prompt provided or if Leo settings exist
            if not system_prompt or leo_settings.get("custom_instructions") or leo_settings.get("markdown_content"):
                system_prompt = await leo_service.build_system_prompt(current_user.id)
            
            # Use Leo provider preference if set and request provider is "auto"
            if provider_preference == "auto" and leo_settings.get("provider_preference") != "auto":
                provider_preference = leo_settings.get("provider_preference", "auto")
            
            # Use Leo temperature if not provided in request
            if temperature is None:
                temperature = leo_settings.get("temperature", 0.7)
            
            # Use Leo max_tokens if not provided in request
            if max_tokens is None:
                max_tokens = leo_settings.get("max_tokens")
            
            # Use Leo model preference if not provided in request
            if model is None:
                model = leo_settings.get("model_preference")
            
            # Get ERP context if enabled
            erp_context = ""
            if leo_settings.get("enable_erp_context", True):
                try:
                    context_service = LeoContextService(db)
                    
                    # Get last user message
                    last_user_message = None
                    for msg in reversed(request.messages):
                        if msg.role == "user":
                            last_user_message = msg.content
                            break
                    
                    if last_user_message:
                        # Analyze query to determine relevant data types
                        data_types = context_service.analyze_query(last_user_message)
                        
                        # Log for debugging
                        logger.debug(f"Leo query analysis for '{last_user_message}': {data_types}")
                        
                        # Get relevant data
                        relevant_data = await context_service.get_relevant_data(
                            current_user.id,
                            data_types,
                            last_user_message
                        )
                        
                        # Log data found
                        data_counts = {k: len(v) for k, v in relevant_data.items()}
                        logger.debug(f"Leo context data found: {data_counts}")
                        
                        # Build context string
                        erp_context = await context_service.build_context_string(
                            relevant_data,
                            last_user_message
                        )
                        
                        if erp_context:
                            logger.debug(f"Leo ERP context generated ({len(erp_context)} chars)")
                except Exception as e:
                    logger.warning(f"Could not load ERP context: {e}", exc_info=True)
                    erp_context = ""
            
            # Add ERP context to system prompt if available - SIMPLIFIED FORMAT
            if erp_context:
                system_prompt += f"\n\n=== DONNÉES ERP ===\n{erp_context}\n=== FIN DONNÉES ===\n\nRÈGLES:\n- Utilise UNIQUEMENT les données ci-dessus pour répondre\n- Si tu vois 'RÉSUMÉ: CONTACTS: 200', réponds 'Vous avez 200 contacts'\n- Si tu vois 'CLIENTS: 64', réponds 'Vous avez 64 clients'\n- Si tu vois des détails (noms, emails, etc.), utilise-les pour répondre\n- Ne dis JAMAIS 'je n'ai pas accès' - tu as toujours accès aux données ci-dessus\n- Si le contexte est vide, dis 'J'ai cherché mais je n'ai rien trouvé'"
            else:
                # Even if no specific context, add instruction that Leo has access to ERP data
                system_prompt += "\n\n⚠️ IMPORTANT: Tu as accès aux données de l'ERP Nukleo (contacts, entreprises, projets, opportunités, employés). J'ai cherché dans la base de données pour cette requête mais n'ai trouvé aucune donnée correspondante. Dis clairement à l'utilisateur: 'J'ai cherché dans vos données ERP mais je n'ai pas trouvé d'informations correspondantes.' Ne dis JAMAIS que tu n'as pas accès aux données."
        except Exception as e:
            # If Leo settings fail, use defaults
            logger.debug(f"Could not load Leo settings, using defaults: {e}")
            if not system_prompt:
                system_prompt = "Tu es Leo, l'assistant IA de l'ERP Nukleo. Réponds toujours en français sauf demande contraire. Sois concis mais complet."
        
        # Resolve provider
        provider = AIProvider(provider_preference) if provider_preference != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        response = await service.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            system_prompt=system_prompt,
        )
        
        return ChatResponse(**response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/chat/simple", response_model=dict)
async def simple_chat(
    request: SimpleChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Simple chat completion using OpenAI or Anthropic (Claude)."""
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Resolve provider
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        response = await service.simple_chat(
            user_message=request.message,
            system_prompt=request.system_prompt,
            model=request.model,
        )
        
        return {
            "response": response,
            "provider": service.provider.value,
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.post("/chat/template", response_model=ChatResponse)
async def template_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Chat completion with template documentation context.
    This endpoint automatically includes template documentation in the system prompt.
    """
    if not AIService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI provider is configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        )
    
    try:
        # Load documentation
        doc_service = get_documentation_service()
        documentation_context = doc_service.format_documentation_for_context(max_total_size=80000)
        doc_summary = doc_service.get_documentation_summary()
        
        # Build enhanced system prompt
        base_system_prompt = request.system_prompt or """You are a helpful AI assistant specialized in helping users understand and work with the Next.js Full-Stack Template.

You have access to the complete template documentation. Use this information to provide accurate, helpful answers about:
- Template features and capabilities
- Setup and configuration
- Architecture and design patterns
- API endpoints and usage
- Database schema and migrations
- Authentication and security
- Deployment and development workflows
- Customization and theming
- And any other template-related questions

Always cite specific documentation when providing answers. If you're unsure about something, say so rather than guessing.

Be friendly, professional, and concise. Format your responses clearly with proper markdown when appropriate."""

        enhanced_system_prompt = f"""{base_system_prompt}

=== TEMPLATE DOCUMENTATION ===

{doc_summary}

{documentation_context}

=== END DOCUMENTATION ===

Remember: You have access to the complete template documentation above. Use it to provide accurate, detailed answers."""

        # Resolve provider
        provider = AIProvider(request.provider) if request.provider != "auto" else AIProvider.AUTO
        service = AIService(provider=provider)
        
        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        response = await service.chat_completion(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens or 2000,  # Increased for longer responses
            system_prompt=enhanced_system_prompt,
        )
        
        return ChatResponse(**response)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.get("/health")
async def ai_health_check(
    current_user: User = Depends(get_current_user),
):
    """Check AI provider configuration and connectivity."""
    result = {
        "configured": False,
        "available_providers": AIService.get_available_providers(),
        "providers": {},
    }
    
    # Check OpenAI
    if AIService.is_configured(AIProvider.OPENAI):
        try:
            service = AIService(provider=AIProvider.OPENAI)
            test_response = await service.simple_chat(
                user_message="Say 'OK' if you can hear me.",
            )
            result["providers"]["openai"] = {
                "configured": True,
                "available": True,
                "model": service.model,
                "test_response": test_response[:50],
            }
            result["configured"] = True
        except Exception as e:
            result["providers"]["openai"] = {
                "configured": True,
                "available": False,
                "error": str(e),
            }
    
    # Check Anthropic
    if AIService.is_configured(AIProvider.ANTHROPIC):
        try:
            service = AIService(provider=AIProvider.ANTHROPIC)
            test_response = await service.simple_chat(
                user_message="Say 'OK' if you can hear me.",
            )
            result["providers"]["anthropic"] = {
                "configured": True,
                "available": True,
                "model": service.model,
                "test_response": test_response[:50],
            }
            result["configured"] = True
        except Exception as e:
            result["providers"]["anthropic"] = {
                "configured": True,
                "available": False,
                "error": str(e),
            }
    
    if not result["configured"]:
        result["error"] = "No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
    
    return result

