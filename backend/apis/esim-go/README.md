# eSIM Go Client with Prism Mock Server

This package provides a TypeScript client for the eSIM Go API with integrated Prism mock server support for testing.

## Features

- Type-safe eSIM Go API client
- Auto-generated types from OpenAPI spec
- Integrated Prism mock server for testing
- Support for both unit and integration testing
- Configurable test scenarios (success, errors, rate limiting)

## Installation

```bash
bun install
```

## Usage

### Production Client

```typescript
import { ESimGoClient } from '@hiilo/esim-go';

const client = new ESimGoClient({
  baseUrl: 'https://api.esim-go.com/v2.4',
  apiKey: process.env.ESIM_GO_API_KEY,
  retryAttempts: 3,
});

// Fetch catalogue
const bundles = await client.getCatalogueWithRetry({
  countries: 'US',
  perPage: 20,
});
```

### Testing with Prism

The package includes Prism mock server integration for realistic API testing without making real API calls.

## Testing

### Setup

1. Download the OpenAPI spec:
```bash
bun run download:spec
```

2. Run tests with different modes:

```bash
# Run all tests with Prism mock server
bun run test:prism

# Run tests with manual watching
bun run test:watch

# Start mock server standalone
bun run mock:server
```

### Test Configuration

Tests can be configured to use Prism mock server or manual mocks:

```typescript
// Using Prism mock (automatic with test:prism script)
import { createPrismClient } from '../testing/mock-config';

const client = createPrismClient();
const result = await client.getCatalogueWithRetry({ countries: 'US' });
```

### Testing Error Scenarios

Use Prism scenarios to test different API responses:

```typescript
import { PrismScenarios } from '../testing/prism-scenarios';

// Test rate limiting
const client = createPrismClient({
  defaultHeaders: PrismScenarios.getHeaders('rate-limit'),
});

// Test authentication errors
const client = createPrismClient({
  defaultHeaders: PrismScenarios.getHeaders('auth-error'),
});
```

## Integration with Server Tests

The server package can use this client with Prism for integration testing:

```typescript
// In server tests
import { createTestContext } from '../test-utils/prism-context';

const context = createTestContext({ usePrism: true });

// This will use the Prism mock server
const result = await context.services.esimGoClient.getCatalogueWithRetry({});
```

### Server Test Scripts

```bash
# Run unit tests (without Prism)
cd server/server
bun run test:unit

# Run integration tests (with Prism)
bun run test:integration

# Run all tests with Prism
bun run test:prism
```

## Environment Variables

```env
# For testing
USE_PRISM_MOCK=true       # Enable Prism mock server
PRISM_VERBOSE=true        # Enable verbose Prism logging

# For production
ESIM_GO_API_KEY=your-api-key
ESIM_GO_BASE_URL=https://api.esim-go.com/v2.4
```

## How It Works

1. **OpenAPI Spec**: The package uses the official eSIM Go OpenAPI specification
2. **Prism Server**: Stoplight Prism creates a mock server from the OpenAPI spec
3. **Type Generation**: TypeScript types are generated from the same spec
4. **Contract Testing**: Tests validate against the actual API contract
5. **Zero Maintenance**: When the API updates, just download the new spec

## Benefits

- **No Mock Maintenance**: Prism generates mocks from the OpenAPI spec automatically
- **Realistic Responses**: Mock responses match the actual API structure
- **Error Testing**: Easy to test rate limits, auth errors, and other edge cases
- **Fast Tests**: No network calls means faster test execution
- **CI/CD Ready**: Works in Docker and GitHub Actions

## Advanced Usage

### Custom Prism Server

```typescript
import { PrismServer } from './src/testing/prism-helpers';

const server = new PrismServer({
  port: 4010,
  specPath: './custom-spec.yaml',
  dynamic: true,
  verbose: true,
});

await server.start();
// Run your tests
await server.stop();
```

### Multiple Test Scenarios

```typescript
describe('API Scenarios', () => {
  it.each([
    ['success', 200],
    ['rate-limit', 429],
    ['auth-error', 401],
    ['server-error', 500],
  ])('handles %s scenario', async (scenario, expectedStatus) => {
    const client = createPrismClient({
      defaultHeaders: PrismScenarios.getHeaders(scenario as any),
    });
    
    // Test your scenario
  });
});
```

## Troubleshooting

### Prism Server Won't Start

- Ensure port 4010 is available
- Check that `openapi-spec.yaml` exists (run `bun run download:spec`)
- Try verbose mode: `PRISM_VERBOSE=true bun test`

### Tests Timeout

- Increase timeout in vitest.config.ts
- Check Prism server is running: `curl http://localhost:4010/health`

### Type Mismatches

- Regenerate types: `bun run generate`
- Update OpenAPI spec: `bun run download:spec`

## Contributing

1. Update OpenAPI spec if needed
2. Regenerate types
3. Add tests for new functionality
4. Ensure all tests pass with Prism

## License

Private