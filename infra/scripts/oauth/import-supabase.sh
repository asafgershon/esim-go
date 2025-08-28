#!/bin/bash

# Import script for Supabase resources
# This script helps import existing Supabase project settings into Terraform

echo "========================================="
echo "Supabase Resource Import Script"
echo "========================================="
echo ""

# Check if access token is set
if [ -z "$TF_VAR_supabase_access_token" ]; then
  echo "❌ Error: TF_VAR_supabase_access_token is not set"
  echo ""
  echo "To get your access token:"
  echo "1. Go to: https://supabase.com/dashboard/account/tokens"
  echo "2. Create a new access token"
  echo "3. Export it: export TF_VAR_supabase_access_token='your-token'"
  echo ""
  exit 1
fi

# Project reference
PROJECT_REF="dgkyjkzkwzmjjurzvcxy"

echo "✅ Access token found"
echo "📦 Project: $PROJECT_REF (esim-go)"
echo ""

# Import the project settings
echo "Importing Supabase project settings..."
terraform import supabase_settings.esim_go $PROJECT_REF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully imported Supabase settings!"
  echo ""
  echo "Next steps:"
  echo "1. Review the imported state: terraform state show supabase_settings.esim_go"
  echo "2. Update supabase.tf to match the imported configuration"
  echo "3. Run: terraform plan"
  echo "4. Apply changes: terraform apply"
else
  echo ""
  echo "❌ Import failed. Please check your access token and project reference."
fi