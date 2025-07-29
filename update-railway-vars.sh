#!/bin/bash

# Update Railway Environment Variables Script
# This script updates environment variables for all services in both development and production

echo "🚂 Updating Railway environment variables..."

# Dashboard (manage) - Development
echo "📊 Updating Dashboard Development variables..."
cd client/apps/dashboard
railway variables --set "VITE_ALLOWED_HOSTS=manage.hiiilo.yarinsa.me" --set "VITE_GRAPHQL_URL=https://api.hiiilo.yarinsa.me/graphql" --environment development --service managment-portal

# Dashboard (manage) - Production  
echo "📊 Updating Dashboard Production variables..."
railway variables --set "VITE_ALLOWED_HOSTS=manage.hiiloworld.com" --set "VITE_GRAPHQL_URL=https://api.hiiloworld.com/graphql" --environment production --service managment-portal

cd ../../..

# Server (api) - Development
echo "🔧 Updating Server Development variables..."
cd server/server
railway variables --set "CORS_ORIGINS=https://app.hiiilo.yarinsa.me,https://manage.hiiilo.yarinsa.me" --environment development --service apollo-server

# Server (api) - Production
echo "🔧 Updating Server Production variables..."
railway variables --set "CORS_ORIGINS=https://app.hiiloworld.com,https://manage.hiiloworld.com" --environment production --service apollo-server

cd ../..

# Web App (app) - Development
echo "🌐 Updating Web App Development variables..."
cd client/apps/web-app
railway variables --set "NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.hiiilo.yarinsa.me/graphql" --set "NEXT_PUBLIC_APPLE_REDIRECT_URI=https://app.hiiilo.yarinsa.me" --environment development --service next-web-app

# Web App (app) - Production
echo "🌐 Updating Web App Production variables..."
railway variables --set "NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.hiiloworld.com/graphql" --set "NEXT_PUBLIC_APPLE_REDIRECT_URI=https://app.hiiloworld.com" --environment production --service next-web-app

cd ../../..

echo "✅ Railway environment variables updated successfully!"
echo ""
echo "Note: You may need to:"
echo "1. First run 'railway link' in each project directory to connect to the correct service"
echo "2. Service names used: managment-portal, apollo-server, next-web-app"
echo "3. Redeploy services for changes to take effect"