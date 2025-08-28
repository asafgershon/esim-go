# CDN Outputs

output "cdn_dev_bucket_name" {
  description = "Development CDN S3 bucket name"
  value       = aws_s3_bucket.hiilo_cdn_dev.id
}

output "cdn_prod_bucket_name" {
  description = "Production CDN S3 bucket name"
  value       = aws_s3_bucket.hiilo_cdn_prod.id
}

output "cdn_dev_distribution_id" {
  description = "Development CloudFront distribution ID"
  value       = aws_cloudfront_distribution.hiilo_cdn_dev.id
}

output "cdn_prod_distribution_id" {
  description = "Production CloudFront distribution ID"
  value       = aws_cloudfront_distribution.hiilo_cdn_prod.id
}

output "cdn_dev_domain_name" {
  description = "Development CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.hiilo_cdn_dev.domain_name
}

output "cdn_prod_domain_name" {
  description = "Production CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.hiilo_cdn_prod.domain_name
}

output "cdn_dev_url" {
  description = "Development CDN base URL"
  value       = "https://${aws_cloudfront_distribution.hiilo_cdn_dev.domain_name}"
}

output "cdn_prod_url" {
  description = "Production CDN base URL"
  value       = "https://${aws_cloudfront_distribution.hiilo_cdn_prod.domain_name}"
}

output "cdn_sync_access_key_id" {
  description = "Access key ID for CDN sync user (store in GitHub secrets)"
  value       = aws_iam_access_key.cdn_sync.id
  sensitive   = true
}

output "cdn_sync_secret_access_key" {
  description = "Secret access key for CDN sync user (store in GitHub secrets)"
  value       = aws_iam_access_key.cdn_sync.secret
  sensitive   = true
}