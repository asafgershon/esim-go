# Infrastructure Scripts

This directory contains utility scripts for managing the eSIM Go infrastructure.

## Directory Structure

```
scripts/
├── oauth/      # OAuth and authentication scripts
├── railway/    # Railway deployment scripts
└── aws/        # AWS infrastructure scripts
```

## OAuth Scripts (`oauth/`)

### `import-supabase.sh`
Import existing Supabase project settings into Terraform state.

**Usage:**
```bash
export TF_VAR_supabase_access_token="your-token"
./import-supabase.sh
```

### `import_google_oauth.sh`
Import existing Google OAuth configurations and IAP brands.

**Usage:**
```bash
./import_google_oauth.sh
```

### `manage-oauth-clients.sh`
Manage Google OAuth 2.0 client configurations.

**Features:**
- List existing OAuth clients
- Create new OAuth clients
- Update client configurations
- Export client credentials

**Usage:**
```bash
./manage-oauth-clients.sh [list|create|update|export]
```

### `oauth-setup.sh`
Complete OAuth setup wizard for configuring all authentication providers.

**Usage:**
```bash
./oauth-setup.sh
```

## Railway Scripts (`railway/`)

### `get_railway_token.sh`
Extract Railway API token from CLI configuration.

**Usage:**
```bash
./get_railway_token.sh
```

**Output:** Railway token to stdout, suitable for use in Terraform variables.

### `import_railway.sh`
Import existing Railway resources into Terraform state.

**Usage:**
```bash
./import_railway.sh [environment]
```

**Parameters:**
- `environment`: Target environment (development/production)

### `update-railway-vars.sh`
Batch update Railway environment variables from configuration files.

**Usage:**
```bash
./update-railway-vars.sh [service] [env-file]
```

## AWS Scripts (`aws/`)

### `migrate-hiilo-resources.sh`
Migrate existing AWS resources to the Hiilo organization account.

**Features:**
- S3 bucket migration
- IAM role replication
- Secrets Manager transfer
- DynamoDB table migration

**Usage:**
```bash
./migrate-hiilo-resources.sh
```

## Common Patterns

### Script Execution from Terraform Directory

When working in the Terraform environment directories, reference scripts relative to the infra root:

```bash
# From infra/environments/hiilo-production/
../../scripts/oauth/import-supabase.sh
```

### Environment Variables

Most scripts respect standard environment variables:
- `TF_VAR_*` - Terraform variables
- `AWS_PROFILE` - AWS credential profile
- `RAILWAY_TOKEN` - Railway API token

### Error Handling

All scripts include:
- Input validation
- Error messages with recovery instructions
- Non-zero exit codes on failure
- Idempotent operations where possible

## Security Notes

1. **Never commit credentials** - Scripts should read from environment variables
2. **Use secure storage** - Credentials should be in AWS Secrets Manager or similar
3. **Audit logs** - Critical operations are logged for audit purposes
4. **Minimal permissions** - Scripts request only required permissions

## Contributing

When adding new scripts:
1. Place in appropriate subdirectory
2. Include help text and usage examples
3. Add error handling and validation
4. Update this README
5. Make executable: `chmod +x script-name.sh`