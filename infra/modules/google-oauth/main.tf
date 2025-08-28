terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Web OAuth Clients
resource "google_iap_client" "web_clients" {
  for_each = {
    for key, client in var.oauth_clients : key => client
    if client.client_type == "web"
  }

  display_name = "${var.environment}-${each.value.display_name}"
  brand        = google_iap_brand.hiilo.name
}

# iOS OAuth Clients
resource "google_identity_platform_oauth_idp_config" "ios_clients" {
  for_each = {
    for key, client in var.oauth_clients : key => client
    if client.client_type == "ios"
  }

  name         = "${var.environment}-${each.key}"
  display_name = "${var.environment}-${each.value.display_name}"
  enabled      = true

  client_id     = google_identity_platform_oauth_client.ios[each.key].client_id
  client_secret = google_identity_platform_oauth_client.ios[each.key].client_secret
}

resource "google_identity_platform_oauth_client" "ios" {
  for_each = {
    for key, client in var.oauth_clients : key => client
    if client.client_type == "ios"
  }

  display_name = "${var.environment}-${each.value.display_name}"
  redirect_uri = each.value.redirect_uris
}

# Android OAuth Clients (if needed)
resource "google_identity_platform_oauth_client" "android" {
  for_each = {
    for key, client in var.oauth_clients : key => client
    if client.client_type == "android"
  }

  display_name = "${var.environment}-${each.value.display_name}"
  redirect_uri = each.value.redirect_uris
}

# IAP Brand (shared across all clients)
resource "google_iap_brand" "hiilo" {
  support_email     = "support@hiilo.com"
  application_title = "Hiilo ${title(var.environment)}"
  project           = var.project_id
}

# Outputs for client IDs and secrets
locals {
  oauth_outputs = merge(
    {
      for key, client in google_iap_client.web_clients :
      key => {
        client_id     = client.client_id
        client_secret = client.secret
        type          = "web"
      }
    },
    {
      for key, client in google_identity_platform_oauth_client.ios :
      key => {
        client_id     = client.client_id
        client_secret = client.client_secret
        type          = "ios"
      }
    },
    {
      for key, client in google_identity_platform_oauth_client.android :
      key => {
        client_id     = client.client_id
        client_secret = client.client_secret
        type          = "android"
      }
    }
  )
}