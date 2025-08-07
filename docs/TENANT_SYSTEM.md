# eSIM Go Multi-Tenant System

## Overview
The eSIM Go platform supports multi-tenancy to handle different types of users and organizations.

## Tenant Types

### 1. 🌍 Public Tenant (`public`)
- **Purpose**: B2C (Business-to-Consumer) users
- **Use Case**: Individual consumers who sign up directly
- **Features**: 
  - Default tenant for new signups
  - No organization badge shown in UI
  - Access to consumer features

### 2. 🏢 Organization Tenants (e.g., `monday`)
- **Purpose**: B2B (Business-to-Business) users
- **Use Case**: Employees of partner organizations
- **Features**:
  - Organization branding (logo, name)
  - Organization-specific features/pricing
  - Shows organization badge in UI

### 3. 👑 Master Tenant (`hiilo-master`)
- **Purpose**: System administrators
- **Use Case**: Hiilo admin users who manage the platform
- **Features**:
  - Full access to all tenants
  - Can create/update/delete tenants
  - Can manage user assignments
  - Access to admin APIs

## Database Structure

### Tables
- `tenants`: Stores tenant information
  - `slug` (PK): Unique identifier
  - `name`: Display name
  - `img_url`: Logo/image URL
  - `tenant_type`: 'standard' or 'master'

### User Assignment
Users are assigned to tenants via:
- `raw_app_metadata.tenant_id` in `auth.users` table
- New users automatically assigned to `public` tenant

## GraphQL API

### Queries
```graphql
# Get current user's tenants
query GetUserTenants {
  tenants {
    slug
    name
    imgUrl
    tenantType
  }
}

# Get all tenants (master only)
query GetAllTenants {
  allTenants {
    nodes {
      slug
      name
      tenantType
      userCount
    }
  }
}
```

### Mutations (Master Only)
```graphql
mutation CreateTenant($input: CreateTenantInput!) {
  createTenant(input: $input) {
    slug
    name
  }
}

mutation AssignUserToTenant($userId: ID!, $tenantSlug: ID!) {
  assignUserToTenant(userId: $userId, tenantSlug: $tenantSlug) {
    success
  }
}
```

## UI Behavior

### Dashboard Display
- **Public users**: No tenant badge shown
- **Organization users**: Shows organization name with 🏢 icon
- **Master admins**: Can see all tenants in admin views

### Access Control
- Regular users see only their tenant's data
- Master admins see all data across tenants
- Tenant isolation enforced at database and API levels

## Implementation Details

### Auto-Assignment
New users are automatically assigned to the `public` tenant via database trigger.

### Tenant Detection
```typescript
// Check user's tenant type
const tenantType = user.app_metadata?.tenant_id;
const isPublicUser = tenantType === 'public';
const isMasterAdmin = tenantType === 'hiilo-master';
const isOrgUser = !isPublicUser && !isMasterAdmin;
```

### Security
- Row Level Security (RLS) policies enforce tenant isolation
- Master tenant access validated at multiple layers
- API-level checks for admin operations

## Adding New Tenants

To add a new organization tenant:

1. Create tenant in database:
```sql
INSERT INTO public.tenants (slug, name, img_url)
VALUES ('company-slug', 'Company Name', 'https://company.com/logo.png');
```

2. Assign users to tenant:
```sql
UPDATE auth.users 
SET raw_app_metadata = jsonb_set(
  COALESCE(raw_app_metadata, '{}')::jsonb,
  '{tenant_id}',
  '"company-slug"'
)
WHERE email LIKE '%@company.com';
```

## Future Enhancements
- [ ] Tenant-specific features/modules
- [ ] Tenant-based pricing tiers
- [ ] Custom branding per tenant
- [ ] Tenant usage analytics
- [ ] Self-service tenant management portal