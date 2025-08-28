# Supabase Configuration and Authentication Management
# This file manages Supabase authentication providers and project settings

# Configure the Supabase Provider
provider "supabase" {
  access_token = var.supabase_access_token
}

# Variables for Supabase configuration
variable "supabase_access_token" {
  description = "Supabase Management API access token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "supabase_project_ref" {
  description = "Supabase project reference ID"
  type        = string
  default     = "dgkyjkzkwzmjjurzvcxy" # esim-go project
}

# Import existing Supabase project settings
# Note: This resource manages the authentication and API settings for the Supabase project
# Some settings may be managed through environment variables or the Supabase dashboard
resource "supabase_settings" "esim_go" {
  project_ref = var.supabase_project_ref

  # API Settings
  api = jsonencode({
    db_extra_search_path = "public,extensions"
    db_schema            = "public,storage,graphql_public"
    max_rows             = 1000
  })

  # Auth Settings - Configure authentication providers
  auth = jsonencode({
    # Site configuration
    site_url = "https://esim-go.com"
    
    # Enable authentication providers
    external_email_enabled   = true
    external_google_enabled  = var.enable_google_auth
    external_apple_enabled   = var.enable_apple_auth
    external_phone_enabled   = var.enable_phone_auth
    
    # Email auth settings
    enable_signup              = true
    enable_anonymous_sign_ins  = false
    
    # JWT configuration
    jwt_exp = 3600
    
    # Password requirements
    password_min_length = 8
    
    # SMS settings for phone auth (when enabled)
    sms_provider = var.enable_phone_auth ? "twilio" : "none"
    sms_twilio_account_sid = var.enable_phone_auth ? var.twilio_account_sid : ""
    sms_twilio_auth_token = var.enable_phone_auth ? var.twilio_auth_token : ""
    sms_twilio_message_service_sid = var.enable_phone_auth ? var.twilio_message_service_sid : ""
    sms_template = "Your Hiilo verification code is: {{ .Code }}"
    sms_otp_exp = 60
    sms_otp_length = 6
    
    # Google OAuth configuration (when enabled)
    external_google_client_id = var.enable_google_auth ? var.google_oauth_client_id : ""
    external_google_secret = var.enable_google_auth ? var.google_oauth_client_secret : ""
    
    # Apple Sign In configuration (when enabled)
    external_apple_client_id = var.enable_apple_auth ? var.apple_signin_service_id : ""
    external_apple_secret = var.enable_apple_auth ? var.apple_signin_client_secret : ""
    
    # Allowed redirect URLs
    uri_allow_list = join(",", [
      "http://localhost:3000/**",
      "http://localhost:3001/**",
      "https://esim-go.com/**",
      "https://app.esim-go.com/**",
      "https://hiiloworld.com/**",
      "https://app.hiiloworld.com/**",
      "com.hiiloworld.app://auth/callback",
      "com.hiiloworld.app.dev://auth/callback"
    ])
  })
}

# Feature flags for authentication providers
variable "enable_google_auth" {
  description = "Enable Google OAuth authentication"
  type        = bool
  default     = false
}

variable "enable_apple_auth" {
  description = "Enable Apple Sign In authentication"
  type        = bool
  default     = false
}

variable "enable_phone_auth" {
  description = "Enable Phone/SMS authentication via Twilio"
  type        = bool
  default     = false
}

# Variables for OAuth providers
variable "google_oauth_client_id" {
  description = "Google OAuth client ID for Supabase auth"
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret for Supabase auth"
  type        = string
  default     = ""
  sensitive   = true
}

variable "apple_signin_service_id" {
  description = "Apple Sign In Service ID (client ID)"
  type        = string
  default     = "com.hiiloworld.signin"
}

variable "apple_signin_client_secret" {
  description = "Apple Sign In client secret (JWT)"
  type        = string
  default     = ""
  sensitive   = true
}

# Twilio variables for SMS authentication
variable "twilio_account_sid" {
  description = "Twilio Account SID for SMS auth"
  type        = string
  default     = ""
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token for SMS auth"
  type        = string
  default     = ""
  sensitive   = true
}

variable "twilio_message_service_sid" {
  description = "Twilio Message Service SID for SMS auth"
  type        = string
  default     = ""
  sensitive   = true
}

# Outputs
output "supabase_project_url" {
  value       = "https://${var.supabase_project_ref}.supabase.co"
  description = "Supabase project URL"
}

output "supabase_auth_url" {
  value       = "https://${var.supabase_project_ref}.supabase.co/auth/v1"
  description = "Supabase Auth API endpoint"
}

output "supabase_auth_providers" {
  value = {
    email  = "Enabled"
    google = "Configured (requires client ID and secret in tfvars)"
    apple  = "Configured (requires service ID and secret in tfvars)"
    phone  = "Configured via Twilio"
  }
  description = "Configured authentication providers"
}

output "supabase_auth_instructions" {
  value = <<-EOT
    ========================================
    Supabase Authentication Configuration
    ========================================
    
    Project: ${var.supabase_project_ref}
    Region: eu-central-1
    
    ✅ Authentication Providers Configured:
    - Email/Password authentication
    - Google OAuth (requires credentials)
    - Apple Sign In (requires credentials)
    - Phone/SMS via Twilio
    
    Required Environment Variables:
    1. SUPABASE_ACCESS_TOKEN - Get from: https://supabase.com/dashboard/account/tokens
    2. Google OAuth credentials from Google Cloud Console
    3. Apple Sign In credentials from Apple Developer Portal
    4. Twilio credentials from Twilio Console
    
    To import existing configuration:
    terraform import supabase_settings.esim_go ${var.supabase_project_ref}
    
    Redirect URLs configured for:
    - localhost:3000, localhost:3001 (development)
    - esim-go.com, app.esim-go.com (production)
    - hiiloworld.com, app.hiiloworld.com (production)
    - Native mobile apps (iOS)
  EOT
}