# Diagnostic - Upload des photos vers S3 lors de l'import de contacts

## Problème identifié
Les photos ne sont pas uploadées vers S3 lors de l'import de contacts depuis un fichier ZIP.

## Points de vérification

### 1. Configuration S3
Vérifier que les variables d'environnement suivantes sont configurées:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION` (optionnel, défaut: us-east-1)
- `AWS_S3_ENDPOINT_URL` (optionnel, pour services compatibles S3)

**Test:** Exécuter `python backend/scripts/diagnose_photo_upload.py`

### 2. Structure du fichier ZIP
Le fichier ZIP doit contenir:
- Un fichier Excel (`.xlsx` ou `.xls`) avec les données des contacts
- Un dossier `photos/` (optionnel) avec les images

Les photos peuvent être nommées selon ces patterns:
- `firstname_lastname.jpg` (ou .jpeg, .png, .gif, .webp)
- Ou référencées dans une colonne Excel (`photo_filename` ou `nom_fichier_photo`)

### 3. Points de défaillance possibles

#### A. S3 non configuré
**Symptôme:** Les photos ne sont pas uploadées, warning dans les logs
**Code:** Ligne 808-832 dans `contacts.py`
**Solution:** Configurer les variables d'environnement S3

#### B. Erreur lors de l'initialisation de S3Service
**Symptôme:** Warning "Impossible d'initialiser le service S3"
**Code:** Ligne 812-823 dans `contacts.py`
**Solution:** Vérifier les credentials AWS et les permissions du bucket

#### C. Photos non trouvées dans le ZIP
**Symptôme:** Aucune photo uploadée, mais pas d'erreur
**Code:** Ligne 643-653 dans `contacts.py`
**Vérification:** 
- Les photos doivent être dans le dossier `photos/` ou à la racine
- Les extensions doivent être: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Les noms de fichiers doivent correspondre aux patterns attendus

#### D. Matching des noms de fichiers échoue
**Symptôme:** Photos trouvées mais non uploadées
**Code:** Ligne 964-1050 dans `contacts.py`
**Patterns testés:**
- `firstname_normalized_lastname_normalized.jpg`
- `firstname_lower_lastname_lower.jpg`
- Nom depuis colonne Excel (`photo_filename` ou `nom_fichier_photo`)

#### E. Erreur lors de l'upload vers S3
**Symptôme:** Erreur dans les logs, warning ajouté aux résultats
**Code:** Ligne 1042-1049 dans `contacts.py`
**Vérification:** Vérifier les logs pour l'erreur exacte

### 4. Améliorations du logging

Le code log déjà beaucoup d'informations:
- Ligne 809: Configuration S3 et nombre de photos trouvées
- Ligne 814: Initialisation réussie de S3Service
- Ligne 816: Erreur d'initialisation
- Ligne 986: Tentative d'upload avec patterns disponibles
- Ligne 1016: Début de l'upload
- Ligne 1022: Résultat de l'upload
- Ligne 1034: Vérification réussie
- Ligne 1036: Échec de vérification
- Ligne 1043: Erreur d'upload avec traceback

### 5. Actions de diagnostic

1. **Vérifier la configuration S3:**
   ```bash
   python backend/scripts/diagnose_photo_upload.py
   ```

2. **Vérifier les logs lors de l'import:**
   - Chercher les messages commençant par "S3 configuration check"
   - Chercher les messages "Uploading photo"
   - Chercher les erreurs "Failed to upload photo"

3. **Vérifier la structure du ZIP:**
   - Ouvrir le ZIP et vérifier que les photos sont présentes
   - Vérifier les noms de fichiers
   - Vérifier que le fichier Excel contient les colonnes nécessaires

4. **Tester manuellement l'upload:**
   - Utiliser le script de diagnostic pour tester un upload de test

## Solutions proposées

### Solution 1: Améliorer le logging
Ajouter plus de détails dans les logs pour identifier exactement où le processus échoue.

### Solution 2: Vérifier la compatibilité de TempUploadFile
S'assurer que la classe `TempUploadFile` est compatible avec `S3Service.upload_file()`.

### Solution 3: Ajouter une validation pré-upload
Vérifier que S3 est configuré et accessible avant de commencer l'import.

### Solution 4: Améliorer la gestion des erreurs
S'assurer que toutes les erreurs sont capturées et loggées, même les erreurs silencieuses.
