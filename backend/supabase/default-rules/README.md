# Default Pricing Rules and Strategies

This directory contains the default pricing rules and strategies exported from the production eSIM Go database.

## Directory Structure

```
default-rules/
├── pricing-rules/       # Individual pricing rule SQL files
│   ├── 001-cost-base.sql
│   ├── 002-keep-profit-standard.sql
│   ├── 003-bundle-markup-matrix.sql
│   └── 004-processing-fee-matrix.sql
├── pricing-strategies/  # Pricing strategy SQL files
│   └── 001-default-pricing-strategy.sql
└── apply-all.sql       # Apply all rules and strategies
```

## Pricing Rules

### 1. Base Cost Pricing (`001-cost-base.sql`)
- **Type**: Initialization
- **Purpose**: Sets the initial price to the bundle cost
- **Event**: `set-base-price`

### 2. Standard Profit Protection (`002-keep-profit-standard.sql`)
- **Type**: Constraint
- **Purpose**: Ensures minimum $1.50 profit on all bundles
- **Event**: `apply-profit-constraint`

### 3. Bundle Markup Matrix (`003-bundle-markup-matrix.sql`)
- **Type**: Markup
- **Purpose**: Applies markup based on bundle group and duration
- **Event**: `apply-markup`
- **Configuration**: Contains specific markup values for different bundle types and durations

### 4. Processing Fee Matrix (`004-processing-fee-matrix.sql`)
- **Type**: Processing Fee
- **Purpose**: Unified processing fee matrix for all payment methods
- **Event**: `checkout`

## Pricing Strategy

### Default Pricing Strategy (`001-default-pricing-strategy.sql`)
- **Purpose**: Standard pricing with markup, psychological rounding, and profit protection
- **Is Default**: Yes
- **Version**: 1

## How to Apply

### Apply All Rules and Strategies

To apply all rules and strategies to a new environment:

```bash
# From the backend/supabase directory
psql $DATABASE_URL -f default-rules/apply-all.sql
```

### Apply Individual Rules

To apply a specific rule:

```bash
# Apply a single pricing rule
psql $DATABASE_URL -f default-rules/pricing-rules/001-cost-base.sql

# Apply the default strategy
psql $DATABASE_URL -f default-rules/pricing-strategies/001-default-pricing-strategy.sql
```

### Using Supabase CLI

If you're using Supabase CLI:

```bash
# Apply all rules
supabase db push --db-url $DATABASE_URL < default-rules/apply-all.sql

# Or apply individually
supabase db push --db-url $DATABASE_URL < default-rules/pricing-rules/001-cost-base.sql
```

## Important Notes

1. **Order Matters**: Rules should be applied in numerical order as they may depend on each other
2. **Idempotent**: All SQL files use `ON CONFLICT DO UPDATE` to ensure they can be run multiple times safely
3. **UUIDs**: The rules use specific UUIDs to maintain consistency across environments
4. **Timestamps**: Original creation timestamps are preserved for audit purposes

## Customization

To customize these rules for a specific environment:

1. Copy the relevant SQL file
2. Modify the parameters in the `event_params` JSONB field
3. Update the description to reflect your changes
4. Consider changing the `code` field to indicate it's a custom variant

## Dependencies

These rules require the following tables to exist:
- `pricing_rules`
- `pricing_strategies`
- `catalog_bundles` (referenced by the rules)

Make sure your database schema is up to date before applying these rules.