variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "hiilo-470409"  # New project in organization
}

variable "gcp_project_number" {
  description = "Google Cloud Project Number"
  type        = string
  default     = "177752062147"  # Updated project number
}

variable "gcp_organization_id" {
  description = "Google Cloud Organization ID"
  type        = string
  default     = "751064751797"
}

# Apple Sign In Configuration Variables
variable "apple_issuer_id" {
  description = "Apple App Store Connect Issuer ID"
  type        = string
  sensitive   = true
}

variable "apple_key_id" {
  description = "Apple App Store Connect API Key ID"
  type        = string
  sensitive   = true
}

variable "apple_private_key" {
  description = "Apple App Store Connect API Private Key content"
  type        = string
  sensitive   = true
}

variable "apple_app_id_dev" {
  description = "Apple App ID for development environment"
  type        = string
  default     = "com.hiiloworld.app.dev"
}

variable "apple_app_id_prod" {
  description = "Apple App ID for production environment"
  type        = string
  default     = "com.hiiloworld.app"
}