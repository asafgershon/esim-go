# SES DNS Configuration Guide

## Domain Verification Status

| Domain | Verification | DKIM |
|--------|--------------|------|
| hiiloworld.com | ✅ Success | ✅ Success |
| hiiilo.yarinsa.me | ✅ Success | ✅ Success |
| yarinsa.me | ✅ Success | ✅ Success |
| hiilo.awsapps.com | ✅ Success | ✅ Success |
| hiilo.yarinsa.me | ❌ Failed | ❌ Not Started |

## DNS Records Required

### Domain Verification (TXT Records)
Add these TXT records to your domain's DNS:

```
_amazonses.{domain} TXT "{verification_token}"
```

### DKIM Configuration (CNAME Records)
For each domain, add 3 CNAME records:

```
{token1}._domainkey.{domain} CNAME {token1}.dkim.amazonses.com
{token2}._domainkey.{domain} CNAME {token2}.dkim.amazonses.com
{token3}._domainkey.{domain} CNAME {token3}.dkim.amazonses.com
```

### SPF Record (TXT)
Add to your domain's root:

```
"v=spf1 include:amazonses.com ~all"
```

### DMARC Record (TXT)
Add as _dmarc.{domain}:

```
"v=DMARC1; p=quarantine; rua=mailto:admin@{domain}"
```

## Fixing hiilo.yarinsa.me

The domain hiilo.yarinsa.me needs to be re-verified:
1. Add the TXT record for verification
2. Enable DKIM after verification succeeds
3. Add the DKIM CNAME records

## WorkMail Integration

The INBOUND_MAIL receipt rule set is managed by WorkMail for:
- hiilo.awsapps.com
- hiiloworld.com

This handles incoming emails to these domains and routes them to WorkMail.

## Best Practices

1. **Always use Configuration Sets**: Track email metrics
2. **Set up SNS notifications**: Monitor bounces and complaints
3. **Use DKIM**: Improve deliverability
4. **Monitor sending quota**: Check GetSendQuota regularly
5. **Implement retry logic**: Handle throttling gracefully