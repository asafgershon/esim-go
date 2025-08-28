# OAuth Client Configuration
# Since the GCP project is not part of an organization, OAuth clients must be created manually
# This file documents the required OAuth client configurations

locals {
  # Production OAuth Clients
  production_oauth_clients = {
    web_app = {
      name             = "production-esim-go-web"
      type             = "Web application"
      authorized_origins = [
        "https://esim-go.com",
        "https://www.esim-go.com",
        "https://app.esim-go.com"
      ]
      redirect_uris = [
        "https://esim-go.com/auth/callback",
        "https://app.esim-go.com/auth/callback",
        "https://esim-go.com/api/auth/callback/google",
        "https://app.esim-go.com/api/auth/callback/google"
      ]
    }
    
    admin_dashboard = {
      name             = "production-esim-go-admin"
      type             = "Web application"
      authorized_origins = [
        "https://admin.esim-go.com"
      ]
      redirect_uris = [
        "https://admin.esim-go.com/auth/callback",
        "https://admin.esim-go.com/api/auth/callback/google"
      ]
    }
    
    ios_app = {
      name      = "production-esim-go-ios"
      type      = "iOS"
      bundle_id = "com.hiilo.esimgo"
    }
  }
  
  # Development OAuth Clients
  development_oauth_clients = {
    web_app = {
      name             = "dev-esim-go-web"
      type             = "Web application"
      authorized_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dev.esim-go.com",
        "https://esim-go-dev.vercel.app"
      ]
      redirect_uris = [
        "http://localhost:3000/auth/callback",
        "http://localhost:3001/auth/callback",
        "http://localhost:3000/api/auth/callback/google",
        "http://localhost:3001/api/auth/callback/google",
        "https://dev.esim-go.com/auth/callback",
        "https://dev.esim-go.com/api/auth/callback/google"
      ]
    }
    
    admin_dashboard = {
      name             = "dev-esim-go-admin"
      type             = "Web application"
      authorized_origins = [
        "http://localhost:3002",
        "https://admin-dev.esim-go.com"
      ]
      redirect_uris = [
        "http://localhost:3002/auth/callback",
        "http://localhost:3002/api/auth/callback/google",
        "https://admin-dev.esim-go.com/auth/callback",
        "https://admin-dev.esim-go.com/api/auth/callback/google"
      ]
    }
    
    ios_app = {
      name      = "dev-esim-go-ios"
      type      = "iOS"
      bundle_id = "com.hiilo.esimgo.dev"
    }
  }
}

# Outputs for documentation
output "oauth_setup_instructions" {
  value = <<-EOT
    ========================================
    OAuth Client Setup Instructions
    ========================================
    
    Since your GCP project (${var.gcp_project_id}) is not part of an organization,
    OAuth clients must be created manually through the Google Cloud Console.
    
    Go to: https://console.cloud.google.com/apis/credentials?project=${var.gcp_project_id}
    
    1. First, configure the OAuth consent screen:
       - User Type: External
       - App name: Hiilo eSIM Go
       - Support email: support@esim-go.com
       - Authorized domains: esim-go.com
    
    2. Create OAuth 2.0 Client IDs for each environment:
    
    PRODUCTION CLIENTS:
    ${join("\n    ", [for k, v in local.production_oauth_clients : format("- %s (%s)", v.name, v.type)])}
    
    DEVELOPMENT CLIENTS:
    ${join("\n    ", [for k, v in local.development_oauth_clients : format("- %s (%s)", v.name, v.type)])}
    
    3. After creating, download the client configurations and store the credentials securely.
    
    4. Update your application environment variables with the client IDs and secrets.
    
    See oauth-clients-config.tf for detailed configuration of each client.
  EOT
}

output "production_oauth_config" {
  description = "Production OAuth client configurations"
  value       = local.production_oauth_clients
}

output "development_oauth_config" {
  description = "Development OAuth client configurations"
  value       = local.development_oauth_clients
}