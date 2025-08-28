# GitHub Configuration - Environments and Secrets

# GitHub Provider Configuration
provider "github" {
  # Token should be set via GITHUB_TOKEN environment variable
  # or using terraform variable
  token = var.github_token
  owner = "yarinsa"  # Repository owner
}

# Variable for GitHub token
variable "github_token" {
  description = "GitHub personal access token with repo scope"
  type        = string
  sensitive   = true
  default     = ""
}

# Data source for the repository
data "github_repository" "esim_go" {
  name = "esim-go"
}

# Development Environment
resource "github_repository_environment" "development" {
  repository  = data.github_repository.esim_go.name
  environment = "development"
  
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

# Development environment deployment branch policy
resource "github_repository_environment_deployment_policy" "development_branches" {
  repository     = data.github_repository.esim_go.name
  environment    = github_repository_environment.development.environment
  branch_pattern = "development"
}

# Development environment deployment branch policy for PRs
resource "github_repository_environment_deployment_policy" "development_prs" {
  repository     = data.github_repository.esim_go.name
  environment    = github_repository_environment.development.environment
  branch_pattern = "pull_request"
}

# Production Environment
resource "github_repository_environment" "production" {
  repository  = data.github_repository.esim_go.name
  environment = "production"
  
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
  
  # Optional: Add reviewers for production deployments
  # reviewers {
  #   users = [github_user_id]
  #   teams = [github_team_id]
  # }
  
  # Optional: Wait timer before deployment (in minutes)
  # wait_timer = 10
}

# Production environment deployment branch policy
resource "github_repository_environment_deployment_policy" "production_branches" {
  repository     = data.github_repository.esim_go.name
  environment    = github_repository_environment.production.environment
  branch_pattern = "main"  # Using main as production branch
}

# Development Environment Secrets
resource "github_actions_environment_secret" "dev_cdn_sync_access_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "CDN_SYNC_ACCESS_KEY_ID"
  plaintext_value = aws_iam_access_key.cdn_sync.id
}

resource "github_actions_environment_secret" "dev_cdn_sync_secret_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "CDN_SYNC_SECRET_ACCESS_KEY"
  plaintext_value = aws_iam_access_key.cdn_sync.secret
}

resource "github_actions_environment_secret" "dev_cdn_distribution_id" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "CDN_DISTRIBUTION_ID"
  plaintext_value = aws_cloudfront_distribution.hiilo_cdn_dev.id
}

resource "github_actions_environment_secret" "dev_s3_bucket" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "CDN_S3_BUCKET"
  plaintext_value = aws_s3_bucket.hiilo_cdn_dev.id
}

resource "github_actions_environment_secret" "dev_cdn_url" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "CDN_URL"
  plaintext_value = "https://${aws_cloudfront_distribution.hiilo_cdn_dev.domain_name}"
}

# Railway token for development
resource "github_actions_environment_secret" "dev_railway_token" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "RAILWAY_TOKEN"
  plaintext_value = var.railway_token
}

# Production Environment Secrets
resource "github_actions_environment_secret" "prod_cdn_sync_access_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "CDN_SYNC_ACCESS_KEY_ID"
  plaintext_value = aws_iam_access_key.cdn_sync.id
}

resource "github_actions_environment_secret" "prod_cdn_sync_secret_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "CDN_SYNC_SECRET_ACCESS_KEY"
  plaintext_value = aws_iam_access_key.cdn_sync.secret
}

resource "github_actions_environment_secret" "prod_cdn_distribution_id" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "CDN_DISTRIBUTION_ID"
  plaintext_value = aws_cloudfront_distribution.hiilo_cdn_prod.id
}

resource "github_actions_environment_secret" "prod_s3_bucket" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "CDN_S3_BUCKET"
  plaintext_value = aws_s3_bucket.hiilo_cdn_prod.id
}

resource "github_actions_environment_secret" "prod_cdn_url" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "CDN_URL"
  plaintext_value = "https://${aws_cloudfront_distribution.hiilo_cdn_prod.domain_name}"
}

# Railway token for production
resource "github_actions_environment_secret" "prod_railway_token" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "RAILWAY_TOKEN"
  plaintext_value = var.railway_token
}

# Additional common secrets that might be needed
# Add these based on your application needs

# Development - Supabase
resource "github_actions_environment_secret" "dev_supabase_url" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "SUPABASE_URL"
  plaintext_value = var.supabase_url
}

resource "github_actions_environment_secret" "dev_supabase_anon_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.development.environment
  secret_name     = "SUPABASE_ANON_KEY"
  plaintext_value = var.supabase_anon_key
}

# Production - Supabase
resource "github_actions_environment_secret" "prod_supabase_url" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "SUPABASE_URL"
  plaintext_value = var.supabase_url
}

resource "github_actions_environment_secret" "prod_supabase_anon_key" {
  repository      = data.github_repository.esim_go.name
  environment     = github_repository_environment.production.environment
  secret_name     = "SUPABASE_ANON_KEY"
  plaintext_value = var.supabase_anon_key
}