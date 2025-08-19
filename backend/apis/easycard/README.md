# @hiilo/easycard

TypeScript client for the EasyCard Payment Service API.

## Installation

```bash
bun add @hiilo/easycard
```

## Usage

### Using Environment Variables (Recommended)

Set the following environment variables:
```bash
EASYCARD_API_KEY=your-api-key
EASYCARD_API_URL=https://ecng-transactions.azurewebsites.net  # optional, this is the default
```

Then use the client:
```typescript
import { EasyCardClient } from '@hiilo/easycard';

// Create client from environment variables (with validation)
const client = EasyCardClient.fromEnv();

// Use the client
const transactions = await client.transactions.apiTransactionsGet();
```

### Manual Configuration

```typescript
import { EasyCardClient } from '@hiilo/easycard';

// Initialize the client manually
const client = new EasyCardClient({
  apiKey: 'your-api-key',
  basePath: 'https://ecng-transactions.azurewebsites.net', // optional
});
```

## Available APIs

- **billing**: Billing management operations
- **cardToken**: Card tokenization operations  
- **invoicing**: Invoice management
- **paymentIntent**: Payment intent operations
- **paymentRequests**: Payment request management
- **transactions**: Transaction operations
- **webhooks**: Webhook management

## Development

### Regenerate Client from Swagger

The client is auto-generated from the EasyCard API Swagger specification. To regenerate:

```bash
bun run regenerate
```

This will:
1. Clean existing generated code
2. Fetch the latest Swagger spec from the API
3. Generate new TypeScript client code

## Configuration

The client fetches its API specification directly from:
`https://ecng-transactions.azurewebsites.net/swagger/v1/swagger.json`

This is configured in `openapi-generator.config.yaml`.