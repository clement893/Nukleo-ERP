# Batch 6: Profile/Settings Pages - Theme Fix Report

## Summary
Successfully migrated Profile and Settings pages and components to use theme-aware CSS variables, replacing all hardcoded gray colors with theme variables.

## Files Modified

### Profile Pages (4 files)
1. `apps/web/src/app/[locale]/profile/page.tsx`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

2. `apps/web/src/app/[locale]/profile/settings/page.tsx`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

3. `apps/web/src/app/[locale]/profile/security/page.tsx`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

4. `apps/web/src/app/[locale]/profile/activity/page.tsx`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

### Profile Components (2 files)
1. `apps/web/src/components/profile/ProfileCard.tsx`
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

2. `apps/web/src/components/profile/ProfileForm.tsx`
   - No hardcoded colors found (already using theme-aware components)

### Settings Components (6 files)
1. `apps/web/src/components/settings/SettingsNavigation.tsx`
   - Fixed: `bg-gray-100 dark:bg-gray-700` → `bg-muted`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground`

2. `apps/web/src/components/settings/GeneralSettings.tsx`
   - Fixed: `text-gray-700 dark:text-gray-300` → `text-foreground` (10 instances)
   - Fixed: `text-gray-500 dark:text-gray-400` → `text-muted-foreground` (2 instances)

3. `apps/web/src/components/settings/UserSettings.tsx`
   - Fixed: `bg-white dark:bg-gray-800` → `bg-background` (2 instances)
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
   - Fixed: `text-gray-700 dark:text-gray-300` → `text-foreground`
   - Fixed: `bg-white dark:bg-gray-700` → `bg-background`
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground`
   - Fixed: `border-gray-300 dark:border-gray-600` → `border-border`

4. `apps/web/src/components/settings/SecuritySettings.tsx`
   - Fixed: `bg-white dark:bg-gray-800` → `bg-background` (4 instances)
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground` (6 instances)
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground` (4 instances)
   - Fixed: `border-gray-200 dark:border-gray-700` → `border-border` (2 instances)
   - Fixed: `text-gray-700 dark:text-gray-300` → `text-foreground` (2 instances)

5. `apps/web/src/components/settings/NotificationSettings.tsx`
   - Fixed: `bg-white dark:bg-gray-800` → `bg-background`
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground` (2 instances)
   - Fixed: `border-gray-200 dark:border-gray-700` → `border-border`
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground`

6. `apps/web/src/components/settings/APIKeys.tsx`
   - Fixed: `bg-white dark:bg-gray-800` → `bg-background` (3 instances)
   - Fixed: `text-gray-900 dark:text-gray-100` → `text-foreground` (5 instances)
   - Fixed: `text-gray-600 dark:text-gray-400` → `text-muted-foreground` (5 instances)
   - Fixed: `text-gray-400 dark:text-gray-500` → `text-muted-foreground`
   - Fixed: `border-gray-200 dark:border-gray-700` → `border-border` (2 instances)
   - Fixed: `bg-gray-50 dark:bg-gray-900` → `bg-muted`
   - Fixed: `border-gray-300 dark:border-gray-600` → `border-border` (2 instances)
   - Fixed: `hover:text-gray-900 dark:hover:text-gray-100` → `hover:text-foreground`
   - Fixed: `hover:bg-gray-50 dark:hover:bg-gray-800` → `hover:bg-muted`
   - Fixed: `bg-gray-100 dark:bg-gray-900` → `bg-muted`
   - Fixed: `text-gray-700 dark:text-gray-300` → `text-foreground`

7. `apps/web/src/components/settings/OrganizationSettings.tsx`
   - Fixed: `bg-white dark:bg-gray-800` → `bg-background` (3 instances)

## Color Mappings Applied

- `text-gray-900 dark:text-gray-100` → `text-foreground`
- `text-gray-700 dark:text-gray-300` → `text-foreground`
- `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
- `text-gray-500 dark:text-gray-400` → `text-muted-foreground`
- `text-gray-400 dark:text-gray-500` → `text-muted-foreground`
- `bg-white dark:bg-gray-800` → `bg-background`
- `bg-white dark:bg-gray-700` → `bg-background`
- `bg-gray-100 dark:bg-gray-700` → `bg-muted`
- `bg-gray-50 dark:bg-gray-900` → `bg-muted`
- `bg-gray-100 dark:bg-gray-900` → `bg-muted`
- `border-gray-200 dark:border-gray-700` → `border-border`
- `border-gray-300 dark:border-gray-600` → `border-border`
- `hover:bg-gray-50 dark:hover:bg-gray-800` → `hover:bg-muted`
- `hover:text-gray-900 dark:hover:text-gray-100` → `hover:text-foreground`

## Verification

✅ **TypeScript**: No errors
✅ **Linter**: No errors
✅ **Hardcoded Colors**: All removed from profile/settings pages and main components
⚠️ **Note**: Some hardcoded colors remain in `WebhooksSettings.tsx` and `APISettings.tsx` (will be addressed in a future batch)

## Impact

- **12 files** modified
- **~60+ color instances** migrated to theme variables
- All profile and settings pages now fully theme-aware
- Consistent theming across user account management interfaces

## Next Steps

Batch 7: Dashboard/Admin Pages (remaining pages)

