"""
Redis Cache Configuration
Cache backend pour améliorer les performances
"""

from typing import Optional, Any
import json
import gzip
import base64
from functools import wraps
import hashlib

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

from app.core.config import settings
from app.core.logging import logger


class CacheBackend:
    """Backend de cache abstrait"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.use_redis = REDIS_AVAILABLE and hasattr(settings, 'REDIS_URL')
        
        if self.use_redis and settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                logger.info("Redis cache initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis: {e}")
                self.use_redis = False
    
    async def get(self, key: str) -> Optional[Any]:
        """Récupérer une valeur du cache avec décompression automatique"""
        if not self.use_redis or not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                # Vérifier si compressé
                if value.startswith("__compressed__"):
                    encoded = value.replace("__compressed__", "")
                    compressed = base64.b64decode(encoded)
                    json_data = gzip.decompress(compressed).decode('utf-8')
                else:
                    json_data = value
                
                return json.loads(json_data)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
        return None
    
    async def set(self, key: str, value: Any, expire: int = 300, compress: bool = False) -> bool:
        """Stocker une valeur dans le cache avec compression optionnelle"""
        if not self.use_redis or not self.redis_client:
            return False
        
        try:
            # Sérialiser en JSON
            json_data = json.dumps(value, default=str)
            
            # Compresser si activé et si la valeur est grande (>1KB)
            if compress and len(json_data) > 1024:
                compressed = gzip.compress(json_data.encode('utf-8'))
                encoded = base64.b64encode(compressed).decode('utf-8')
                # Ajouter un préfixe pour indiquer la compression
                final_value = f"__compressed__{encoded}"
            else:
                final_value = json_data
            
            await self.redis_client.setex(key, expire, final_value)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Supprimer une clé du cache"""
        if not self.use_redis or not self.redis_client:
            return False
        
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Supprimer toutes les clés correspondant à un pattern (non-bloquant avec SCAN)"""
        if not self.use_redis or not self.redis_client:
            return 0
        
        try:
            deleted_count = 0
            cursor = 0
            
            # Utiliser SCAN au lieu de KEYS pour éviter de bloquer Redis
            while True:
                cursor, keys = await self.redis_client.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100  # Traiter par batch de 100
                )
                
                if keys:
                    deleted_count += await self.redis_client.delete(*keys)
                
                if cursor == 0:  # SCAN terminé
                    break
            
            return deleted_count
        except Exception as e:
            logger.error(f"Cache clear_pattern error: {e}")
        return 0


# Instance globale
cache_backend = CacheBackend()


def cache_key(*args, **kwargs) -> str:
    """Générer une clé de cache à partir d'arguments"""
    key_data = f"{args}:{sorted(kwargs.items())}"
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(expire: int = 300, key_prefix: str = ""):
    """
    Décorateur pour mettre en cache le résultat d'une fonction
    
    Usage:
        @cached(expire=600, key_prefix="users")
        async def get_users():
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Générer la clé de cache
            cache_key_str = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Vérifier le cache
            cached_value = await cache_backend.get(cache_key_str)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key_str}")
                return cached_value
            
            # Exécuter la fonction
            logger.debug(f"Cache miss: {cache_key_str}")
            result = await func(*args, **kwargs)
            
            # Mettre en cache
            await cache_backend.set(cache_key_str, result, expire)
            
            return result
        
        # Ajouter méthode d'invalidation
        async def invalidate(*args, **kwargs):
            """Invalider le cache pour cette fonction avec les mêmes arguments"""
            cache_key_str = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            await cache_backend.delete(cache_key_str)
        
        async def invalidate_all():
            """Invalider tout le cache pour ce préfixe"""
            pattern = f"{key_prefix}:{func.__name__}:*"
            await cache_backend.clear_pattern(pattern)
        
        wrapper.invalidate = invalidate
        wrapper.invalidate_all = invalidate_all
        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str) -> int:
    """
    Fonction utilitaire pour invalider le cache par pattern
    
    Usage:
        await invalidate_cache_pattern("users:*")
        await invalidate_cache_pattern("user:123:*")
    """
    return await cache_backend.clear_pattern(pattern)


async def init_cache():
    """Initialiser le cache"""
    if cache_backend.use_redis:
        logger.info("Cache backend ready")
    else:
        logger.warning("Cache backend not available (Redis not configured)")


async def close_cache():
    """Fermer les connexions cache"""
    if cache_backend.redis_client:
        await cache_backend.redis_client.close()
        logger.info("Cache connections closed")

