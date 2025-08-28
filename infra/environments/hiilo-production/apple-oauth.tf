# Apple Sign In OAuth Configuration
# Using the fintreal/appstore provider for managing Apple Sign In services

# Provider configuration for Apple Developer account
provider "appstore" {
  appstore_key_issuer_id = var.apple_issuer_id
  appstore_key_id        = var.apple_key_id
  appstore_key           = var.apple_private_key
}

# Bundle Identifier for development environment
resource "appstore_bundle_identifier" "development" {
  identifier = "com.hiiloworld.app.dev"
  name       = "Hiilo World Dev"
}

# Bundle Identifier for production environment
resource "appstore_bundle_identifier" "production" {
  identifier = "com.hiiloworld.app"
  name       = "Hiilo World"
}

# Bundle Identifier for Sign in with Apple service - Development
resource "appstore_bundle_identifier" "signin_dev" {
  identifier = "com.hiiloworld.signin.dev"
  name       = "Hiilo World Sign In - Development"
}

# Bundle Identifier for Sign in with Apple service - Production
resource "appstore_bundle_identifier" "signin_prod" {
  identifier = "com.hiiloworld.signin"
  name       = "Hiilo World Sign In"
}

# Outputs for use in application configuration
output "apple_signin_development" {
  description = "Apple Sign In configuration for development"
  sensitive   = true
  value = {
    app_bundle_id    = appstore_bundle_identifier.development.identifier
    signin_bundle_id = appstore_bundle_identifier.signin_dev.identifier
  }
}

output "apple_signin_production" {
  description = "Apple Sign In configuration for production"
  sensitive   = true
  value = {
    app_bundle_id    = appstore_bundle_identifier.production.identifier
    signin_bundle_id = appstore_bundle_identifier.signin_prod.identifier
  }
}

# Documentation output
output "apple_signin_setup_instructions" {
  value = <<-EOT
    ========================================
    Apple Sign In Bundle Identifiers Setup
    ========================================
    
    This Terraform configuration creates Apple Bundle Identifiers for:
    
    Development:
    - App Bundle ID: ${appstore_bundle_identifier.development.identifier}
    - Service ID: ${appstore_bundle_identifier.signin_dev.identifier}
    
    Production:
    - App Bundle ID: ${appstore_bundle_identifier.production.identifier}
    - Service ID: ${appstore_bundle_identifier.signin_prod.identifier}
    
    IMPORTANT: After running this Terraform:
    
    1. Go to Apple Developer Portal to configure Sign in with Apple:
       https://developer.apple.com/account/resources/identifiers/list
    
    2. For each Service ID (signin bundles), configure:
       - Enable "Sign in with Apple" capability
       - Configure domains and return URLs:
       
       Development (com.hiiloworld.signin.dev):
       - Domains: app.hiilo.yarinsa.me, app.hiiloworld.dev
       - Return URLs: 
         * https://app.hiilo.yarinsa.me/auth/callback/apple
         * https://app.hiiloworld.dev/auth/callback/apple
       
       Production (com.hiiloworld.signin):
       - Domains: hiiloworld.com, www.hiiloworld.com, app.hiiloworld.com
       - Return URLs:
         * https://hiiloworld.com/auth/callback/apple
         * https://www.hiiloworld.com/auth/callback/apple
         * https://app.hiiloworld.com/auth/callback/apple
    
    3. Configure your app with the Service IDs as client IDs
    
    Note: The fintreal/appstore provider only manages bundle identifiers.
    Additional Sign in with Apple configuration must be done manually in Apple Developer Portal.
  EOT
}