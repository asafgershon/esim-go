# SES Configuration for Email Sending

# Verified Domain Identities
resource "aws_ses_domain_identity" "hiiloworld" {
  domain = "hiiloworld.com"
}

resource "aws_ses_domain_identity" "hiiilo_yarinsa" {
  domain = "hiiilo.yarinsa.me"
}

resource "aws_ses_domain_identity" "yarinsa" {
  domain = "yarinsa.me"
}

resource "aws_ses_domain_identity" "hiilo_awsapps" {
  domain = "hiilo.awsapps.com"
}

resource "aws_ses_domain_identity" "hiilo_yarinsa" {
  domain = "hiilo.yarinsa.me"
}

# DKIM Configuration for each domain
resource "aws_ses_domain_dkim" "hiiloworld" {
  domain = aws_ses_domain_identity.hiiloworld.domain
}

resource "aws_ses_domain_dkim" "hiiilo_yarinsa" {
  domain = aws_ses_domain_identity.hiiilo_yarinsa.domain
}

resource "aws_ses_domain_dkim" "yarinsa" {
  domain = aws_ses_domain_identity.yarinsa.domain
}

resource "aws_ses_domain_dkim" "hiilo_awsapps" {
  domain = aws_ses_domain_identity.hiilo_awsapps.domain
}

# Note: hiilo.yarinsa.me has DKIM disabled and verification failed
resource "aws_ses_domain_dkim" "hiilo_yarinsa" {
  domain = aws_ses_domain_identity.hiilo_yarinsa.domain
}

# Verified Email Identities
resource "aws_ses_email_identity" "yarinsasson2" {
  email = "yarinsasson2@gmail.com"
}

resource "aws_ses_email_identity" "liad" {
  email = "Liad@lg-adv.com"
}

resource "aws_ses_email_identity" "rango" {
  email = "rango@fielderz.com"
}

# Configuration Set for tracking
resource "aws_ses_configuration_set" "hiilo_esim_emails" {
  name = "hiilo-esim-emails"
}

# Event destination for the configuration set (optional - for tracking)
resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-event-destination"
  configuration_set_name = aws_ses_configuration_set.hiilo_esim_emails.name
  enabled                = true

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "MessageTag"
    value_source   = "messageTag"
  }
  
  matching_types = [
    "send",
    "bounce",
    "complaint",
    "delivery",
    "reject"
  ]
}

# Receipt rule set for incoming emails (WorkMail integration)
# Note: This is managed by WorkMail, so we'll import but not modify
data "aws_ses_active_receipt_rule_set" "main" {}

# Output important information
output "ses_domain_verification_tokens" {
  description = "Domain verification tokens for DNS TXT records"
  value = {
    hiiloworld_com     = aws_ses_domain_identity.hiiloworld.verification_token
    hiiilo_yarinsa_me  = aws_ses_domain_identity.hiiilo_yarinsa.verification_token
    yarinsa_me         = aws_ses_domain_identity.yarinsa.verification_token
    hiilo_awsapps_com  = aws_ses_domain_identity.hiilo_awsapps.verification_token
    hiilo_yarinsa_me   = aws_ses_domain_identity.hiilo_yarinsa.verification_token
  }
  sensitive = true
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for DNS CNAME records"
  value = {
    hiiloworld_com    = aws_ses_domain_dkim.hiiloworld.dkim_tokens
    hiiilo_yarinsa_me = aws_ses_domain_dkim.hiiilo_yarinsa.dkim_tokens
    yarinsa_me        = aws_ses_domain_dkim.yarinsa.dkim_tokens
    hiilo_awsapps_com = aws_ses_domain_dkim.hiilo_awsapps.dkim_tokens
  }
  sensitive = true
}

output "ses_configuration_set" {
  description = "SES Configuration Set name for email tracking"
  value       = aws_ses_configuration_set.hiilo_esim_emails.name
}