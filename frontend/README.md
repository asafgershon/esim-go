# Client Monorepo with shadcn/ui and Tailwind CSS v4

This is a monorepo setup with shadcn/ui components and Tailwind CSS v4 shared across applications.

## Structure

```
client/
├── apps/
│   └── dashboard/          # Vite + React dashboard app
└── packages/
    └── ui/                 # Shared shadcn/ui components with Tailwind v4
```

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the dashboard development server:
   ```bash
   cd apps/dashboard
   bun run dev
   ```

The dashboard will be available at `http://localhost:5173`

## Tailwind CSS v4 Configuration

This setup uses **Tailwind CSS v4** with the following key features:

- **No config files needed** - Tailwind v4 works without `tailwind.config.js`
- **@source directive** - Automatically detects classes in your source files
- **Vite plugin** - Uses `@tailwindcss/vite` for seamless integration
- **CSS variables** - All design tokens are defined as CSS custom properties

### Source Detection

The CSS file uses `@source` directives to tell Tailwind where to look for classes:

```css
@import "tailwindcss";
@source "../components";
@source "../../../apps/dashboard/src";
```

## Adding shadcn/ui Components

To add new shadcn/ui components to the shared `@workspace/ui` package:

```bash
# From the client root directory
bun run ui:add button
bun run ui:add card
bun run ui:add input
# etc.
```

Or directly from the ui package:

```bash
cd packages/ui
bunx shadcn@canary add [component-name]
```

## Using Components

Import components from the shared ui package:

```tsx
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
```

## Key Dependencies

- **Tailwind CSS v4** (`@tailwindcss/vite`, `tailwindcss@4.0.0-alpha.30`)
- **shadcn/ui** components with Radix UI primitives
- **Vite** for fast development and building
- **TypeScript** with workspace path aliases

## Workspace Configuration

The monorepo uses Bun workspaces with:
- `@workspace/ui` - Shared component library
- Path aliases configured in TypeScript and Vite
- Shared CSS variables and design tokens
