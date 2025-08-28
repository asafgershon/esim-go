# Enable required Google Cloud APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "iap.googleapis.com",                    # Identity-Aware Proxy
    # "identityplatform.googleapis.com",     # Identity Platform (requires billing)
    "cloudresourcemanager.googleapis.com",   # Resource Manager
    "iam.googleapis.com",                    # IAM
    "secretmanager.googleapis.com",          # Secret Manager (optional)
  ])

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false
}