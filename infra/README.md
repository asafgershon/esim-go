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

## Cost Tracking

With separate accounts, you can now:
- View Hiilo-specific costs in AWS Cost Explorer
- Set up account-specific budgets
- Generate detailed billing reports per account