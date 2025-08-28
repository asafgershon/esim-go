# Railway Provider Configuration

provider "railway" {
  # Token should be set via RAILWAY_TOKEN environment variable
  # or uncomment below and use terraform variable
  # token = var.railway_token
}

# Variables for Railway configuration
variable "railway_token" {
  description = "Railway API token for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

# Import existing Railway project
# terraform import railway_project.hiilo cedece0b-a6c2-4ffe-8d19-460090acf032
resource "railway_project" "hiilo" {
  name        = "Hiilo"
  description = "Hiilo eSIM Platform"
  
  # Private project (not publicly accessible source)
  private = true
  
  # Enable PR deployments
  has_pr_deploys = true
  
  # Default environment configuration
  default_environment = {
    name = "production"
  }
}

# Note: The railway provider doesn't have a data source for environments
# We'll use the default environment from the project resource
locals {
  production_environment_id = "5bfb2c21-601c-47e7-8828-a1c1a1781e74" # From railway variables output
}