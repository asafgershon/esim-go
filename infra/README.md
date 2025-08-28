# Infrastructure as Code - AWS Organization Setup

This Terraform configuration manages the AWS Organization structure with separate accounts for billing clarity.

## Architecture

- **Management Account** (052299608953): Root organization account
- **Hiilo Production Account** (167524898689): Dedicated account for Hiilo eSIM resources

## Structure

```
infra/
├── *.tf                              # Management account resources
└── environments/
    └── hiilo-production/
        └── main.tf                   # Hiilo account resources
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.5.0 installed

## Setup Instructions

### Step 1: Management Account Setup

```bash
# In the infra/ directory
terraform init

# Import existing organization
terraform import aws_organizations_organization.main o-gs0qfk09ws

# Review and apply
terraform plan
terraform apply
```

This will create:
- IAM user `hiilo-admin` for managing Hiilo account
- Terraform state bucket and locking table
- Organization structure

### Step 2: Configure Hiilo Account Access

After running terraform apply, create access keys for the hiilo-admin user:

```bash
# Create access keys
aws iam create-access-key --user-name hiilo-admin

# Configure AWS CLI profile
aws configure --profile hiilo-production
# Enter the access key ID and secret from above
# Region: us-east-1
```

### Step 3: Deploy Hiilo Account Resources

```bash
# Navigate to Hiilo environment
cd environments/hiilo-production/

# Use the Hiilo profile or assume role
export AWS_PROFILE=hiilo-production
# OR
aws sts assume-role \
  --role-arn "arn:aws:iam::167524898689:role/OrganizationAccountAccessRole" \
  --role-session-name "TerraformSession"

# Initialize and apply
terraform init
terraform plan
terraform apply
```

## Resources Created

### Management Account Resources:
- **SES Configuration**:
  - 5 verified domains (hiiloworld.com, yarinsa.me, etc.)
  - 3 verified email addresses
  - Configuration set for email tracking
  - DKIM enabled for email authentication
  - WorkMail integration for incoming emails

### Railway Platform Resources:
- **Project**: Hiilo (Production environment)
- **Services**:
  - Apollo Server (GraphQL API)
  - Redis (Caching and sessions)
  - Next.js Web App (Customer portal)
  - Management Portal (Admin dashboard)
- **Custom Domains**:
  - api.hiiloworld.com
  - hiiloworld.com
  - manage.hiiloworld.com
- **Environment Variables**: 40+ configured variables

### Hiilo Account Resources:
- **S3 Buckets**: 
  - `hiilo-esim-resources`: eSIM data and resources
  - `hiilo-cdn`: Static assets and CDN content
- **IAM Roles**: Cross-account access and application roles

## Cross-Account Access

To access Hiilo account from management account:

```bash
# Configure AWS CLI profile for Hiilo account
aws configure --profile hiilo-production

# Or assume role programmatically
aws sts assume-role \
  --role-arn "arn:aws:iam::167524898689:role/OrganizationAccountAccessRole" \
  --role-session-name "HiiloSession"
```

## Next Steps

1. Create IAM access keys for `hiilo-admin` user
2. Configure application credentials to use Hiilo account
3. Migrate existing resources from management account
4. Set up CloudWatch billing alerts
5. Configure budget limits

## Railway Setup

### Prerequisites
1. Get Railway API token from [Railway Dashboard > Account Settings > Tokens](https://railway.app/account/tokens)
2. Set the token: `export RAILWAY_TOKEN=your_token_here`

### Import Railway Resources
```bash
# Copy and fill in the variables file
cp railway.tfvars.example railway.tfvars
# Edit railway.tfvars with your actual values

# Run the import script
./import_railway.sh

# Verify the import
terraform plan -var-file=railway.tfvars
```

### Managing Railway Variables
Railway environment variables are managed in `railway_variables.tf`. To update:
1. Edit the variables in the terraform file
2. Run `terraform apply -var-file=railway.tfvars`
3. Railway will automatically redeploy affected services

## Cost Tracking

With separate accounts, you can now:
- View Hiilo-specific costs in AWS Cost Explorer
- Set up account-specific budgets
- Generate detailed billing reports per account
- Track Railway usage in Railway dashboard