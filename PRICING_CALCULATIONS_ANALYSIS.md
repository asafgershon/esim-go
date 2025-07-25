# Pricing Calculations Analysis - eSIM-Go Codebase

## Overview
This document provides a comprehensive analysis of all pricing calculation patterns found across the eSIM-Go codebase, including their locations, use cases, and implementation details.

## 1. Server-Side Core Pricing Engine

### Location: `server/server/src/services/pricing-engine.service.ts`
**Use Case**: Central pricing calculation engine that orchestrates all pricing logic

**Key Calculations**:
1. **Base Cost** → Starting price from eSIM Go API
2. **Markup** → Added to base cost to create subtotal
3. **Subtotal** → Base cost + markup
4. **Discounts** → Applied to subtotal (percentage or fixed amount)
5. **Processing Fee** → Calculated as percentage of price after discount
6. **Final Price** → What customer pays
7. **Profit** → Final revenue minus base cost

**Features**:
- Rule-based pricing with priority system
- Profit validation
- Minimum price enforcement
- Batch processing support

## 2. Rules Engine Actions

### Location: `server/server/src/rules-engine/actions/`

#### Discount Actions (`discount.ts`)
- `APPLY_DISCOUNT_PERCENTAGE`: Applies percentage discount to subtotal
- `APPLY_FIXED_DISCOUNT`: Applies fixed amount discount (capped at subtotal)
- `SET_DISCOUNT_PER_UNUSED_DAY`: Sets discount rate for unused days

#### Markup Actions (`markup.ts`)
- `ADD_MARKUP`: Adds fixed markup to base cost

#### Processing Actions (`processing.ts`)
- `SET_PROCESSING_RATE`: Sets payment processing fee rate

#### System Actions (`system.ts`)
- `SET_MINIMUM_PRICE`: Ensures minimum price floor
- `SET_MINIMUM_PROFIT`: Ensures minimum profit margin

## 3. GraphQL Resolvers

### Location: `server/server/src/resolvers/catalog-resolvers.ts`

#### `calculatePrice` Mutation
**Use Case**: Single price calculation for checkout
- Fetches bundles for country/region
- Uses PricingEngineService to calculate optimal price
- Selects best bundle based on duration
- Returns detailed pricing breakdown

#### `calculatePrices` Mutation
**Use Case**: Batch pricing for catalog display
- Processes multiple pricing requests in parallel
- Deduplicates results to avoid redundant calculations
- Used by dashboard for bulk pricing display

### Location: `server/server/src/resolvers/checkout-resolvers.ts`

#### `createCheckoutSession` Mutation
**Use Case**: Final price calculation at purchase time
- Validates bundle availability and pricing
- Selects optimal bundle for requested duration
- Calculates final price using pricing engine
- Creates checkout session with pricing snapshot

## 4. Default System Rules

### Location: `server/server/src/services/default-rules.service.ts`

**Default Processing Rates by Payment Method**:
- Israeli Card: 1.4%
- Foreign Card: 4.5%
- Bit: 1.4%
- Amex: 3.5%
- Diners: 3.5%

**Default Business Rules**:
- Minimum price floor: $0.01
- Minimum profit margin: $1.50
- Unused days discount rate: 10% per day

## 5. Dashboard Pricing Implementations

### Location: `client/apps/dashboard/src/utils/pricing-calculations.ts`
**Use Case**: Admin dashboard price display helpers
- `calculateAveragePricePerDay`: Simple division for display (price / duration)
- `buildBatchPricingInput`: Prepares batch pricing requests
- `extractDurationsFromPlans`: Extracts unique durations for pricing

### Location: `client/apps/dashboard/src/hooks/usePricingData.ts`
**Use Case**: Admin dashboard pricing data management
- Manages country-level pricing data
- Calculates average price per day
- Handles lazy loading of bundle prices
- Integrates with rule-based pricing engine

### Location: `client/apps/dashboard/src/hooks/usePricingWithRules.ts`
**Use Case**: Advanced pricing management with rules
- Enhanced pricing calculations with rule breakdown
- Generates pricing recommendations
- Simulates pricing rules before applying
- Calculates profit margins and validates minimum thresholds

## 6. Web App Pricing Implementations

### Location: `client/apps/web-app/src/hooks/usePricing.ts`
**Use Case**: Customer-facing real-time pricing
- Real-time price calculation with debouncing
- Transforms server response to user-friendly format:
  - `dailyPrice`: Total price / days
  - `totalPrice`: Final price after discount
  - `originalPrice`: Price before discount
  - `discountAmount`: Discount value
  - `hasDiscount`: Boolean flag

### Location: `client/apps/web-app/src/hooks/useBatchPricing.ts`
**Use Case**: Pre-calculated pricing for UI components
- Pre-calculates prices for 1-30 days
- Caches results for instant display
- Used for price sliders and comparisons

## 7. Pricing Calculation Flow

```
1. Bundle Selection
   ↓
2. Base Cost (from eSIM Go)
   ↓
3. Add Markup (system/business rules)
   ↓
4. Calculate Subtotal
   ↓
5. Apply Discounts (percentage/fixed)
   ↓
6. Calculate Price After Discount
   ↓
7. Calculate Processing Fee
   ↓
8. Final Price (customer pays)
   ↓
9. Calculate Profit & Validate
```

## 8. Key Pricing Formulas

### Core Calculations
- **Subtotal**: `baseCost + markup`
- **Total Discount**: Sum of all discount amounts
- **Price After Discount**: `subtotal - totalDiscount`
- **Processing Fee**: `priceAfterDiscount * processingRate`
- **Final Price**: `priceAfterDiscount + processingFee`
- **Revenue After Processing**: `priceAfterDiscount`
- **Profit**: `revenueAfterProcessing - baseCost`

### Display Calculations
- **Daily Price**: `totalPrice / numOfDays`
- **Average Price Per Day**: `price / duration`
- **Unused Days Discount**: `discountPerUnusedDay * unusedDays * markup`

## 9. Bundle Selection Logic

The pricing engine selects the optimal bundle based on:
1. **Exact match**: Prefers bundles with exact duration match
2. **Next available**: Selects next available duration ≥ requested
3. **Fallback**: Uses longest available duration if no suitable match

This ensures customers always get a bundle that meets their needs while maximizing value.

## 10. Architecture Insights

### Separation of Concerns
- **Server**: Core calculation logic, rule engine, data persistence
- **Dashboard**: Admin tools, simulation, rule management
- **Web App**: Customer-facing display, real-time calculations

### Data Flow
1. **eSIM Go API** → Bundle base costs
2. **Rules Engine** → Apply business logic
3. **GraphQL** → Expose calculations to clients
4. **React Hooks** → Manage UI state and caching
5. **Components** → Display formatted prices

### Caching Strategy
- **Server**: Redis cache for catalog data (30-day TTL)
- **Dashboard**: Apollo Client cache for pricing data
- **Web App**: Batch pre-calculation for common durations

## 11. Future Considerations

With the new `pricingBreakdown` field on the Bundle interface:
- Move calculation logic from mutations to field resolvers
- Enable lazy evaluation of pricing only when requested
- Reduce redundant calculations across different queries
- Maintain backward compatibility during transition

## 12. Summary

The pricing system is well-architected with:
- Clear separation between calculation and display logic
- Flexible rule-based pricing engine
- Multiple optimization strategies (caching, batching, lazy loading)
- Comprehensive error handling and validation
- Support for multiple payment methods and currencies

The modular design allows for easy extension and modification of pricing rules without affecting the core calculation engine.