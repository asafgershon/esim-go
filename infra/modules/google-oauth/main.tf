terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# IAP Brand (only create if specified)
resource "google_iap_brand" "hiilo" {
  count = var.create_brand ? 1 : 0
  
  support_email     = var.support_email
  application_title = "Hiilo ${title(var.environment)}"
  project           = var.project_id
}

# For web applications using IAP
resource "google_iap_client" "web_clients" {
  for_each = {
    for key, client in var.oauth_clients : key => client
    if client.client_type == "web" && var.create_brand
  }

  display_name = "${var.environment}-${each.value.display_name}"
  brand        = google_iap_brand.hiilo[0].name
}

# Note: For standard OAuth 2.0 clients (not IAP), we need to use the Google Cloud Console
# or gcloud CLI as Terraform doesn't directly support creating OAuth 2.0 clients
# outside of IAP context.

# Output structure for OAuth clients that need to be created manually
locals {
  manual_oauth_configs = {
    for key, client in var.oauth_clients : key => {
      display_name     = "${var.environment}-${client.display_name}"
      client_type      = client.client_type
      authorized_uris  = client.authorized_uris
      redirect_uris    = client.redirect_uris
      bundle_id        = try(client.bundle_id, null)
      package_name     = try(client.package_name, null)
      sha1_fingerprint = try(client.sha1_fingerprint, null)
    } if client.client_type != "web" || !var.create_brand
  }
  
  oauth_outputs = {
    for key, client in google_iap_client.web_clients :
    key => {
      client_id     = client.client_id
      client_secret = client.secret
      type          = "web"
    }
  }
}