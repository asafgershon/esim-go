# CDN Infrastructure for Static Assets
# S3 Buckets and CloudFront Distributions for Development and Production

# Development S3 Bucket
resource "aws_s3_bucket" "hiilo_cdn_dev" {
  bucket = "hiilo-cdn-dev"
  
  tags = {
    Name        = "Hiilo CDN Development"
    Environment = "development"
    Purpose     = "Static assets for email templates and app"
  }
}

# Production S3 Bucket
resource "aws_s3_bucket" "hiilo_cdn_prod" {
  bucket = "hiilo-cdn-prod"
  
  tags = {
    Name        = "Hiilo CDN Production"
    Environment = "production"
    Purpose     = "Static assets for email templates and app"
  }
}

# Public access settings for Development bucket
resource "aws_s3_bucket_public_access_block" "hiilo_cdn_dev" {
  bucket = aws_s3_bucket.hiilo_cdn_dev.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Public access settings for Production bucket
resource "aws_s3_bucket_public_access_block" "hiilo_cdn_prod" {
  bucket = aws_s3_bucket.hiilo_cdn_prod.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# CORS configuration for Development bucket
resource "aws_s3_bucket_cors_configuration" "hiilo_cdn_dev" {
  bucket = aws_s3_bucket.hiilo_cdn_dev.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# CORS configuration for Production bucket
resource "aws_s3_bucket_cors_configuration" "hiilo_cdn_prod" {
  bucket = aws_s3_bucket.hiilo_cdn_prod.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# Bucket policy for Development (CloudFront OAI access)
resource "aws_s3_bucket_policy" "hiilo_cdn_dev" {
  bucket = aws_s3_bucket.hiilo_cdn_dev.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAI"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.hiilo_cdn_dev.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.hiilo_cdn_dev.arn}/*"
      }
    ]
  })
}

# Bucket policy for Production (CloudFront OAI access)
resource "aws_s3_bucket_policy" "hiilo_cdn_prod" {
  bucket = aws_s3_bucket.hiilo_cdn_prod.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAI"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.hiilo_cdn_prod.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.hiilo_cdn_prod.arn}/*"
      }
    ]
  })
}

# CloudFront Origin Access Identity for Development
resource "aws_cloudfront_origin_access_identity" "hiilo_cdn_dev" {
  comment = "OAI for Hiilo CDN Development"
}

# CloudFront Origin Access Identity for Production
resource "aws_cloudfront_origin_access_identity" "hiilo_cdn_prod" {
  comment = "OAI for Hiilo CDN Production"
}

# CloudFront Distribution for Development
resource "aws_cloudfront_distribution" "hiilo_cdn_dev" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Hiilo CDN Development"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"  # Use only North America and Europe edge locations for dev

  origin {
    domain_name = aws_s3_bucket.hiilo_cdn_dev.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.hiilo_cdn_dev.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.hiilo_cdn_dev.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.hiilo_cdn_dev.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "Hiilo CDN Development"
    Environment = "development"
  }
}

# CloudFront Distribution for Production
resource "aws_cloudfront_distribution" "hiilo_cdn_prod" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Hiilo CDN Production"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Use all edge locations for production

  origin {
    domain_name = aws_s3_bucket.hiilo_cdn_prod.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.hiilo_cdn_prod.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.hiilo_cdn_prod.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.hiilo_cdn_prod.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  # Custom error pages
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # For custom domain, uncomment and configure:
    # acm_certificate_arn = aws_acm_certificate.cdn.arn
    # ssl_support_method  = "sni-only"
  }

  tags = {
    Name        = "Hiilo CDN Production"
    Environment = "production"
  }
}

# IAM User for GitHub Actions to sync CDN
resource "aws_iam_user" "cdn_sync" {
  name = "hiilo-cdn-sync"
  path = "/system/"

  tags = {
    Name    = "Hiilo CDN Sync User"
    Purpose = "GitHub Actions CDN deployment"
  }
}

# IAM Policy for CDN sync
resource "aws_iam_policy" "cdn_sync" {
  name        = "HiiloCDNSyncPolicy"
  description = "Policy for syncing CDN assets from GitHub Actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.hiilo_cdn_dev.arn,
          "${aws_s3_bucket.hiilo_cdn_dev.arn}/*",
          aws_s3_bucket.hiilo_cdn_prod.arn,
          "${aws_s3_bucket.hiilo_cdn_prod.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = [
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.hiilo_cdn_dev.id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.hiilo_cdn_prod.id}"
        ]
      }
    ]
  })
}

# Attach policy to CDN sync user
resource "aws_iam_user_policy_attachment" "cdn_sync" {
  user       = aws_iam_user.cdn_sync.name
  policy_arn = aws_iam_policy.cdn_sync.arn
}

# Create access key for GitHub Actions
resource "aws_iam_access_key" "cdn_sync" {
  user = aws_iam_user.cdn_sync.name
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}