#!/usr/bin/env python3
"""
Script pour supprimer tous les contacts de la base de données
Utile pour réimporter des contacts depuis un fichier Excel
"""

import asyncio
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, delete

from app.core.config import settings
from app.models.contact import Contact
from app.core.logging import logger


async def delete_all_contacts():
    """Supprimer tous les contacts de la base de données"""
    print("🗑️  Suppression de tous les contacts...")
    print(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    # Créer l'engine
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            # Compter les contacts avant suppression
            result = await db.execute(select(Contact))
            contacts = result.scalars().all()
            count = len(contacts)
            
            if count == 0:
                print("ℹ️  Aucun contact trouvé dans la base de données.")
                return
            
            print(f"📊 {count} contact(s) trouvé(s)")
            
            # Demander confirmation
            print()
            print("⚠️  ATTENTION: Cette action va supprimer TOUS les contacts de la base de données!")
            response = input("Êtes-vous sûr de vouloir continuer? (tapez 'OUI' pour confirmer): ")
            
            if response != "OUI":
                print("❌ Suppression annulée.")
                return
            
            # Supprimer tous les contacts
            print()
            print("🔄 Suppression en cours...")
            
            # Utiliser delete() pour supprimer tous les contacts
            await db.execute(delete(Contact))
            await db.commit()
            
            print(f"✅ {count} contact(s) supprimé(s) avec succès!")
            print()
            print("💡 Vous pouvez maintenant réimporter vos contacts depuis l'interface web.")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Erreur lors de la suppression des contacts: {e}", exc_info=True)
            print(f"❌ Erreur lors de la suppression: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(delete_all_contacts())
    except KeyboardInterrupt:
        print("\n❌ Opération annulée par l'utilisateur.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        sys.exit(1)
