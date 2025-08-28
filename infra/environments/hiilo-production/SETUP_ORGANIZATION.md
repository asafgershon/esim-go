# Setting Up Google Cloud Organization with Cloud Identity

## Current Status
- ✅ Cloud Identity account created: yarinsasson@hiiloworld.com
- ✅ Domain: hiiloworld.com
- ✅ Project access granted to Cloud Identity account
- ⏳ Organization needs to be activated

## Steps to Complete Organization Setup

### 1. Verify Domain Ownership (if not done)
Go to: https://admin.google.com/
- Sign in with yarinsasson@hiiloworld.com
- Navigate to Account > Domains
- Verify hiiloworld.com ownership if needed

### 2. Activate Google Cloud Organization
1. Go to: https://console.cloud.google.com/
2. Sign in with yarinsasson@hiiloworld.com
3. Click on the project selector (top bar)
4. Click "CREATE ORGANIZATION" if available
5. Or go to: https://console.cloud.google.com/cloud-resource-manager

### 3. Find Your Organization ID
Once created, run:
```bash
gcloud organizations list
```

Or find it in the Console:
- Go to: https://console.cloud.google.com/iam-admin/settings
- Organization ID will be displayed

### 4. Migrate Project to Organization
Once you have the org ID (format: organizations/123456789):
```bash
# Switch to account with project owner permissions
gcloud config set account yarinsasson2@gmail.com

# Move project to organization
gcloud projects move esim-go-465108 \
  --organization=ORGANIZATION_ID
```

### 5. Update Terraform Configuration
After migration, we can:
- Create IAP brands programmatically
- Manage OAuth clients via Terraform
- Set organization-level policies

## Troubleshooting

### Organization Not Appearing?
1. Check Cloud Identity Admin: https://admin.google.com/
2. Ensure domain verification is complete
3. Wait 10-15 minutes for propagation
4. Try signing out and back in

### Need to Accept Terms?
Go to: https://console.cloud.google.com/welcome
Sign in with yarinsasson@hiiloworld.com and accept Cloud terms

### Alternative Manual Setup
If organization setup is complex, you can continue with manual OAuth client creation:
1. The current Terraform config documents all needed OAuth clients
2. Create them manually in: https://console.cloud.google.com/apis/credentials
3. Store credentials in your app's environment variables