#!/bin/bash

# Import script for existing Google OAuth clients
# Run this from the hiilo-production environment directory

PROJECT_ID="hiilo-production-971026346752"
PROJECT_NUMBER="971026346752"

echo "Importing existing Google OAuth resources..."

# First, initialize Terraform
terraform init

# Import the Google project itself (if you want to manage it)
# terraform import google_project.hiilo projects/${PROJECT_NUMBER}

# List existing OAuth 2.0 client IDs (you'll need to run this with gcloud CLI)
echo "Listing existing OAuth 2.0 clients..."
echo "Run this command to see existing clients:"
echo "gcloud auth application-default login"
echo "gcloud config set project ${PROJECT_NUMBER}"
echo "gcloud alpha iap oauth-clients list --project=${PROJECT_NUMBER}"

# Example import commands (replace CLIENT_ID with actual values):
# For IAP clients:
# terraform import module.google_oauth_production.google_iap_client.web_clients[\"web_app\"] "projects/${PROJECT_NUMBER}/brands/BRAND_ID/identityAwareProxyClients/CLIENT_ID"

# For Identity Platform OAuth clients:
# terraform import module.google_oauth_production.google_identity_platform_oauth_client.ios[\"ios_app\"] "projects/${PROJECT_NUMBER}/oauthClients/CLIENT_ID"

echo ""
echo "To import existing clients:"
echo "1. List your existing OAuth clients using gcloud commands above"
echo "2. Update the terraform configuration to match existing client settings"
echo "3. Run the appropriate import commands for each client"
echo ""
echo "Example:"
echo "terraform import 'module.google_oauth_production.google_iap_client.web_clients[\"web_app\"]' \"projects/${PROJECT_NUMBER}/brands/BRAND_ID/identityAwareProxyClients/CLIENT_ID\""