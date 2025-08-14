# EasyCard Development Guide

## Local Development with Mock EasyCard API

The EasyCard integration supports both real API calls and mock responses using Prism mock servers for local development and testing.

### Quick Start

1. **Set up environment variables** in your `.env`:
   ```bash
   # For mock development
   EASYCARD_ENVIRONMENT=mock
   EASYCARD_MOCK_BASE_URL=http://localhost:4012
   
   # Still needed (can be dummy values for mock mode)
   EASYCARD_API_KEY=test-api-key
   EASYCARD_TERMINAL_ID=test-terminal-id
   EASY_CARD_PRIVATE_API_KEY=test-private-key
   ```

2. **Start the EasyCard mock server**:
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
| `EASYCARD_ENVIRONMENT` | Controls which client to use | `production`, `test`, `mock` |
| `EASYCARD_MOCK_BASE_URL` | Mock server URL (when using `mock`) | `http://localhost:4012` |
| `EASYCARD_API_KEY` | API key (real or dummy for mock) | Your EasyCard API key |

### Development Modes

#### 1. Mock Mode (`EASYCARD_ENVIRONMENT=mock`)
- **Uses**: Prism mock server with OpenAPI specification
- **Benefits**: Fast development, no API limits, predictable responses
- **Setup**: Run `bun run mock:easycard` first

#### 2. Test Mode (`EASYCARD_ENVIRONMENT=test`)
- **Uses**: Mock client with hardcoded responses
- **Benefits**: No external dependencies, fastest for unit tests
- **Setup**: No additional setup needed

#### 3. Production Mode (`EASYCARD_ENVIRONMENT=production`)
- **Uses**: Real EasyCard API
- **Benefits**: Real integration testing
- **Setup**: Requires valid EasyCard credentials

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