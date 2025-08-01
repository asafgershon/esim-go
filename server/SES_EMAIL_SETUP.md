# Amazon SES Email Domain Setup

## Overview
The eSIM Go platform now uses environment-based email domains for Amazon SES:
- **Production**: `hiiloworld.com`
- **Development**: `hiiilo.yarinsa.me`

## Environment Variable
```env
# Production
SES_EMAIL_DOMAIN=hiiloworld.com

# Development  
SES_EMAIL_DOMAIN=hiiilo.yarinsa.me
```

## How It Works
The `SESEmailService` automatically constructs the "from" email as `noreply@{SES_EMAIL_DOMAIN}`.

### Override Option
You can still override with a specific email address using:
```env
SES_FROM_EMAIL=custom@example.com
```

## DNS Setup for hiiilo.yarinsa.me

Add these records to your DNS for the development subdomain:

### TXT Record (Domain Verification)
- **Type:** TXT
- **Name:** _amazonses.hiiilo
- **Value:** RcLjJyZ9EfO8mBEmr7JL5vLdqn6xrJUzFwt5k6BVmCc=

### CNAME Records (DKIM)
You'll need to generate DKIM tokens for the subdomain using:
```bash
aws ses verify-domain-dkim --domain hiiilo.yarinsa.me --region us-east-1
```

## Verification Status
- ✅ `hiiloworld.com` - Verified with DKIM
- ⏳ `hiiilo.yarinsa.me` - Pending DNS setup

## Migration Notes
The `SES_FROM_EMAIL` variable is now deprecated but still supported for backward compatibility.