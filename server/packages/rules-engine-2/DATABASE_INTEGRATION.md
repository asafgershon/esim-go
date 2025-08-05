# Database Integration for Rules Engine V2

This document describes the database integration implemented for the eSIM Go pricing rules engine, specifically for coupon codes and corporate email domain discounts.

## Overview

The rules engine now integrates with the following database tables:
- `coupons` - Stores coupon codes with discount rules and usage limits
- `coupon_usage_logs` - Tracks coupon usage for analytics and limits
- `corporate_email_domains` - Defines corporate email domains eligible for discounts

## New Features

### 1. Database-Backed Coupon System

#### Features:
- **Dynamic coupon loading**: Coupons are loaded from the database in real-time
- **Usage tracking**: All coupon applications are logged with usage statistics
- **Validation rules**: Supports bundle restrictions, region restrictions, usage limits
- **Expiration handling**: Automatic validation of coupon validity periods
- **Caching**: Intelligent caching with TTL to optimize performance

#### Coupon Types Supported:
- **Percentage discounts**: E.g., 10% off
- **Fixed amount discounts**: E.g., $5 off
- **Bundle-specific**: Only apply to certain bundle types
- **Region-specific**: Only apply to specific countries/regions

#### Usage Limits:
- **Total usage limit**: Maximum number of times a coupon can be used globally
- **Per-user limit**: Maximum times a single user can use a coupon
- **Time-based**: Valid from/until date ranges

### 2. Corporate Email Domain Discounts

#### Features:
- **Automatic detection**: Detects corporate email domains and applies discounts
- **Configurable rates**: Each domain can have different discount percentages
- **Spending thresholds**: Minimum spend requirements and maximum discount caps
- **Priority handling**: Corporate discounts don't stack with coupon codes

#### Supported Configurations:
- **Discount percentage**: E.g., 15% off for company.com
- **Maximum discount**: Cap the total discount amount
- **Minimum spend**: Require minimum order value
- **Active/inactive status**: Enable/disable domains dynamically

## Technical Implementation

### Database Loaders

**Location**: `/src/loaders/coupon-loader.ts`

Key functions:
- `loadCouponByCode(code)` - Load and validate coupon from database
- `getCouponUsageCount(couponId, userId?)` - Get usage statistics
- `logCouponUsage(params)` - Record coupon usage
- `findCorporateEmailDomain(domain)` - Find corporate discount config
- `validateCouponApplicability(coupon, bundleId, region)` - Validate restrictions

### Updated Facts

**Location**: `/src/facts/discount-facts.ts`

Updated facts:
- `couponValidation` - Now loads from database with full validation
- `emailDomainDiscount` - Now queries corporate domains table

### Enhanced Processors

**Location**: `/src/processors/discount-processor.ts`

Enhancements:
- Automatic coupon usage logging when discounts are applied
- Support for both percentage and fixed_amount coupon types
- Error handling for database operations

### GraphQL Resolver Integration

**Location**: `/server/src/resolvers/pricing-resolvers.ts`

Updated resolvers:
- `calculatePrice` - Passes user context for corporate discounts
- `calculatePrice2` - Supports coupon codes via `promo` field
- `calculatePrices` - Batch processing with coupon support
- `calculatePrices2` - Enhanced batch processing

## Usage Examples

### Basic Coupon Usage

```typescript
import { calculatePricing } from '@hiilo/rules-engine-2';

// Apply coupon code
const result = await calculatePricing({
  days: 7,
  country: 'US',
  group: 'Standard Unlimited Essential',
  couponCode: 'WELCOME10',
  userId: 'user-123',
  userEmail: 'customer@example.com',
});

console.log('Final price:', result.pricing.finalPrice);
console.log('Discount applied:', result.pricing.discountValue);
```

### Corporate Email Discount

```typescript
// Corporate email automatically detected
const result = await calculatePricing({
  days: 14,
  country: 'DE',
  group: 'Standard Unlimited Plus',
  userId: 'employee-456',
  userEmail: 'employee@company.com', // Corporate domain
});
```

### GraphQL API Usage

```graphql
mutation CalculatePrice {
  calculatePrice2(input: {
    numOfDays: 7
    countryId: "US"
    groups: ["Standard Unlimited Essential"]
    promo: "WELCOME10"  # Coupon code
  }) {
    finalPrice
    discountValue
    discountRate
    bundle {
      name
      duration
    }
  }
}
```

## Database Schema

### Coupons Table

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  coupon_type coupon_type NOT NULL, -- 'percentage' | 'fixed_amount'
  value DECIMAL(10,2) NOT NULL,
  min_spend DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  max_total_usage INTEGER,
  max_per_user INTEGER,
  allowed_bundle_ids TEXT[],
  allowed_regions TEXT[],
  corporate_domain VARCHAR(255),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Corporate Email Domains Table

```sql
CREATE TABLE corporate_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_spend DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Coupon Usage Logs Table

```sql
CREATE TABLE coupon_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  discounted_amount DECIMAL(10,2) NOT NULL,
  order_id UUID,
  used_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

### Caching Strategy

1. **Coupon Cache**: 5-minute TTL with LRU eviction
2. **Corporate Domains Cache**: 5-minute TTL for all domains
3. **Usage Statistics**: Real-time (no caching for accuracy)

### Database Optimizations

1. **Indexes**:
   - `coupons.code` - Unique index for fast lookups
   - `corporate_email_domains.domain` - Unique index
   - `coupon_usage_logs.coupon_id` - For usage counting
   - `coupon_usage_logs.user_id` - For per-user limits

2. **Query Patterns**:
   - Single coupon lookups by code
   - Batch corporate domain loading
   - Efficient usage counting with aggregates

## Testing

### Test Suite

Run the comprehensive test suite:

```bash
# Compile TypeScript
npm run build

# Run database integration tests
node dist/test-database-integration.js
```

### Test Coverage

The test suite covers:
- ✅ Coupon loading and validation
- ✅ Corporate email domain detection
- ✅ Usage tracking and limits
- ✅ Cache performance
- ✅ Discount priority rules
- ✅ Error handling
- ✅ GraphQL resolver integration

### Example Test Data

```sql
-- Sample coupon
INSERT INTO coupons (code, coupon_type, value, description, max_total_usage) 
VALUES ('WELCOME10', 'percentage', 10.00, 'Welcome discount for new users', 1000);

-- Sample corporate domain
INSERT INTO corporate_email_domains (domain, discount_percentage, max_discount) 
VALUES ('company.com', 15.00, 100.00);
```

## Error Handling

The system gracefully handles:
- **Database connection failures**: Falls back to no discount
- **Invalid coupon codes**: Returns validation errors
- **Usage limit exceeded**: Prevents coupon application
- **Network timeouts**: Uses cached data when available
- **Malformed data**: Logs errors and continues processing

## Monitoring and Analytics

### Metrics Tracked

1. **Coupon Performance**:
   - Usage rates by coupon code
   - Conversion rates
   - Average discount amounts

2. **Corporate Discounts**:
   - Domain-wise usage statistics
   - Revenue impact analysis

3. **System Performance**:
   - Cache hit/miss rates
   - Database query performance
   - Error rates and types

### Logging

All operations are logged with appropriate levels:
- `INFO`: Successful operations and business events
- `WARN`: Recoverable errors and validation failures
- `ERROR`: System errors and database failures
- `DEBUG`: Detailed processing information

## Migration Guide

For existing systems integrating this database functionality:

1. **Run database migrations** to create new tables
2. **Update environment variables** with database credentials
3. **Import existing coupon data** to the new coupons table  
4. **Configure corporate domains** in the new table
5. **Test with the provided test suite**
6. **Deploy with monitoring** to track the integration

## Future Enhancements

Planned improvements:
- 🔄 **Rule-based coupons**: Complex business rules for coupon eligibility
- 📊 **A/B testing**: Dynamic coupon experiments
- 🎯 **Personalization**: User-specific coupon recommendations
- 📈 **Analytics dashboard**: Real-time coupon performance metrics
- 🔗 **Integration APIs**: External coupon management systems
- 🛡️ **Fraud detection**: Abuse prevention mechanisms

## Support

For questions or issues with the database integration:
1. Check the test suite for examples
2. Review the logs for error details
3. Consult the loader implementations for technical details
4. Run the comprehensive test suite to validate functionality