# Note: Service accounts need to be created manually due to IAM permissions
# 
# Required service accounts to create in Google Cloud Console:
# 
# Production:
# - Account ID: esim-go-backend-prod
# - Display Name: eSIM Go Backend Production  
# - Role: roles/identitytoolkit.admin
# 
# Development:
# - Account ID: esim-go-backend-dev
# - Display Name: eSIM Go Backend Development
# - Role: roles/identitytoolkit.admin
#
# These service accounts can be used for server-to-server authentication with Google Identity Platform.

# Alternative: Create service accounts via Terraform when permissions allow
# resource "google_service_account" "backend_production" {
#   account_id   = "esim-go-backend-prod"
#   display_name = "eSIM Go Backend Production"
#   project      = var.gcp_project_id
# }
# 
# resource "google_service_account" "backend_development" {
#   account_id   = "esim-go-backend-dev"
#   display_name = "eSIM Go Backend Development"
#   project      = var.gcp_project_id
# }