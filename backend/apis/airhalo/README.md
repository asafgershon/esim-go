# Airalo Client Package

A TypeScript client for the Airalo eSIM Partner API with comprehensive search and filtering capabilities.

## Installation

```bash
npm install @hiilo/airalo
# or
bun add @hiilo/airalo
```

## Quick Start

```typescript
import { AirHaloClient } from '@hiilo/airalo';

const client = new AirHaloClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  baseUrl: 'https://partners.airalo.com' // optional
});

// Get all packages
const packages = await client.getPackages();

// Search with basic filters
const searchResults = await client.searchPackages({
  countries: ['US', 'CA'],
  minDuration: 7,
  maxDuration: 30,
  isUnlimited: false
});
```

## Advanced Search Features

### Geographic Filtering

```typescript
// Search by countries
const countryResults = await client.searchPackages({
  countries: ['FR', 'ES', 'IT'],
  type: 'local'
});

// Search by regions
const regionResults = await client.searchPackages({
  regions: ['Europe', 'Asia'],
  type: 'regional'
});

// Global packages
const globalResults = await client.searchPackages({
  type: 'global'
});
```

### Duration-based Search

```typescript
// Short-term packages (1-7 days)
const shortTerm = await client.searchPackages({
  maxDuration: 7,
  countries: ['JP']
});

// Long-term packages (30+ days)
const longTerm = await client.searchPackages({
  minDuration: 30,
  countries: ['US']
});

// Exact duration
const exactDuration = await client.searchPackages({
  exactDuration: 15,
  countries: ['GB']
});
```

### Data Amount Filtering

```typescript
// Small data packages (up to 5GB)
const smallData = await client.searchPackages({
  maxDataAmount: 5120, // 5GB in MB
  isUnlimited: false
});

// Large data packages (20GB+)
const largeData = await client.searchPackages({
  minDataAmount: 20480, // 20GB in MB
  isUnlimited: false
});

// Unlimited data only
const unlimited = await client.searchPackages({
  isUnlimited: true,
  countries: ['US', 'CA']
});
```

### Price-based Filtering

```typescript
// Budget packages under $20
const budget = await client.searchPackages({
  maxPrice: 20,
  currency: 'USD',
  countries: ['TH', 'VN']
});

// Premium packages $50+
const premium = await client.searchPackages({
  minPrice: 50,
  currency: 'USD',
  isUnlimited: true
});
```

### Sorting Results

```typescript
// Sort by price (ascending)
const cheapest = await client.searchPackages({
  countries: ['DE'],
  sortBy: 'price',
  sortDirection: 'asc'
});

// Sort by data amount (descending)
const mostData = await client.searchPackages({
  countries: ['US'],
  sortBy: 'data',
  sortDirection: 'desc'
});

// Sort by duration
const longestDuration = await client.searchPackages({
  countries: ['FR'],
  sortBy: 'duration',
  sortDirection: 'desc'
});
```

### Finding Similar Packages

```typescript
// Find packages similar to your current offering
const similarPackages = await client.findSimilarPackages({
  countries: ['US'],
  duration: 30,
  dataAmount: 10240, // 10GB
  isUnlimited: false
});

// This returns packages with:
// - Same/similar countries
// - Duration within ±3 days
// - Data amount within ±20%
// - Scored by similarity
```

## Complete Search Example

```typescript
// Complex search with multiple criteria
const advancedSearch = await client.searchPackages({
  // Geographic
  countries: ['US', 'CA', 'MX'],
  type: 'local',
  
  // Duration
  minDuration: 7,
  maxDuration: 30,
  
  // Data
  minDataAmount: 5120, // 5GB
  maxDataAmount: 50240, // 50GB
  isUnlimited: false,
  
  // Price
  maxPrice: 100,
  currency: 'USD',
  
  // Sorting and pagination
  sortBy: 'price',
  sortDirection: 'asc',
  limit: 20,
  page: 1
});

console.log(`Found ${advancedSearch.length} packages`);
advancedSearch.forEach(pkg => {
  console.log(`${pkg.title} - ${pkg.countries.join(', ')}`);
  pkg.operators.forEach(op => {
    op.packages.forEach(p => {
      console.log(`  ${p.day} days, ${p.amount}MB, $${p.price}`);
    });
  });
});
```

## Order Management

```typescript
// Place an order
const order = await client.placeOrder('package-id', 2, {
  description: 'Order for customer XYZ',
  toEmail: 'customer@example.com'
});

// Get orders
const orders = await client.getOrders(10, 1); // limit, page

// Get specific order
const orderDetails = await client.getOrderById('order-id');
```

## Response Format

The search methods return `EnhancedPackageInfo[]` with the following structure:

```typescript
interface EnhancedPackageInfo {
  id: string;
  title: string;
  slug: string;
  countries: string[];
  regions: string[];
  type: 'local' | 'regional' | 'global';
  operators: Array<{
    id: string;
    title: string;
    countries: string[];
    packages: Array<{
      id: string;
      amount: number; // Data in MB
      day: number; // Duration in days
      price: number;
      currency: string;
      is_unlimited: boolean;
      pricePerGB?: number; // Calculated field
      durationCategory: 'short' | 'medium' | 'long'; // Calculated field
    }>;
  }>;
}
```

## Error Handling

```typescript
import { AirhaloApiError, AirhaloAuthError, AirhaloRateLimitError } from '@hiilo/airalo';

try {
  const packages = await client.searchPackages({ countries: ['US'] });
} catch (error) {
  if (error instanceof AirhaloAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof AirhaloRateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof AirhaloApiError) {
    console.error('API error:', error.statusCode, error.message);
  }
}
```

## Configuration Options

```typescript
const client = new AirHaloClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  baseUrl: 'https://partners.airalo.com', // optional
  timeout: 30000, // optional, default 30s
  retryAttempts: 3, // optional, default 3
  enableLogging: true // optional, default false
});
```