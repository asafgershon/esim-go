output "organization_id" {
  description = "The ID of the AWS Organization"
  value       = aws_organizations_organization.main.id
}

output "management_account_id" {
  description = "The ID of the management account"
  value       = aws_organizations_organization.main.master_account_id
}

output "hiilo_account_id" {
  description = "The ID of the Hiilo production account"
  value       = local.hiilo_account_id
}

output "hiilo_admin_user_arn" {
  description = "The ARN of the Hiilo admin IAM user"
  value       = aws_iam_user.hiilo_admin.arn
}

output "hiilo_admin_access_key_id" {
  description = "Access key ID for hiilo-admin user"
  value       = aws_iam_access_key.hiilo_admin.id
  sensitive   = true
}

output "hiilo_admin_secret_access_key" {
  description = "Secret access key for hiilo-admin user"
  value       = aws_iam_access_key.hiilo_admin.secret
  sensitive   = true
}

output "terraform_state_bucket" {
  description = "The S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table" {
  description = "The DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_state_lock.name
}