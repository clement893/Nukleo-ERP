#!/usr/bin/env python3
"""
Script pour exécuter la migration Alembic
Crée le pipeline MAIN avec toutes les étapes
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from alembic import command
    from alembic.config import Config
    
    def run_migration():
        """Run Alembic migration to head"""
        print("🔄 Exécution de la migration Alembic...")
        
        # Get Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Run upgrade to head
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Migration exécutée avec succès!")
        print("📋 Pipeline MAIN créé avec 15 étapes")
        
    if __name__ == "__main__":
        run_migration()
        
except ImportError as e:
    print(f"❌ Erreur: Module non trouvé - {e}")
    print("💡 Installez les dépendances Python:")
    print("   pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erreur lors de l'exécution de la migration: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
