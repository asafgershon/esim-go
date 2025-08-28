#!/bin/bash

# Script to extract Railway token from CLI configuration
# This token is already stored from your Railway CLI login

CONFIG_FILE="$HOME/.railway/config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Railway config not found at $CONFIG_FILE"
    echo "Please run 'railway login' first"
    exit 1
fi

# Extract token from config
TOKEN=$(cat "$CONFIG_FILE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('user', {}).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "Error: No token found in Railway config"
    echo "Please run 'railway login' to authenticate"
    exit 1
fi

# Export for Terraform use
echo "Railway token found!"
echo ""
echo "To use with Terraform, run:"
echo "export RAILWAY_TOKEN=\"$TOKEN\""
echo ""
echo "Or add to your shell profile:"
echo "echo 'export RAILWAY_TOKEN=\"$TOKEN\"' >> ~/.zshrc"