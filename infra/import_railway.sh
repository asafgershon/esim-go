#!/bin/bash

# Import script for existing Railway resources
# Run this after setting up your Railway API token

echo "======================================"
echo "Railway Resources Import Script"
echo "======================================"
echo ""

# Check if Railway token is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "RAILWAY_TOKEN not set. Attempting to extract from Railway CLI..."
    
    # Try to get token from Railway CLI config
    if [ -f "$HOME/.railway/config.json" ]; then
        export RAILWAY_TOKEN=$(cat "$HOME/.railway/config.json" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('user', {}).get('token', ''))" 2>/dev/null)
        
        if [ -n "$RAILWAY_TOKEN" ]; then
            echo "Token extracted from Railway CLI config!"
        else
            echo "ERROR: Could not extract token from Railway config"
            echo "Please run 'railway login' or set RAILWAY_TOKEN manually"
            exit 1
        fi
    else
        echo "ERROR: Railway CLI not configured."
        echo "Please run 'railway login' first, or"
        echo "Get token from: https://railway.app/account/tokens"
        echo "Then: export RAILWAY_TOKEN=your_token_here"
        exit 1
    fi
fi

echo "Railway token detected. Starting import..."
echo ""

# Import Railway Project
echo "1. Importing Railway project 'Hiilo'..."
terraform import -var-file=railway.tfvars railway_project.hiilo cedece0b-a6c2-4ffe-8d19-460090acf032

# Import Apollo Server Service
echo "2. Importing Apollo Server service..."
terraform import -var-file=railway.tfvars railway_service.apollo_server 4afbf8ed-9842-4b63-afe9-239a1f0ed91c

# Import other services (need to get their IDs first)
echo ""
echo "3. For Redis and other services, you need to get their service IDs from Railway dashboard"
echo "   Then run:"
echo "   terraform import railway_service.redis <redis-service-id>"
echo "   terraform import railway_service.next_web_app <next-web-app-service-id>"
echo "   terraform import railway_service.management_portal <management-portal-service-id>"

# Import environment variables
echo ""
echo "4. To import existing environment variables, use the format:"
echo "   terraform import railway_variable.apollo_server[\"VAR_NAME\"] <service-id>:<environment-id>:VAR_NAME"
echo ""
echo "   Example:"
echo "   terraform import 'railway_variable.apollo_server[\"PORT\"]' 4afbf8ed-9842-4b63-afe9-239a1f0ed91c:production:PORT"

# Import custom domains
echo ""
echo "5. To import custom domains:"
echo "   terraform import railway_custom_domain.api <domain-id>"
echo "   terraform import railway_custom_domain.web <domain-id>"
echo "   terraform import railway_custom_domain.management <domain-id>"

echo ""
echo "======================================"
echo "After importing, run:"
echo "  terraform plan"
echo "to verify the import was successful."
echo "======================================"