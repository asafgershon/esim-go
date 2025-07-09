# eSIM Go Backend Implementation Guide

## 🚀 Overview

This document outlines the backend implementation for the eSIM Go Platform, which integrates with the eSIM Go API to enable customers to purchase and manage unlimited data plans globally.

## 📂 Implementation Structure

### Database Schema (SQL Migrations)
Located in `/server/db/migrations/`:

1. **001_create_data_plans.sql** - Stores eSIM Go catalogue data
2. **002_create_esim_orders.sql** - Tracks customer purchases
3. **003_create_esims.sql** - Individual eSIM instances
4. **004_create_esim_bundles.sql** - Bundle assignments and usage

### Apollo DataSources
Located in `/server/server/src/datasources/esim-go/`:

1. **esim-go-base.ts** - Base class with authentication and error handling
2. **catalogue-datasource.ts** - Browse and search data plans
3. **orders-datasource.ts** - Purchase eSIMs and manage orders
4. **esims-datasource.ts** - Manage individual eSIMs and bundles
5. **types.ts** - TypeScript interfaces for API responses

### GraphQL Implementation
- **Schema Updates** - New types for DataPlan, Order, ESIM, and Bundles
- **Resolvers** - Located in `/server/server/src/resolvers/esim-resolvers.ts`
- **Context Integration** - DataSources available in GraphQL context

### Services
- **Webhook Handler** - `/server/server/src/services/esim-go-webhook.ts`

## 🔧 Key Features Implemented

### 1. Data Plan Browsing (Public)
```graphql
query {
  # Browse all plans with filters
  dataPlans(filter: {
    region: "Europe"
    duration: 30
    maxPrice: 100
  }) {
    id
    name
    description
    price
    duration
    countries { name iso }
  }
  
  # Get featured plans
  featuredPlans {
    id
    name
    price
  }
}
```

### 2. eSIM Purchase (Authenticated)
```graphql
mutation {
  purchaseESIM(planId: "plan-uuid", input: {
    quantity: 1
    customerReference: "CUST-123"
    autoActivate: false
  }) {
    success
    order {
      id
      reference
      status
      totalPrice
    }
    error
  }
}
```

### 3. eSIM Management (Authenticated)
```graphql
query {
  # List user's eSIMs
  myESIMs {
    id
    iccid
    status
    qrCode
    usage {
      totalUsed
      totalRemaining
    }
    bundles {
      name
      state
      dataUsed
      endDate
    }
  }
  
  # Get specific eSIM details
  esimDetails(id: "esim-uuid") {
    id
    plan { name description }
    bundles { state dataUsed }
  }
}

mutation {
  # Suspend eSIM
  suspendESIM(esimId: "esim-uuid") {
    success
    esim { status }
  }
  
  # Restore eSIM
  restoreESIM(esimId: "esim-uuid") {
    success
    esim { status }
  }
}
```

### 4. Order Management (Authenticated)
```graphql
query {
  # List user's orders
  myOrders(filter: {
    status: COMPLETED
    fromDate: "2024-01-01"
  }) {
    id
    reference
    status
    totalPrice
    createdAt
  }
  
  # Get order details
  orderDetails(id: "order-uuid") {
    id
    dataPlan { name }
    esims {
      iccid
      qrCode
      status
    }
  }
}
```

## 🔒 Security Implementation

### Authentication
- Uses Supabase Auth with JWT tokens
- Protected routes use `@auth` directive
- User context available in resolvers

### API Security
- eSIM Go API key stored in environment variables
- All API calls go through DataSources with error handling
- Rate limiting handled by eSIM Go API

### Database Security
- Row Level Security (RLS) enabled on all tables
- Users can only see their own data
- Admin-only operations for data plan management

## 🏗️ Architecture Decisions

### 1. Apollo DataSources Pattern
- Clean separation of API logic
- Built-in caching support
- Consistent error handling

### 2. Hybrid Data Storage
- API data cached with TTL
- Database stores relationships and metadata
- Real-time data fetched on demand

### 3. Caching Strategy
```typescript
// Catalogue: 1 hour (plans rarely change)
await this.cache?.set(key, data, { ttl: 3600 });

// Orders: 5 minutes (status updates)
await this.cache?.set(key, data, { ttl: 300 });

// QR Codes: 24 hours (immutable)
await this.cache?.set(key, data, { ttl: 86400 });
```

## 🔄 Webhook Integration

The webhook handler processes these events:
- `order.completed` - Creates eSIMs in database
- `esim.assigned` - Updates QR codes
- `esim.activated` - Updates status
- `bundle.activated` - Creates/updates bundles
- `bundle.expired` - Marks bundles as expired

## 🚀 Deployment Checklist

### Environment Variables
```env
# Required
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ESIM_GO_API_KEY=

# Optional
ESIM_GO_WEBHOOK_SECRET=
REDIS_URL=
```

### Database Setup
1. Run migrations in order (001-004)
2. Seed sample data plans (optional)
3. Verify RLS policies are active

### Testing
```bash
# Run GraphQL queries
npm run dev

# Test data plan browsing (no auth)
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ featuredPlans { name price } }"}'

# Test authenticated queries
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ myESIMs { id status } }"}'
```

## 📊 Monitoring

### Key Metrics
- API response times (target < 200ms)
- Cache hit rates
- Order completion rates
- Error rates by type

### Logging
- All API errors logged with context
- Webhook events logged
- Performance metrics tracked

## 🔮 Future Enhancements

1. **Real-time Subscriptions**
   - WebSocket support for live updates
   - Bundle usage tracking
   - Status change notifications

2. **Advanced Analytics**
   - Usage patterns
   - Popular destinations
   - Revenue tracking

3. **Batch Operations**
   - Bulk eSIM purchases
   - Group management
   - Corporate accounts

4. **Enhanced Caching**
   - Redis integration
   - Distributed caching
   - Cache warming strategies

## 🐛 Troubleshooting

### Common Issues

1. **"eSIM Go API key not configured"**
   - Ensure `ESIM_GO_API_KEY` is set in environment

2. **"Failed to fetch data plans"**
   - Check eSIM Go API connectivity
   - Verify API key permissions

3. **"Not authenticated"**
   - Ensure JWT token is valid
   - Check Supabase configuration

4. **Webhook signature failures**
   - Verify `ESIM_GO_WEBHOOK_SECRET` matches eSIM Go configuration
   - Check request body parsing

### Debug Mode
Enable detailed logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📚 API Reference

### DataSources Methods

#### CatalogueDataSource
- `getAllPlans()` - Get all available plans
- `getPlansByRegion(region)` - Filter by region
- `getPlansByCountry(iso)` - Filter by country
- `searchPlans(criteria)` - Advanced search
- `getFeaturedPlans()` - Curated plans

#### OrdersDataSource
- `createOrder(request)` - Purchase eSIMs
- `getOrder(reference)` - Get order details
- `getOrders(params)` - List orders
- `getOrderAssignments(reference)` - Get QR codes
- `cancelOrder(reference)` - Cancel order

#### ESIMsDataSource
- `getESIMs(params)` - List eSIMs
- `getESIM(iccid)` - Get eSIM details
- `updateESIM(iccid, request)` - Update eSIM
- `getBundleStatus(iccid, bundle)` - Bundle details
- `getESIMUsage(iccid)` - Usage statistics
- `suspendESIM(iccid)` - Suspend service
- `restoreESIM(iccid)` - Restore service

---

## 💡 Best Practices

1. **Always use DataSources** for API calls
2. **Cache aggressively** but with appropriate TTLs
3. **Handle errors gracefully** with user-friendly messages
4. **Log extensively** for debugging
5. **Test webhook handlers** thoroughly
6. **Monitor API usage** to avoid rate limits

## 🎉 Success!

The eSIM Go backend integration is complete and production-ready. The system provides:
- ✅ Secure authentication
- ✅ Efficient data plan browsing
- ✅ Seamless purchase flow
- ✅ Real-time eSIM management
- ✅ Comprehensive error handling
- ✅ Performance optimization