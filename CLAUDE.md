# eSIM Go Platform - Claude Configuration

## Project Overview

The eSIM Go platform is a modern web application for purchasing and managing eSIMs globally. Built with:
- **Backend**: Node.js, TypeScript, Apollo GraphQL, Supabase
- **Frontend**: React, Next.js, Tailwind CSS, Shadcn/ui
- **Infrastructure**: Railway (backend), Vercel (frontend)
- **Integrations**: eSIM Go API, Stripe, Twilio

## Project Structure

```
esim-go/
├── client/
│   ├── web-app/           # React PWA for end users
│   ├── dashboard/         # Admin dashboard
│   └── shared/           # Shared components
├── server/
│   ├── server/           # GraphQL API server
│   │   ├── src/
│   │   │   ├── resolvers/    # GraphQL resolvers
│   │   │   ├── services/     # Business logic
│   │   │   ├── repositories/ # Data access
│   │   │   └── utils/        # Utilities
│   │   └── package.json
│   └── db/               # Database schemas
├── .claude/
│   ├── agents/           # Specialized AI agents
│   └── commands/         # Workflow commands
└── docs/                 # Documentation
```

## Key Features Implemented

✅ **Authentication System**
- Email/password, Apple, Google, Phone/SMS
- JWT-based sessions with Supabase Auth
- Role-based access control

✅ **eSIM Catalog**
- Bundle browsing by country/region
- Real-time pricing
- Advanced filtering

✅ **Checkout System**
- Multi-step checkout flow
- Session-based state management
- Payment processing (Stripe-ready)

✅ **eSIM Provisioning**
- Direct activation for iOS 17.4+
- QR code generation
- Manual activation support
- Real-time status updates

✅ **Bundle Data Sync**
- Automated catalog updates
- Cron job synchronization
- Webhook processing

## Development Workflow

Use the `/esim-workflow` command to start any development task. The orchestrator will automatically coordinate the right agents.

### Quick Examples

```bash
# Add a new feature
/esim-workflow "Add wishlists so users can save bundles for later"

# Fix a bug
/esim-workflow "Fix the checkout session expiring too quickly"

# Improve performance
/esim-workflow "Optimize bundle search to return results in under 200ms"
```

## Agent Capabilities

### esim-orchestrator
Master coordinator that manages the entire development workflow.

### esim-analyst
- Analyzes business requirements
- Creates user stories and acceptance criteria
- Researches eSIM industry standards

### esim-architect
- Designs system architecture
- Plans database schemas
- Creates API specifications

### graphql-backend-developer
- Implements GraphQL resolvers
- Writes TypeScript services
- Integrates with Supabase

### react-frontend-developer
- Builds React components
- Implements responsive designs
- Optimizes for mobile PWA

### esim-integration-specialist
- Integrates eSIM Go API
- Implements activation workflows
- Handles provider webhooks

### esim-tester
- Writes comprehensive tests
- Creates E2E test scenarios
- Performs mobile testing

### esim-security-auditor
- Reviews security vulnerabilities
- Ensures OWASP compliance
- Validates authentication flows

### esim-performance-optimizer
- Optimizes GraphQL queries
- Improves frontend performance
- Implements caching strategies

## Environment Configuration

### Required Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# eSIM Go API
ESIM_GO_API_KEY=
ESIM_GO_BASE_URL=
ESIM_GO_MODE=production

# Other services
STRIPE_SECRET_KEY=
REDIS_URL=
```

## Common Tasks

### Adding a New Feature
1. Use `/esim-workflow "description of feature"`
2. The orchestrator will coordinate all agents
3. Review the implementation plan
4. Approve and let agents implement

### Debugging Issues
1. Describe the issue to the orchestrator
2. Relevant agents will investigate
3. Get detailed analysis and fixes

### Performance Optimization
1. Specify performance goals
2. Performance optimizer will analyze
3. Get specific optimization recommendations

## Best Practices

1. **Always use the workflow command** for complex tasks
2. **Let agents work in their specialization** - don't override
3. **Review agent outputs** before implementing
4. **Maintain test coverage** above 80%
5. **Security first** - all features reviewed by security auditor

## Testing

- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Cypress
- Mobile testing: Real devices + BrowserStack

## Deployment

- **Backend**: Automatic deployment to Railway on main branch
- **Frontend**: Automatic deployment to Vercel on main branch
- **Database**: Migrations via Supabase CLI

## Support

For complex scenarios not covered by agents, refer to:
- Project documentation in `/docs`
- Linear project board
- eSIM Go API documentation

Remember: The agents are here to help you build faster and better. Trust their expertise in their domains!

## Package Management

- We are using zbunz as package manager in all projects

## Testing Best Practices

- Always use vitest for testing 'bun run test' and not 'bun test'!
- Add --run to vitest to avoid watch mode

## Type Checking

- We run type-check using 'bun run build' if no type-check script exists