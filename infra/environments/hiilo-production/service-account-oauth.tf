# Alternative OAuth approach using Service Accounts
# Service accounts can be used for server-to-server authentication

# Production Service Account for backend
resource "google_service_account" "backend_production" {
  account_id   = "esim-go-backend-prod"
  display_name = "eSIM Go Backend Production"
  project      = var.gcp_project_id
}

# Development Service Account for backend  
resource "google_service_account" "backend_development" {
  account_id   = "esim-go-backend-dev"
  display_name = "eSIM Go Backend Development"
  project      = var.gcp_project_id
}

# Create service account keys
resource "google_service_account_key" "backend_production_key" {
  service_account_id = google_service_account.backend_production.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

resource "google_service_account_key" "backend_development_key" {
  service_account_id = google_service_account.backend_development.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Grant necessary permissions
resource "google_project_iam_member" "backend_production_iam" {
  project = var.gcp_project_id
  role    = "roles/identitytoolkit.admin"  # Changed from firebase.authAdmin
  member  = "serviceAccount:${google_service_account.backend_production.email}"
}

resource "google_project_iam_member" "backend_development_iam" {
  project = var.gcp_project_id
  role    = "roles/identitytoolkit.admin"  # Changed from firebase.authAdmin
  member  = "serviceAccount:${google_service_account.backend_development.email}"
}

# Store credentials in AWS Secrets Manager (optional)
resource "aws_secretsmanager_secret" "google_sa_production" {
  name        = "google-sa-credentials-production"
  description = "Google Service Account credentials for production"
  
  tags = {
    Environment = "production"
    Type        = "service-account"
  }
}

resource "aws_secretsmanager_secret_version" "google_sa_production" {
  secret_id = aws_secretsmanager_secret.google_sa_production.id
  secret_string = base64decode(google_service_account_key.backend_production_key.private_key)
}

resource "aws_secretsmanager_secret" "google_sa_development" {
  name        = "google-sa-credentials-development"
  description = "Google Service Account credentials for development"
  
  tags = {
    Environment = "development"
    Type        = "service-account"
  }
}

resource "aws_secretsmanager_secret_version" "google_sa_development" {
  secret_id = aws_secretsmanager_secret.google_sa_development.id
  secret_string = base64decode(google_service_account_key.backend_development_key.private_key)
}

# Outputs
output "service_accounts" {
  value = {
    production = {
      email = google_service_account.backend_production.email
      id    = google_service_account.backend_production.id
    }
    development = {
      email = google_service_account.backend_development.email
      id    = google_service_account.backend_development.id
    }
  }
}

output "service_account_key_instructions" {
  value = <<-EOT
    Service account keys have been created and stored in AWS Secrets Manager.
    
    To retrieve them:
    Production: aws secretsmanager get-secret-value --secret-id google-sa-credentials-production
    Development: aws secretsmanager get-secret-value --secret-id google-sa-credentials-development
    
    These can be used for server-side authentication with Google services.
  EOT
}