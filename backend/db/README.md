# eSIM Go Database Schema Management

## Setup

1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Set up environment variables in `.env`
3. Pull latest schema: `supabase db pull`

## Making Schema Changes

1. Create a new migration: `supabase migration new "description_of_change"`
2. Edit the generated migration file in `server/db/migrations/`
3. Apply migration: `supabase db push`

## Best Practices

- Always pull latest schema before making changes
- Write descriptive migration names
- Test migrations in development before applying to production
- Keep sensitive connection details out of version control