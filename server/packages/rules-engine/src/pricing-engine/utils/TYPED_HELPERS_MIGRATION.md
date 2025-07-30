# Typed Helpers Migration Guide

## Overview
To prevent runtime errors from accessing non-existent properties (like `request.dataType` which doesn't exist in `CalculatePriceInput`), we've created strongly-typed wrappers for `dot.pick` and `dot.set`.

## Benefits
- **Compile-time safety**: TypeScript will catch typos and invalid paths at compile time
- **IntelliSense support**: Your IDE will auto-complete valid paths
- **Prevents runtime errors**: No more accessing properties that don't exist

## Migration Examples

### Before (Error-prone)
```typescript
// This compiles but fails at runtime if dataType doesn't exist
const dataType = dot.pick("request.dataType", state);

// Typo in property name - compiles but returns undefined
const customerId = dot.pick("context.costumer.id", state);
```

### After (Type-safe)
```typescript
import { typedPick, typedSet } from './utils/state-helpers';

// TypeScript error: Property 'dataType' does not exist on type 'Request'
const dataType = typedPick("request.dataType", state); // ❌ Compilation error

// TypeScript error: Property 'costumer' does not exist on type 'Context'
const customerId = typedPick("context.costumer.id", state); // ❌ Compilation error

// Correct usage - compiles and works
const countryISO = typedPick("request.countryISO", state); // ✅
const customerId = typedPick("context.customer.id", state); // ✅
```

## Valid Paths for PricingEngineState

Based on the current schema, these are the valid paths:

### Request paths:
- `request.duration`
- `request.countryISO`
- `request.paymentMethod`
- `request.promo`
- ❌ `request.dataType` (doesn't exist - use bundle.isUnlimited instead)

### Context paths:
- `context.customer.id`
- `context.customer.groups`
- `context.timestamp`

### Processing paths:
- `processing.steps`
- `processing.selectedBundle`
- `processing.previousBundle`
- `processing.region`
- `processing.group`

### Response paths:
- `response.unusedDays`
- `response.selectedBundle`
- `response.pricing`
- `response.appliedRules`

### Metadata paths:
- `metadata.correlationId`
- `metadata.timestamp`
- `metadata.version`

## Migration Steps

1. Import the typed helpers:
   ```typescript
   import { typedPick, typedSet } from './utils/state-helpers';
   ```

2. Replace `dot.pick` with `typedPick`:
   ```typescript
   // Before
   const value = dot.pick("some.path", state);
   
   // After
   const value = typedPick("some.path", state);
   ```

3. Replace `dot.set` with `typedSet`:
   ```typescript
   // Before
   dot.set("some.path", value, state);
   
   // After
   typedSet("some.path", value, state);
   ```

4. Fix any TypeScript compilation errors - these indicate actual bugs in your code!

## Common Errors Fixed

1. **Accessing non-existent dataType**:
   - Error: `typedPick("request.dataType", state)`
   - Fix: Use `bundle.isUnlimited` to determine if it's unlimited or fixed

2. **Typo in customer**:
   - Error: `typedPick("context.costumer.id", state)`
   - Fix: `typedPick("context.customer.id", state)`

3. **Wrong property types**:
   - Error: `typedSet("response.unusedDays", "5", state)` (string instead of number)
   - Fix: `typedSet("response.unusedDays", 5, state)`