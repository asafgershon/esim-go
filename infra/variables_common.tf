# Common Variables used across multiple providers
# These should be defined in terraform.tfvars or environment-specific tfvars files

# Environment
variable "node_env" {
  description = "Node environment (development/production)"
  type        = string
  default     = "development"
}

# Supabase Configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

# Redis Configuration
variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

# eSIM Go API Configuration
variable "esim_go_api_key" {
  description = "eSIM Go API key"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

variable "esim_go_mode" {
  description = "eSIM Go mode (production/mock)"
  type        = string
  default     = "mock"
}

variable "esim_go_webhook_secret" {
  description = "eSIM Go webhook secret"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

# JWT Configuration
variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

variable "checkout_jwt_secret" {
  description = "Checkout JWT secret"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

# AWS Credentials (for services that need them)
variable "aws_access_key_id" {
  description = "AWS access key ID for services"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}

variable "aws_secret_access_key" {
  description = "AWS secret access key for services"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars
}