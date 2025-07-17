# Pricing Management Feature - Complete Summary

## Overview
The pricing management system allows marketing analysts to configure and manage eSIM bundle pricing with advanced controls for markup, discounts, and dynamic pricing rules. The system integrates with the eSIM Go API to fetch bundle data and provides real-time pricing calculations.

## Architecture

### Frontend Components
1. **PricingPage** (`/client/apps/dashboard/src/pages/pricing.tsx`)
   - Main pricing management interface
   - Country-based grouping with lazy loading
   - Handles expand/collapse of country groups
   - Manages pricing configuration drawer state

2. **CountryPricingTable** (`/client/apps/dashboard/src/components/country-pricing-table.tsx`)
   - Expandable table showing countries and their bundles
   - Displays: Country name, total bundles, avg price/day, discount status, last fetched
   - Lazy loads country-specific bundles on expansion
   - Click handlers for opening configuration drawer

3. **PricingConfigDrawer** (`/client/apps/dashboard/src/components/pricing-config-drawer.tsx`)
   - **3-section layout**:
     - **Configuration**: Markup, discount, processing rates, priority
     - **Preview**: Real-time pricing breakdown and profit analysis
     - **Simulator**: Dynamic pricing simulation for 1-30 days
   - Advanced pricing calculations with unused days discount
   - Price boundary analysis (break-even, current, max recommended)
   - Bundle mapping logic for non-standard durations

### Backend Services
1. **CatalogSyncService** (`/server/server/src/services/catalog-sync.service.ts`)
   - **Background sync**: Fetches complete catalog every 2 hours
   - **Country-specific caching**: Individual country bundle caches
   - **Multi-page fetching**: Handles eSIM Go API pagination
   - **Performance optimization**: Reduces API calls from 50+ to cached responses

2. **PricingService** (`/server/server/src/services/pricing.service.ts`)
   - **Pricing calculations**: Cost, markup, discounts, processing fees
   - **Bundle mapping**: Smart selection for non-standard durations
   - **Unused days discount**: Automatic discount for oversized bundles
   - **Formula-based calculations**: Consistent pricing logic

3. **CatalogueDataSource** (`/server/server/src/datasources/esim-go/catalogue-datasource.ts`)
   - **Multi-page API fetching**: Discovers bundles across multiple pages
   - **Intelligent caching**: Full catalog + country-specific caches
   - **Performance optimization**: Background sync + lazy loading

## Data Flow

### 1. Initial Page Load
```
User → PricingPage → GET_DATA_PLANS (cached) → Country groups display
```

### 2. Country Expansion
```
User clicks country → handleExpandCountry → GET_DATA_PLANS (country filter) → Bundle list
```

### 3. Bundle Configuration
```
User clicks bundle → PricingConfigDrawer → Real-time calculations → Save configuration
```

### 4. Background Sync
```
Server startup → CatalogSyncService → Multi-page fetch → Cache full catalog
```

## Business Logic

### Pricing Formula
```typescript
// Base pricing
cost = esimGoPrice * costSplitPercent
costPlus = esimGoPrice * (1 - costSplitPercent)
totalCost = cost + costPlus

// Unused days discount (for non-standard durations)
unusedDays = selectedBundle.duration - requestedDays
unusedDaysDiscount = unusedDays > 0 ? (unusedDays / selectedBundle.duration) * 0.1 : 0
adjustedCost = totalCost * (1 - unusedDaysDiscount)

// Customer discount
discountValue = adjustedCost * discountRate
priceAfterDiscount = adjustedCost - discountValue

// Processing fees
processingCost = priceAfterDiscount * processingRate
revenueAfterProcessing = priceAfterDiscount - processingCost

// Final profit
finalRevenue = revenueAfterProcessing - cost - costPlus
```

### Bundle Selection Logic
```typescript
// Smart bundle mapping for non-standard durations
availableBundles = [3, 5, 7, 10, 14, 21, 30] // Common eSIM Go durations

function getBestBundle(requestedDays: number) {
  // 1. Try exact match
  if (availableBundles.includes(requestedDays)) return requestedDays;
  
  // 2. Find smallest bundle that covers requested days
  const suitable = availableBundles.filter(b => b >= requestedDays);
  if (suitable.length > 0) return Math.min(...suitable);
  
  // 3. Use largest available bundle
  return Math.max(...availableBundles);
}
```

## Performance Optimizations

### Problem Solved
- **Issue**: eSIM Go API pagination requires multiple sequential calls
- **Impact**: 7+ second response times, poor user experience
- **Root Cause**: Different bundle durations distributed across API pages

### Solution Implemented
1. **Background Sync**: Fetches complete catalog every 2 hours
2. **Country-based Caching**: Individual country bundle caches
3. **Lazy Loading**: Load country data on-demand
4. **Multi-page Fetching**: Discover all bundle durations

### Results
- **Response Time**: 7+ seconds → <1 second
- **Bundle Diversity**: Only 7-day → Multiple durations (1-day, 7-day, etc.)
- **User Experience**: Loading delays → Instant cached responses
- **API Efficiency**: 50+ queries → Efficient cached responses

## Database Schema

### Pricing Configurations Table
```sql
CREATE TABLE pricing_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  country_id VARCHAR(2), -- ISO country code
  region_id VARCHAR(50),
  duration INTEGER,
  bundle_group VARCHAR(100),
  cost_split_percent DECIMAL(5,4), -- 0.0000 to 1.0000
  discount_rate DECIMAL(5,4),
  processing_rate DECIMAL(5,4),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)
```sql
-- Only authenticated users can view configurations
CREATE POLICY "Users can view pricing configurations" ON pricing_configurations
FOR SELECT TO authenticated USING (true);

-- Only admins can modify configurations
CREATE POLICY "Admins can modify pricing configurations" ON pricing_configurations
FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'ADMIN');
```

## GraphQL Schema

### Types
```graphql
type PricingBreakdown {
  bundleName: String!
  countryName: String!
  duration: Int!
  cost: Float!
  costPlus: Float!
  totalCost: Float!
  discountRate: Float!
  discountValue: Float!
  priceAfterDiscount: Float!
  processingRate: Float!
  processingCost: Float!
  revenueAfterProcessing: Float!
  finalRevenue: Float!
  currency: String!
}

type PricingConfiguration {
  id: ID!
  name: String!
  description: String
  countryId: String
  regionId: String
  duration: Int
  bundleGroup: String
  costSplitPercent: Float!
  discountRate: Float!
  processingRate: Float!
  isActive: Boolean!
  priority: Int!
  createdBy: String
  createdAt: String!
  updatedAt: String!
}

type DataPlanConnection {
  items: [DataPlan!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  pageInfo: PageInfo!
  lastFetched: String # Cache timestamp
}
```

### Queries
```graphql
# Batch pricing calculation
query CalculateBatchPricing($inputs: [CalculatePriceInput!]!) {
  calculatePrices(inputs: $inputs) {
    # ... PricingBreakdown fields
  }
}

# Get pricing configurations
query GetPricingConfigurations {
  pricingConfigurations {
    # ... PricingConfiguration fields
  }
}

# Get data plans with caching
query GetDataPlans($filter: DataPlanFilter) {
  dataPlans(filter: $filter) {
    items { # ... DataPlan fields }
    lastFetched # Cache timestamp
  }
}
```

### Mutations
```graphql
# Update pricing configuration
mutation UpdatePricingConfiguration($input: UpdatePricingConfigurationInput!) {
  updatePricingConfiguration(input: $input) {
    success
    error
    configuration { # ... PricingConfiguration fields }
  }
}
```

## Key Features

### 1. Country-Based Management
- **Expandable country groups** with bundle counts and average pricing
- **Lazy loading** of country-specific bundles
- **Custom discount indicators** for countries with special pricing

### 2. Advanced Pricing Configuration
- **3-section drawer interface**:
  - Configuration: Markup, discount, processing rates
  - Preview: Real-time pricing breakdown
  - Simulator: Dynamic pricing for 1-30 days
- **Smart bundle mapping** for non-standard durations
- **Unused days discount** for oversized bundles
- **Profit boundary analysis** (break-even, current, max recommended)

### 3. Performance & Caching
- **Background sync service** for complete catalog caching
- **Country-specific caching** with individual timestamps
- **Multi-page API fetching** to discover all bundle durations
- **Last fetched indicators** for data freshness transparency

### 4. Business Intelligence
- **Profit margin calculations** with break-even analysis
- **Price per day comparisons** across different durations
- **Revenue optimization** with dynamic pricing simulation
- **Configuration priority system** for rule precedence

## Current Status & Next Steps

### ✅ Completed
- Performance optimization (7+ sec → <1 sec)
- Country-based caching and lazy loading
- Multi-page API fetching for bundle diversity
- Advanced pricing configuration drawer
- Background sync service implementation
- LastFetched timestamps for data freshness

### 🔄 In Progress
- Email sent to eSIM Go (Jason) for API improvements
- Monitoring background sync performance
- Testing bundle diversity across different countries

### 📋 Pending
1. **Short-term** (1-2 weeks):
   - Add cache management admin interface
   - Enhance sync service error handling
   - Performance monitoring and metrics

2. **Medium-term** (1-2 months):
   - Webhook integration for catalog changes
   - Intelligent prefetching based on usage
   - Enhanced bundle availability tracking

3. **Long-term** (3+ months):
   - Alternative API provider evaluation
   - Predictive pricing based on market data
   - Advanced analytics and reporting

## Technical Dependencies

### Frontend
- React 18 with TypeScript
- Apollo Client for GraphQL
- @tanstack/react-table for data display
- shadcn/ui components (Drawer, Slider, Badge, etc.)
- Sonner for toast notifications

### Backend
- Node.js with Apollo Server
- GraphQL with TypeScript
- Redis for caching
- Supabase (PostgreSQL) for configuration storage
- eSIM Go API integration

### External APIs
- **eSIM Go API v2.5**: Bundle catalog and pricing data
- **Supabase**: Authentication and database
- **Redis**: Caching and session management

## Security Considerations

- **Row Level Security**: Database-level access control
- **Role-based permissions**: Admin-only configuration access
- **Input validation**: All pricing parameters validated
- **Cache security**: Sensitive data not cached in plain text
- **Audit logging**: All configuration changes tracked

## Monitoring & Observability

- **Background sync logs**: Success/failure rates and duration
- **API performance metrics**: Response times and error rates
- **Cache hit ratios**: Full catalog vs country-specific cache usage
- **User interaction tracking**: Most accessed countries and bundles
- **Pricing configuration analytics**: Popular configurations and success rates

---

*This feature represents a comprehensive pricing management system with advanced performance optimizations, intelligent caching, and sophisticated business logic for eSIM bundle pricing.*