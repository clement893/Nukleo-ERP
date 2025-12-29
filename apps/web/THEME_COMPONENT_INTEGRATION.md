# Theme Component Integration Guide

**Problem**: Theme changes don't visually affect components because many components use hardcoded colors instead of theme-aware CSS variables.

**Solution**: Use theme-aware Tailwind classes and CSS variables throughout components.

---

## 🎨 Theme-Aware Color Classes

### ✅ USE THESE (Theme-Aware)
```tsx
// Primary colors - Changes with theme
className="bg-primary-500 text-primary-50"
className="text-primary-600 hover:text-primary-700"

// Secondary colors - Changes with theme  
className="bg-secondary-500 text-secondary-50"

// Danger/Warning/Info/Success - Changes with theme
className="bg-danger-500 text-danger-50"
className="bg-warning-500 text-warning-50"

// Base colors - Uses theme variables
className="bg-background text-foreground"
className="bg-muted text-muted-foreground"
className="border-border"
```

### ❌ AVOID THESE (Hardcoded)
```tsx
// Hardcoded grays - Won't change with theme
className="bg-gray-100 text-gray-700"
className="text-gray-600 dark:text-gray-300"

// Hardcoded blues/slates - Won't change with theme
className="bg-blue-500 text-blue-50"
className="bg-slate-100 text-slate-700"
```

---

## 🔧 Component Patterns

### 1. Buttons & Interactive Elements
```tsx
// ✅ Theme-aware button
<button className="bg-primary-500 hover:bg-primary-600 text-white">
  Click me
</button>

// ✅ Outline button using theme
<button className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50">
  Outline
</button>

// ❌ Hardcoded colors
<button className="bg-blue-500 hover:bg-blue-600 text-white">
  Won't change with theme
</button>
```

### 2. Cards & Containers
```tsx
// ✅ Theme-aware card
<div className="bg-background border-border rounded-lg shadow-sm">
  <h3 className="text-foreground">Title</h3>
  <p className="text-muted-foreground">Content</p>
</div>

// ❌ Hardcoded colors
<div className="bg-white dark:bg-gray-800 border-gray-200">
  Won't adapt to theme colors
</div>
```

### 3. Text & Typography
```tsx
// ✅ Theme-aware text
<h1 className="text-foreground">Heading</h1>
<p className="text-muted-foreground">Subtitle</p>
<span className="text-primary-600">Accent text</span>

// ❌ Hardcoded colors
<h1 className="text-gray-900 dark:text-gray-100">Won't change</h1>
```

### 4. Borders & Dividers
```tsx
// ✅ Theme-aware borders
<div className="border border-border">
<div className="border-t border-border">

// ❌ Hardcoded borders
<div className="border border-gray-200 dark:border-gray-700">
```

---

## 🎯 Making Components Theme-Aware

### Step 1: Replace Hardcoded Colors
Find and replace hardcoded color classes:

```tsx
// Before
className="bg-gray-100 text-gray-700 hover:bg-gray-200"

// After  
className="bg-muted text-foreground hover:bg-muted/80"
```

### Step 2: Use Primary/Secondary for Accents
```tsx
// Before
className="text-blue-600 hover:text-blue-700"

// After
className="text-primary-600 hover:text-primary-700"
```

### Step 3: Use CSS Variables for Complex Cases
```tsx
// For inline styles or complex calculations
style={{ 
  backgroundColor: 'var(--color-primary-500)',
  color: 'var(--color-primary-50)'
}}
```

---

## 📋 Component Checklist

When updating a component, ensure:

- [ ] No hardcoded `gray-*`, `blue-*`, `slate-*` colors (unless intentionally neutral)
- [ ] Interactive elements use `primary-*` or `secondary-*` colors
- [ ] Backgrounds use `bg-background` or `bg-muted`
- [ ] Text uses `text-foreground` or `text-muted-foreground`
- [ ] Borders use `border-border`
- [ ] Hover states use theme colors (`hover:bg-primary-600`)

---

## 🚀 Quick Migration Examples

### Button Component
```tsx
// Ghost variant - Before
className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"

// Ghost variant - After
className="text-foreground hover:bg-muted focus:ring-primary-500"
```

### Header Component  
```tsx
// Links - Before
className="text-gray-700 dark:text-gray-300 hover:text-primary-600"

// Links - After
className="text-foreground hover:text-primary transition-colors"
```

### Card Component
```tsx
// Already good! Uses theme variables
className="bg-[var(--color-background)] border-[var(--color-border)]"
```

---

## 🎨 Theme Impact Examples

### Example 1: Primary Color Change
**Theme Setting**: `primary_color: "#ff6b6b"` (Coral Red)

**Components Affected**:
- All buttons with `bg-primary-*` classes
- Links with `text-primary-*` classes  
- Focus rings with `ring-primary-*`
- Borders with `border-primary-*`

**Visual Change**: 
- Buttons change from blue to coral red
- Links change from blue to coral red
- Focus states use coral red

### Example 2: Secondary Color Change
**Theme Setting**: `secondary_color: "#4ecdc4"` (Turquoise)

**Components Affected**:
- Secondary buttons
- Success states (if not explicitly set)
- Accent elements

**Visual Change**:
- Secondary buttons become turquoise
- Success messages use turquoise

### Example 3: Background Color Change
**Theme Setting**: `colors.background: "#f8f9fa"` (Light Gray)

**Components Affected**:
- All elements using `bg-background`
- Cards, modals, dropdowns

**Visual Change**:
- Entire app background changes
- Cards use new background color

---

## 🔍 Finding Hardcoded Colors

Search for these patterns in your components:

```bash
# Find hardcoded gray colors
grep -r "gray-[0-9]" src/components

# Find hardcoded blue colors  
grep -r "blue-[0-9]" src/components

# Find hardcoded slate colors
grep -r "slate-[0-9]" src/components
```

---

## 💡 Best Practices

1. **Use semantic color names**: `primary`, `secondary`, `danger` instead of `blue`, `green`, `red`
2. **Leverage CSS variables**: For complex styling, use `var(--color-primary-500)` directly
3. **Test theme changes**: Change theme colors and verify components update
4. **Document exceptions**: If you MUST use hardcoded colors, document why
5. **Use theme helpers**: Import from `@/lib/theme/component-helpers` for utilities

---

## 🎯 Next Steps

1. Audit all components for hardcoded colors
2. Update components to use theme-aware classes
3. Test with different theme configurations
4. Document any exceptions or special cases
