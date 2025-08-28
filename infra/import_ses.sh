#!/bin/bash

# Import script for existing SES resources

echo "Importing SES Domain Identities..."
terraform import aws_ses_domain_identity.hiiloworld hiiloworld.com
terraform import aws_ses_domain_identity.hiiilo_yarinsa hiiilo.yarinsa.me
terraform import aws_ses_domain_identity.yarinsa yarinsa.me
terraform import aws_ses_domain_identity.hiilo_awsapps hiilo.awsapps.com
terraform import aws_ses_domain_identity.hiilo_yarinsa hiilo.yarinsa.me

echo "Importing SES Domain DKIM..."
terraform import aws_ses_domain_dkim.hiiloworld hiiloworld.com
terraform import aws_ses_domain_dkim.hiiilo_yarinsa hiiilo.yarinsa.me
terraform import aws_ses_domain_dkim.yarinsa yarinsa.me
terraform import aws_ses_domain_dkim.hiilo_awsapps hiilo.awsapps.com
terraform import aws_ses_domain_dkim.hiilo_yarinsa hiilo.yarinsa.me

echo "Importing SES Email Identities..."
terraform import aws_ses_email_identity.yarinsasson2 yarinsasson2@gmail.com
terraform import aws_ses_email_identity.liad "Liad@lg-adv.com"
terraform import aws_ses_email_identity.rango "rango@fielderz.com"

echo "Importing SES Configuration Set..."
terraform import aws_ses_configuration_set.hiilo_esim_emails hiilo-esim-emails

echo "Done! Now run 'terraform plan' to verify the import."