# Google OAuth Setup with Terraform

## Overview
This configuration manages Google OAuth clients for both development and production environments within a single GCP project (971026346752).

## Structure
- **Production clients**: Named with `production-` prefix
- **Development clients**: Named with `dev-` prefix
- Both environments share the same GCP project and IAP brand

## Initial Setup

### 1. Authenticate with Google Cloud
```bash
gcloud auth application-default login
gcloud config set project 971026346752
```

### 2. Check existing OAuth clients
```bash
# List existing OAuth 2.0 clients
gcloud alpha iap oauth-clients list --project=971026346752

# List existing brands
gcloud alpha iap brands list --project=971026346752
```

### 3. Import existing resources (if any)

If you have existing OAuth clients, import them:

```bash
# Navigate to the environment directory
cd infra/environments/hiilo-production/

# Initialize Terraform
terraform init

# Import existing brand (if exists)
terraform import 'module.google_oauth_production.data.google_iap_brand.existing[0]' "projects/971026346752/brands/BRAND_ID"

# Import existing OAuth clients
# For web clients:
terraform import 'module.google_oauth_production.google_iap_client.web_clients["web_app"]' \
  "projects/971026346752/brands/BRAND_ID/identityAwareProxyClients/CLIENT_ID"

# For iOS/Android clients:
terraform import 'module.google_oauth_production.google_identity_platform_oauth_client.ios["ios_app"]' \
  "projects/971026346752/oauthClients/CLIENT_ID"
```

### 4. Apply configuration
```bash
terraform plan
terraform apply
```

## Environment Variables

After applying, retrieve OAuth credentials:

```bash
# Production credentials
aws secretsmanager get-secret-value --secret-id hiilo/google-oauth/production

# Development credentials
aws secretsmanager get-secret-value --secret-id hiilo/google-oauth/development
```

## Adding New OAuth Clients

Edit `google-oauth.tf` and add to the `oauth_clients` map:

```hcl
new_client = {
  display_name    = "New Client Name"
  client_type     = "web"  # or "ios", "android"
  authorized_uris = ["https://example.com"]
  redirect_uris   = ["https://example.com/auth/callback"]
  bundle_id       = "com.example.app"  # For iOS only
  package_name    = "com.example.app"  # For Android only
}
```

## Security Notes

- OAuth client secrets are stored in AWS Secrets Manager
- Never commit client secrets to version control
- Use the appropriate environment-specific credentials
- Rotate secrets periodically

## Troubleshooting

### "Brand already exists" error
Set `create_brand = false` in the module configuration

### "Permission denied" error
Ensure you have the following IAM roles:
- `roles/iap.admin`
- `roles/identityplatform.admin`
- `roles/iam.serviceAccountAdmin`

### Import state mismatch
If Terraform state doesn't match reality, refresh state:
```bash
terraform refresh
```