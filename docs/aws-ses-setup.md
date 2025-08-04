# AWS SES Setup for Hiilo eSIM-Go

## Configuration Complete ✅

### Verified Domains
- `hiiloworld.com` - Primary domain for customer communications
- `hiilo.yarinsa.me` - Development/testing domain

### IAM Permissions
The `hiilo-esim-service` IAM user has been configured with:
- Full SES access through the `hiilo-developers` group
- Specific sending permissions for `@hiiloworld.com` and `@hiilo.yarinsa.me` addresses
- Read access to SES statistics and quotas

### Configuration Set
- **Name**: `hiilo-esim-emails`
- **Purpose**: Tracks all emails sent through the platform for metrics and cost allocation

## Cost Tracking & Budgeting

### How SES Costs Are Tracked

1. **IAM User Attribution**: All SES API calls made with `hiilo-esim-service` credentials are automatically attributed to this user
2. **AWS Cost Explorer**: View costs by:
   - Navigate to AWS Cost Explorer
   - Filter by Service: "Amazon Simple Email Service"
   - Filter by User: "hiilo-esim-service"
   - Group by Usage Type to see:
     - Email sending costs
     - Attachment costs
     - Incoming email costs

### Pricing Structure (US East 1)
- **First 62,000 emails/month**: Free (if sent from EC2)
- **Additional emails**: $0.10 per 1,000 emails
- **Attachments**: $0.12 per GB
- **Incoming emails**: $0.10 per 1,000 emails

### Setting Up Budget Alerts

To set up cost alerts for SES:

```bash
aws budgets create-budget \
  --account-id 052299608953 \
  --budget file://ses-budget.json \
  --notifications-with-subscribers file://ses-notifications.json
```

### Usage in Application

```javascript
// Example: Sending email with cost tracking
const AWS = require('aws-sdk');

const ses = new AWS.SES({
  region: process.env.AWS_SES_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const params = {
  Source: 'noreply@hiiloworld.com',
  Destination: {
    ToAddresses: ['customer@example.com']
  },
  Message: {
    Subject: { Data: 'Your eSIM is ready!' },
    Body: { Text: { Data: 'Activation instructions...' } }
  },
  ConfigurationSetName: 'hiilo-esim-emails', // Important for tracking
  Tags: [
    { Name: 'Project', Value: 'eSIM-Go' },
    { Name: 'Type', Value: 'Activation' }
  ]
};

await ses.sendEmail(params).promise();
```

## Monitoring Dashboard

Access SES metrics:
1. CloudWatch > Metrics > SES
2. Filter by Configuration Set: `hiilo-esim-emails`
3. Available metrics:
   - Send rate
   - Bounce rate
   - Complaint rate
   - Delivery rate

## Monthly Cost Report

To generate a monthly SES cost report:

```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{
    "And": [
      {"Dimensions": {"Key": "SERVICE", "Values": ["Amazon Simple Email Service"]}},
      {"Dimensions": {"Key": "LINKED_ACCOUNT", "Values": ["052299608953"]}}
    ]
  }'
```

## Important Notes

1. **Sandbox Mode**: Currently in SES sandbox. To send to unverified addresses, request production access
2. **Sending Limits**: Check current limits with `aws ses get-send-quota`
3. **Bounce Handling**: Set up SNS topics for bounce/complaint notifications
4. **DKIM/SPF**: Already configured for both domains
5. **Cost Attribution**: All costs appear under the `hiilo-esim-service` IAM user for easy tracking