# SES IAM Policies for sending emails

# IAM user for SES sending (if needed for applications)
resource "aws_iam_user" "ses_sender" {
  name = "ses-email-sender"
  path = "/"
  
  tags = {
    Purpose = "SES email sending for applications"
  }
}

# Policy for sending emails from verified domains
resource "aws_iam_policy" "ses_send_email" {
  name        = "SESSendEmailPolicy"
  path        = "/"
  description = "Allow sending emails through SES"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
          "ses:SendBulkTemplatedEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = [
              "*@hiiloworld.com",
              "*@hiiilo.yarinsa.me",
              "*@yarinsa.me",
              "*@hiilo.awsapps.com",
              "yarinsasson2@gmail.com"
            ]
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ses:GetSendQuota",
          "ses:GetSendStatistics"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "ses_sender_policy" {
  user       = aws_iam_user.ses_sender.name
  policy_arn = aws_iam_policy.ses_send_email.arn
}

# Role for Lambda functions that send emails
resource "aws_iam_role" "ses_lambda_role" {
  name = "SESLambdaEmailRole"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Purpose = "Lambda functions sending emails via SES"
  }
}

resource "aws_iam_role_policy_attachment" "ses_lambda_policy" {
  role       = aws_iam_role.ses_lambda_role.name
  policy_arn = aws_iam_policy.ses_send_email.arn
}

resource "aws_iam_role_policy_attachment" "ses_lambda_basic" {
  role       = aws_iam_role.ses_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# SNS topic for SES notifications (bounces, complaints)
resource "aws_sns_topic" "ses_notifications" {
  name = "ses-email-notifications"
  
  tags = {
    Purpose = "SES bounce and complaint notifications"
  }
}

resource "aws_sns_topic_subscription" "ses_notifications_email" {
  topic_arn = aws_sns_topic.ses_notifications.arn
  protocol  = "email"
  endpoint  = "yarinsasson2@gmail.com"
}

# SES notification configuration for bounces and complaints
resource "aws_ses_identity_notification_topic" "hiiloworld_bounce" {
  topic_arn                = aws_sns_topic.ses_notifications.arn
  notification_type        = "Bounce"
  identity                 = aws_ses_domain_identity.hiiloworld.domain
  include_original_headers = true
}

resource "aws_ses_identity_notification_topic" "hiiloworld_complaint" {
  topic_arn                = aws_sns_topic.ses_notifications.arn
  notification_type        = "Complaint"
  identity                 = aws_ses_domain_identity.hiiloworld.domain
  include_original_headers = true
}

# Output IAM user ARN for application configuration
output "ses_sender_user_arn" {
  description = "ARN of the SES sender IAM user"
  value       = aws_iam_user.ses_sender.arn
}

output "ses_lambda_role_arn" {
  description = "ARN of the Lambda role for SES"
  value       = aws_iam_role.ses_lambda_role.arn
}

output "ses_notifications_topic_arn" {
  description = "ARN of the SNS topic for SES notifications"
  value       = aws_sns_topic.ses_notifications.arn
}