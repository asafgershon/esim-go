# eSIM Go Database Schema Overview

## Schema Files Created

1. **schema_dump.sql** (2,345 lines) - Complete public schema including all tables, views, functions, and policies
2. **auth_schema.sql** (1,021 lines) - Supabase auth schema with user management
3. **storage_schema.sql** (519 lines) - Supabase storage schema for file handling

## Main Database Tables

### Core Business Tables
- **esim_bundles** - Available eSIM packages and bundles
- **esim_orders** - Customer orders for eSIMs
- **esims** - Individual eSIM instances with activation details
- **data_plans** - Data plan configurations
- **package_assignments** - Links orders to specific packages

### Pricing & Configuration
- **pricing_rules** - Dynamic pricing rules engine
- **pricing_blocks** - Pricing condition blocks
- **pricing_strategies** - Pricing strategy definitions
- **strategy_blocks** - Links strategies to blocks
- **high_demand_countries** - Countries with special pricing

### Catalog Management
- **catalog_bundles** - Synchronized bundle catalog
- **catalog_metadata** - Catalog sync metadata
- **catalog_sync_jobs** - Catalog synchronization history

### User & Session Management
- **profiles** - User profile extensions
- **checkout_sessions** - Active checkout sessions
- **trips** - Travel destinations/trips

## Custom Types
- **block_type** - Types of pricing blocks
- **event_type** - Types of system events

## Key Features
- Row Level Security (RLS) policies on all tables
- UUID primary keys for all entities
- Comprehensive audit fields (created_at, updated_at)
- Foreign key relationships maintaining referential integrity

## To Use This Schema Locally

1. Create a new Supabase project locally:
   ```bash
   supabase start
   ```

2. Apply the schema:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres < db/schema_dump.sql
   psql -h localhost -p 54322 -U postgres -d postgres < db/auth_schema.sql
   psql -h localhost -p 54322 -U postgres -d postgres < db/storage_schema.sql
   ```

3. The local database will now mirror the production schema structure.

## Migration Management

All migrations are stored in `/server/supabase/migrations/` and are applied in chronological order.