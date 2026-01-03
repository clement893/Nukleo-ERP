# Inventaire des Modals et Drawers - Nukleo ERP

## 📊 Résumé
- **11 fichiers** contenant des modals/drawers
- **302 occurrences** de patterns modal/drawer
- **2 composants de base** : Modal.tsx et Drawer.tsx

---

## 🎯 Composants de Base à Moderniser

### 1. `/components/ui/Modal.tsx`
**Statut**: ❌ Design standard (pas ultra-moderne)
**Utilisation**: Composant de base utilisé partout
**Caractéristiques actuelles**:
- Overlay noir avec 50% opacité
- Fond blanc/background standard
- Animations basiques (fade-in, scale-in)
- Support glassmorphism mais pas activé par défaut
- Border radius standard

**À moderniser**:
- ✨ Backdrop blur intense (60% + blur-md)
- ✨ Header avec gradient Aurora Borealis
- ✨ Icônes Sparkles dans le header
- ✨ Animations fluides améliorées
- ✨ Border radius plus généreux (rounded-3xl)
- ✨ Shadow plus prononcée (shadow-2xl)

### 2. `/components/ui/Drawer.tsx`
**Statut**: ❌ Design standard (pas ultra-moderne)
**Utilisation**: Drawer latéral pour détails utilisateurs
**Caractéristiques actuelles**:
- Overlay noir 50%
- Fond background standard
- Slide animation basique
- Border simple

**À moderniser**:
- ✨ Backdrop blur intense
- ✨ Header avec gradient
- ✨ Glassmorphism effect
- ✨ Animations améliorées

---

## 📁 Pages Utilisant des Modals

### Admin - Invitations (`/admin/invitations/page.tsx`)
**Modals**:
1. **Create Invitation Modal** - Inviter un utilisateur
   - Champs: email, role
   - Actions: Annuler, Inviter

### Admin - Leo Documentation (`/admin/leo-documentation/page.tsx`)
**Modals**:
1. **Create Modal** - Nouvelle documentation
2. **Edit Modal** - Modifier documentation
3. **Delete Modal** - Confirmation suppression
4. **Preview Modal** - Aperçu documentation

### Admin - Organizations (`/admin/organizations/AdminOrganizationsContent.tsx`)
**Modals**:
1. **Create Modal** - Créer une équipe
2. **Edit Modal** - Modifier équipe
3. **View Modal** - Voir détails équipe

### Admin - RBAC (`/admin/rbac/page.tsx`)
**Modals**:
1. **Create Role Modal** - Créer un rôle
2. **Edit Role Modal** - Modifier rôle
3. **Delete Role Modal** - Supprimer rôle

### Admin - Roles (`/admin/roles/page.tsx`)
**Modals**:
1. **Create Modal** - Créer un rôle
2. **Edit Modal** - Modifier rôle
3. **Delete Modal** - Supprimer rôle

### Admin - Teams (`/admin/teams/page.tsx`)
**Modals**:
1. **Create Team Modal** - Créer une équipe
   - Champs: name, description

### Admin - Themes (`/admin/themes/components/ThemeActions.tsx`)
**Modals**:
1. **ConfirmActivateModal** - Activer un thème
2. **ConfirmDeleteModal** - Supprimer un thème

### Admin - Users (`/admin/users/page.tsx`)
**Modals**:
1. **Create/Edit Modal** - Créer/modifier utilisateur
2. **Delete Modal** - Supprimer utilisateur
3. **Roles Modal** - Gérer les rôles
4. **Permissions Modal** - Gérer les permissions
5. **Portal Permissions Modal** - Permissions portail
**Drawers**:
1. **Detail Drawer** - Détails utilisateur

### Admin - Users Content (`/admin/users/AdminUsersContent.tsx`)
**Modals**:
1. **Roles Modal** - Gérer les rôles
2. **Permissions Modal** - Gérer les permissions
3. **Portal Permissions Modal** - Permissions portail
4. **Employee Link Modal** - Lier à un employé
5. **Delete Modal** - Supprimer utilisateur

### Admin - Feedback (`/admin/feedback/page.tsx`)
**Modals**:
1. **Response Modal** - Répondre au feedback
2. **Delete Modal** - Supprimer feedback

---

## 🎨 Plan de Modernisation

### Phase 1: Composants de Base ✅
- [x] Créer le design ultra-moderne pour `/dashboard/creation-projet-demo`
- [ ] Moderniser `/components/ui/Modal.tsx`
- [ ] Moderniser `/components/ui/Drawer.tsx`

### Phase 2: Pages Admin (11 fichiers)
- [ ] `/admin/invitations/page.tsx`
- [ ] `/admin/leo-documentation/page.tsx`
- [ ] `/admin/organizations/AdminOrganizationsContent.tsx`
- [ ] `/admin/rbac/page.tsx`
- [ ] `/admin/roles/page.tsx`
- [ ] `/admin/teams/page.tsx`
- [ ] `/admin/themes/components/ThemeActions.tsx`
- [ ] `/admin/users/page.tsx`
- [ ] `/admin/users/AdminUsersContent.tsx`
- [ ] `/admin/feedback/page.tsx`

### Phase 3: Autres Pages
- [ ] Chercher d'autres modals dans `/dashboard/*`
- [ ] Chercher d'autres modals dans `/portail-employe-demo/*`

---

## 🔥 Design System Ultra-Moderne

### Couleurs
- **Aurora Borealis Gradient**: `from-[#5F2B75] via-[#523DC9] to-[#6B1817]`
- **Violet/Purple**: `from-violet-600 to-purple-600`
- **Blue/Cyan**: `from-blue-600 to-cyan-600`
- **Green/Emerald**: `from-green-600 to-emerald-600`

### Effets
- **Backdrop Blur**: `bg-black/60 backdrop-blur-md`
- **Glassmorphism**: `bg-white/20 backdrop-blur-sm border border-white/30`
- **Shadows**: `shadow-2xl`
- **Border Radius**: `rounded-3xl` (modals), `rounded-2xl` (cards), `rounded-xl` (inputs)

### Typography
- **Font**: Space Grotesk
- **Weight**: font-black pour les titres
- **Sizes**: text-3xl (modal headers), text-xl (section headers)

### Animations
- **Modal**: `animate-in fade-in zoom-in-95 duration-300`
- **Buttons**: `hover:scale-105 transition-all`
- **Inputs**: `focus:ring-4 focus:ring-violet-500/20`

### Composants Custom
- **ModernInput**: Input avec icône, border-2, focus ring
- **ModernSelect**: Select avec icône, border-2, focus ring
- **ModernTextarea**: Textarea avec icône, border-2, focus ring
