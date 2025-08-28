# Railway Provider Configuration

provider "railway" {
  # Token can be set via RAILWAY_TOKEN environment variable
  # or using terraform variable (which we're using now)
  token = var.railway_token
}

# Variables for Railway configuration
variable "railway_token" {
  description = "Railway API token for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

# IMPORTANT: Railway Terraform Provider Limitations
# The terraform-community/railway provider (v0.2.0) has significant limitations:
# 1. Cannot connect GitHub repositories to services
# 2. Cannot configure build settings (root directory, build commands, etc.)
# 3. Cannot trigger deployments
# 4. Cannot manage deployment environments properly
#
# Therefore, we only manage the project and environment variables through Terraform.
# Services must be created and connected manually through the Railway dashboard.
#
# Existing services (created manually with deployments):
# - apollo-server (ID: 4afbf8ed-9842-4b63-afe9-239a1f0ed91c)
# - next-web-app (ID: 828d900a-6ec3-4353-a6fa-0a6426e44b9d)
# - managment-portal (ID: 17fc26ce-0b65-436f-8ae8-8b6b0e941e8e)
# - workers (ID: 7a2e0d52-1572-4a59-a443-281f654770d4)
# - Redis (ID: 827f0f60-b06f-44a4-80a7-f815b464e8ac)

# Import existing Railway project
# terraform import railway_project.hiilo cedece0b-a6c2-4ffe-8d19-460090acf032
resource "railway_project" "hiilo" {
  name        = "Hiilo"
  # description = "Hiilo eSIM Platform"  # Commenting out to avoid update errors
  
  # Private project (not publicly accessible source)
  private = true
  
  # PR deployments (keep existing state)
  has_pr_deploys = false
  
  # Team ID from import - commenting out to prevent replacement
  # team_id = "435da450-e1d1-46bc-8fc1-548944b22bdd"
  
  lifecycle {
    ignore_changes = [
      team_id,  # Ignore team_id to prevent replacement
      default_environment,  # Keep existing environment
      description  # Also ignore description changes
    ]
  }
}

# Note: The railway provider doesn't have a data source for environments
# We'll use the default environment from the project resource
locals {
  production_environment_id = "5bfb2c21-601c-47e7-8828-a1c1a1781e74"
  development_environment_id = "86b1c6a6-509d-4097-8d51-f0ebd298143e"
}