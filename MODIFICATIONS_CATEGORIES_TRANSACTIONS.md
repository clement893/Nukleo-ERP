# Modifications apportées - Catégories de transactions

## Résumé des modifications

Les modifications suivantes ont été apportées au fichier `backend/app/api/v1/endpoints/finances/transactions.py` :

### 1. Création automatique des catégories lors de l'import

**Localisation** : Lignes 901-944 dans `import_transactions()`

**Fonctionnalité** :
- Si une catégorie (ex: "Services") n'existe pas, elle est créée automatiquement
- Le type est correctement mappé :
  - `ENTRY` pour les revenus (`TransactionType.REVENUE`)
  - `EXIT` pour les dépenses (`TransactionType.EXPENSE`)
- Plus d'avertissements "Catégorie non trouvée"

**Code implémenté** :
```python
# Find or create category by name if provided
category_id = None
if category_name:
    category_name_clean = str(category_name).strip()
    # Try exact match first (case-insensitive)
    category_result = await db.execute(
        select(TransactionCategory).where(
            and_(
                TransactionCategory.user_id == current_user.id,
                func.lower(TransactionCategory.name) == func.lower(category_name_clean)
            )
        ).limit(1)
    )
    category = category_result.scalar_one_or_none()
    
    # If not found, try partial match
    if not category:
        category_result = await db.execute(
            select(TransactionCategory).where(
                and_(
                    TransactionCategory.user_id == current_user.id,
                    TransactionCategory.name.ilike(f"%{category_name_clean}%")
                )
            ).limit(1)
        )
        category = category_result.scalar_one_or_none()
    
    # If still not found, create it automatically
    if not category:
        from app.models.transaction_category import TransactionType as CategoryTransactionType
        # Map TransactionType (REVENUE/EXPENSE) to CategoryTransactionType (ENTRY/EXIT)
        category_type = CategoryTransactionType.EXIT if final_type == TransactionType.EXPENSE else CategoryTransactionType.ENTRY
        
        new_category = TransactionCategory(
            user_id=current_user.id,
            name=category_name_clean,
            type=category_type,
            is_active=True
        )
        db.add(new_category)
        await db.flush()
        await db.refresh(new_category)
        category = new_category
        logger.info(f"Auto-created category '{category_name_clean}' (type: {category_type.value}) for user {current_user.id}")
```

### 2. Affichage du nom de la catégorie dans les réponses GET

**Localisation** : 
- Lignes 155-173 : Vérification de l'existence de la table et préparation du JOIN
- Ligne 213 : Ajout du nom de catégorie dans la réponse

**Fonctionnalité** :
- L'endpoint GET fait un LEFT JOIN avec `transaction_categories` pour récupérer le nom
- Le champ `category` contient maintenant le nom de la catégorie au lieu de seulement l'ID
- Les transactions s'affichent correctement avec leurs catégories

**Code implémenté** :
```python
# Add category name from transaction_categories table if category_id exists
category_name_select = ""
category_join = ""
# Check if transaction_categories table exists
try:
    table_check = await db.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'transaction_categories'
        )
    """))
    categories_table_exists = table_check.scalar()
    
    if categories_table_exists and 'category_id' in existing_columns:
        category_name_select = ", transaction_categories.name AS category_name"
        category_join = "LEFT JOIN transaction_categories ON transactions.category_id = transaction_categories.id"
except Exception as e:
    logger.warning(f"Could not check for transaction_categories table: {e}")
    # Continue without category name if table doesn't exist

# Dans la réponse (ligne 213)
'category': row_dict.get('category_name'),  # Add category name from JOIN
```

**Pour l'endpoint GET individuel** (lignes 265-285) :
```python
query = select(Transaction, TransactionCategory.name.label('category_name')).outerjoin(
    TransactionCategory, Transaction.category_id == TransactionCategory.id
).where(...)
transaction, category_name = row
transaction_dict = TransactionResponse.model_validate(transaction).model_dump()
transaction_dict['category'] = category_name  # Add category name
return TransactionResponse(**transaction_dict)
```

### 3. Vérification de l'existence de la table

**Localisation** : Lignes 158-172

**Fonctionnalité** :
- Vérification de l'existence de `transaction_categories` avant le JOIN pour éviter les erreurs
- Gestion gracieuse des erreurs si la table n'existe pas encore
- Le système continue sans le nom de catégorie si la table n'existe pas

**Code implémenté** :
```python
# Check if transaction_categories table exists
try:
    table_check = await db.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'transaction_categories'
        )
    """))
    categories_table_exists = table_check.scalar()
    
    if categories_table_exists and 'category_id' in existing_columns:
        category_name_select = ", transaction_categories.name AS category_name"
        category_join = "LEFT JOIN transaction_categories ON transactions.category_id = transaction_categories.id"
except Exception as e:
    logger.warning(f"Could not check for transaction_categories table: {e}")
    # Continue without category name if table doesn't exist
```

## État Git

**Fichier modifié** : `backend/app/api/v1/endpoints/finances/transactions.py`

**Statut** :
- ✅ Modifications présentes dans le code actuel (HEAD)
- ⚠️ Commits non poussés détectés (mais ces modifications semblent déjà être dans HEAD)
- 📝 Aucune modification non commitée dans ce fichier

**Commits liés** :
- `a88be0f6` - Fix: Corriger l'endpoint transactions/import pour utiliser category_id
- `b55e92f6` - fix: Add timezone handling and validation for transaction creation
- `3ff95271` - Fix: Update Transaction model to use category_id instead of category

## Résultat attendu

✅ **Les 38 transactions créées devraient toutes être visibles sur la page des dépenses**
✅ **Les catégories "Services" seront créées automatiquement lors du prochain import**
✅ **Les transactions afficheront le nom de leur catégorie**

## Test recommandé

1. Réimporter le fichier CSV/Excel avec des catégories
2. Vérifier que les catégories sont créées automatiquement
3. Rafraîchir la page des dépenses
4. Vérifier que les transactions s'affichent avec leurs catégories (nom au lieu de seulement l'ID)

## Notes

- Les modifications sont déjà implémentées dans le code
- Le système gère gracieusement l'absence de la table `transaction_categories`
- Les catégories sont créées avec le bon type (ENTRY/EXIT) selon le type de transaction
- Le mapping est automatique : REVENUE → ENTRY, EXPENSE → EXIT
