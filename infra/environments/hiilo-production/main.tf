terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  
  # Use AWS_PROFILE=hiilo-production or configure credentials
  
  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = "production"
      Project     = "Hiilo"
    }
  }
}

# S3 bucket for Hiilo eSIM resources
resource "aws_s3_bucket" "hiilo_esim_resources" {
  bucket = "hiilo-esim-resources"
  
  tags = {
    Name        = "Hiilo eSIM Resources"
    Environment = "production"
  }
}

resource "aws_s3_bucket_versioning" "hiilo_esim_resources" {
  bucket = aws_s3_bucket.hiilo_esim_resources.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "hiilo_esim_resources" {
  bucket = aws_s3_bucket.hiilo_esim_resources.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "hiilo_esim_resources" {
  bucket = aws_s3_bucket.hiilo_esim_resources.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for Hiilo CDN
resource "aws_s3_bucket" "hiilo_cdn" {
  bucket = "hiilo-cdn"
  
  tags = {
    Name        = "Hiilo CDN"
    Environment = "production"
    Purpose     = "Static assets and CDN content"
  }
}

resource "aws_s3_bucket_cors_configuration" "hiilo_cdn" {
  bucket = aws_s3_bucket.hiilo_cdn.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_website_configuration" "hiilo_cdn" {
  bucket = aws_s3_bucket.hiilo_cdn.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "error.html"
  }
}

# IAM role for applications
resource "aws_iam_role" "hiilo_application" {
  name = "HiiloApplicationRole"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "lambda.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Purpose = "Application access to Hiilo resources"
  }
}

# Policy for Hiilo application to access S3 buckets
resource "aws_iam_policy" "hiilo_s3_access" {
  name        = "HiiloS3Access"
  path        = "/"
  description = "Access to Hiilo S3 buckets"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.hiilo_esim_resources.arn,
          "${aws_s3_bucket.hiilo_esim_resources.arn}/*",
          aws_s3_bucket.hiilo_cdn.arn,
          "${aws_s3_bucket.hiilo_cdn.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "hiilo_application_s3" {
  role       = aws_iam_role.hiilo_application.name
  policy_arn = aws_iam_policy.hiilo_s3_access.arn
}

output "hiilo_esim_bucket" {
  description = "The name of the Hiilo eSIM resources bucket"
  value       = aws_s3_bucket.hiilo_esim_resources.id
}

output "hiilo_cdn_bucket" {
  description = "The name of the Hiilo CDN bucket"
  value       = aws_s3_bucket.hiilo_cdn.id
}

output "hiilo_cdn_website_endpoint" {
  description = "The website endpoint for the Hiilo CDN bucket"
  value       = aws_s3_bucket_website_configuration.hiilo_cdn.website_endpoint
}

output "hiilo_application_role_arn" {
  description = "The ARN of the Hiilo application role"
  value       = aws_iam_role.hiilo_application.arn
}