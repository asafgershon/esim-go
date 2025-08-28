variable "environment" {
  description = "Environment name (dev, production)"
  type        = string
  
  validation {
    condition     = contains(["dev", "production"], var.environment)
    error_message = "Environment must be dev or production."
  }
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "oauth_clients" {
  description = "OAuth client configurations"
  type = map(object({
    display_name     = string
    client_type      = string # web, ios, android
    authorized_uris  = list(string)
    redirect_uris    = list(string)
    bundle_id        = optional(string) # For iOS clients
    package_name     = optional(string) # For Android clients
    sha1_fingerprint = optional(string) # For Android clients
  }))
  default = {}
}

variable "common_tags" {
  description = "Common tags/labels for resources"
  type        = map(string)
  default     = {}
}

variable "create_brand" {
  description = "Whether to create a new IAP brand or use existing"
  type        = bool
  default     = true
}

variable "support_email" {
  description = "Support email for OAuth consent screen"
  type        = string
  default     = "support@esim-go.com"
}