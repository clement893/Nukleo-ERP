# Diagnostic : Problème de Sauvegarde JSON Complexe dans les Thèmes

## Problème Signalé

L'utilisateur entre un JSON complexe dans l'éditeur de thème (avec structure imbriquée : `colors`, `typography`, `spacing`, `borderRadius`, `effects`), clique sur sauvegarder, revient à la liste des thèmes, mais le JSON n'est pas modifié - seuls les champs de base sont sauvegardés.

## Analyse du Code

### Flux de Données

1. **JSONEditor** (`apps/web/src/app/[locale]/admin/themes/components/JSONEditor.tsx`)
   - Ligne 169-170 : Quand le JSON est valide, appelle `onChange(validation.parsed)` avec le config complet
   - Le JSON complexe est correctement parsé et passé au parent

2. **ThemeEditor** (`apps/web/src/app/[locale]/admin/themes/components/ThemeEditor.tsx`)
   - Ligne 104-120 : `handleJSONChange` reçoit le config complet et appelle `updateConfig(newConfig)`
   - Ligne 139-148 : **PROBLÈME ICI** - `handleSave` reconstruit un config partiel :
   ```typescript
   const config: ThemeConfig = {
     primary_color: state.config.primary_color || formData.primary_color,
     secondary_color: state.config.secondary_color || formData.secondary_color,
     danger_color: state.config.danger_color || formData.danger_color,
     warning_color: state.config.warning_color || formData.warning_color,
     info_color: state.config.info_color || formData.info_color,
     success_color: state.config.success_color || formData.success_color,
     font_family: (state.config as any).font_family || formData.font_family || undefined,
     border_radius: (state.config as any).border_radius || formData.border_radius || undefined,
   } as ThemeConfig;
   ```
   - **Ce code ne prend que quelques champs spécifiques, perdant tous les autres champs du config complexe**

3. **useThemeEditor** (`apps/web/src/app/[locale]/admin/themes/hooks/useThemeEditor.ts`)
   - Ligne 20-25 : `updateConfig` fait un merge partiel : `{ ...prev.config, ...updates }`
   - Cela devrait fonctionner, mais le problème est dans `handleSave`

4. **handleSave dans ThemesPage** (`apps/web/src/app/[locale]/admin/themes/page.tsx`)
   - Ligne 50-96 : Reçoit le `config` de ThemeEditor et l'envoie à `updateTheme`
   - Le config reçu est déjà incomplet à cause du problème dans ThemeEditor

5. **API updateTheme** (`apps/web/src/lib/api/theme.ts`)
   - Ligne 211-243 : Envoie le `themeData.config` tel quel au backend
   - Le backend accepte un `Dict[str, Any]` donc devrait accepter la structure complexe

6. **Backend** (`backend/app/api/v1/endpoints/themes.py`)
   - Ligne 392-393 : `theme.config = theme_data.config` - sauvegarde directement le config
   - Le backend devrait sauvegarder correctement si le config complet arrive

## Problème Identifié

### Problème Principal : Perte de Données dans `handleSave` de ThemeEditor

**Fichier** : `apps/web/src/app/[locale]/admin/themes/components/ThemeEditor.tsx`  
**Ligne** : 139-148

Le code reconstruit un `ThemeConfig` avec seulement quelques champs spécifiques au lieu d'utiliser `state.config` directement. Cela perd tous les champs complexes comme :
- `colors` (objet imbriqué)
- `typography` (objet imbriqué)
- `spacing` (objet imbriqué)
- `borderRadius` (objet imbriqué)
- `effects` (objet imbriqué avec glassmorphism)
- Tous les autres champs personnalisés

### Exemple de Données Perdues

**JSON entré par l'utilisateur** :
```json
{
  "config": {
    "mode": "dark",
    "primary": "#523DC9",
    "colors": {
      "background": "#291919",
      "foreground": "#FFFFFF",
      "muted": "#3E2A3E",
      ...
    },
    "typography": {
      "fontFamily": "Inter, sans-serif",
      "fontFamilyHeading": "Space Grotesk, sans-serif",
      ...
    },
    "effects": {
      "glassmorphism": {
        "card": { ... },
        "panel": { ... }
      }
    }
  }
}
```

**Config sauvegardé** (après `handleSave`) :
```json
{
  "primary_color": "#523DC9",
  "secondary_color": null,
  "danger_color": null,
  ...
  // Tous les autres champs complexes sont perdus !
}
```

## Causes Racines

1. **Type ThemeConfig trop restrictif** : Le type `ThemeConfig` dans `@modele/types` définit seulement quelques champs de base, mais le backend accepte `Dict[str, Any]`

2. **handleSave reconstruit au lieu d'utiliser** : Au lieu d'utiliser `state.config` directement, le code reconstruit un objet partiel

3. **Mapping incomplet** : Le code essaie de mapper `primary_color` depuis `primary`, mais ne gère pas la structure complexe

## Solutions Recommandées

### Solution 1 : Utiliser `state.config` Directement (Recommandé)

Dans `ThemeEditor.handleSave`, remplacer la reconstruction partielle par :
```typescript
const config: ThemeConfig = state.config;
```

### Solution 2 : Merge Complet

Si on veut garder la logique de fallback, faire un merge complet :
```typescript
const config: ThemeConfig = {
  ...state.config,
  primary_color: state.config.primary_color || state.config.primary || formData.primary_color,
  // ... autres fallbacks
} as ThemeConfig;
```

### Solution 3 : Vérifier le Format du Config

S'assurer que le config du JSONEditor est bien dans le format attendu (extraction du `config` si c'est un objet thème complet)

## Fichiers à Modifier

1. **`apps/web/src/app/[locale]/admin/themes/components/ThemeEditor.tsx`**
   - Ligne 139-148 : Modifier `handleSave` pour utiliser `state.config` directement

2. **`packages/types/src/theme.ts`** (optionnel)
   - Améliorer le type `ThemeConfig` pour accepter une structure plus flexible

## Vérifications Supplémentaires

1. **Vérifier que le JSONEditor extrait bien le config** : Le code ligne 59-67 de JSONEditor.tsx semble correct
2. **Vérifier que updateConfig préserve la structure** : Le merge dans useThemeEditor devrait préserver
3. **Vérifier la sérialisation JSON** : S'assurer que les objets imbriqués sont bien sérialisés

## Impact

- **Sévérité** : Haute - Les utilisateurs ne peuvent pas sauvegarder des configurations de thème complexes
- **Fréquence** : À chaque tentative de sauvegarde d'un JSON complexe
- **Utilisateurs affectés** : Tous les superadmins qui essaient de créer/modifier des thèmes avec structure complexe
