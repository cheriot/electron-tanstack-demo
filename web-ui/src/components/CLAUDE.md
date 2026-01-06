# Component Library Guidelines

This file provides guidance on which component libraries to use when working on the UI.

## Component Library Preferences

### Catalyst (Preferred for Layout & Page Elements)

**Use Catalyst components for:**

- Layout components (navbar, stacked-layout, divider)
- Page-level UI elements (headings, pagination, description lists)
- Form controls (radio, listbox, combobox, switch)
- Navigation elements (link, dropdown)
- Alerts and feedback

**Location:** `@/components/catalyst/`

Catalyst is built by Tailwind Labs and provides well-designed, accessible components that work seamlessly with Tailwind CSS.

### ai-elements (AI Chat UI)

**Always consider ai-elements when updating the AI chat UI.**

**Use ai-elements for:**

- Chat interfaces (conversation, controls, context)
- AI-specific patterns (chain-of-thought, checkpoint, confirmation)
- Code display (code-block)
- Artifacts and canvas elements
- Buttons, cards, and badges in AI contexts

**Location:** `@/components/ai-elements/`

These components are specifically designed for AI chat interfaces and provide consistent patterns for AI interactions.

### shadcn/ui (Installing new UI components)

**Installation:**

```bash
pnpm dlx shadcn@latest add [component-name]
```

### Radix UI (Do Not Use Directly)

**Do NOT import Radix components directly.** The library is not well maintained.

❌ **Wrong:**

```tsx
import { Switch } from '@radix-ui/react-switch'
```

✅ **Correct:**

```tsx
import { Switch } from '@/components/catalyst/switch'
```

## Component Selection Decision Tree

1. **Building AI chat UI?** → Use ai-elements
2. **Need layout or page-level component?** → Use Catalyst
3. **Radix?** → Never import directly; Use Catalyst or suggest installing a 3rd party library with shadcn.

## Styling

Components use:

- **Tailwind CSS** for styling
- **`cn()`** utility from `tailwind-merge` for conditional classes
- **`cva()`** from `class-variance-authority` for component variants
