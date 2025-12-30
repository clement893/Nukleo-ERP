"""
Script de diagnostic pour l'upload des photos vers S3 lors de l'import de contacts
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.s3_service import S3Service
from app.core.logging import logger

def diagnose_s3_config():
    """Diagnostique la configuration S3"""
    print("=" * 60)
    print("DIAGNOSTIC S3 - Upload des photos de contacts")
    print("=" * 60)
    print()
    
    # Vérifier les variables d'environnement
    print("1. Vérification des variables d'environnement:")
    print("-" * 60)
    
    env_vars = {
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
        "AWS_S3_BUCKET": os.getenv("AWS_S3_BUCKET"),
        "AWS_S3_ENDPOINT_URL": os.getenv("AWS_S3_ENDPOINT_URL"),
    }
    
    all_configured = True
    for key, value in env_vars.items():
        if key == "AWS_S3_ENDPOINT_URL":
            status = "✓ (optionnel)" if value else "⚠ (optionnel - non défini)"
        elif value:
            masked_value = value[:4] + "..." + value[-4:] if len(value) > 8 else "***"
            status = f"✓ ({masked_value})"
        else:
            status = "✗ NON CONFIGURÉ"
            if key in ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"]:
                all_configured = False
        print(f"  {key}: {status}")
    
    print()
    
    # Vérifier is_configured()
    print("2. Vérification de S3Service.is_configured():")
    print("-" * 60)
    try:
        is_configured = S3Service.is_configured()
        print(f"  Résultat: {'✓ S3 est configuré' if is_configured else '✗ S3 n\'est pas configuré'}")
    except Exception as e:
        print(f"  ✗ Erreur lors de la vérification: {e}")
        is_configured = False
    
    print()
    
    # Tester l'initialisation de S3Service
    print("3. Test d'initialisation de S3Service:")
    print("-" * 60)
    s3_service = None
    try:
        s3_service = S3Service()
        print("  ✓ S3Service initialisé avec succès")
    except Exception as e:
        print(f"  ✗ Erreur lors de l'initialisation: {e}")
        print(f"     Type d'erreur: {type(e).__name__}")
    
    print()
    
    # Tester l'upload d'un fichier de test si S3 est configuré
    if s3_service:
        print("4. Test d'upload d'un fichier de test:")
        print("-" * 60)
        try:
            from io import BytesIO
            from fastapi import UploadFile
            
            # Créer un fichier de test
            test_content = b"test image content"
            test_file = BytesIO(test_content)
            
            class TestUploadFile:
                def __init__(self, filename: str, content: bytes):
                    self.filename = filename
                    self.content_type = 'image/jpeg'
                    self.file = BytesIO(content)
            
            test_upload = TestUploadFile("test.jpg", test_content)
            
            print(f"  Tentative d'upload vers: contacts/photos/test/")
            upload_result = s3_service.upload_file(
                file=test_upload,
                folder='contacts/photos',
                user_id='test_user'
            )
            
            print(f"  ✓ Upload réussi!")
            print(f"     File key: {upload_result.get('file_key')}")
            print(f"     URL: {upload_result.get('url', 'N/A')[:80]}...")
            print(f"     Size: {upload_result.get('size', 0)} bytes")
            
            # Vérifier que le fichier existe
            file_key = upload_result.get('file_key')
            if file_key:
                try:
                    metadata = s3_service.get_file_metadata(file_key)
                    print(f"  ✓ Vérification réussie - fichier existe dans S3")
                    print(f"     Taille vérifiée: {metadata.get('size', 0)} bytes")
                    
                    # Nettoyer - supprimer le fichier de test
                    try:
                        s3_service.delete_file(file_key)
                        print(f"  ✓ Fichier de test supprimé")
                    except Exception as e:
                        print(f"  ⚠ Impossible de supprimer le fichier de test: {e}")
                except Exception as e:
                    print(f"  ✗ Erreur lors de la vérification: {e}")
            
        except Exception as e:
            print(f"  ✗ Erreur lors du test d'upload: {e}")
            print(f"     Type d'erreur: {type(e).__name__}")
            import traceback
            print(f"     Traceback:")
            traceback.print_exc()
    
    print()
    print("=" * 60)
    print("RÉSUMÉ:")
    print("=" * 60)
    
    if all_configured and is_configured and s3_service:
        print("✓ S3 est correctement configuré et fonctionnel")
        print("  Le problème pourrait être dans:")
        print("  - Le code d'import qui ne trouve pas les photos dans le ZIP")
        print("  - Le matching des noms de fichiers")
        print("  - Les erreurs silencieuses dans le code d'import")
    else:
        print("✗ S3 n'est pas correctement configuré")
        print("  Veuillez vérifier les variables d'environnement manquantes")
    
    print()

if __name__ == "__main__":
    diagnose_s3_config()
