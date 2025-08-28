# Google Provider Configuration
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "us-central1"
}

# Production OAuth Clients
module "google_oauth_production" {
  source = "../../modules/google-oauth"
  
  environment = "production"
  project_id  = var.gcp_project_id
  
  oauth_clients = {
    # Web Application
    web_app = {
      display_name    = "Hiilo Web App"
      client_type     = "web"
      authorized_uris = [
        "https://esim-go.com",
        "https://www.esim-go.com",
        "https://app.esim-go.com"
      ]
      redirect_uris = [
        "https://esim-go.com/auth/callback",
        "https://app.esim-go.com/auth/callback"
      ]
    }
    
    # iOS App
    ios_app = {
      display_name    = "Hiilo iOS"
      client_type     = "ios"
      bundle_id       = "com.hiilo.esimgo"
      authorized_uris = []
      redirect_uris = [
        "com.hiilo.esimgo:/oauth2redirect",
        "com.hiilo.esimgo:/auth/callback"
      ]
    }
    
    # Admin Dashboard
    admin_dashboard = {
      display_name    = "Hiilo Admin Dashboard"
      client_type     = "web"
      authorized_uris = [
        "https://admin.esim-go.com"
      ]
      redirect_uris = [
        "https://admin.esim-go.com/auth/callback"
      ]
    }
  }
  
  common_tags = {
    ManagedBy   = "Terraform"
    Environment = "production"
    Project     = "Hiilo"
  }
}

# Development OAuth Clients (in same project, different naming)
module "google_oauth_development" {
  source = "../../modules/google-oauth"
  
  environment = "dev"
  project_id  = var.gcp_project_id
  
  oauth_clients = {
    # Development Web Application
    web_app = {
      display_name    = "Hiilo Web App"
      client_type     = "web"
      authorized_uris = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dev.esim-go.com",
        "https://*.vercel.app"
      ]
      redirect_uris = [
        "http://localhost:3000/auth/callback",
        "http://localhost:3001/auth/callback",
        "https://dev.esim-go.com/auth/callback"
      ]
    }
    
    # Development iOS App
    ios_app = {
      display_name    = "Hiilo iOS"
      client_type     = "ios"
      bundle_id       = "com.hiilo.esimgo.dev"
      authorized_uris = []
      redirect_uris = [
        "com.hiilo.esimgo.dev:/oauth2redirect",
        "com.hiilo.esimgo.dev:/auth/callback"
      ]
    }
    
    # Development Admin Dashboard
    admin_dashboard = {
      display_name    = "Hiilo Admin Dashboard"
      client_type     = "web"
      authorized_uris = [
        "http://localhost:3002",
        "https://admin-dev.esim-go.com"
      ]
      redirect_uris = [
        "http://localhost:3002/auth/callback",
        "https://admin-dev.esim-go.com/auth/callback"
      ]
    }
  }
  
  common_tags = {
    ManagedBy   = "Terraform"
    Environment = "development"
    Project     = "Hiilo"
  }
}

# Outputs
output "production_oauth_client_ids" {
  description = "Production OAuth client IDs"
  value       = module.google_oauth_production.oauth_client_ids
}

output "development_oauth_client_ids" {
  description = "Development OAuth client IDs"
  value       = module.google_oauth_development.oauth_client_ids
}

# Store sensitive values in AWS Secrets Manager
resource "aws_secretsmanager_secret" "google_oauth_production" {
  name        = "hiilo/google-oauth/production"
  description = "Google OAuth credentials for production environment"
  
  tags = {
    Environment = "production"
    Type        = "oauth-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "google_oauth_production" {
  secret_id = aws_secretsmanager_secret.google_oauth_production.id
  secret_string = jsonencode(module.google_oauth_production.oauth_clients)
}

resource "aws_secretsmanager_secret" "google_oauth_development" {
  name        = "hiilo/google-oauth/development"
  description = "Google OAuth credentials for development environment"
  
  tags = {
    Environment = "development"
    Type        = "oauth-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "google_oauth_development" {
  secret_id = aws_secretsmanager_secret.google_oauth_development.id
  secret_string = jsonencode(module.google_oauth_development.oauth_clients)
}