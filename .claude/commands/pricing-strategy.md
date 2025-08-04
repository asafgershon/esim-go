# Pricing Strategy Development

Use this command to implement sophisticated pricing strategies for eSIM Go's advanced pricing engine. The expanded team will build a comprehensive pricing system with json-rules-engine, business intelligence, psychological pricing, and payment optimization.

## Usage

```
/pricing-strategy "description of the pricing feature or strategy you want to build"
```

## Examples

```
/pricing-strategy "Implement fixed pricing rules for enterprise customers with priority override"
/pricing-strategy "Create intelligent charm pricing with differentiation preservation"
/pricing-strategy "Build regional optimization insights with cross-market analysis"
/pricing-strategy "Add payment method optimization to maximize net revenue"
/pricing-strategy "Implement strategic discounts that can override profit constraints"
/pricing-strategy "Create A/B testing framework for psychological pricing strategies"
```

## The Enhanced Pricing Engine Team

### Core Implementation Team
- **pricing-engine-implementation-specialist**: Master implementer coordinating the entire pricing engine
- **pricing-rules-engineer**: JSON rules engine expert for business logic
- **pricing-data-engineer**: Supabase optimization and data loading specialist
- **pricing-intelligence-analyst**: Business insights and regional optimization
- **pricing-optimization-specialist**: Psychological pricing and conversion optimization
- **pricing-payment-specialist**: Payment processing and fee optimization
- **pricing-integration-specialist**: Maintains compatibility with existing pricing interfaces

### Supporting Team
- **pricing-engine-pm**: Drives roadmap and ensures incremental delivery
- **pricing-ux-designer**: Designs visual pricing blocks and rule builder UI
- **architect**: Ensures overall system architecture remains simple and scalable
- **graphql-backend-developer**: Implements GraphQL APIs for pricing services
- **react-frontend-developer**: Builds admin interfaces and dashboards
- **supabase-agent**: Database schema design, migrations, and type generation
- **esim-integration-specialist**: Ensures pricing integrates with provisioning
- **esim-tester**: Comprehensive testing of all pricing scenarios

## Workflow

### Phase 1: Architecture & Planning (Days 1-2)
1. **Supabase Agent** pulls existing `pricing_rules` table schema with conditions/actions structure
2. **Pricing Integration Specialist** documents current pricing interfaces and API contracts
3. **Pricing UX Designer** designs visual pricing rule builder with drag-drop blocks:
   - Condition blocks (IF bundle matches, IF customer segment, IF date range)
   - Action blocks (SET fixed price, APPLY discount, ADD markup)
   - Logic blocks (AND, OR, NOT operators)
   - Preview and testing interface
4. **Pricing Engine Implementation Specialist** analyzes requirements and designs overall architecture
5. **Pricing Rules Engineer** defines enhanced rule structures and custom facts needed
6. **Supabase Agent** designs schema migrations to extend pricing_rules for new capabilities:
   - Enhanced conditions for fixed pricing, strategic discounts
   - New action types for psychological pricing, payment optimization
   - Additional metadata fields for business intelligence
7. **Pricing UX Designer** creates UI mockups for:
   - Admin dashboard with pricing insights
   - Rule management interface
   - A/B testing configuration
   - Real-time pricing preview
8. **Pricing Integration Specialist** creates compatibility layer design for existing interfaces
9. **Pricing Data Engineer** reviews schema design and plans data loading strategy
10. **Pricing Intelligence Analyst** identifies key metrics and insights to generate

### Phase 2: Schema Migration & Core Implementation (Days 3-5)
9. **Supabase Agent** runs migrations to enhance pricing_rules table:
   - Adds new condition types: `FIXED_PRICING`, `STRATEGIC_DISCOUNT`, `PROMOTION`
   - Extends actions with: `SET_FIXED_PRICE`, `OVERRIDE_PROFIT_CONSTRAINTS`, `APPLY_PSYCHOLOGICAL_PRICING`
   - Creates supporting tables: `payment_methods`, `bundle_costs`, `pricing_audit_log`
10. **Supabase Agent** generates updated TypeScript types from new schema
11. **Pricing Integration Specialist** coordinates backend/frontend alignment:
   - Updates GraphQL resolvers to use json-rules-engine operators
   - Ensures React components use same operator enums
   - Creates shared constants file for operator mappings
12. **Pricing Integration Specialist** implements adapter pattern to maintain existing API compatibility
13. **Pricing Engine Implementation Specialist** builds ProductionESIMPricingEngine using catalog_bundles data
14. **Pricing Rules Engineer** implements json-rules-engine integration with pricing_rules table
15. **Pricing Data Engineer** creates efficient data loading from catalog_bundles and enhanced schema
16. **GraphQL Backend Developer** integrates pricing engine with GraphQL APIs while maintaining existing endpoints

### Phase 3: Advanced Features (Days 6-8)
16. **Pricing Optimization Specialist** implements psychological pricing algorithms
17. **Pricing Payment Specialist** adds payment processing calculations
18. **Supabase Agent** creates real-time subscriptions for pricing rule changes
19. **Pricing Intelligence Analyst** builds business intelligence features
20. **Pricing Integration Specialist** ensures all new features work through existing interfaces
21. **React Frontend Developer** creates admin dashboards and insights UI

### Phase 4: Testing & Optimization (Days 9-10)
22. **eSIM Tester** runs comprehensive test scenarios including edge cases
23. **Pricing Integration Specialist** tests backward compatibility with existing systems
24. **Pricing Engine Implementation Specialist** optimizes performance
25. **Pricing Intelligence Analyst** validates insights accuracy
26. **Supabase Agent** verifies all database operations and indexes for performance

### Phase 5: Deployment & Monitoring (Days 11-12)
27. **Team** deploys to staging with production data copy
28. **Pricing Engine PM** coordinates production rollout
29. **Pricing Integration Specialist** monitors existing systems for any compatibility issues
30. **Pricing Intelligence Analyst** monitors real-time metrics and generates first insights
31. **Supabase Agent** monitors database performance and real-time sync health

## Pricing-Specific Considerations

### Advanced Strategy Types:
- **Fixed Pricing Rules**: Highest priority overrides for enterprise/special cases
- **Strategic Discounts**: Coupon codes and partnerships with profit override capability
- **Intelligent Psychological**: Charm pricing with differentiation preservation
- **Regional Optimization**: Cross-market analysis and recommendations
- **Payment-Optimized**: Net revenue maximization through payment routing
- **A/B Testing**: Data-driven pricing experiments
- **Business Intelligence**: Real-time insights and predictive analytics

### Technical Architecture:
- **JSON Rules Engine**: Complex business logic as maintainable rules
- **Real-time Data Sync**: Supabase subscriptions for instant updates
- **Multi-layer Caching**: Sub-50ms response times
- **Comprehensive Audit**: Every calculation step logged
- **Fallback Protection**: Always returns valid prices

### Key Capabilities:
- **Priority Hierarchy**: Fixed > Strategic > Promotional > Base pricing
- **Profit Constraints**: Automatic enforcement with override capability
- **Price Differentiation**: Maintains minimum gaps between similar prices
- **Payment Intelligence**: Calculates true net revenue after fees
- **Regional Insights**: Identifies optimization opportunities across markets

### Success Metrics:
- Price calculation response < 50ms
- 100% pricing accuracy with full audit trail
- Support for 20+ pricing strategies
- 95% actionable insight generation
- 99.99% uptime with automatic fallbacks

## Example Flow

```
/pricing-strategy "Implement intelligent psychological pricing with regional optimization"

Days 1-2 (Architecture & Planning):
- Implementation Specialist: "Design system supporting psychological pricing with differentiation"
- Rules Engineer: "Create custom facts for price differentiation and regional analysis"
- Data Engineer: "Schema for contextual pricing data and efficient lookups"
- Intelligence Analyst: "Define regional optimization metrics and insights structure"

Days 3-5 (Core Implementation):
- Implementation Specialist: Builds ProductionESIMPricingEngine with all core features
- Rules Engineer: Implements pricing hierarchy (Fixed > Strategic > Promotional > Base)
- Data Engineer: Creates parallel data loading with transformation pipelines
- Backend Developer: Integrates calculatePriceWithInsights into GraphQL resolvers

Days 6-8 (Advanced Features):
- Optimization Specialist: Implements intelligentCharmPricing with $0.10 minimum gaps
- Payment Specialist: Adds payment method fee calculations for net revenue
- Intelligence Analyst: Builds generateRegionalOptimizationInsights
- Frontend Developer: Creates insights dashboard showing margin heatmaps

Days 9-10 (Testing & Optimization):
- Tester: Validates differentiation preservation across 100+ scenarios
- Implementation Specialist: Optimizes to achieve <50ms response times
- Intelligence Analyst: Confirms 95% of insights are actionable

Days 11-12 (Deployment):
- Deploy with feature flag to 10% of traffic
- Monitor: Price calculations averaging 35ms
- Results: 12% conversion improvement while maintaining differentiation
- Insights: Identified $50K/month optimization opportunity in EU markets
```

## Database Schema Evolution

### Existing pricing_rules Table Structure:
```sql
-- Current structure we'll enhance
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY,
  type TEXT, -- Will add: FIXED_PRICING, STRATEGIC_DISCOUNT
  name VARCHAR(255),
  description TEXT,
  conditions JSONB, -- Enhanced condition types
  actions JSONB, -- New action types
  priority INTEGER, -- 0-1000, higher = evaluated first
  is_active BOOLEAN,
  is_editable BOOLEAN,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Supabase Agent Migration Strategy:
1. **Align with json-rules-engine operators** in conditions:
   ```javascript
   // Standard operators to use in pricing_rules.conditions
   const OPERATORS = {
     'equal': '=',
     'notEqual': '!=',
     'in': 'IN',
     'notIn': 'NOT IN',
     'greaterThan': '>',
     'greaterThanInclusive': '>=',
     'lessThan': '<',
     'lessThanInclusive': '<=',
     'contains': 'CONTAINS',
     'doesNotContain': 'NOT CONTAINS'
   };
   ```

2. **Extend condition types** in JSONB to support catalog_bundles fields:
   - Bundle conditions: `groups`, `countries`, `duration`, `is_unlimited`
   - Price conditions: `price`, `currency`
   - Regional conditions: `region`, `regions`
   - Custom conditions: coupon codes, customer segments

3. **Extend action types** in JSONB to support:
   - `SET_FIXED_PRICE`: Override all calculations
   - `OVERRIDE_PROFIT_CONSTRAINTS`: Allow strategic losses
   - `APPLY_PSYCHOLOGICAL_PRICING`: With strategy selection
   - `OPTIMIZE_PAYMENT_METHOD`: Route to best processor
   - `ADD_MARKUP`: Add fixed amount
   - `APPLY_PERCENTAGE`: Apply percentage adjustment

4. **Create supporting tables**:
   - `payment_methods`: Fee structures and routing rules
   - `bundle_costs`: Cost data linked to catalog_bundles
   - `pricing_audit_log`: Complete calculation history
   - `pricing_insights`: Generated business intelligence

5. **Update frontend/backend to use json-rules-engine format**:
   - GraphQL resolvers use engine operators
   - React components use same operator enums
   - Validation ensures compatibility

6. **Generate TypeScript types** automatically after migration

## Visual Pricing Builder Design

### Drag-and-Drop Pricing Blocks (UX Designer):
```typescript
// Visual block components for rule builder
interface PricingBlock {
  id: string;
  type: 'condition' | 'action' | 'logic';
  category: string;
  icon: string;
  label: string;
  description: string;
  configurable: BlockConfig[];
}

// Example condition blocks
const CONDITION_BLOCKS = [
  {
    type: 'condition',
    category: 'Bundle',
    icon: '📦',
    label: 'Bundle Group',
    description: 'Match specific bundle groups',
    configurable: [
      { field: 'groups', operator: 'in', value: [] }
    ]
  },
  {
    type: 'condition',
    category: 'Customer',
    icon: '👤',
    label: 'Customer Segment',
    description: 'Target specific customer types',
    configurable: [
      { field: 'customerType', operator: 'equal', value: '' }
    ]
  },
  {
    type: 'condition',
    category: 'Time',
    icon: '📅',
    label: 'Date Range',
    description: 'Active during specific periods',
    configurable: [
      { field: 'currentDate', operator: 'between', value: { start: '', end: '' } }
    ]
  }
];

// Example action blocks
const ACTION_BLOCKS = [
  {
    type: 'action',
    category: 'Pricing',
    icon: '💰',
    label: 'Set Fixed Price',
    description: 'Override with specific price',
    configurable: [
      { action: 'SET_FIXED_PRICE', value: 0, currency: 'USD' }
    ]
  },
  {
    type: 'action',
    category: 'Discount',
    icon: '🏷️',
    label: 'Apply Percentage',
    description: 'Percentage discount/markup',
    configurable: [
      { action: 'APPLY_PERCENTAGE', value: 0, direction: 'discount' }
    ]
  }
];
```

### Visual Rule Builder Interface:
```jsx
// React component structure
<PricingRuleBuilder>
  <BlockPalette>
    <BlockCategory title="Conditions">
      {CONDITION_BLOCKS.map(block => <DraggableBlock {...block} />)}
    </BlockCategory>
    <BlockCategory title="Actions">
      {ACTION_BLOCKS.map(block => <DraggableBlock {...block} />)}
    </BlockCategory>
  </BlockPalette>
  
  <RuleCanvas>
    <DropZone type="conditions">
      {/* Dropped condition blocks with AND/OR logic */}
    </DropZone>
    <DropZone type="actions">
      {/* Dropped action blocks executed in order */}
    </DropZone>
  </RuleCanvas>
  
  <RulePreview>
    <PriceSimulator />
    <AffectedBundlesCount />
    <EstimatedImpact />
  </RulePreview>
</PricingRuleBuilder>
```

## Catalog Bundles Integration

### Working with catalog_bundles Table:
```typescript
// The pricing engine uses catalog_bundles as the source of truth
interface CatalogBundle {
  id: string;
  esim_go_name: string;
  groups: string[];        // Used for bundle group matching
  countries: string[];     // Regional pricing conditions
  duration: number;        // Validity days for rules
  is_unlimited: boolean;   // Special pricing for unlimited
  price: number;          // Base price from provider
  currency: string;       // Multi-currency support
  region: string;         // Regional categorization
  // ... other fields
}

// Pricing engine loads bundles for rule evaluation
class BundleDataLoader {
  async loadBundlesForPricing() {
    const { data: bundles } = await supabase
      .from('catalog_bundles')
      .select('*')
      .eq('is_active', true);
      
    // Transform for efficient lookups
    return this.indexBundlesByGroup(bundles);
  }
}
```

### JSON Rules Engine Integration:
```javascript
// Frontend components use same operators as backend
export const RULE_OPERATORS = {
  // Aligned with json-rules-engine
  equal: { label: 'equals', symbol: '=' },
  notEqual: { label: 'does not equal', symbol: '≠' },
  in: { label: 'is one of', symbol: '∈' },
  notIn: { label: 'is not one of', symbol: '∉' },
  greaterThan: { label: 'greater than', symbol: '>' },
  lessThan: { label: 'less than', symbol: '<' },
  contains: { label: 'contains', symbol: '⊃' }
};

// Backend resolver uses same format
const createPricingRule = async (_, { input }) => {
  const rule = {
    type: input.type,
    conditions: input.conditions.map(c => ({
      fact: c.field,          // Maps to catalog_bundles field
      operator: c.operator,   // Uses json-rules-engine operator
      value: c.value
    })),
    actions: input.actions,
    priority: input.priority
  };
  
  // Validate against json-rules-engine
  const engine = new Engine();
  engine.addRule(rule); // Validates format
  
  // Save to pricing_rules table
  return await supabase.from('pricing_rules').insert(rule);
};
```

## Common Patterns

### Implementing Fixed Pricing Rules:
```javascript
// Highest priority - overrides all calculations
{
  rule_type: 'fixed_pricing',
  priority: 1000,
  conditions: {
    bundle_group: 'ENTERPRISE_GLOBAL',
    coupon_code: 'ACME2024'
  },
  fixed_price: 99.00,
  override_reason: 'Enterprise contract pricing'
}
```

### Adding Strategic Discounts:
```javascript
// Can override profit constraints
{
  rule_type: 'strategic_discount', 
  priority: 500,
  discount_percent: 50,
  override_profit_constraints: true,
  minimum_allowed_profit: -5.00, // Can operate at loss
  conditions: {
    email_domain: '@partner.com',
    bundle_groups: ['US_LOCAL', 'EU_REGIONAL']
  }
}
```

### Psychological Pricing Configuration:
```javascript
// Intelligent charm with differentiation
engine.setPsychologicalPricingStrategy('intelligentCharmPricing', {
  bundleGroup: 'US_LOCAL',
  minimumDifferentiation: 0.10,
  charmEndingPool: [99, 95, 89, 79, 49]
});
```

### Regional Optimization Analysis:
```javascript
// Generate cross-regional insights
const insights = await engine.generateRegionalOptimizationInsights(
  'EU_REGIONAL',
  30,
  ['DE', 'FR', 'UK', 'ES']
);
// Returns margin analysis, opportunities, and recommendations
```

### Payment Method Optimization:
```javascript
// Calculate true net revenue
const result = await engine.calculatePrice({
  bundleGroup: 'GLOBAL',
  validityDays: 30,
  paymentMethod: 'paypal',
  country: 'BR'
});
// Includes payment processing fees and net revenue
```

The architecture supports sophisticated pricing strategies while maintaining performance, reliability, and full auditability.