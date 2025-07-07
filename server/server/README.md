# eSIM Go Server

GraphQL server for the eSIM Go platform, built with Apollo Server, TypeScript, Bun, and Supabase Auth.

## Features

- 🔐 **Supabase Authentication** with role-based access control
- 📝 **GraphQL Code Generation** for type safety
- 🚀 **Real-time Subscriptions** via WebSocket
- 🛡️ **Auth Directives** for securing resolvers
- 🔧 **Schema Stitching** for modular GraphQL schemas
- 👥 **User Management** with Supabase Auth
- 📱 **Phone Verification** support for eSIM activation

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL, anon key, and service role key
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase configuration
   ```

4. **Generate TypeScript types:**
   ```bash
   bun run codegen
   ```

5. **Start development server:**
   ```bash
   bun run dev
   ```

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run codegen` - Generate TypeScript types from GraphQL schema
- `bun run codegen:watch` - Watch for schema changes and regenerate types

## Project Structure

```
src/
├── context/              # Context types and authentication
│   ├── auth.ts          # Legacy JWT authentication (for migration)
│   ├── supabase-auth.ts # Supabase authentication logic
│   └── types.ts         # TypeScript context types
├── auth.directive.ts     # GraphQL auth directive implementation
├── app.ts               # Apollo Server setup and configuration
├── resolvers.ts         # GraphQL resolvers
└── types.ts             # Generated TypeScript types (auto-generated)
```

## Authentication

The server uses Supabase Auth with JWT tokens and an `@auth` directive that can be applied to any GraphQL field or type:

```graphql
type Query {
  me: User @auth
  publicData: String  # No auth required
  availablePlans: [ESIMPlan!]!  # Public eSIM plans
}

type Mutation {
  signUp(input: SignUpInput!): SignUpResponse
  signIn(input: SignInInput!): SignInResponse
  purchaseESIM(planId: ID!, input: PurchaseESIMInput!): PurchaseESIMResponse @auth
}
```

### Authentication Flow

1. **Sign Up**: Creates user in Supabase Auth with metadata
2. **Sign In**: Returns JWT access token and refresh token
3. **Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Token Verification**: Server validates tokens with Supabase

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Legacy JWT secret (migration only) | No |
| `DATABASE_URL` | Database connection string | Yes |
| `REDIS_URL` | Redis connection for subscriptions | No |
| `ESIM_GO_API_KEY` | eSIM Go API key | Yes |
| `PORT` | Server port (default: 4000) | No |

## GraphQL Playground

Once the server is running, you can access the GraphQL playground at:
- **HTTP**: http://localhost:4000/graphql
- **WebSocket**: ws://localhost:4000/graphql

### Example Queries

**Sign Up:**
```graphql
mutation {
  signUp(input: {
    email: "user@example.com"
    password: "securepassword"
    firstName: "John"
    lastName: "Doe"
  }) {
    success
    user { id email firstName lastName }
    sessionToken
  }
}
```

**Get Current User (requires auth header):**
```graphql
query {
  me {
    id
    email
    firstName
    lastName
  }
}
```

## Migration from Custom JWT

If you're migrating from the previous custom JWT implementation:

1. **Backward Compatible**: Legacy JWT support is maintained
2. **Gradual Migration**: New users use Supabase, existing users can migrate
3. **Updated Context**: New `SupabaseAuthContext` with user data
4. **Same Directives**: `@auth` directive works with both systems

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed migration steps.

## TODO

- [x] Implement Supabase Auth integration
- [x] Update resolvers for sign up/sign in
- [ ] Implement user repository and database models
- [ ] Add eSIM Go API integration
- [ ] Set up Redis for caching and subscriptions
- [ ] Implement payment processing
- [ ] Add comprehensive error handling
- [ ] Set up logging and monitoring
- [ ] Add rate limiting
- [ ] Implement refresh token logic
- [ ] Add social login support
- [ ] Implement phone verification for eSIM activation
- [ ] Add role-based permissions (USER, ADMIN, PARTNER)
