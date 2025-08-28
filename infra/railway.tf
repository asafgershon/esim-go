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
  production_environment_id = "5bfb2c21-601c-47e7-8828-a1c1a1781e74" # From railway variables output
}