# eSIM Go Infrastructure

This directory contains the Terraform configuration for managing the eSIM Go platform infrastructure across AWS and Railway.

## Overview

The infrastructure includes:
- **AWS Resources**: Organizations, SES (Simple Email Service), DynamoDB, IAM
- **Railway Resources**: Project, services (API, Redis, Web Apps), environment variables
- **Multi-environment support**: Development and Production configurations

## Prerequisites

### Required Tools
- [Terraform](https://www.terraform.io/downloads) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Railway CLI](https://docs.railway.app/develop/cli) authenticated (`railway login`)

### Required Access
- AWS account with appropriate IAM permissions
- Railway account with project access
- Access to environment secrets (stored in tfvars files)

## Initial Setup

### 1. Initialize Terraform

```bash
make init
```

Or manually:
```bash
terraform init
```

### 2. Configure Environment Variables

Copy the example tfvars file and update with your values:

```bash
cp environments/development.tfvars.example environments/development.tfvars
cp environments/production.tfvars.example environments/production.tfvars
```

Edit the files with your specific configuration:
- Supabase credentials
- AWS credentials
- Railway token
- API keys and secrets

### 3. Import Existing Resources

If you have existing resources that need to be managed by Terraform:

#### Import Railway Resources
```bash
make import-railway ENV=development
```

#### Import AWS SES Resources
```bash
make import-ses ENV=development
```

## Usage

### Planning Changes

Review planned changes before applying:

```bash
# Development environment (default)
make plan

# Production environment
make plan ENV=production

# Or use shortcuts
make dev-plan
make prod-plan
```

### Applying Changes

Apply infrastructure changes:

```bash
# Development environment
make apply

# Production environment
make apply ENV=production

# Or use shortcuts
make dev-apply
make prod-apply
```

### Destroying Infrastructure

⚠️ **Use with caution** - this will destroy resources:

```bash
# Development environment
make destroy ENV=development

# Production environment
make destroy ENV=production
```

## Environment Management

### Environment Variables Structure

Each environment has its own tfvars file in `environments/`:

```
environments/
├── development.tfvars    # Development environment configuration
└── production.tfvars     # Production environment configuration
```

### Key Configuration Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment` | Environment name | `development` or `production` |
| `aws_region` | AWS region | `us-east-1` |
| `supabase_url` | Supabase project URL | `https://xxx.supabase.co` |
| `railway_token` | Railway API token | Auto-extracted from CLI |
| `redis_password` | Redis password | Generated secure password |
| `jwt_secret` | JWT signing secret | Generated secure secret |

### Getting Railway Token

The Railway token is automatically extracted from the CLI configuration:

```bash
./get_railway_token.sh
```

This token is stored in `~/.railway/config.json` after running `railway login`.

## Resource Organization

### File Structure

```
infra/
├── Makefile                    # Simplified commands
├── README.md                   # This file
├── versions.tf                 # Provider versions
├── variables_common.tf         # Common variable definitions
├── backend.tf                  # Terraform state backend
├── aws_organization.tf         # AWS Organizations setup
├── aws_ses.tf                  # SES email service
├── railway.tf                  # Railway project configuration
├── railway_services.tf         # Railway service definitions
├── railway_variables.tf        # Railway environment variables
├── outputs.tf                  # Output values
├── environments/              
│   ├── development.tfvars     # Development environment
│   └── production.tfvars      # Production environment
└── scripts/
    ├── get_railway_token.sh   # Extract Railway token
    ├── import_railway.sh      # Import Railway resources
    └── import_ses.sh          # Import SES resources
```

### Managed Services

#### Railway Services
- **apollo-server**: GraphQL API server
- **redis**: Redis cache database
- **web-app**: Next.js customer-facing application
- **management-portal**: Admin dashboard application

#### AWS Resources
- **SES**: Email sending service with domain verification
- **DynamoDB**: Terraform state locking
- **Organizations**: Multi-account structure for billing separation
- **IAM**: Users, roles, and policies for service access

## Common Operations

### Update Environment Variables

1. Edit the appropriate service variables in `railway_variables.tf`
2. Plan the changes: `make plan ENV=<environment>`
3. Apply if changes look correct: `make apply ENV=<environment>`

### Add New Railway Service

1. Add service definition in `railway_services.tf`
2. Add environment variables in `railway_variables.tf`
3. Update outputs in `outputs.tf` if needed
4. Apply changes: `make apply ENV=<environment>`

### Update AWS Resources

1. Modify the appropriate AWS resource file
2. Plan changes to verify: `make plan ENV=<environment>`
3. Apply changes: `make apply ENV=<environment>`

## Troubleshooting

### Railway Rate Limiting

If you encounter rate limiting errors when creating multiple Railway variables:
1. Wait 30-60 seconds between applies
2. Use targeted applies for specific resources
3. Variables are created in batches automatically

### Import Conflicts

If resources already exist and Terraform tries to recreate them:
1. Import the existing resource: `terraform import <resource_type>.<name> <id>`
2. Add lifecycle rules to ignore certain changes if needed
3. Verify the imported state matches the configuration

### Variable Prompts

If Terraform prompts for variables during plan/apply:
1. Ensure you're using the Makefile commands which include `-var-file`
2. Check that all variables have defaults in `variables_common.tf`
3. Verify your tfvars file exists and contains all required values

## Security Best Practices

1. **Never commit tfvars files** - They contain sensitive credentials
2. **Use environment-specific credentials** - Don't share tokens between environments
3. **Rotate secrets regularly** - Update JWT secrets, API keys periodically
4. **Limit access** - Use IAM policies with least privilege principle
5. **Enable MFA** - For AWS root account and IAM users

## Additional Commands

### Format Terraform Files
```bash
make fmt
```

### Validate Configuration
```bash
make validate
```

### Show Current State
```bash
make show
```

### Clean Local Files
```bash
make clean
```

### Get Help
```bash
make help
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Terraform plan output carefully before applying
3. Consult the Railway and AWS documentation
4. Check the project's main documentation in `/docs`

## Important Notes

- Always review `terraform plan` output before applying changes
- Production changes should be reviewed by another team member
- Keep tfvars files secure and out of version control
- Regular backups of Terraform state are recommended
- Test infrastructure changes in development first