# Railway Infrastructure Setup

## Overview

The Railway infrastructure is partially managed through Terraform with significant limitations due to the terraform-community/railway provider capabilities.

## Current State

### What Terraform Manages ✅
- **Project Configuration**: Basic project settings
- **Environment Variables**: All service environment variables
- **Variable Updates**: Easy bulk updates through Terraform

### What Terraform CANNOT Manage ❌
- **GitHub Repository Connections**: Must be done manually
- **Build Configuration**: Root directories, build commands, etc.
- **Deployments**: Cannot trigger or manage deployments
- **Service Creation**: Services must be created manually first

## Manual Setup Required

### Services (Already Created)

The following services exist and have deployments:

| Service | ID | Repository Path | Status |
|---------|----|-----------------| -------|
| apollo-server | 4afbf8ed-9842-4b63-afe9-239a1f0ed91c | /backend/server | ✅ Deployed |
| next-web-app | 828d900a-6ec3-4353-a6fa-0a6426e44b9d | /frontend/apps/web-app | ✅ Deployed |
| managment-portal | 17fc26ce-0b65-436f-8ae8-8b6b0e941e8e | /frontend/apps/dashboard | ✅ Deployed |
| workers | 7a2e0d52-1572-4a59-a443-281f654770d4 | /backend/workers | ✅ Deployed |
| Redis | 827f0f60-b06f-44a4-80a7-f815b464e8ac | Docker Image | ✅ Deployed |

### GitHub Repository Connection

Each service needs to be connected to GitHub manually:

1. Go to Railway Dashboard → Select Service
2. Settings → Connect GitHub Repo
3. Select `yarinsa/esim-go` repository
4. Configure:
   - **Root Directory**: See table above
   - **Build Command**: (usually auto-detected)
   - **Start Command**: (usually auto-detected)

### Environment Configuration

Each service has two environments:
- **production**: Main branch deployments
- **development**: Development branch deployments

## Terraform Usage

### Managing Environment Variables

All environment variables are managed in `railway_variables.tf`:

```hcl
# Example: Adding a new variable to apollo-server
locals {
  apollo_server_vars = {
    NEW_VAR = "value"
    # ... existing vars
  }
}
```

### Applying Changes

```bash
# Development environment
make plan-dev
make apply-dev

# Production environment  
make plan-prod
make apply-prod
```

## Limitations

The Railway Terraform provider (v0.2.0) has these limitations:

1. **No GitHub Integration**: Cannot connect repositories via Terraform
2. **No Build Configuration**: Cannot set build/start commands
3. **No Deployment Management**: Cannot trigger deployments
4. **Limited Service Management**: Cannot fully configure services

## Workaround Strategy

1. **Manual Service Creation**: Create services through Railway dashboard
2. **Terraform for Variables**: Use Terraform only for environment variables
3. **GitHub Actions for Deployments**: Rely on Railway's GitHub integration for auto-deployments

## Important Notes

- **DO NOT** create services through Terraform - they won't have deployments
- **DO NOT** delete services through Terraform - use Railway dashboard
- **DO** use Terraform for all environment variable management
- **DO** keep service IDs documented in this file

## Troubleshooting

### Duplicate Services
If you see duplicate services (some with deployments, some without):
1. The ones without deployments were created by Terraform
2. Delete them manually in Railway dashboard
3. Use only the services with active deployments

### Missing Deployments
If a service has no deployments:
1. It was likely created by Terraform
2. Delete it and recreate manually in Railway dashboard
3. Connect GitHub repository and configure build settings

### Variable Updates Not Reflecting
After updating variables through Terraform:
1. Variables are updated immediately
2. You may need to redeploy the service to pick up changes
3. Use Railway dashboard to trigger a redeploy if needed