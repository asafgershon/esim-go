#!/bin/bash

echo "=== Testing Checkout Flow with Payment Intent ==="

# Step 1: Create a checkout session
echo -e "\n1. Creating checkout session..."
RESPONSE=$(curl -s -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) { createCheckoutSession(input: $input) { success session { id token steps paymentUrl paymentIntentId } error } }",
    "variables": {
      "input": {
        "countryId": "US",
        "numOfDays": 7
      }
    }
  }')

TOKEN=$(echo $RESPONSE | jq -r '.data.createCheckoutSession.session.token')
SESSION_ID=$(echo $RESPONSE | jq -r '.data.createCheckoutSession.session.id')

echo "Session created: $SESSION_ID"
echo "Token: $TOKEN"
echo "Initial payment URL: $(echo $RESPONSE | jq -r '.data.createCheckoutSession.session.paymentUrl')"

# Step 2: Authenticate the session
echo -e "\n2. Authenticating session..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation UpdateCheckoutStep($input: UpdateCheckoutStepInput!) { updateCheckoutStep(input: $input) { success session { id steps paymentUrl paymentIntentId } nextStep error } }",
    "variables": {
      "input": {
        "token": "'$TOKEN'",
        "stepType": "AUTHENTICATION",
        "data": {
          "userId": "b623f8cd-6bdc-4c52-aabf-fd312686e837"
        }
      }
    }
  }')

echo "Authentication response:"
echo $AUTH_RESPONSE | jq '.'

PAYMENT_URL=$(echo $AUTH_RESPONSE | jq -r '.data.updateCheckoutStep.session.paymentUrl')
PAYMENT_INTENT_ID=$(echo $AUTH_RESPONSE | jq -r '.data.updateCheckoutStep.session.paymentIntentId')

echo -e "\nPayment URL after auth: $PAYMENT_URL"
echo "Payment Intent ID: $PAYMENT_INTENT_ID"

# Step 3: Get session to test auto-renewal
echo -e "\n3. Getting session (should auto-renew if needed)..."
GET_RESPONSE=$(curl -s -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCheckoutSession($token: String!) { getCheckoutSession(token: $token) { success session { id steps paymentUrl paymentIntentId } error } }",
    "variables": {
      "token": "'$TOKEN'"
    }
  }')

echo "Get session response:"
echo $GET_RESPONSE | jq '.'

RENEWED_URL=$(echo $GET_RESPONSE | jq -r '.data.getCheckoutSession.session.paymentUrl')
RENEWED_INTENT=$(echo $GET_RESPONSE | jq -r '.data.getCheckoutSession.session.paymentIntentId')

echo -e "\nPayment URL from get: $RENEWED_URL"
echo "Payment Intent ID from get: $RENEWED_INTENT"

# Summary
echo -e "\n=== SUMMARY ==="
echo "Session ID: $SESSION_ID"
echo "Payment URL available: $([ "$RENEWED_URL" != "null" ] && echo "YES ✓" || echo "NO ✗")"
echo "Payment Intent ID available: $([ "$RENEWED_INTENT" != "null" ] && echo "YES ✓" || echo "NO ✗")"