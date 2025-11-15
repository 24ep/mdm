# Design Tokens System

## Overview

The application now uses a centralized design token system for spacing, typography, and sizing. This provides:

- **Consistency**: All spacing and font sizes are defined in one place
- **Reduced Size**: Optimized values for a more compact, modern tech application
- **Maintainability**: Easy to adjust globally by changing token values
- **Scalability**: Clear naming conventions for easy adoption

## Key Changes

### Container Padding
- **Before**: `2rem` (32px)
- **After**: `1rem` (16px) on mobile, `1.5rem` (24px) on desktop
- **Reduction**: 50% on mobile, 25% on desktop

### Spacing Scale
The spacing scale has been optimized for a more compact UI:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `xs` | 0.25rem | 4px | Tight spacing, icon gaps |
| `sm` | 0.5rem | 8px | Small padding, input padding |
| `md` | 0.75rem | 12px | Medium spacing, sidebar padding |
| `base` | 1rem | 16px | Standard spacing, card padding |
| `lg` | 1.25rem | 20px | Large spacing, section gaps |
| `xl` | 1.5rem | 24px | Extra large spacing |
| `2xl` | 2rem | 32px | Very large spacing |
| `3xl` | 2.5rem | 40px | Huge spacing |
| `4xl` | 3rem | 48px | Maximum spacing |

### Font Size Scale
Optimized typography scale:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `xs` | 0.75rem | 12px | Small labels, captions |
| `sm` | 0.875rem | 14px | Body text, descriptions |
| `base` | 1rem | 16px | Default body text |
| `lg` | 1.125rem | 18px | Large body text |
| `xl` | 1.25rem | 20px | Small headings |
| `2xl` | 1.5rem | 24px | Section headings |
| `3xl` | 1.875rem | 30px | Page headings |
| `4xl` | 2.25rem | 36px | Large headings |
| `5xl` | 3rem | 48px | Hero headings |

## Usage

### Tailwind Classes (Recommended)

Use Tailwind utility classes that now reference the optimized tokens:

```tsx
// Spacing
<div className="p-4">        {/* padding: 1rem (16px) */}
<div className="m-2">        {/* margin: 0.5rem (8px) */}
<div className="gap-3">      {/* gap: 0.75rem (12px) */}
<div className="space-y-2">  {/* vertical spacing: 0.5rem (8px) */}

// Typography
<p className="text-sm">      {/* font-size: 0.875rem (14px) */}
<h1 className="text-2xl">   {/* font-size: 1.5rem (24px) */}
```

### CSS Variables

For custom CSS, use the CSS variables defined in `globals.css`:

```css
.my-component {
  padding: var(--spacing-base);        /* 1rem (16px) */
  margin-bottom: var(--spacing-lg);   /* 1.25rem (20px) */
  font-size: var(--font-size-sm);      /* 0.875rem (14px) */
}

.card {
  padding: var(--card-padding);       /* 1rem (16px) */
  gap: var(--section-gap);             /* 1.25rem (20px) */
}
```

### TypeScript Constants

Import and use the design tokens in TypeScript:

```typescript
import { SPACING, FONT_SIZES, COMPONENT_SPACING } from '@/lib/design-tokens'

const styles = {
  padding: SPACING.base,              // '1rem'
  fontSize: FONT_SIZES.sm,            // '0.875rem'
  gap: COMPONENT_SPACING.cardGap,    // '0.75rem'
}
```

## Component-Specific Spacing

Common UI elements have dedicated spacing tokens:

```css
/* Input elements */
--input-padding: 0.5rem;      /* 8px */
--input-height: 2rem;         /* 32px */

/* Cards/Panels */
--card-padding: 1rem;         /* 16px */

/* Buttons */
--button-padding-x: 1rem;     /* 16px */
--button-padding-y: 0.5rem;   /* 8px */

/* Sidebar/Navigation */
--sidebar-padding: 0.75rem;    /* 12px */

/* Content areas */
--content-padding: 1rem;      /* 16px */
--section-gap: 1.25rem;       /* 20px */
```

## Migration Guide

### Before (Hardcoded Values)
```tsx
<div className="p-8">           {/* 2rem (32px) */}
<div className="text-lg">       {/* 1.125rem (18px) - Tailwind default */}
<div style={{ padding: '24px' }}> {/* Hardcoded pixel value */}
```

### After (Using Tokens)
```tsx
<div className="p-4">           {/* 1rem (16px) - reduced */}
<div className="text-lg">      {/* 1.125rem (18px) - optimized */}
<div style={{ padding: 'var(--spacing-base)' }}> {/* CSS variable */}
```

## Benefits

1. **Reduced Visual Weight**: 50% reduction in container padding makes better use of screen space
2. **Consistent Spacing**: All components use the same spacing scale
3. **Easy Global Adjustments**: Change one value to update the entire application
4. **Better Performance**: Smaller spacing values reduce layout complexity
5. **Modern Aesthetic**: Compact spacing aligns with modern tech application design

## Files Modified

- `tailwind.config.ts` - Added spacing and fontSize scales
- `src/app/globals.css` - Added CSS variables for spacing and typography
- `src/lib/design-tokens.ts` - Created TypeScript constants for design tokens

## Future Improvements

Consider migrating hardcoded spacing values throughout the codebase to use these tokens. This can be done incrementally:

1. Start with new components
2. Update frequently used components
3. Gradually migrate existing components

