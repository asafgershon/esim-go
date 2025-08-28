# Google OAuth Configuration with Organization Support
# Now we can create IAP brands and OAuth clients programmatically!

# IAP Brand (OAuth Consent Screen)
resource "google_iap_brand" "esim_go" {
  support_email     = "yarinsasson@hiiloworld.com"  # Use verified domain
  application_title = "Hiilo"  # Match what was created in Console
  project          = var.gcp_project_id
}

# Production OAuth Clients
resource "google_iap_client" "prod_web" {
  display_name = "Production Web App"
  brand        = google_iap_brand.esim_go.name
}

resource "google_iap_client" "prod_admin" {
  display_name = "Production Admin Dashboard"
  brand        = google_iap_brand.esim_go.name
}

# Development OAuth Clients
resource "google_iap_client" "dev_web" {
  display_name = "Development Web App"
  brand        = google_iap_brand.esim_go.name
}

resource "google_iap_client" "dev_admin" {
  display_name = "Development Admin Dashboard"
  brand        = google_iap_brand.esim_go.name
}

# Enable Identity Platform for mobile OAuth
resource "google_project_service" "identity_platform" {
  project = var.gcp_project_id
  service = "identityplatform.googleapis.com"
  
  disable_on_destroy = false
}

resource "google_identity_platform_config" "default" {
  project = var.gcp_project_id
  
  # Authorized domains for OAuth
  authorized_domains = [
    "esim-go.com",
    "hiiloworld.com",
    "localhost"
  ]
  
  depends_on = [google_project_service.identity_platform]
}

# Outputs for OAuth configuration
output "oauth_clients_org" {
  sensitive = true
  value = {
    production = {
      web = {
        client_id     = google_iap_client.prod_web.client_id
        client_secret = google_iap_client.prod_web.secret
      }
      admin = {
        client_id     = google_iap_client.prod_admin.client_id
        client_secret = google_iap_client.prod_admin.secret
      }
    }
    development = {
      web = {
        client_id     = google_iap_client.dev_web.client_id
        client_secret = google_iap_client.dev_web.secret
      }
      admin = {
        client_id     = google_iap_client.dev_admin.client_id
        client_secret = google_iap_client.dev_admin.secret
      }
    }
  }
}

output "oauth_brand_info" {
  value = {
    name              = google_iap_brand.esim_go.name
    application_title = google_iap_brand.esim_go.application_title
    support_email     = google_iap_brand.esim_go.support_email
    project          = var.gcp_project_id
    organization     = var.gcp_organization_id
  }
}

output "firebase_config" {
  value = {
    project_id      = var.gcp_project_id
    auth_domain     = "${var.gcp_project_id}.firebaseapp.com"
    api_key         = "Will be created in Firebase Console"
  }
}