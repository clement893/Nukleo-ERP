# Guide d'import des photos de contacts

## Structure du fichier ZIP

Pour importer des contacts avec leurs photos, vous devez créer un fichier ZIP contenant :

1. **Un fichier Excel** (`.xlsx` ou `.xls`) avec les données des contacts
2. **Les photos** des contacts (optionnel)

### Structure recommandée du ZIP

```
contacts.zip
├── contacts.xlsx          (ou contacts.xls)
└── photos/                (dossier optionnel)
    ├── jean_dupont.jpg
    ├── marie-martin.png
    ├── pierre_durand.jpeg
    └── ...
```

**OU** (photos à la racine)

```
contacts.zip
├── contacts.xlsx
├── jean_dupont.jpg
├── marie-martin.png
└── pierre_durand.jpeg
```

## Méthodes de correspondance des photos

Le système peut faire correspondre les photos aux contacts de **deux façons** :

### Méthode 1 : Colonne dans l'Excel (Recommandée)

Ajoutez une colonne dans votre fichier Excel avec l'un de ces noms :
- `logo_filename`
- `photo_filename`
- `nom_fichier_photo`

Dans cette colonne, indiquez le nom exact du fichier photo (avec ou sans extension).

**Exemple Excel :**
| Prénom | Nom | Email | photo_filename |
|--------|-----|-------|----------------|
| Jean   | Dupont | jean@example.com | jean_dupont.jpg |
| Marie  | Martin | marie@example.com | marie-martin.png |

**Fichiers dans le ZIP :**
- `jean_dupont.jpg`
- `marie-martin.png`

### Méthode 2 : Correspondance automatique par nom

Si vous n'avez pas de colonne `photo_filename`, le système essaie automatiquement de faire correspondre les photos en utilisant le prénom et le nom du contact.

**Formats de noms de fichiers supportés :**
- `prenom_nom.jpg` (ex: `jean_dupont.jpg`)
- `prenom-nom.jpg` (ex: `jean-dupont.jpg`)
- `Prenom_Nom.jpg` (ex: `Jean_Dupont.jpg`)
- `PRENOM_NOM.jpg` (ex: `JEAN_DUPONT.jpg`)

**Extensions supportées :**
- `.jpg`
- `.jpeg`
- `.png`
- `.gif`
- `.webp`

**Exemple :**
Si votre contact s'appelle "Jean Dupont", le système cherchera automatiquement :
- `jean_dupont.jpg`
- `jean_dupont.jpeg`
- `jean_dupont.png`
- `jean-dupont.jpg`
- `Jean_Dupont.jpg`
- etc.

## Normalisation des noms de fichiers

Le système normalise automatiquement les noms de fichiers pour améliorer la correspondance :
- Suppression des accents (é → e, à → a, etc.)
- Conversion en minuscules
- Normalisation des espaces et caractères spéciaux

**Exemple :**
- `Jean-François_Dupont.jpg` → correspond à `jean-francois_dupont.jpg`
- `Marie Élise Martin.png` → correspond à `marie_elise_martin.png`

## Conseils pour un import réussi

### ✅ Bonnes pratiques

1. **Utilisez la colonne `photo_filename`** dans l'Excel pour un contrôle total
2. **Nommez les photos de manière cohérente** : `prenom_nom.extension`
3. **Placez les photos dans un dossier `photos/`** pour une meilleure organisation
4. **Utilisez des extensions standard** : `.jpg`, `.jpeg`, ou `.png`
5. **Vérifiez que les noms de fichiers correspondent exactement** (sensible à la casse dans certains cas)

### ❌ À éviter

1. **Ne pas utiliser de caractères spéciaux** dans les noms de fichiers (sauf `-` et `_`)
2. **Ne pas utiliser d'espaces** dans les noms de fichiers (utilisez `_` ou `-`)
3. **Ne pas mettre les photos dans des sous-dossiers** trop profonds
4. **Ne pas utiliser de formats d'image non supportés** (`.bmp`, `.tiff`, etc.)

## Exemple complet

### Structure du ZIP
```
mes_contacts.zip
├── contacts.xlsx
└── photos/
    ├── jean_dupont.jpg
    ├── marie_martin.png
    └── pierre_durand.jpeg
```

### Contenu de l'Excel (contacts.xlsx)

| Prénom | Nom | Email | photo_filename |
|--------|-----|-------|----------------|
| Jean   | Dupont | jean.dupont@example.com | jean_dupont.jpg |
| Marie  | Martin | marie.martin@example.com | marie_martin.png |
| Pierre | Durand | pierre.durand@example.com | pierre_durand.jpeg |

### Résultat attendu

- ✅ Les 3 contacts seront importés
- ✅ Les 3 photos seront automatiquement associées aux contacts correspondants
- ✅ Les photos seront uploadées sur S3 dans le dossier `contacts/photos/`

## Dépannage

### Les photos ne sont pas importées

1. **Vérifiez les logs d'import** pour voir les messages d'erreur
2. **Vérifiez que les noms de fichiers correspondent** exactement (avec ou sans extension selon votre méthode)
3. **Vérifiez que les extensions sont supportées** (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
4. **Vérifiez que les photos sont bien dans le ZIP** (pas seulement dans un dossier local)

### La correspondance automatique ne fonctionne pas

1. **Utilisez la colonne `photo_filename`** dans l'Excel pour un contrôle précis
2. **Vérifiez que le prénom et le nom sont correctement remplis** dans l'Excel
3. **Vérifiez le format du nom de fichier** : `prenom_nom.extension` ou `prenom-nom.extension`

### Messages d'erreur courants

- **"Cannot match photo - missing first_name or last_name"** : Le contact n'a pas de prénom ou de nom dans l'Excel
- **"Cannot match photo - photo_filename 'xxx' not found in ZIP"** : Le nom de fichier dans l'Excel ne correspond à aucun fichier dans le ZIP
- **"Cannot match photo - no photo_filename and auto-match failed"** : La correspondance automatique a échoué, utilisez la colonne `photo_filename`
