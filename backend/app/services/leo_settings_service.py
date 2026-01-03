"""
Leo Settings Service
Manages Leo AI assistant settings and preferences
"""

from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_preference_service import UserPreferenceService
from app.core.logging import logger


class LeoSettingsService:
    """Service for managing Leo AI assistant settings"""

    # Default settings
    DEFAULT_SETTINGS = {
        "tone": "professionnel",
        "approach": "concis",
        "language": "fr",
        "custom_instructions": "",
        "markdown_file_id": None,
        "markdown_file_name": None,
        "markdown_content": None,
        "temperature": 0.7,
        "max_tokens": None,
        "provider_preference": "auto",
        "model_preference": None,
        "enable_context_memory": False,
    }

    # Tone descriptions
    TONE_DESCRIPTIONS = {
        "professionnel": "Réponds de manière professionnelle et formelle, en utilisant un vocabulaire adapté au contexte professionnel.",
        "decontracte": "Réponds de manière décontractée et amicale, en utilisant un ton plus informel et accessible.",
        "technique": "Réponds de manière technique et précise, en utilisant la terminologie appropriée et en fournissant des détails techniques.",
        "amical": "Réponds de manière chaleureuse et amicale, en créant une atmosphère conviviale.",
        "formel": "Réponds de manière formelle et respectueuse, en utilisant un langage soutenu.",
    }

    # Approach descriptions
    APPROACH_DESCRIPTIONS = {
        "concis": "Sois concis dans tes réponses, va droit au but sans détours.",
        "detaille": "Fournis des réponses détaillées et complètes, en expliquant chaque point.",
        "avec_exemples": "Inclus toujours des exemples concrets dans tes réponses pour illustrer tes points.",
        "pas_a_pas": "Structure tes réponses en étapes claires et numérotées.",
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.preference_service = UserPreferenceService(db)

    async def get_leo_settings(self, user_id: int) -> Dict[str, Any]:
        """Get Leo settings for a user, returning defaults if not set"""
        try:
            preference = await self.preference_service.get_preference(user_id, "leo_settings")
            if preference and preference.value:
                # Merge with defaults to ensure all keys are present
                settings = {**self.DEFAULT_SETTINGS, **preference.value}
                return settings
            return self.DEFAULT_SETTINGS.copy()
        except Exception as e:
            logger.error(f"Error getting Leo settings for user {user_id}: {e}", exc_info=True)
            return self.DEFAULT_SETTINGS.copy()

    async def update_leo_settings(
        self, user_id: int, settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update Leo settings for a user"""
        try:
            # Get current settings
            current_settings = await self.get_leo_settings(user_id)
            
            # Merge with new settings
            updated_settings = {**current_settings, **settings}
            
            # Validate settings
            updated_settings = self._validate_settings(updated_settings)
            
            # Save to preferences
            await self.preference_service.set_preference(
                user_id, "leo_settings", updated_settings
            )
            
            logger.info(f"Leo settings updated for user {user_id}")
            return updated_settings
        except Exception as e:
            logger.error(f"Error updating Leo settings for user {user_id}: {e}", exc_info=True)
            raise

    def _validate_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize settings"""
        validated = {}
        
        # Validate tone
        if "tone" in settings:
            tone = settings["tone"]
            if tone in self.TONE_DESCRIPTIONS:
                validated["tone"] = tone
            else:
                validated["tone"] = self.DEFAULT_SETTINGS["tone"]
        else:
            validated["tone"] = self.DEFAULT_SETTINGS["tone"]
        
        # Validate approach
        if "approach" in settings:
            approach = settings["approach"]
            if approach in self.APPROACH_DESCRIPTIONS:
                validated["approach"] = approach
            else:
                validated["approach"] = self.DEFAULT_SETTINGS["approach"]
        else:
            validated["approach"] = self.DEFAULT_SETTINGS["approach"]
        
        # Validate language
        if "language" in settings:
            lang = settings["language"]
            if lang in ["fr", "en", "auto"]:
                validated["language"] = lang
            else:
                validated["language"] = self.DEFAULT_SETTINGS["language"]
        else:
            validated["language"] = self.DEFAULT_SETTINGS["language"]
        
        # Validate custom_instructions (max 2000 chars)
        if "custom_instructions" in settings:
            instructions = str(settings["custom_instructions"])[:2000]
            validated["custom_instructions"] = instructions
        else:
            validated["custom_instructions"] = self.DEFAULT_SETTINGS["custom_instructions"]
        
        # Validate markdown fields
        validated["markdown_file_id"] = settings.get("markdown_file_id")
        validated["markdown_file_name"] = settings.get("markdown_file_name")
        validated["markdown_content"] = settings.get("markdown_content")
        
        # Validate temperature (0.0 - 2.0)
        if "temperature" in settings:
            temp = float(settings["temperature"])
            validated["temperature"] = max(0.0, min(2.0, temp))
        else:
            validated["temperature"] = self.DEFAULT_SETTINGS["temperature"]
        
        # Validate max_tokens
        if "max_tokens" in settings and settings["max_tokens"] is not None:
            max_tokens = int(settings["max_tokens"])
            validated["max_tokens"] = max(1, min(4000, max_tokens)) if max_tokens > 0 else None
        else:
            validated["max_tokens"] = None
        
        # Validate provider_preference
        if "provider_preference" in settings:
            provider = settings["provider_preference"]
            if provider in ["auto", "openai", "anthropic"]:
                validated["provider_preference"] = provider
            else:
                validated["provider_preference"] = self.DEFAULT_SETTINGS["provider_preference"]
        else:
            validated["provider_preference"] = self.DEFAULT_SETTINGS["provider_preference"]
        
        # Validate model_preference
        validated["model_preference"] = settings.get("model_preference")
        
        # Validate enable_context_memory
        validated["enable_context_memory"] = bool(settings.get("enable_context_memory", False))
        
        return validated

    async def build_system_prompt(self, user_id: int) -> str:
        """Build the system prompt from user's Leo settings"""
        settings = await self.get_leo_settings(user_id)
        
        # Base prompt
        base_prompt = "Tu es Leo, l'assistant IA de l'ERP Nukleo.\n\n"
        
        # Add tone instruction
        tone_desc = self.TONE_DESCRIPTIONS.get(
            settings["tone"], self.TONE_DESCRIPTIONS["professionnel"]
        )
        base_prompt += f"{tone_desc}\n\n"
        
        # Add approach instruction
        approach_desc = self.APPROACH_DESCRIPTIONS.get(
            settings["approach"], self.APPROACH_DESCRIPTIONS["concis"]
        )
        base_prompt += f"{approach_desc}\n\n"
        
        # Add custom instructions if present
        if settings.get("custom_instructions"):
            base_prompt += f"Consignes personnalisées :\n{settings['custom_instructions']}\n\n"
        
        # Add markdown content if present
        if settings.get("markdown_content"):
            base_prompt += f"=== Instructions détaillées ===\n{settings['markdown_content']}\n=== Fin des instructions ===\n\n"
        
        # Add language instruction
        if settings["language"] == "fr":
            base_prompt += "Réponds toujours en français sauf demande contraire.\n"
        elif settings["language"] == "en":
            base_prompt += "Always respond in English unless asked otherwise.\n"
        else:
            base_prompt += "Réponds toujours en français sauf demande contraire.\n"
        
        base_prompt += "\nSois concis mais complet."
        
        return base_prompt

    async def upload_markdown_file(
        self, user_id: int, file_content: str, filename: str
    ) -> Dict[str, Any]:
        """Upload a markdown file for Leo instructions"""
        try:
            # Validate file size (max 500KB)
            if len(file_content.encode('utf-8')) > 500 * 1024:
                raise ValueError("Le fichier est trop volumineux (maximum 500KB)")
            
            # Validate filename
            if not filename.endswith('.md'):
                raise ValueError("Le fichier doit être au format Markdown (.md)")
            
            # Get current settings
            settings = await self.get_leo_settings(user_id)
            
            # Update markdown fields
            settings["markdown_file_name"] = filename
            settings["markdown_content"] = file_content
            settings["markdown_file_id"] = user_id  # Simple ID based on user_id
            
            # Save settings
            await self.preference_service.set_preference(
                user_id, "leo_settings", settings
            )
            
            logger.info(f"Markdown file uploaded for user {user_id}: {filename}")
            
            return {
                "success": True,
                "filename": filename,
                "size": len(file_content.encode('utf-8')),
            }
        except Exception as e:
            logger.error(f"Error uploading markdown file for user {user_id}: {e}", exc_info=True)
            raise

    async def download_markdown_file(self, user_id: int) -> Optional[str]:
        """Download the markdown file content"""
        try:
            settings = await self.get_leo_settings(user_id)
            return settings.get("markdown_content")
        except Exception as e:
            logger.error(f"Error downloading markdown file for user {user_id}: {e}", exc_info=True)
            return None

    async def delete_markdown_file(self, user_id: int) -> bool:
        """Delete the markdown file"""
        try:
            settings = await self.get_leo_settings(user_id)
            settings["markdown_file_name"] = None
            settings["markdown_content"] = None
            settings["markdown_file_id"] = None
            
            await self.preference_service.set_preference(
                user_id, "leo_settings", settings
            )
            
            logger.info(f"Markdown file deleted for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting markdown file for user {user_id}: {e}", exc_info=True)
            return False

    @staticmethod
    def get_default_leo_settings() -> Dict[str, Any]:
        """Get default Leo settings"""
        return LeoSettingsService.DEFAULT_SETTINGS.copy()
