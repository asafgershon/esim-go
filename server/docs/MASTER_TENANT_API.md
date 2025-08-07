# Master Tenant API Documentation

## Overview

The Master Tenant API provides hierarchical tenant management capabilities for the eSIM Go platform. Master tenant administrators have elevated privileges to manage all tenants, users, and tenant assignments across the entire system.

## Architecture

### Database Schema

```sql
-- Tenants table with tenant_type
tenants {
  slug: string (PK)
  name: string
  img_url: string
  tenant_type: 'standard' | 'master'
  created_at: timestamp
  updated_at: timestamp
}

-- User-Tenant relationships
user_tenants {
  id: uuid (PK)
  user_id: uuid (FK -> users)
  tenant_slug: string (FK -> tenants)
  role: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Database Functions

- `is_master_tenant_admin()` - Checks if current authenticated user is a master tenant admin
- `is_user_master_tenant_admin(user_id)` - Checks if specific user is a master tenant admin

## GraphQL Schema

### Types

```graphql
enum TenantType {
  STANDARD
  MASTER
}

type Tenant {
  slug: ID!
  name: String!
  imgUrl: String!
  tenantType: TenantType!
  createdAt: String!
  updatedAt: String!
  userCount: Int @auth(role: "ADMIN")  # Only visible to admins
}

type TenantConnection {
  nodes: [Tenant!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

input TenantFilter {
  tenantType: TenantType
  search: String
}
```

### Queries

#### `tenants`
Returns tenants accessible by the current user.
- **Regular users**: See only their assigned tenants
- **Master tenant admins**: See all tenants in the system

```graphql
query MyTenants {
  tenants {
    slug
    name
    imgUrl
    tenantType
  }
}
```

#### `allTenants` (Master Only)
Returns all tenants with filtering and pagination.

```graphql
query AllTenants($filter: TenantFilter, $pagination: PaginationInput) {
  allTenants(filter: $filter, pagination: $pagination) {
    nodes {
      slug
      name
      tenantType
      userCount
    }
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

#### `tenant` (Single Tenant)
Returns a specific tenant by slug.

```graphql
query GetTenant($slug: ID!) {
  tenant(slug: $slug) {
    slug
    name
    imgUrl
    tenantType
    userCount
    createdAt
    updatedAt
  }
}
```

### Mutations

All mutations require master tenant access.

#### `createTenant`
Creates a new tenant.

```graphql
mutation CreateTenant($input: CreateTenantInput!) {
  createTenant(input: $input) {
    slug
    name
    tenantType
  }
}

# Input
{
  "input": {
    "slug": "acme-corp",
    "name": "ACME Corporation",
    "imgUrl": "https://example.com/logo.png",
    "tenantType": "STANDARD"
  }
}
```

#### `updateTenant`
Updates an existing tenant.

```graphql
mutation UpdateTenant($slug: ID!, $input: UpdateTenantInput!) {
  updateTenant(slug: $slug, input: $input) {
    slug
    name
    tenantType
  }
}
```

#### `deleteTenant`
Deletes a tenant (cannot delete master tenant or tenants with users).

```graphql
mutation DeleteTenant($slug: ID!) {
  deleteTenant(slug: $slug) {
    success
    message
  }
}
```

#### `assignUserToTenant`
Assigns a user to a tenant with optional role.

```graphql
mutation AssignUser($userId: ID!, $tenantSlug: ID!, $role: String) {
  assignUserToTenant(userId: $userId, tenantSlug: $tenantSlug, role: $role) {
    success
    message
  }
}
```

#### `removeUserFromTenant`
Removes a user from a tenant.

```graphql
mutation RemoveUser($userId: ID!, $tenantSlug: ID!) {
  removeUserFromTenant(userId: $userId, tenantSlug: $tenantSlug) {
    success
    message
  }
}
```

## Access Control

### Authorization Levels

1. **Public Access**: No tenant operations available
2. **Authenticated Users**: Can view their assigned tenants
3. **Master Tenant Admins**: Full access to all tenant operations

### Security Features

- Master tenant cannot be deleted (prevents system lockout)
- Tenants with assigned users cannot be deleted
- All operations are logged for audit purposes
- Database-level RLS policies enforce access control

## Performance Optimizations

### DataLoader Integration
- Batch loading of tenants reduces database queries
- 5-minute cache for tenant data
- Automatic cache invalidation on mutations

### Query Optimization
- Single JOIN query for user-tenant relationships
- Batch fetching of user counts
- Pagination support for large datasets

### Caching Strategy
- In-memory caching via DataLoader
- Per-request context caching of master status
- Automatic cache clearing on mutations

## Error Handling

### Error Codes
- `UNAUTHENTICATED`: User not logged in
- `FORBIDDEN`: Insufficient permissions (not master tenant)
- `NOT_FOUND`: Tenant doesn't exist
- `CONFLICT`: Operation conflicts (e.g., deleting tenant with users)
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### Example Error Response
```json
{
  "errors": [{
    "message": "Master tenant access required",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }]
}
```

## Usage Examples

### Check if User is Master Admin
```typescript
const isMaster = await repository.isUserMasterTenantAdmin(userId);
```

### Get All Tenants (Master Admin)
```typescript
const result = await repository.getAllTenantsForMaster({
  filter: { tenantType: 'standard' },
  pagination: { limit: 50, offset: 0 }
});
```

### Create New Tenant
```typescript
const tenant = await repository.createTenant({
  slug: 'new-tenant',
  name: 'New Tenant',
  imgUrl: 'https://example.com/logo.png',
  tenantType: 'standard'
});
```

## Migration Guide

### Database Migration
1. Run migration to add `tenant_type` column
2. Run migration to create database functions
3. Update existing tenants to 'standard' type
4. Create initial master tenant

### Code Updates
1. Update GraphQL schema
2. Update TypeScript types
3. Update repository with new methods
4. Update resolvers with access control

## Testing

### Unit Tests
```typescript
describe('Master Tenant Access', () => {
  it('should allow master admin to view all tenants', async () => {
    // Test implementation
  });
  
  it('should restrict regular users to their tenants', async () => {
    // Test implementation
  });
  
  it('should prevent deletion of master tenant', async () => {
    // Test implementation
  });
});
```

### Integration Tests
- Test database functions
- Test GraphQL queries/mutations
- Test access control enforcement
- Test caching behavior

## Monitoring

### Key Metrics
- Master tenant operation count
- Average query response time
- Cache hit ratio
- Failed authorization attempts

### Logging
All master tenant operations are logged with:
- User ID
- Operation type
- Target tenant
- Timestamp
- Result (success/failure)

## Future Enhancements

1. **Audit Trail**: Complete audit log of all tenant operations
2. **Bulk Operations**: Batch tenant creation/updates
3. **Tenant Templates**: Predefined tenant configurations
4. **Subscription Support**: Real-time tenant updates via GraphQL subscriptions
5. **Redis Caching**: Cross-instance cache sharing
6. **Tenant Limits**: Resource quotas per tenant
7. **Tenant Analytics**: Usage statistics and reporting