# Note: Required APIs need to be enabled manually due to service account permissions
# Required APIs to enable in Google Cloud Console:
# - iap.googleapis.com (Identity-Aware Proxy)
# - identityplatform.googleapis.com (Identity Platform - requires billing)
# - cloudresourcemanager.googleapis.com (Resource Manager)
# - iam.googleapis.com (IAM)
# - secretmanager.googleapis.com (Secret Manager - optional)

# resource "google_project_service" "required_apis" {
#   for_each = toset([
#     "iap.googleapis.com",
#     "cloudresourcemanager.googleapis.com",
#     "iam.googleapis.com",
#     "secretmanager.googleapis.com",
#   ])
# 
#   project = var.gcp_project_id
#   service = each.value
# 
#   disable_on_destroy = false
# }