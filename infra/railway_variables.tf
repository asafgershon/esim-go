# Railway Environment Variables
# SECURITY NOTE: Store sensitive values in terraform.tfvars or use environment variables

locals {
  # Common environment variables used across services
  common_env_vars = {
    NODE_ENV                = var.node_env
    LOG_LEVEL              = "info"
    RAILWAY_ENVIRONMENT    = "production"
  }
  
  # Apollo Server specific variables
  apollo_server_vars = {
    PORT                    = "5001"
    CORS_ORIGINS           = "https://manage.hiiloworld.com,https://hiiloworld.com"
    DASHBOARD_URL          = "https://manage.hiiilo.yarinsa.me/"
    
    # Database
    SUPABASE_URL           = var.supabase_url
    SUPABASE_ANON_KEY      = var.supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    
    # Redis
    REDIS_HOST             = "redis.railway.internal"
    REDIS_PORT             = "6379"
    REDIS_PASSWORD         = var.redis_password
    REDIS_URL              = "redis://default:${var.redis_password}@redis.railway.internal:6379"
    
    # eSIM Go API
    ESIM_GO_API_KEY        = var.esim_go_api_key
    ESIM_GO_BASE_URL       = "https://api.esim-go.com"
    ESIM_GO_MODE           = var.esim_go_mode
    ESIM_GO_WEBHOOK_SECRET = var.esim_go_webhook_secret
    
    # Authentication
    JWT_SECRET             = var.jwt_secret
    CHECKOUT_JWT_SECRET    = var.checkout_jwt_secret
    
    # AWS Services
    AWS_ACCESS_KEY_ID      = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY  = var.aws_secret_access_key
    AWS_REGION             = "il-central-1"
    AWS_SMS_TYPE           = "Transactional"
    AWS_SNS_SENDER_ID      = "ESIM"
    
    # CDN URL
    CDN_URL                = var.environment == "production" ? "https://${aws_cloudfront_distribution.hiilo_cdn_prod.domain_name}" : "https://${aws_cloudfront_distribution.hiilo_cdn_dev.domain_name}"
  }
}

# Apollo Server Environment Variables
resource "railway_variable" "apollo_server" {
  for_each = merge(local.common_env_vars, local.apollo_server_vars)
  
  name           = each.key
  value          = each.value
  environment_id = local.production_environment_id
  service_id     = railway_service.apollo_server.id
}

# Redis Environment Variables
resource "railway_variable" "redis" {
  for_each = {
    REDIS_PASSWORD = var.redis_password
  }
  
  name           = each.key
  value          = each.value
  environment_id = local.production_environment_id
  service_id     = railway_service.redis.id
}

# Next.js Web App Environment Variables
resource "railway_variable" "next_web_app" {
  for_each = {
    NODE_ENV                  = var.node_env
    NEXT_PUBLIC_API_URL       = "https://api.hiiloworld.com"
    NEXT_PUBLIC_SUPABASE_URL  = var.supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY = var.supabase_anon_key
  }
  
  name           = each.key
  value          = each.value
  environment_id = local.production_environment_id
  service_id     = railway_service.next_web_app.id
}

# Management Portal Environment Variables
resource "railway_variable" "management_portal" {
  for_each = {
    NODE_ENV                  = var.node_env
    NEXT_PUBLIC_API_URL       = "https://api.hiiloworld.com"
    NEXT_PUBLIC_SUPABASE_URL  = var.supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY = var.supabase_anon_key
  }
  
  name           = each.key
  value          = each.value
  environment_id = local.production_environment_id
  service_id     = railway_service.management_portal.id
}

# Note: Variable definitions are in variables_common.tf to avoid duplication
# This file only contains the Railway-specific resource configurations