output "oauth_clients" {
  description = "OAuth client configurations"
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

output "iap_brand" {
  description = "IAP Brand information"
  value = {
    name              = google_iap_brand.hiilo.name
    support_email     = google_iap_brand.hiilo.support_email
    application_title = google_iap_brand.hiilo.application_title
  }
}