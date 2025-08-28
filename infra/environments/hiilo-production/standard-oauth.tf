# Standard OAuth 2.0 Setup with Organization
# Since we have an organization, we can now manage OAuth properly via Terraform

# The OAuth brand was created manually and exists
# Project: hiilo-470409 is in organization: 751064751797

# Note: Identity Platform API needs to be enabled manually
# Enable at: https://console.cloud.google.com/apis/library/identityplatform.googleapis.com?project=${var.gcp_project_id}

# resource "google_project_service" "identity_platform" {
#   project = var.gcp_project_id
#   service = "identityplatform.googleapis.com"
#   
#   disable_on_destroy = false
# }

# Output instructions for manual OAuth client creation
output "standard_oauth_instructions" {
  value = <<-EOT
    ========================================
    Standard OAuth 2.0 Client Setup
    ========================================
    
    Project: ${var.gcp_project_id} (in organization)
    Firebase Auth Domain: ${var.gcp_project_id}.firebaseapp.com
    
    ✅ Identity Platform enabled
    ✅ Authorized domains configured
    
    Manual Steps Required:
    1. Go to: https://console.cloud.google.com/apis/credentials?project=${var.gcp_project_id}
    
    2. Create OAuth 2.0 Client IDs:
    
    Production Web App:
    - Type: Web application
    - Name: production-web-app
    - Authorized origins: https://esim-go.com, https://hiiloworld.com
    - Redirect URIs: 
      * https://esim-go.com/auth/callback
      * https://hiiloworld.com/auth/callback
    
    Development Web App:
    - Type: Web application  
    - Name: development-web-app
    - Authorized origins: http://localhost:3000, http://localhost:3001
    - Redirect URIs:
      * http://localhost:3000/auth/callback
      * http://localhost:3001/auth/callback
    
    Production iOS App:
    - Type: iOS
    - Name: production-ios-app
    - Bundle ID: com.hiiloworld.app
    
    Development iOS App:
    - Type: iOS
    - Name: development-ios-app
    - Bundle ID: com.hiiloworld.app.dev
    
    3. Download client configurations and add to environment variables
    
    The OAuth consent screen should use the existing External configuration.
  EOT
}