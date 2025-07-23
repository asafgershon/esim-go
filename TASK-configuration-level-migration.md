# Task: Migrate Configuration Level to Rule-Based Engine

## Overview
The pricing system currently uses a `configurationLevel` field that needs to be migrated to use the rule-based pricing engine. This field is being hard-coded client-side and should be determined by the pricing rules system.

## Current State
- `configurationLevel` is hard-coded as 'GLOBAL' in client-side transformations
- The field is expected by `BundlesTable.tsx` component for display
- The field is not currently returned by the backend GraphQL queries

## Required Changes

### 1. Backend Changes
- Remove or deprecate the `configurationLevel` field from the CountryBundle type
- Replace with rule-based indicators that show:
  - Which rules were applied
  - Rule priority/hierarchy 
  - Rule source (system vs business rules)

### 2. Frontend Changes
- Update `ConfigurationLevelIndicator` component to work with rule-based data
- Modify `BundlesTable.tsx` to display rule information instead of configuration level
- Update any other components that reference `configurationLevel`

### 3. GraphQL Schema Updates
- Add fields for rule application data:
  ```graphql
  type CountryBundle {
    # ... existing fields
    appliedRules: [AppliedRule]
    ruleCount: Int
    ruleImpact: Float
    primaryRuleType: String
  }
  ```

## Migration Strategy
1. Add new rule-based fields alongside existing `configurationLevel`
2. Update frontend components to use new fields with fallback
3. Remove `configurationLevel` once all components are migrated

## Affected Files
- `/client/apps/dashboard/src/components/PricingSplitView/BundlesTable.tsx`
- `/client/apps/dashboard/src/components/configuration-level-indicator.tsx`
- `/client/apps/dashboard/src/hooks/usePricingData.ts`
- Backend GraphQL resolvers for CountryBundle type
- Backend pricing calculation services

## Benefits
- Removes hard-coded business logic from frontend
- Provides transparency on pricing rule application
- Enables more flexible pricing configurations
- Aligns with rule-based pricing architecture