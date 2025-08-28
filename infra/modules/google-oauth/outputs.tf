output "oauth_clients" {
  description = "OAuth client configurations created via IAP"
  value       = local.oauth_outputs
  sensitive   = true
}

output "oauth_client_ids" {
  description = "OAuth client IDs only (non-sensitive)"
  value = {
    for key, client in local.oauth_outputs :
    key => client.client_id
  }
}

output "manual_oauth_configs" {
  description = "OAuth configurations that need to be created manually"
  value       = local.manual_oauth_configs
}

output "iap_brand" {
  description = "IAP Brand information"
  value = var.create_brand ? {
    name              = google_iap_brand.hiilo[0].name
    support_email     = google_iap_brand.hiilo[0].support_email
    application_title = google_iap_brand.hiilo[0].application_title
  } : null
}