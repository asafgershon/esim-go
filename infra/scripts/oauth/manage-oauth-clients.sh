#!/bin/bash

# Script to manage Google OAuth 2.0 clients
# Since Terraform doesn't fully support OAuth client management,
# this script provides gcloud commands to create them

PROJECT_ID="esim-go-465108"
PROJECT_NUMBER="971026346752"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Google OAuth Client Management Script${NC}"
echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo ""

# Function to create web OAuth client
create_web_oauth_client() {
    local NAME=$1
    local REDIRECT_URIS=$2
    
    echo -e "${YELLOW}Creating Web OAuth Client: $NAME${NC}"
    
    # Note: OAuth 2.0 clients need to be created via Console or API
    echo "To create a web OAuth client, use the Google Cloud Console:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "2. Click 'Create Credentials' > 'OAuth client ID'"
    echo "3. Select 'Web application'"
    echo "4. Name: $NAME"
    echo "5. Authorized redirect URIs: $REDIRECT_URIS"
    echo ""
}

# Function to create iOS OAuth client
create_ios_oauth_client() {
    local NAME=$1
    local BUNDLE_ID=$2
    
    echo -e "${YELLOW}Creating iOS OAuth Client: $NAME${NC}"
    echo "To create an iOS OAuth client:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "2. Click 'Create Credentials' > 'OAuth client ID'"
    echo "3. Select 'iOS'"
    echo "4. Name: $NAME"
    echo "5. Bundle ID: $BUNDLE_ID"
    echo ""
}

# Function to create Android OAuth client
create_android_oauth_client() {
    local NAME=$1
    local PACKAGE_NAME=$2
    local SHA1=$3
    
    echo -e "${YELLOW}Creating Android OAuth Client: $NAME${NC}"
    echo "To create an Android OAuth client:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "2. Click 'Create Credentials' > 'OAuth client ID'"
    echo "3. Select 'Android'"
    echo "4. Name: $NAME"
    echo "5. Package name: $PACKAGE_NAME"
    echo "6. SHA-1 certificate fingerprint: $SHA1"
    echo ""
}

# Check if user is authenticated
echo -e "${GREEN}Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}Not authenticated. Please run: gcloud auth login${NC}"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable iap.googleapis.com --project=$PROJECT_ID
gcloud services enable identityplatform.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID

echo ""
echo -e "${GREEN}OAuth Client Configuration Instructions:${NC}"
echo ""

# Production Clients
echo -e "${GREEN}=== PRODUCTION ENVIRONMENT ===${NC}"
create_web_oauth_client "production-Hiilo-Web-App" "https://esim-go.com/auth/callback,https://app.esim-go.com/auth/callback"
create_web_oauth_client "production-Hiilo-Admin-Dashboard" "https://admin.esim-go.com/auth/callback"
create_ios_oauth_client "production-Hiilo-iOS" "com.hiilo.esimgo"

# Development Clients
echo -e "${GREEN}=== DEVELOPMENT ENVIRONMENT ===${NC}"
create_web_oauth_client "dev-Hiilo-Web-App" "http://localhost:3000/auth/callback,http://localhost:3001/auth/callback,https://dev.esim-go.com/auth/callback"
create_web_oauth_client "dev-Hiilo-Admin-Dashboard" "http://localhost:3002/auth/callback,https://admin-dev.esim-go.com/auth/callback"
create_ios_oauth_client "dev-Hiilo-iOS" "com.hiilo.esimgo.dev"

echo ""
echo -e "${GREEN}After creating the OAuth clients:${NC}"
echo "1. Download the client configuration JSON files"
echo "2. Store the client IDs and secrets securely"
echo "3. Update your application configuration with the new credentials"
echo ""

# List existing OAuth clients (if any)
echo -e "${GREEN}Existing credentials in project:${NC}"
echo "View at: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"