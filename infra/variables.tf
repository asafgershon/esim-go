variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "management"
}

variable "organization_name" {
  description = "Name of the AWS Organization"
  type        = string
  default     = "YarinSasson"
}

variable "hiilo_account_email" {
  description = "Email for Hiilo production account"
  type        = string
  default     = "hiilo@yarinsasson.com"
}

variable "hiilo_account_name" {
  description = "Name for Hiilo production account"
  type        = string
  default     = "Hiilo Production"
}