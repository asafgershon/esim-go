# Railway Environment Variables Update Commands

Run these commands after linking to your Railway project in each directory:

## 1. Dashboard (manage.hiiilo.yarinsa.me / manage.hiiloworld.com)

```bash
cd client/apps/dashboard
railway link  # Select esim-go project and managment-portal service

# Development environment
railway variables --set "VITE_ALLOWED_HOSTS=manage.hiiilo.yarinsa.me" --set "VITE_GRAPHQL_URL=https://api.hiiilo.yarinsa.me/graphql" --environment development

# Production environment
railway variables --set "VITE_ALLOWED_HOSTS=manage.hiiloworld.com" --set "VITE_GRAPHQL_URL=https://api.hiiloworld.com/graphql" --environment production
```

## 2. Server (api.hiiilo.yarinsa.me / api.hiiloworld.com)

```bash
cd server/server
railway link  # Select esim-go project and apollo-server service

# Development environment
railway variables --set "CORS_ORIGINS=https://app.hiiilo.yarinsa.me,https://manage.hiiilo.yarinsa.me" --environment development

# Production environment
railway variables --set "CORS_ORIGINS=https://app.hiiloworld.com,https://manage.hiiloworld.com" --environment production
```

## 3. Web App (app.hiiilo.yarinsa.me / app.hiiloworld.com)

```bash
cd client/apps/web-app
railway link  # Select esim-go project and next-web-app service

# Development environment
railway variables --set "NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.hiiilo.yarinsa.me/graphql" --set "NEXT_PUBLIC_APPLE_REDIRECT_URI=https://app.hiiilo.yarinsa.me" --environment development

# Production environment
railway variables --set "NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.hiiloworld.com/graphql" --set "NEXT_PUBLIC_APPLE_REDIRECT_URI=https://app.hiiloworld.com" --environment production
```

## Notes:
- Run `railway link` first in each directory to connect to the correct service
- Service names: **managment-portal**, **apollo-server**, **next-web-app**
- After updating variables, redeploy each service for changes to take effect
- You can verify variables were set with: `railway variables --environment development`