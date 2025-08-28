# Complete OAuth Setup Guide for eSIM Go Platform

## Table of Contents
1. [Overview](#overview)
2. [Current Infrastructure Status](#current-infrastructure-status)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Apple Sign In Setup](#apple-sign-in-setup)
5. [Service Accounts](#service-accounts)
6. [Environment Variables](#environment-variables)
7. [Terraform Management](#terraform-management)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide consolidates all OAuth authentication setup for the eSIM Go platform, including Google OAuth 2.0, Apple Sign In, and service accounts for backend authentication.

### Project Information
- **GCP Project ID**: `esim-go-465108`
- **GCP Project Number**: `971026346752`
- **Organization**: `hiiloworld.com` (ID: `751064751797`)
- **AWS Account**: `052299608953`

### Authentication Methods Supported
- Google OAuth 2.0 (Web, iOS, Admin)
- Apple Sign In (iOS, Web)
- Service Account Authentication (Backend)

---

## Current Infrastructure Status

### ✅ Successfully Deployed via Terraform

1. **Google Cloud Resources**
   - APIs Enabled: IAP, IAM, Resource Manager, Identity Toolkit, Secret Manager
   - Service Accounts: `esim-go-backend-prod`, `esim-go-backend-dev`
   - IAM Roles: Identity Toolkit Admin for service accounts

2. **Apple Developer Resources**
   - Bundle IDs: `com.hiiloworld.app`, `com.hiiloworld.app.dev`
   - Service IDs: `com.hiiloworld.signin`, `com.hiiloworld.signin.dev`

3. **AWS Resources**
   - S3 Buckets: `hiilo-esim-resources`, `hiilo-cdn`
   - Secrets Manager: Storing Google service account credentials
   - IAM Roles: `HiiloApplicationRole`

### ⚠️ Pending Manual Setup

1. **Google OAuth Clients** - Must be created manually in Cloud Console
2. **Apple Sign In Configuration** - Domains and return URLs in Developer Portal
3. **Project Organization Migration** - Requires owner permissions

---

## Google OAuth Setup

### Step 1: Configure OAuth Consent Screen

Go to: https://console.cloud.google.com/apis/credentials/consent?project=esim-go-465108

**Configuration:**
- **User Type**: External
- **App Name**: Hiilo eSIM Go
- **Support Email**: support@esim-go.com
- **App Logo**: Upload if available
- **Authorized Domains**: `esim-go.com`, `hiiloworld.com`
- **Developer Contact**: support@esim-go.com

### Step 2: Create OAuth 2.0 Client IDs

Go to: https://console.cloud.google.com/apis/credentials?project=esim-go-465108

Click "CREATE CREDENTIALS" → "OAuth client ID" for each:

#### Production Clients

**1. Production Web Application** (`production-esim-go-web`)
- **Type**: Web application
- **Authorized JavaScript Origins**:
  - `https://esim-go.com`
  - `https://www.esim-go.com`
  - `https://app.esim-go.com`
- **Authorized Redirect URIs**:
  - `https://esim-go.com/auth/callback`
  - `https://app.esim-go.com/auth/callback`
  - `https://esim-go.com/api/auth/callback/google`
  - `https://app.esim-go.com/api/auth/callback/google`

**2. Production Admin Dashboard** (`production-esim-go-admin`)
- **Type**: Web application
- **Authorized JavaScript Origins**:
  - `https://admin.esim-go.com`
- **Authorized Redirect URIs**:
  - `https://admin.esim-go.com/auth/callback`
  - `https://admin.esim-go.com/api/auth/callback/google`

**3. Production iOS App** (`production-esim-go-ios`)
- **Type**: iOS
- **Bundle ID**: `com.hiiloworld.app`

#### Development Clients

**4. Development Web Application** (`dev-esim-go-web`)
- **Type**: Web application
- **Authorized JavaScript Origins**:
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `https://dev.esim-go.com`
  - `https://esim-go-dev.vercel.app`
- **Authorized Redirect URIs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3001/auth/callback`
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3001/api/auth/callback/google`
  - `https://dev.esim-go.com/auth/callback`
  - `https://dev.esim-go.com/api/auth/callback/google`

**5. Development Admin Dashboard** (`dev-esim-go-admin`)
- **Type**: Web application
- **Authorized JavaScript Origins**:
  - `http://localhost:3002`
  - `https://admin-dev.esim-go.com`
- **Authorized Redirect URIs**:
  - `http://localhost:3002/auth/callback`
  - `http://localhost:3002/api/auth/callback/google`
  - `https://admin-dev.esim-go.com/auth/callback`
  - `https://admin-dev.esim-go.com/api/auth/callback/google`

**6. Development iOS App** (`dev-esim-go-ios`)
- **Type**: iOS
- **Bundle ID**: `com.hiiloworld.app.dev`

---

## Apple Sign In Setup

### Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect API Key (created in Terraform variables)

### Step 1: Verify Bundle IDs (Already Created via Terraform)

The following have been created:
- `com.hiiloworld.app` - Production App
- `com.hiiloworld.app.dev` - Development App
- `com.hiiloworld.signin` - Production Service ID
- `com.hiiloworld.signin.dev` - Development Service ID

### Step 2: Configure Service IDs

Go to: https://developer.apple.com/account/resources/identifiers/list/serviceId

#### Production Service ID (`com.hiiloworld.signin`)

1. Click on the Service ID
2. Enable "Sign in with Apple"
3. Click "Configure"
4. **Primary App ID**: `com.hiiloworld.app`
5. **Domains and Subdomains**:
   - `hiiloworld.com`
   - `www.hiiloworld.com`
   - `app.hiiloworld.com`
6. **Return URLs**:
   - `https://hiiloworld.com/auth/callback/apple`
   - `https://www.hiiloworld.com/auth/callback/apple`
   - `https://app.hiiloworld.com/auth/callback/apple`

#### Development Service ID (`com.hiiloworld.signin.dev`)

1. Click on the Service ID
2. Enable "Sign in with Apple"
3. Click "Configure"
4. **Primary App ID**: `com.hiiloworld.app.dev`
5. **Domains and Subdomains**:
   - `app.hiilo.yarinsa.me`
   - `app.hiiloworld.dev`
   - `localhost` (for local testing)
6. **Return URLs**:
   - `https://app.hiilo.yarinsa.me/auth/callback/apple`
   - `https://app.hiiloworld.dev/auth/callback/apple`
   - `http://localhost:3000/auth/callback/apple`

### Step 3: Generate Client Secret

For web implementations, you'll need to generate a client secret JWT. Use the Service ID as the client ID.

---

## Service Accounts

Service accounts are used for server-to-server authentication and have been created via Terraform.

### Created Service Accounts

1. **Production**: `esim-go-backend-prod@esim-go-465108.iam.gserviceaccount.com`
2. **Development**: `esim-go-backend-dev@esim-go-465108.iam.gserviceaccount.com`

### Retrieving Credentials

Credentials are stored in AWS Secrets Manager:

```bash
# Production credentials
aws secretsmanager get-secret-value \
  --secret-id google-sa-credentials-production \
  --query SecretString \
  --output text > prod-sa-key.json

# Development credentials
aws secretsmanager get-secret-value \
  --secret-id google-sa-credentials-development \
  --query SecretString \
  --output text > dev-sa-key.json
```

### Using Service Accounts

Service accounts can be used for:
- Firebase Admin SDK
- Google Cloud APIs
- Identity Platform operations
- Backend authentication

---

## Environment Variables

### Google OAuth Variables

```env
# Production
GOOGLE_CLIENT_ID_PROD_WEB=<from-console>
GOOGLE_CLIENT_SECRET_PROD_WEB=<from-console>
GOOGLE_CLIENT_ID_PROD_ADMIN=<from-console>
GOOGLE_CLIENT_SECRET_PROD_ADMIN=<from-console>
GOOGLE_CLIENT_ID_PROD_IOS=<from-console>

# Development
GOOGLE_CLIENT_ID_DEV_WEB=<from-console>
GOOGLE_CLIENT_SECRET_DEV_WEB=<from-console>
GOOGLE_CLIENT_ID_DEV_ADMIN=<from-console>
GOOGLE_CLIENT_SECRET_DEV_ADMIN=<from-console>
GOOGLE_CLIENT_ID_DEV_IOS=<from-console>

# Service Accounts (optional, can use key files instead)
GOOGLE_SA_KEY_PROD=<base64-encoded-key>
GOOGLE_SA_KEY_DEV=<base64-encoded-key>
```

### Apple Sign In Variables

```env
# Apple Configuration (from Terraform variables)
APPLE_ISSUER_ID=<from-app-store-connect>
APPLE_KEY_ID=<from-app-store-connect>
APPLE_PRIVATE_KEY=<from-app-store-connect>

# Client IDs (Service IDs)
APPLE_CLIENT_ID_PROD=com.hiiloworld.signin
APPLE_CLIENT_ID_DEV=com.hiiloworld.signin.dev

# Bundle IDs
APPLE_BUNDLE_ID_PROD=com.hiiloworld.app
APPLE_BUNDLE_ID_DEV=com.hiiloworld.app.dev
```

### Deployment Locations

Add these environment variables to:
- **Production Backend**: Railway
- **Production Frontend**: Vercel
- **Local Development**: `.env.local` files
- **CI/CD**: GitHub Secrets

---

## Terraform Management

### Files Overview

```
hiilo-production/
├── main.tf                      # Main AWS and Google provider config
├── variables.tf                 # Project variables
├── apple-oauth.tf              # Apple Sign In configuration
├── service-account-oauth.tf   # Google service accounts
├── oauth-clients-config.tf    # OAuth client documentation
├── google-apis.tf              # Google API enablement
└── *.sh                        # Helper scripts
```

### Common Terraform Commands

```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Get outputs
terraform output -json

# Get specific output
terraform output google_oauth_clients
terraform output service_accounts
```

### Adding New OAuth Clients

1. Update `oauth-clients-config.tf` with new client configuration
2. Run `terraform plan` to see documentation changes
3. Manually create the client in Google Cloud Console
4. Update environment variables

---

## Troubleshooting

### Common Issues and Solutions

#### "Project must belong to an organization" Error
- **Issue**: Cannot create IAP brand without organization
- **Solution**: Either migrate project to organization or use standard OAuth 2.0 clients

#### "Permission denied" Errors
- **Issue**: Insufficient permissions for operation
- **Required Roles**:
  - `roles/iap.admin` - For IAP operations
  - `roles/identityplatform.admin` - For Identity Platform
  - `roles/iam.serviceAccountAdmin` - For service accounts

#### OAuth Consent Screen Issues
- **Issue**: App verification required
- **Solution**: For production, submit app for Google verification
- **Temporary**: Keep app in testing mode with test users

#### Apple Sign In Not Working
- **Issue**: Invalid client or return URL
- **Check**:
  1. Service ID is properly configured
  2. Domains are verified
  3. Return URLs match exactly
  4. Client secret JWT is valid (expires after 6 months)

#### Service Account Authentication Fails
- **Issue**: Invalid credentials or permissions
- **Check**:
  1. Key JSON is properly formatted
  2. Service account has required roles
  3. APIs are enabled in the project

### Migration to Organization (Future)

When ready to migrate project to organization:

```bash
# As project owner
gcloud auth login <owner-email>

# Move project
gcloud alpha projects move esim-go-465108 \
  --organization=751064751797

# Then update Terraform to use IAP brands
```

---

## Quick Reference

### Important URLs
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=esim-go-465108
- **Apple Developer**: https://developer.apple.com/account/resources/identifiers/list
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent?project=esim-go-465108

### Project Details
- **GCP Project**: `esim-go-465108`
- **Organization**: `hiiloworld.com` (751064751797)
- **Support Email**: support@esim-go.com
- **Domains**: esim-go.com, hiiloworld.com

### Terraform Outputs
```bash
# View all outputs
terraform output

# Get sensitive outputs
terraform output -json apple_signin_development
terraform output -json service_accounts
```

---

## Next Steps

1. ✅ **Complete Manual OAuth Client Creation** in Google Cloud Console
2. ✅ **Configure Apple Sign In** Service IDs in Developer Portal
3. ✅ **Add Environment Variables** to all deployment environments
4. ⏳ **Migrate Project to Organization** (when owner permissions available)
5. ⏳ **Submit for OAuth Verification** (for production release)

---

*Last Updated: August 28, 2024*
*Terraform Managed Resources: Service Accounts, Apple Bundle IDs, AWS Infrastructure*
*Manual Setup Required: Google OAuth Clients, Apple Service ID Configuration*