# Pricing Blocks Code-to-Database Mapping Guide

## Overview
This document explains how pricing rules from the `rules-engine-2` codebase map to the `pricing_blocks` database table and how they connect to the drag-and-drop UI.

## Database Schema Mapping

The existing `pricing_blocks` table columns map to json-rules-engine as follows:

| Database Column | Maps To | Description |
|----------------|---------|-------------|
| `conditions` | Rule conditions | json-rules-engine condition format with facts, operators, and values |
| `action` | Rule event | Contains both event type and params |
| `priority` | Rule priority | Execution order (higher = earlier) |
| `category` | Block type | Maps to UI block types |

## Code-to-Database Transformation Pattern

### From Code (json-rules-engine):
```typescript
new Rule({
  name: "Rule Name",
  priority: 100,
  conditions: {
    all: [{ fact: "someFact", operator: "equal", value: "someValue" }]
  },
  event: {
    type: "event-type",
    params: { /* parameters */ }
  }
})
```

### To Database:
```json
{
  "name": "Rule Name",
  "priority": 100,
  "conditions": {
    "all": [{ "fact": "someFact", "operator": "equal", "value": "someValue" }]
  },
  "action": {
    "type": "event-type",
    "params": { /* parameters */ }
  }
}
```

## UI Block Type Mapping

| UI Block | Category | Event Type | Icon | Color |
|----------|----------|------------|------|-------|
| Discount | discount | apply-discount | Percent | green |
| Markup | markup | apply-markup | TrendingUp | blue |
| Fixed Price | fixed-price | apply-fixed-price | DollarSign | purple |
| Processing Fee | processing-fee | apply-processing-fee | CreditCard | orange |
| Keep Profit | keep-profit | apply-profit-constraint | Target | red |
| Psychological Rounding | psychological-rounding | apply-psychological-rounding | Calculator | indigo |
| Region Rounding | region-rounding | apply-region-rounding | Globe | teal |

## Facts Used in Conditions

| Fact | Type | Description | Example |
|------|------|-------------|---------|
| `request` | Object | Request parameters | `path: "$.dataType"` |
| `country` | Object | Country information | `path: "$.country"` |
| `selectedBundle` | Object | Currently selected bundle | `path: "$.is_unlimited"` |
| `previousBundle` | Object | Previously selected bundle | `path: "$.price"` |
| `paymentMethod` | Enum | Payment method type | `value: "ISRAELI_CARD"` |
| `isExactMatch` | Boolean | Whether duration exactly matches | `value: false` |
| `unusedDays` | Number | Number of unused days | `operator: "greaterThan"` |

## Configurable Parameters by Block Type

### Discount Block
```json
{
  "discount_type": "APPLY_DISCOUNT_PERCENTAGE", // or "APPLY_FIXED_DISCOUNT"
  "value": 10, // percentage or fixed amount
  "condition": "always", // or "min-days", "dataType"
  "minDays": 7 // if condition is "min-days"
}
```

### Markup Block
```json
{
  "type": "ADD_MARKUP",
  "value": 20, // for simple markup
  "markupMatrix": { // for complex bundle-specific markup
    "Bundle Name": {
      "1": 3,  // days: markup amount
      "7": 12,
      "30": 20
    }
  }
}
```

### Processing Fee Block
```json
{
  "type": "SET_PROCESSING_RATE",
  "method": "ISRAELI_CARD", // payment method
  "value": 1.4, // percentage
  "fixedFee": 0.30 // optional fixed fee
}
```

### Fixed Price Block
```json
{
  "type": "set-fixed-price",
  "value": 88, // fixed price
  "currency": "USD"
}
```

### Keep Profit Block
```json
{
  "value": 1.5, // minimum profit
  "type": "fixed" // or "percentage"
}
```

### Psychological Rounding Block
```json
{
  "strategy": "nearest-whole", // or "charm", "prestige", "odd"
  "roundTo": 0.99 // rounding value
}
```

### Region Rounding Block
```json
{
  "region": "us", // or "eu", "uk", "asia"
  "roundingRule": "nearest-dollar", // or "nearest-five", "nearest-ten"
  "value": 0.99
}
```

## Implementation Notes for Engineers

### Backend Engineer Tasks:

1. **GraphQL Mutations**:
   - `createPricingBlock(input: PricingBlockInput!): PricingBlock`
   - `updatePricingBlock(id: ID!, input: PricingBlockInput!): PricingBlock`
   - `deletePricingBlock(id: ID!): Boolean`
   - `reorderPricingBlocks(strategyId: ID!, blockIds: [ID!]!): [PricingBlock]`

2. **Rules Engine Integration**:
   - Modify `rules-engine-2` to load rules from database
   - Cache rules in Redis for performance
   - Add validation layer for rule format
   - Implement hot-reload when rules change

3. **API Endpoints**:
   - GET `/api/pricing-blocks` - List all blocks
   - POST `/api/pricing-blocks/validate` - Validate rule configuration
   - POST `/api/pricing-blocks/test` - Test rule with sample data

### Frontend Architect Tasks:

1. **Connect UI to Backend**:
   - Replace hardcoded `availableBlocks` with GraphQL query
   - Implement save functionality for strategies
   - Add form validation for block configurations

2. **Configuration Modals**:
   - Dynamic forms based on block type
   - Validation for required fields
   - Preview of rule conditions

3. **Strategy Management**:
   - Save/Load strategies
   - Version control UI
   - A/B testing interface

4. **Testing Interface**:
   - Input sample data
   - Show rule execution flow
   - Display pricing calculation steps

## Migration Execution

1. **Run SQL Migration**:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres < pricing_blocks_migration.sql
   ```

2. **Verify Data**:
   ```sql
   SELECT name, category, priority FROM pricing_blocks ORDER BY priority DESC;
   ```

3. **Test Rules Engine**:
   - Load rules from database
   - Compare results with hardcoded rules
   - Ensure backward compatibility

## Security Considerations

- Validate all rule configurations before saving
- Implement role-based access for rule editing
- Audit trail for all rule changes
- Sandbox rule execution for testing

## Performance Optimizations

- Cache compiled rules in memory
- Use database triggers for cache invalidation
- Batch rule updates in transactions
- Index on `is_active` and `priority` columns