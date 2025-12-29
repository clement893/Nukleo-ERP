# Theme Template Implementation Plan

**Goal**: Transform this into a fully themeable template where complex UIs can be completely customized through themes, not just colors and fonts.

**Approach**: Batched implementation with build verification and progress reports at each step.

---

## 📋 Implementation Strategy

### Principles
1. **Each batch must be buildable** - No breaking changes
2. **TypeScript-safe** - All types defined before use
3. **Backward compatible** - Existing themes continue working
4. **Incremental** - Each batch builds on previous
5. **Tested** - Verify theme changes work after each batch
6. **Documented** - Update docs at end

---

## 🎯 Batch Overview

| Batch | Focus | Duration | Risk Level | Dependencies |
|-------|-------|----------|------------|--------------|
| **Batch 1** | Theme Schema Extension | 2-3 days | Low | None |
| **Batch 2** | Spacing System Integration | 3-4 days | Medium | Batch 1 |
| **Batch 3** | Component Size System | 4-5 days | Medium | Batch 1, 2 |
| **Batch 4** | Component Variant System | 4-5 days | Medium | Batch 1, 2, 3 |
| **Batch 5** | Layout System | 5-6 days | High | Batch 1, 2 |
| **Batch 6** | Animation System | 3-4 days | Low | Batch 1 |
| **Batch 7** | Effects Integration | 3-4 days | Low | Batch 1 |
| **Batch 8** | Component Updates (Core) | 5-6 days | High | Batches 1-7 |
| **Batch 9** | Component Updates (Extended) | 4-5 days | Medium | Batch 8 |
| **Batch 10** | Theme Builder UI | 4-5 days | Medium | Batches 1-9 |
| **Batch 11** | Documentation & Examples | 3-4 days | Low | All batches |
| **Total** | | **40-50 days** | | |

---

## 📦 Batch 1: Theme Schema Extension

### Goal
Extend theme configuration schema to support complex theming without breaking existing themes.

### Tasks

#### 1.1 Update TypeScript Types
**File**: `packages/types/src/theme.ts`

```typescript
// Add new interfaces
export interface LayoutConfig {
  spacing?: {
    unit?: string;
    scale?: number;
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
  };
  gaps?: {
    tight?: string;
    normal?: string;
    loose?: string;
  };
  containers?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export interface ComponentSizeConfig {
  paddingX?: string;
  paddingY?: string;
  fontSize?: string;
  minHeight?: string;
  borderRadius?: string;
}

export interface ComponentVariantConfig {
  background?: string;
  hover?: string;
  text?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  textShadow?: string;
  [key: string]: unknown;
}

export interface ComponentConfig {
  button?: {
    sizes?: Record<string, ComponentSizeConfig>;
    variants?: Record<string, ComponentVariantConfig>;
    layout?: {
      iconPosition?: 'left' | 'right' | 'top' | 'bottom';
      iconGap?: string;
      contentAlignment?: 'left' | 'center' | 'right';
    };
  };
  card?: {
    padding?: {
      sm?: string;
      md?: string;
      lg?: string;
    };
    structure?: {
      header?: boolean;
      footer?: boolean;
      divider?: boolean;
    };
  };
  // Add more components as needed
}

export interface AnimationConfig {
  duration?: {
    fast?: string;
    normal?: string;
    slow?: string;
  };
  easing?: {
    default?: string;
    bounce?: string;
    smooth?: string;
  };
  transitions?: {
    colors?: string;
    transform?: string;
    opacity?: string;
  };
}

export interface ResponsiveConfig {
  breakpoints?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    wide?: string;
  };
  behaviors?: {
    mobileFirst?: boolean;
    containerQueries?: boolean;
  };
}

// Extend ThemeConfig
export interface ThemeConfig {
  // Existing fields (keep for backward compatibility)
  primary_color: string;
  secondary_color: string;
  danger_color: string;
  warning_color: string;
  info_color: string;
  success_color: string;
  font_family?: string;
  border_radius?: string;
  
  // New fields
  layout?: LayoutConfig;
  components?: ComponentConfig;
  animations?: AnimationConfig;
  responsive?: ResponsiveConfig;
  
  // Existing fields
  colors?: Record<string, unknown>;
  typography?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  
  [key: string]: unknown; // Allow extra config fields
}
```

#### 1.2 Update Backend Model (Optional - if needed)
**File**: `backend/app/models/theme.py`
- Ensure JSON field accepts new structure
- Add validation for new fields (optional)

#### 1.3 Update Default Theme Config
**File**: `apps/web/src/lib/theme/default-theme-config.ts`
- Add default values for new config sections
- Ensure backward compatibility

### Verification Steps
- [ ] TypeScript compiles without errors
- [ ] Existing themes still load correctly
- [ ] New config fields are optional (backward compatible)
- [ ] Types exported correctly from `@modele/types`

### Progress Report Template
```markdown
## Batch 1 Progress Report

**Status**: ✅ Complete / ⚠️ In Progress / ❌ Blocked

**Completed**:
- [x] TypeScript types extended
- [x] Backward compatibility verified

**Issues**:
- None / [List any issues]

**Next Batch**: Batch 2 - Spacing System Integration
```

---

## 📦 Batch 2: Spacing System Integration

### Goal
Replace hardcoded Tailwind spacing with theme-aware CSS variables.

### Tasks

#### 2.1 Extend CSS Variable System
**File**: `apps/web/src/lib/theme/global-theme-provider.tsx`

Add spacing variable application:
```typescript
// In applyThemeConfig function
if (config.layout?.spacing) {
  const spacing = config.layout.spacing;
  if (spacing.unit) root.style.setProperty('--spacing-unit', spacing.unit);
  if (spacing.scale) root.style.setProperty('--spacing-scale', String(spacing.scale));
  Object.entries(spacing).forEach(([key, value]) => {
    if (key !== 'unit' && key !== 'scale' && typeof value === 'string') {
      root.style.setProperty(`--spacing-${key}`, value);
    }
  });
}

if (config.layout?.gaps) {
  const gaps = config.layout.gaps;
  Object.entries(gaps).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--gap-${key}`, value);
    }
  });
}
```

#### 2.2 Update Tailwind Config
**File**: `apps/web/tailwind.config.ts`

```typescript
spacing: {
  // Use CSS variables with fallbacks
  xs: 'var(--spacing-xs, 0.5rem)',
  sm: 'var(--spacing-sm, 0.75rem)',
  md: 'var(--spacing-md, 1rem)',
  lg: 'var(--spacing-lg, 1.5rem)',
  xl: 'var(--spacing-xl, 2rem)',
  '2xl': 'var(--spacing-2xl, 3rem)',
  '3xl': 'var(--spacing-3xl, 4rem)',
  // Keep existing custom values
  18: '4.5rem',
  88: '22rem',
  128: '32rem',
},
```

#### 2.3 Create Spacing Helper Hook
**File**: `apps/web/src/lib/theme/use-theme-spacing.ts` (new)

```typescript
import { useGlobalTheme } from './global-theme-provider';

export function useThemeSpacing() {
  const { theme } = useGlobalTheme();
  
  const getSpacing = (key: string, fallback?: string) => {
    if (typeof window === 'undefined') {
      return fallback || `var(--spacing-${key})`;
    }
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--spacing-${key}`)
      .trim();
    return value || fallback || `var(--spacing-${key})`;
  };
  
  return { getSpacing };
}
```

### Verification Steps
- [ ] Build succeeds
- [ ] CSS variables are set correctly
- [ ] Tailwind spacing classes use variables
- [ ] Existing components still render correctly
- [ ] Test with theme that changes spacing values

### Progress Report Template
```markdown
## Batch 2 Progress Report

**Status**: ✅ Complete

**Completed**:
- [x] Spacing CSS variables system
- [x] Tailwind config updated
- [x] Helper hook created

**Testing**:
- [x] Build successful
- [x] Variables applied correctly
- [x] Backward compatible

**Next Batch**: Batch 3 - Component Size System
```

---

## 📦 Batch 3: Component Size System

### Goal
Make component sizes themeable (Button, Input, Card, etc.)

### Tasks

#### 3.1 Create Component Size Hook
**File**: `apps/web/src/lib/theme/use-component-config.ts` (new)

```typescript
import { useGlobalTheme } from './global-theme-provider';
import type { ComponentSizeConfig } from '@modele/types';

export function useComponentConfig(componentName: string) {
  const { theme } = useGlobalTheme();
  
  const getSize = (size: string): ComponentSizeConfig | null => {
    const config = theme?.config?.components?.[componentName as keyof ComponentConfig]?.sizes?.[size];
    return config || null;
  };
  
  const getVariant = (variant: string): ComponentVariantConfig | null => {
    const config = theme?.config?.components?.[componentName as keyof ComponentConfig]?.variants?.[variant];
    return config || null;
  };
  
  return { getSize, getVariant };
}
```

#### 3.2 Update Button Component (Example)
**File**: `apps/web/src/components/ui/Button.tsx`

```typescript
import { useComponentConfig } from '@/lib/theme/use-component-config';

function Button({ size = 'md', variant = 'primary', ...props }: ButtonProps) {
  const { getSize, getVariant } = useComponentConfig('button');
  const sizeConfig = getSize(size);
  const variantConfig = getVariant(variant);
  
  // Use theme config if available, fallback to defaults
  const paddingX = sizeConfig?.paddingX || sizes[size].split(' ')[0]; // Extract from existing
  const paddingY = sizeConfig?.paddingY || sizes[size].split(' ')[1];
  
  // Apply via CSS variables or inline styles
  const buttonStyle = {
    ...(sizeConfig?.paddingX && { paddingLeft: sizeConfig.paddingX, paddingRight: sizeConfig.paddingX }),
    ...(sizeConfig?.paddingY && { paddingTop: sizeConfig.paddingY, paddingBottom: sizeConfig.paddingY }),
    ...(variantConfig?.background && { backgroundColor: variantConfig.background }),
  };
  
  // ... rest of component
}
```

#### 3.3 Update Input Component
**File**: `apps/web/src/components/ui/Input.tsx`
- Similar approach to Button
- Use theme config for sizes

#### 3.4 Update Card Component
**File**: `apps/web/src/components/ui/Card.tsx`
- Use theme config for padding

### Verification Steps
- [ ] Build succeeds
- [ ] Button sizes work with theme config
- [ ] Input sizes work with theme config
- [ ] Card padding works with theme config
- [ ] Fallback to defaults if no theme config
- [ ] TypeScript types correct

### Progress Report Template
```markdown
## Batch 3 Progress Report

**Status**: ✅ Complete

**Completed**:
- [x] Component config hook
- [x] Button component updated
- [x] Input component updated
- [x] Card component updated

**Testing**:
- [x] Theme config applies correctly
- [x] Fallbacks work
- [x] No TypeScript errors

**Next Batch**: Batch 4 - Component Variant System
```

---

## 📦 Batch 4: Component Variant System

### Goal
Make component variants extensible and themeable.

### Tasks

#### 4.1 Extend Variant System
**File**: `apps/web/src/components/ui/Button.tsx`

```typescript
// Merge theme variants with default variants
const getVariantClasses = (variant: string, variantConfig?: ComponentVariantConfig) => {
  const defaultVariants = {
    primary: ['bg-primary-600', 'text-white', ...],
    // ... existing
  };
  
  // If theme config exists, use it
  if (variantConfig) {
    return [
      variantConfig.background && `[background-color:${variantConfig.background}]`,
      variantConfig.text && `[color:${variantConfig.text}]`,
      variantConfig.border && `[border-color:${variantConfig.border}]`,
      // ... apply all config properties
    ].filter(Boolean).join(' ');
  }
  
  // Fallback to defaults
  return defaultVariants[variant] || defaultVariants.primary;
};
```

#### 4.2 Create Variant Helper
**File**: `apps/web/src/lib/theme/variant-helpers.ts` (new)

```typescript
export function applyVariantConfig(
  baseClasses: string[],
  variantConfig: ComponentVariantConfig
): string {
  const classes = [...baseClasses];
  
  // Convert config to Tailwind arbitrary values
  if (variantConfig.background) {
    classes.push(`[background-color:${variantConfig.background}]`);
  }
  if (variantConfig.text) {
    classes.push(`[color:${variantConfig.text}]`);
  }
  // ... handle all properties
  
  return classes.join(' ');
}
```

#### 4.3 Update Multiple Components
- Button
- Input
- Card
- Badge
- Alert

### Verification Steps
- [ ] Build succeeds
- [ ] Custom variants work
- [ ] Default variants still work
- [ ] Variant config applies correctly

---

## 📦 Batch 5: Layout System

### Goal
Make layouts themeable (gaps, containers, grid systems).

### Tasks

#### 5.1 Create Layout Hook
**File**: `apps/web/src/lib/theme/use-layout.ts` (new)

```typescript
export function useLayout() {
  const { theme } = useGlobalTheme();
  
  const getGap = (size: 'tight' | 'normal' | 'loose' = 'normal') => {
    return `var(--gap-${size}, 1rem)`;
  };
  
  const getContainerWidth = (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg') => {
    return `var(--container-${size}, 1024px)`;
  };
  
  return { getGap, getContainerWidth };
}
```

#### 5.2 Update Container Component
**File**: `apps/web/src/components/ui/Container.tsx`
- Use theme container widths

#### 5.3 Create Layout Components
**File**: `apps/web/src/components/ui/Stack.tsx` (new)
**File**: `apps/web/src/components/ui/Grid.tsx` (new)
- Use theme gaps

### Verification Steps
- [ ] Layout components use theme values
- [ ] Gaps apply correctly
- [ ] Containers use theme widths

---

## 📦 Batch 6: Animation System

### Goal
Make animations and transitions themeable.

### Tasks

#### 6.1 Apply Animation CSS Variables
**File**: `apps/web/src/lib/theme/global-theme-provider.tsx`

```typescript
if (config.animations) {
  const anim = config.animations;
  if (anim.duration) {
    Object.entries(anim.duration).forEach(([key, value]) => {
      root.style.setProperty(`--animation-duration-${key}`, value);
    });
  }
  if (anim.easing) {
    Object.entries(anim.easing).forEach(([key, value]) => {
      root.style.setProperty(`--animation-easing-${key}`, value);
    });
  }
}
```

#### 6.2 Update Tailwind Config
**File**: `apps/web/tailwind.config.ts`

```typescript
transitionDuration: {
  fast: 'var(--animation-duration-fast, 150ms)',
  normal: 'var(--animation-duration-normal, 200ms)',
  slow: 'var(--animation-duration-slow, 300ms)',
},
transitionTimingFunction: {
  default: 'var(--animation-easing-default, ease-in-out)',
  bounce: 'var(--animation-easing-bounce, cubic-bezier(0.68, -0.55, 0.265, 1.55))',
  smooth: 'var(--animation-easing-smooth, cubic-bezier(0.4, 0, 0.2, 1))',
},
```

### Verification Steps
- [ ] Animation variables apply
- [ ] Transitions use theme values
- [ ] Defaults work if no config

---

## 📦 Batch 7: Effects Integration

### Goal
Widely apply effects system to components.

### Tasks

#### 7.1 Create Effect Hook
**File**: `apps/web/src/lib/theme/use-effects.ts` (new)

```typescript
export function useEffects() {
  const { theme } = useGlobalTheme();
  
  const getEffect = (effectName: string, property: string) => {
    return `var(--effect-${effectName}-${property})`;
  };
  
  const hasEffect = (effectName: string) => {
    const effects = theme?.config?.effects;
    return effects && effects[effectName];
  };
  
  return { getEffect, hasEffect };
}
```

#### 7.2 Apply Effects to Components
- Card: glassmorphism
- Modal: glassmorphism
- Dropdown: glassmorphism
- Button: neon glow (if enabled)

### Verification Steps
- [ ] Effects apply correctly
- [ ] Components use effects when enabled
- [ ] No performance issues

---

## 📦 Batch 8: Component Updates (Core Components)

### Goal
Update core UI components to use theme system.

### Components to Update:
1. Button ✅ (from Batch 3)
2. Input ✅ (from Batch 3)
3. Card ✅ (from Batch 3)
4. Form
5. Modal
6. Dropdown
7. Select
8. Textarea
9. Checkbox
10. Radio

### Tasks
- Update each component to use theme hooks
- Replace hardcoded values with theme variables
- Ensure backward compatibility
- Test each component

### Verification Steps
- [ ] All core components updated
- [ ] Build succeeds
- [ ] Components render correctly
- [ ] Theme changes apply

---

## 📦 Batch 9: Component Updates (Extended Components)

### Goal
Update remaining components.

### Components:
- Table
- DataTable
- Tabs
- Accordion
- Alert
- Badge
- Breadcrumb
- Pagination
- etc.

### Tasks
- Same as Batch 8
- Focus on components that need theme support

---

## 📦 Batch 10: Theme Builder UI

### Goal
Create UI for building complex themes.

### Tasks

#### 10.1 Create Theme Builder Component
**File**: `apps/web/src/app/[locale]/admin/themes/builder/page.tsx` (new)

Features:
- Visual theme editor
- Live preview
- Export/import themes
- Preset themes

#### 10.2 Create Theme Presets
**File**: `apps/web/src/lib/theme/presets.ts` (new)

Presets:
- Minimal
- Bold
- Neon
- Corporate
- Modern

### Verification Steps
- [ ] Theme builder works
- [ ] Can create custom themes
- [ ] Presets load correctly
- [ ] Export/import works

---

## 📦 Batch 11: Documentation & Examples

### Goal
Update all documentation for template users.

### Tasks

#### 11.1 Update Main Documentation
**Files to Update**:
- `README.md` - Add theme system overview
- `docs/THEME_SETUP.md` - Update with new features
- `docs/THEME_MANAGEMENT.md` - Update with complex theming
- `docs/THEME_CREATION_GUIDE.md` - Add complex theme examples

#### 11.2 Create New Documentation
**New Files**:
- `docs/THEME_COMPONENT_CUSTOMIZATION.md` - How to theme components
- `docs/THEME_LAYOUT_SYSTEM.md` - Layout theming guide
- `docs/THEME_ANIMATION_SYSTEM.md` - Animation theming guide
- `docs/THEME_EXAMPLES.md` - Complete theme examples
- `docs/THEME_MIGRATION.md` - Migrating existing themes

#### 11.3 Create Example Themes
**File**: `examples/themes/` (new directory)

Themes:
- `minimal-theme.json`
- `bold-theme.json`
- `neon-theme.json`
- `corporate-theme.json`
- `modern-theme.json`

#### 11.4 Update Code Comments
- Add JSDoc comments to theme hooks
- Document component theming
- Add usage examples

### Verification Steps
- [ ] All docs updated
- [ ] Examples work
- [ ] Documentation is clear
- [ ] Template users can follow guides

---

## 🔄 Batch Workflow

### For Each Batch:

1. **Planning** (Day 1)
   - Review batch tasks
   - Identify dependencies
   - Plan implementation

2. **Implementation** (Days 2-N)
   - Implement tasks
   - Write tests
   - Fix issues

3. **Verification** (Day N+1)
   - Run build
   - Check TypeScript
   - Test functionality
   - Verify backward compatibility

4. **Progress Report** (Day N+1)
   - Document completed work
   - Note any issues
   - Update status

5. **Commit & Push** (Day N+1)
   - Commit changes
   - Push to branch
   - Create PR (optional)

---

## 📊 Progress Tracking

### Create Progress File
**File**: `THEME_IMPLEMENTATION_PROGRESS.md`

```markdown
# Theme Implementation Progress

## Overall Status: 🟡 In Progress (Batch X of 11)

### Batch Status

| Batch | Status | Completion | Notes |
|-------|--------|------------|-------|
| 1. Schema Extension | ✅ Complete | 100% | - |
| 2. Spacing System | ✅ Complete | 100% | - |
| 3. Component Sizes | 🟡 In Progress | 60% | Blocked on... |
| 4. Component Variants | ⏳ Pending | 0% | - |
| ... | ... | ... | ... |

### Current Batch: Batch 3

**Started**: [Date]
**Expected Completion**: [Date]
**Status**: In Progress

**Tasks**:
- [x] Task 1
- [x] Task 2
- [ ] Task 3
- [ ] Task 4

**Issues**:
- None

**Next Steps**:
1. Complete Task 3
2. Test component sizes
3. Move to Batch 4
```

---

## 🚨 Risk Mitigation

### Build Errors
- **Prevention**: Run build after each significant change
- **Fix**: Revert if build breaks, fix incrementally

### TypeScript Errors
- **Prevention**: Define types before use
- **Fix**: Add proper type definitions

### Backward Compatibility
- **Prevention**: Make new fields optional
- **Fix**: Provide migration path

### Performance Issues
- **Prevention**: Test with large themes
- **Fix**: Optimize CSS variable lookups

---

## ✅ Success Criteria

### Technical
- [ ] All batches complete
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] All components themeable
- [ ] Backward compatible

### Functional
- [ ] Can create complex themes
- [ ] Theme changes apply correctly
- [ ] Performance acceptable
- [ ] Documentation complete

### Template Quality
- [ ] Easy for users to create themes
- [ ] Clear examples provided
- [ ] Documentation comprehensive
- [ ] Template is production-ready

---

## 📝 Notes

- **Start with low-risk batches** (1, 2, 6, 7)
- **Test thoroughly** after each batch
- **Document as you go** (don't wait until end)
- **Get feedback** early (Batch 3-4)
- **Iterate** if needed

---

**Ready to start? Begin with Batch 1!**
