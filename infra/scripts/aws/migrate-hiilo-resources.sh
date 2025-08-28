#!/bin/bash

# Migration script for Hiilo resources to new AWS account
# Account IDs
SOURCE_ACCOUNT="052299608953"
TARGET_ACCOUNT="167524898689"
SOURCE_BUCKET="hiilo-esim-resources"
TARGET_BUCKET="hiilo-esim-resources"

echo "=== Hiilo Resources Migration Plan ==="
echo ""
echo "Source Account: $SOURCE_ACCOUNT (yarinsasson)"
echo "Target Account: $TARGET_ACCOUNT (Hiilo Production)"
echo ""

# Step 1: List current resources
echo "Step 1: Current resources in source account"
echo "--------------------------------------------"
echo "S3 Bucket: hiilo-esim-resources"
aws s3 ls s3://$SOURCE_BUCKET --summarize --human-readable --recursive | head -20

# Step 2: Create bucket in new account
echo ""
echo "Step 2: To migrate S3 bucket"
echo "-----------------------------"
echo "You'll need to:"
echo "1. Create access keys for hiilo-admin user"
echo "2. Configure AWS CLI with new profile for Hiilo account"
echo "3. Create new S3 bucket in Hiilo account"
echo "4. Copy data from old bucket to new bucket"
echo "5. Update your application configurations"

# Commands to run after setting up credentials:
cat << 'EOF'

# Configure new profile (run this after creating access keys)
aws configure --profile hiilo-production

# Create bucket in new account
aws s3 mb s3://hiilo-esim-resources --region us-east-1 --profile hiilo-production

# Copy data between accounts (add --dryrun first to test)
aws s3 sync s3://hiilo-esim-resources s3://hiilo-esim-resources --profile hiilo-production

# Verify migration
aws s3 ls s3://hiilo-esim-resources --profile hiilo-production --summarize --human-readable

# After verification, delete old bucket
# aws s3 rb s3://hiilo-esim-resources --force

EOF

echo ""
echo "Step 3: Update application configuration"
echo "-----------------------------------------"
echo "Update your .env files and deployment configs to use the new account credentials"