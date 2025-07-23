# Project Overview

## Project Components
- Web app handling BTC flow
- Dashboard for management
- Apollo server

## Key Details
- Global eSIM platform
- Working with 3rd party for eSIM bundles
- Collaborative development process with code review

## Development Practices
- Always use graphql-codegen
- After creating db migration run in the `server/server` directory `bun run codgen`
- Always use generated types in the `web-app` or `dashboard` for network responses
- **IMPORTANT**: Always use generated types from `@/__generated__/graphql` when using Apollo Client hooks:
  - `useQuery<GetCountriesQuery>(GET_COUNTRIES)`
  - `useLazyQuery<GetCountryBundlesQuery>(GET_COUNTRY_BUNDLES)`
  - `useMutation<CreateOrderMutation, CreateOrderMutationVariables>(CREATE_ORDER)`
  - This ensures type safety and prevents runtime errors from field name mismatches
- Use the generated types from __generated__ folder and use it together with `useMutation` and `useQuery` from Apollo client
- To build the dashboard application, use `bun run build` in the `client/apps/dashboard` directory

## Supabase Migration Process
- Create supabase migration by running `supabasem migration new {migration_name}`
- A file will be created in @server/supabase/migrations/, add the content there and run `supabase db push`
- Run supabase commands from `/server` directory

## eSIM Go API Integration Best Practices

### Catalog API Optimization (From Jason Koolman - eSIM Go Support)

**Issue**: High latency when calling the Catalogue endpoint with standard pagination approach.

**Solution**: Use bundle group filtering to reduce API calls and improve performance.

#### Implementation Strategy:
1. **Bundle Group Filtering**: Use the `group` query parameter to fetch each bundle group separately
   - Example: `/v2.5/catalogue?group=Standard Fixed&perPage=200`
   - Available groups: `Standard Fixed`, `Standard - Unlimited Lite`, `Standard - Unlimited Essential`, `Standard - Unlimited Plus`, `Regional Bundles`

2. **Local Caching**: Store responses locally with 30-day TTL
   - eSIM Go updates catalog monthly with each rate release
   - Cache key format: `esim-go:catalog:group:{group-name}`
   - TTL: 30 days (aligned with monthly update cycle)

3. **Reduced API Calls**: 
   - Instead of paginating through all bundles (potentially 100+ API calls)
   - Fetch 5 bundle groups (5 API calls total)
   - Use `perPage=200` to minimize calls per group

#### Benefits:
- **Reduced Latency**: Fewer API calls required
- **Better Performance**: Less strain on both client and eSIM Go servers
- **Organized Data**: Data stored by bundle group for efficient queries
- **Monthly Sync**: Aligned with eSIM Go's update schedule

#### Fallback Strategy:
If bundle group filtering fails, system falls back to multi-page pagination approach to ensure reliability.

#### Implementation Location:
- **Primary**: `server/server/src/services/catalog-sync.service.ts`
- **Cache Integration**: `server/server/src/datasources/esim-go/catalogue-datasource.ts`

#### API Request Format:
```javascript
// Optimized approach (recommended)
GET /v2.5/catalogue?group=Standard Fixed&perPage=200

// vs. Previous approach (high latency)
GET /v2.5/catalogue?perPage=50&page=1
GET /v2.5/catalogue?perPage=50&page=2
// ... potentially 100+ more requests
```

## Authentication Flow Architecture

### Overview
The application implements a comprehensive authentication system with multiple sign-in methods and seamless user experience integration.

### Authentication Methods
1. **Phone OTP**: Primary authentication method using SMS verification
2. **Apple Sign-In**: Social authentication with Apple ID
3. **Google Sign-In**: Social authentication with Google account

### Key Components

#### Frontend Components
- **`/src/components/login-form.tsx`**: Main login form with all authentication methods
- **`/src/components/login-modal.tsx`**: Modal wrapper for login form with responsive design
- **`/src/hooks/useAuth.ts`**: Authentication state management hook
- **`/src/hooks/usePhoneOTP.ts`**: Phone OTP flow management
- **`/src/hooks/useAppleSignIn.ts`**: Apple authentication integration
- **`/src/hooks/useGoogleSignIn.ts`**: Google authentication integration

#### Authentication Flow States
1. **Landing Page Avatar Click**:
   - **Unauthenticated**: Opens login modal (`LoginModal`)
   - **Authenticated**: Direct link to profile page
   
2. **Login Modal**:
   - **Responsive**: 420px max-width on desktop, full-width on mobile
   - **Multi-method**: Phone OTP, Apple, Google sign-in options
   - **Success handling**: Redirects to profile page after successful authentication

3. **Profile Page**:
   - **Real Data Integration**: Connected to backend GraphQL queries
   - **Active eSIM Display**: Shows current plan, usage, and expiry data
   - **Order History**: Real-time order tracking from database

### Authentication Hook (`useAuth`)
- **Conditional Queries**: Only makes ME query when auth token exists
- **Token Management**: Handles localStorage token lifecycle
- **Error Handling**: Automatic token cleanup on auth errors
- **State Management**: Consistent authentication state across app

### GraphQL Integration
- **ME Query**: `query Me { me { id, email, firstName, lastName, phoneNumber } }`
- **Conditional Execution**: Skipped when no auth token present
- **Error Handling**: Automatic token cleanup on UNAUTHORIZED errors

### Profile Page Data Flow
- **User Data**: Real user information from ME query
- **eSIM Data**: Active plan information from `GET_ACTIVE_ESIM_PLAN` query
- **Order History**: Real order data from `GetUserOrders` query
- **Mock Data Elimination**: Replaced all mock data with real backend integration

### Best Practices Implemented
1. **Conditional API Calls**: Prevent unnecessary queries for unauthenticated users
2. **Responsive Design**: Modal adapts to screen size appropriately
3. **Error Boundaries**: Graceful handling of authentication failures
4. **State Consistency**: Unified authentication state across components
5. **Token Security**: Automatic cleanup of expired/invalid tokens

### Performance Optimizations
- **Query Skipping**: ME query only runs when auth token exists
- **Cache Management**: Efficient Apollo Client caching strategy
- **Loading States**: Proper loading indicators during authentication
- **Error Recovery**: Automatic retry mechanisms for failed auth attempts

## Package Management
- Using bun as package manager

## Pricing Module Architecture

### Overview
Dashboard pricing management system with advanced table features, real-time calculations, and configuration tools.

### Core Components
- **`/src/pages/pricing.tsx`**: Main pricing page with lazy loading and batch calculations
- **`/src/components/CountryPricingSplitView/CountryPricingSplitView.tsx`**: Split view with country cards and bundles table
- **`/src/components/pricing-simulator-drawer.tsx`**: Side drawer for pricing simulation (600px, right-slide)

### Key Features
- **Native Grouping**: Countries with lazy-loaded bundles, summary rows with bundle counts
- **Real-time Pricing**: Uses `CALCULATE_BATCH_PRICING` GraphQL query for live calculations
- **Advanced Table**: TanStack Table with sorting (country name, bundle count), filtering, pagination
- **Pricing Configuration**: Per-country/bundle custom pricing rules via drawer
- **Simulator**: Test any country/duration combination with profit analysis

### Data Flow
1. Countries load with summary (bundle counts)
2. Expand triggers lazy load of bundle details
3. Real-time pricing via GraphQL batch calculations
4. Configuration updates via mutations

### Performance
- Lazy loading pattern for initial load speed
- Batch pricing calculations to reduce API calls
- Follows eSIM Go bundle group filtering best practices

## Orders Module

### Components
- **`/src/components/order-details-drawer.tsx`**: Comprehensive order details display
- **`/src/components/details-drawer.tsx`**: Reusable drawer components (`DetailsDrawer`, `DetailsSection`, `DetailsRow`)
- **`/src/pages/orders.tsx`**: Orders table with integrated drawer functionality

### Features
- Order details view with customer info, data plan specs, and timeline
- User-order bidirectional relationship with nullable user field handling
- Interactive UI with clickable references and dropdown actions
- Consistent design patterns and error handling

## Git Commit Guidelines
When making commits, organize changes by feature and create clean, focused commits:

1. **Stage specific files**: Use `git add <specific-files>` to stage only related changes
2. **Review staged files**: Use `git diff --cached --name-only` to review what will be committed
3. **Commit format**: Use descriptive commit messages with this structure:
   ```
   type: brief description
   
   - Detailed bullet points of what was changed
   - Include file locations for major changes
   - Explain the "why" not just the "what"
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. **Separate concerns**: Create separate commits for different features (e.g., validation flow vs URL state management)
5. **Include context**: Reference relevant documentation or API recommendations when applicable

## Structured Logging Guidelines

### Overview
The project uses **Pino** for structured logging with correlation IDs, performance metrics, and JSON formatting for production monitoring.

### Core Principles
1. **No console.log**: Always use the structured logger instead of console.log/console.error
2. **Context over noise**: Include relevant business context, avoid verbose debug logs
3. **Performance tracking**: Log timing for critical operations
4. **Error enrichment**: Capture full error context with stack traces and metadata

### Logger Setup

#### Import and Initialize
```typescript
import { createLogger, withPerformanceLogging } from '../lib/logger';

// Component-level logger
const logger = createLogger({ component: 'ComponentName' });

// Class-level logger  
class MyService {
  private logger = createLogger({ 
    component: 'MyService',
    operationType: 'service-operation'
  });
}
```

#### Correlation IDs
Correlation IDs are automatically generated and included in all logs for request tracing:
```typescript
// Get correlation ID for custom tracking
const correlationId = logger.getCorrelationId();

// Create child logger with additional context
const childLogger = logger.child({ userId: user.id, orderId: order.id });
```

### Logging Levels

#### 1. **logger.info()** - Important business events
```typescript
// ✅ Good: Business-critical events
logger.info('Order created successfully', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  operationType: 'order-creation'
});

logger.info('Catalog sync completed', {
  duration,
  totalBundles: metadata.totalBundles,
  bundleGroups: metadata.bundleGroups,
  operationType: 'catalog-sync'
});
```

#### 2. **logger.warn()** - Recoverable issues
```typescript
// ✅ Good: System warnings
logger.warn('Cache miss, falling back to API', {
  cacheKey: 'esim-go:catalog:metadata',
  operationType: 'cache-fallback'
});

logger.warn('High memory usage detected', {
  memoryMB: memoryMB.toFixed(2),
  threshold: 500,
  operationType: 'memory-warning'
});
```

#### 3. **logger.error()** - System errors
```typescript
// ✅ Good: Error with context
logger.error('Failed to sync catalog', error, {
  bundleGroup: groupName,
  operationType: 'catalog-sync'
});

// ✅ Good: Error without exception object
logger.error('Request timeout', undefined, {
  method: req.method,
  path: req.path,
  operationType: 'request-timeout'
});
```

#### 4. **logger.debug()** - Development info (use sparingly)
```typescript
// ⚠️ Use only for critical debugging - will be filtered in production
logger.debug('Processing payment intent', {
  paymentIntentId: intent.id,
  operationType: 'payment-processing'
});
```

### Context Data Standards

#### Required Fields
- **operationType**: Business operation being performed
- **correlationId**: Automatically included for request tracing

#### Recommended Fields
- **userId**: When user context is available
- **duration**: For timed operations (milliseconds)
- **[entityId]**: Relevant business entity IDs (orderId, bundleId, etc.)

#### Example Context Objects
```typescript
// API operations
{ operationType: 'api-request', endpoint: '/v2.5/catalogue', duration: 1250 }

// Business operations  
{ operationType: 'order-processing', orderId: '123', userId: 'abc', paymentMethod: 'card' }

// System operations
{ operationType: 'cache-refresh', cacheKey: 'esim-go:bundles', ttl: 3600 }

// Performance tracking
{ operationType: 'performance', operation: 'catalog-sync', duration: 45000 }
```

### Performance Metrics

#### Using withPerformanceLogging
```typescript
// ✅ Wrap critical operations for automatic timing
async syncCatalog(): Promise<void> {
  return withPerformanceLogging(
    this.logger,
    'catalog-sync',
    async () => {
      // Your operation here
      await this.performSync();
    },
    { bundleGroups: this.BUNDLE_GROUPS.length }
  );
}
```

#### Manual Performance Logging
```typescript
const start = Date.now();
try {
  await operation();
  logger.logPerformance({
    operation: 'search-plans',
    duration: Date.now() - start,
    context: { country: criteria.country, bundleCount: results.length }
  });
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'search-plans',
    duration: Date.now() - start
  });
}
```

### Anti-Patterns

#### ❌ Don't Do This
```typescript
// ❌ Using console.log
console.log('User logged in:', user.id);

// ❌ Verbose debug logging
logger.debug('Setting variable x to value y');
logger.debug('Entering function processData');
logger.debug('Loop iteration 5 of 100');

// ❌ Logging without context
logger.info('Operation completed');
logger.error('Something went wrong');

// ❌ Logging sensitive data
logger.info('User credentials', { password: user.password, apiKey: secret });
```

#### ✅ Do This Instead
```typescript
// ✅ Structured logging with context
logger.info('User authentication successful', {
  userId: user.id,
  method: 'phone-otp',
  operationType: 'authentication'
});

// ✅ Meaningful business events only
logger.info('Data processing completed', {
  recordsProcessed: data.length,
  duration: processingTime,
  operationType: 'data-processing'
});

// ✅ Error logging with full context
logger.error('API request failed', error, {
  endpoint: '/v2.5/catalogue',
  statusCode: response.status,
  operationType: 'api-request'
});
```

### Production Considerations

#### Log Level Configuration
- **Development**: `debug` level with pretty printing
- **Production**: `info` level with JSON formatting
- **Environment variable**: `LOG_LEVEL=info|debug|warn|error`

#### Security
- **Never log**: Passwords, API keys, payment details, PII
- **Hash sensitive data**: User identifiers, session tokens when needed for debugging
- **Redact automatically**: Use structured fields to avoid accidental exposure

#### Performance
- **Avoid string concatenation**: Use structured context objects
- **Limit debug logs**: Debug level should be minimal even in development
- **Batch operations**: Use performance wrappers for grouped operations

### Integration Examples

#### GraphQL Resolvers
```typescript
const logger = createLogger({ component: 'checkout-resolvers' });

// In resolver function
logger.info('Checkout session created', {
  sessionId: session.id,
  userId: context.auth?.user?.id,
  operationType: 'checkout-session-creation'
});
```

#### Data Sources
```typescript
class CatalogueDataSource {
  private logger = createLogger({ component: 'CatalogueDataSource' });

  async searchPlans(criteria: SearchCriteria) {
    return withPerformanceLogging(
      this.logger,
      'catalog-search',
      async () => {
        // Search implementation
      },
      { country: criteria.country, duration: criteria.duration }
    );
  }
}
```

#### Services
```typescript
class CatalogSyncService {
  private logger = createLogger({ 
    component: 'CatalogSyncService',
    operationType: 'catalog-sync'
  });

  async syncFullCatalog() {
    logger.info('Starting catalog sync', { bundleGroups: this.BUNDLE_GROUPS });
    // Implementation
    logger.info('Catalog sync completed', { totalBundles, duration });
  }
}
```