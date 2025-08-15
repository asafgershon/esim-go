# EasyCard Development Guide

## Local Development with Mock EasyCard API

The EasyCard integration supports both real API calls and mock responses using Prism mock servers for local development and testing.

### Quick Start

1. **Set up environment variables** in your `.env`:
   ```bash
   # For test/development with mocks
   EASYCARD_ENVIRONMENT=test
   EASYCARD_MOCK_BASE_URL=http://localhost:4012
   
   # For production with real payments
   EASYCARD_ENVIRONMENT=production
   EASYCARD_API_KEY=your-real-api-key
   EASYCARD_TERMINAL_ID=your-real-terminal-id
   EASY_CARD_PRIVATE_API_KEY=your-real-private-key
   ```

2. **Start the EasyCard mock server** (for test mode only):
   ```bash
   bun run mock:easycard
   ```
   This starts a Prism server on port 4012 with the EasyCard API specification.

3. **Start your development server**:
   ```bash
   bun run dev
   ```

### Environment Configuration

| Environment Variable | Description | Values |
|----------------------|-------------|--------|
| `EASYCARD_ENVIRONMENT` | Controls which client to use | `test`, `production` |
| `EASYCARD_MOCK_BASE_URL` | Mock server URL (when using `test`) | `http://localhost:4012` |
| `EASYCARD_API_KEY` | API key (real or dummy for test) | Your EasyCard API key |

### Development Modes

#### 1. Test Mode (`EASYCARD_ENVIRONMENT=test`)
- **Uses**: Prism mock server with OpenAPI specification
- **Benefits**: Fast development, no API limits, predictable responses  
- **Setup**: Run `bun run mock:easycard` first
- **Payment Links**: Mock URLs for testing UI flows

#### 2. Production Mode (`EASYCARD_ENVIRONMENT=production`)
- **Uses**: Real EasyCard API
- **Benefits**: Real payment processing and integration testing
- **Setup**: Requires valid EasyCard credentials
- **Payment Links**: Real payment URLs that process actual transactions

### Testing

```bash
# Run all tests with mock APIs
bun run test:integration

# Test specific EasyCard functionality
bun run test packages/easycard-client/src/__tests__/client.integration.test.ts

# Run EasyCard client tests with Prism
cd packages/easycard-client && bun run test:prism
```

### Troubleshooting

**Mock server not starting?**
- Check if port 4012 is already in use: `lsof -i :4012`
- Kill existing processes: `pkill -f prism`

**Client can't connect to mock server?**
- Ensure `EASYCARD_MOCK_BASE_URL=http://localhost:4012`
- Verify mock server is running on the correct port

**Real API calls in mock mode?**
- Check `EASYCARD_ENVIRONMENT=mock` in your `.env`
- Verify the service logs show "Using EasyCard mock client (Prism server)"

### API Coverage

The mock server supports all EasyCard endpoints:
- ✅ Payment Intent creation, retrieval, cancellation
- ✅ OAuth token authentication
- ✅ Transaction listing and filtering
- ✅ Webhook signature verification
- ✅ Error scenarios and validation

### Next Steps

The same pattern can be applied to other payment providers or external APIs by:
1. Creating OpenAPI specifications
2. Setting up Prism mock servers
3. Adding environment-based client switching