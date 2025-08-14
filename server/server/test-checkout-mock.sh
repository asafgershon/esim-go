#!/bin/bash

echo "=== Testing Checkout Flow with Mock Payment ==="

# Step 1: Create a checkout session with a mock user that already exists
echo -e "\n1. Creating checkout session..."
RESPONSE=$(curl -s -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -H "X-User-Id: mock-user-123" \
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
echo "Steps:"
echo $RESPONSE | jq '.data.createCheckoutSession.session.steps'

# Step 2: Just get the session to trigger auto-renewal
echo -e "\n2. Getting session (should trigger payment intent creation if authenticated)..."
GET_RESPONSE=$(curl -s -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCheckoutSession($token: String!) { getCheckoutSession(token: $token) { success session { id steps paymentUrl paymentIntentId metadata } error } }",
    "variables": {
      "token": "'$TOKEN'"
    }
  }')

echo "Session retrieved:"
echo $GET_RESPONSE | jq '.data.getCheckoutSession.session'

# Summary
echo -e "\n=== CHECKING STEPS STATUS ==="
STEPS=$(echo $GET_RESPONSE | jq -r '.data.getCheckoutSession.session.steps')
echo "Steps object: $STEPS"

if [ "$STEPS" != "null" ]; then
  echo "✓ Steps object exists"
  AUTH_COMPLETED=$(echo $STEPS | jq -r '.authentication.completed')
  DELIVERY_COMPLETED=$(echo $STEPS | jq -r '.delivery.completed')
  PAYMENT_READY=$(echo $STEPS | jq -r '.payment.readyForPayment')
  
  echo "Authentication completed: $AUTH_COMPLETED"
  echo "Delivery completed: $DELIVERY_COMPLETED"
  echo "Payment ready: $PAYMENT_READY"
else
  echo "✗ Steps object is null - this is the problem!"
fi