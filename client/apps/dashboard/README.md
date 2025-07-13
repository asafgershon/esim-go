# eSIM Dashboard

Admin dashboard for managing the eSIM platform.

## Features

- 🔐 **Authentication**: Secure login with Supabase
- 📊 **Home Dashboard**: View recent users and daily bundle sales
- 👥 **User Management**: Browse and manage all platform users
- 🌍 **Trip Management**: Manage regional eSIM bundles and configurations

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Install dependencies:
```bash
bun install
```

4. Start the development server:
```bash
bun run dev
```

## Tech Stack

- **React** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Supabase** for authentication and database
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling
- **Tanstack Query** for data fetching
- **date-fns** for date formatting

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── layout/      # Layout components (sidebar, dashboard layout)
│   └── protected-route.tsx
├── contexts/        # React contexts
│   └── auth-context.tsx
├── lib/            # Utilities and configurations
│   └── supabase.ts
├── pages/          # Page components
│   ├── home.tsx
│   ├── login.tsx
│   ├── trips.tsx
│   └── users.tsx
└── App.tsx         # Main app component with routing
```

## Authentication

All routes except `/login` are protected and require authentication. The app uses Supabase Auth for user authentication.

## Development

The dashboard uses the shared UI components from the `@workspace/ui` package. To add new shadcn/ui components:

```bash
bunx shadcn@latest add [component-name]
```

Note: Make sure to add the component exports to `/workspace/client/packages/ui/src/index.ts`.
