# Strategies Repository

The `StrategiesRepository` provides comprehensive database operations for managing pricing strategies and their associated blocks in the eSIM Go platform.

## Overview

Pricing strategies are collections of pricing blocks (rules/conditions) that determine how bundles are priced. Each strategy can contain multiple blocks with specific priorities that control execution order.

## Key Features

- **Complete CRUD operations** for pricing strategies
- **Strategy-block relationship management** with proper priority ordering
- **Efficient database queries** with joins for loading strategies with all blocks
- **Archive/restore functionality** for soft deletes
- **Default strategy management**
- **Strategy cloning** with all associated blocks
- **Comprehensive error handling** and logging
- **TypeScript interfaces** for type safety

## Usage Examples

### Basic Operations

```typescript
import { StrategiesRepository } from '../repositories';

const strategiesRepo = new StrategiesRepository();

// Get all strategies
const strategies = await strategiesRepo.getAllStrategies();

// Get strategy with all blocks (respects priority order)
const strategyWithBlocks = await strategiesRepo.getStrategyWithBlocks(strategyId);

// Create new strategy
const newStrategy = await strategiesRepo.createStrategy({
  code: "HIGH_DEMAND_PRICING",
  name: "High Demand Countries Pricing",
  description: "Special pricing for high-demand destinations",
  createdBy: userId
});
```

### Working with Strategy Blocks

```typescript
// Add a block to strategy
const strategyBlock = await strategiesRepo.addBlockToStrategy({
  strategyId: strategy.id,
  blockId: pricingBlock.id,
  priority: 1000, // Higher priority = executed first
  isEnabled: true,
  configOverrides: { customParam: 'value' }
});

// Update block configuration
await strategiesRepo.updateStrategyBlock(strategyBlock.id, {
  priority: 900,
  configOverrides: { updatedParam: 'newValue' }
});

// Remove block from strategy
await strategiesRepo.removeBlockFromStrategy(strategyBlock.id);
```

### Advanced Operations

```typescript
// Clone existing strategy with all blocks
const clonedStrategy = await strategiesRepo.cloneStrategy(
  originalStrategyId,
  "CLONED_STRATEGY",
  "Cloned High Demand Pricing",
  userId
);

// Set as default strategy
await strategiesRepo.setDefaultStrategy(strategy.id, userId);

// Archive strategy (soft delete)
await strategiesRepo.archiveStrategy(strategy.id, userId);

// Restore archived strategy
await strategiesRepo.restoreStrategy(strategy.id, userId);
```

### Filtering and Search

```typescript
// Get strategies with filters
const filteredStrategies = await strategiesRepo.getAllStrategies({
  isDefault: false,
  isArchived: false,
  createdBy: userId,
  searchTerm: "demand"
});

// Get only the default strategy
const defaultStrategy = await strategiesRepo.getDefaultStrategy();
```

## Database Schema

### Tables Used

- **`pricing_strategies`** - Main strategy records
- **`strategy_blocks`** - Junction table linking strategies to blocks with priority
- **`pricing_blocks`** - Individual pricing rule blocks

### Key Relationships

- Strategy → Strategy Blocks (1:many)
- Strategy Blocks → Pricing Blocks (many:1) 
- Strategies can have parent-child relationships

### Priority Ordering

**IMPORTANT**: The execution order is controlled by `strategy_blocks.priority` (NOT `pricing_blocks.priority`). Higher priority values are executed first (descending order).

## Type Safety

All operations use TypeScript interfaces:

- `PricingStrategy` - Complete strategy object
- `PricingStrategyWithBlocks` - Strategy with loaded blocks
- `StrategyBlock` - Basic block association
- `StrategyBlockWithDetails` - Block with full pricing block details
- `CreateStrategyInput` - Strategy creation parameters
- `UpdateStrategyInput` - Strategy update parameters
- `StrategyFilter` - Query filtering options

## Error Handling

The repository extends `BaseSupabaseRepository` and includes:

- Comprehensive error logging with context
- GraphQL error formatting
- Proper null handling for not-found cases
- Transaction-safe operations

## Logging

All operations are logged with structured data including:
- Operation context (component, operation type)
- Input parameters
- Result metadata
- Error details with full context

## Performance Considerations

- Uses efficient JOIN queries to load strategies with blocks in single operations
- Implements proper indexing assumptions on priority and foreign key columns
- Supports filtering at database level to minimize data transfer
- Includes pagination-ready query patterns

## Integration

The repository is exported from the main repositories index and can be used in:
- GraphQL resolvers
- Service layer operations
- Background job processing
- Admin dashboard operations

Import via:
```typescript
import { StrategiesRepository } from '../repositories';
```