# eSIM Go Platform Purchase Flow Implementation Plan

## Executive Overview

This plan outlines a comprehensive purchase flow for the eSIM Go platform that implements on-demand bundle purchasing without inventory holding. The architecture leverages the generated client with minimal abstraction while ensuring robust error handling and seamless user experience from selection to eSIM delivery.

## Core Architecture Principles

**On-Demand Purchasing**: Bundles are purchased from eSIM Go only when a customer completes a transaction, eliminating inventory management complexity and reducing financial risk.

**Minimal Abstraction**: Direct use of the generated eSIM Go client methods with thin wrapper functions only where necessary for error handling and logging.

**Idempotent Operations**: All critical operations designed to be safely retryable without side effects, ensuring reliability in distributed systems.

## Complete Purchase Flow Architecture

### Phase 1: Bundle Selection and Availability Check

**User Actions**:
1. User browses available eSIM bundles on web-app
2. Selects destination country and data package
3. Chooses bundle duration and features

**Technical Implementation**:
```typescript
// Endpoint: GET /api/bundles/available
async function getAvailableBundles(countryCode: string) {
  // Call eSIM Go API using generated client
  const bundles = await esimGoClient.bundles.list({
    country: countryCode,
    status: 'ACTIVE'
  });
  
  // Transform and cache bundle data (5 min TTL)
  return transformBundleData(bundles);
}

// Endpoint: POST /api/bundles/validate-availability
async function validateBundleAvailability(bundleId: string) {
  // Real-time availability check before checkout
  const bundle = await esimGoClient.bundles.get(bundleId);
  
  if (!bundle.available || bundle.stock === 0) {
    throw new BundleUnavailableError(bundleId);
  }
  
  return { available: true, bundle };
}
```

**Integration Points**:
- `GET /v1/bundles` - List available bundles by country
- `GET /v1/bundles/{bundleId}` - Verify specific bundle availability

### Phase 2: Checkout and Payment Processing

**User Actions**:
1. Proceeds to checkout with selected bundle
2. Enters payment information
3. Confirms purchase

**Technical Implementation**:
```typescript
// checkout-resolvers.ts enhancement
async function createCheckoutSession(input: CheckoutInput) {
  // 1. Create pending order in database
  const order = await db.orders.create({
    userId: ctx.user.id,
    bundleId: input.bundleId,
    status: 'PENDING',
    idempotencyKey: generateIdempotencyKey(),
  });
  
  // 2. Create payment intent with payment provider
  const paymentIntent = await paymentProvider.createIntent({
    amount: bundle.price,
    currency: bundle.currency,
    metadata: { orderId: order.id }
  });
  
  // 3. Return checkout session data
  return {
    orderId: order.id,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.clientSecret
  };
}
```

**State Management**:
- Order states: `PENDING` → `PAYMENT_PROCESSING` → `PAID` → `PROVISIONING` → `DELIVERED` → `ACTIVATED`
- Each state transition logged with timestamp and metadata

### Phase 3: eSIM Bundle Purchase from eSIM Go

**Trigger**: Successful payment confirmation webhook

**Technical Implementation**:
```typescript
// Webhook handler for payment confirmation
async function handlePaymentSuccess(webhookData: PaymentWebhook) {
  const order = await db.orders.findByPaymentIntent(webhookData.paymentIntentId);
  
  try {
    // Update order status
    await db.orders.update(order.id, { status: 'PAID' });
    
    // Purchase bundle from eSIM Go
    const purchaseResult = await purchaseBundle(order);
    
    // Trigger provisioning
    await provisionESIM(order, purchaseResult);
    
  } catch (error) {
    await handlePurchaseError(order, error);
  }
}

// Core bundle purchase function
async function purchaseBundle(order: Order) {
  // Implement exponential backoff for retries
  return await retryWithBackoff(async () => {
    const response = await esimGoClient.orders.create({
      bundleId: order.bundleId,
      quantity: 1,
      referenceId: order.id, // Our order ID for tracking
      customerEmail: order.customerEmail,
      webhook: {
        url: `${BASE_URL}/webhooks/esim-go/provisioning`,
        events: ['order.completed', 'order.failed']
      }
    });
    
    // Store eSIM Go order details
    await db.orders.update(order.id, {
      esimGoOrderId: response.orderId,
      status: 'PROVISIONING'
    });
    
    return response;
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  });
}
```

**Integration Points**:
- `POST /v1/orders` - Create purchase order
- `GET /v1/orders/{orderId}` - Check order status
- `POST /v1/orders/{orderId}/cancel` - Cancel failed orders

### Phase 4: eSIM Profile Generation and Delivery

**Process**: eSIM Go generates profile and sends activation details

**Technical Implementation**:
```typescript
// Webhook handler for eSIM Go provisioning
async function handleESIMProvisioning(webhook: ESIMWebhook) {
  const order = await db.orders.findByESIMOrderId(webhook.orderId);
  
  if (webhook.status === 'completed') {
    // Extract eSIM activation details
    const activationData = {
      qrCode: webhook.data.qrCodeUrl,
      activationCode: webhook.data.activationCode,
      smdpAddress: webhook.data.smdpAddress,
      matchingId: webhook.data.matchingId,
      confirmationCode: webhook.data.confirmationCode
    };
    
    // Store activation data
    await db.esimActivations.create({
      orderId: order.id,
      ...activationData,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    // Update order status
    await db.orders.update(order.id, { status: 'DELIVERED' });
    
    // Send delivery notification
    await notifyCustomer(order, activationData);
    
  } else if (webhook.status === 'failed') {
    await handleProvisioningFailure(order, webhook.error);
  }
}

// Customer notification function
async function notifyCustomer(order: Order, activation: ActivationData) {
  // Email with QR code and instructions
  await emailService.send({
    to: order.customerEmail,
    template: 'esim-delivery',
    data: {
      qrCodeUrl: activation.qrCode,
      manualActivation: {
        smdpAddress: activation.smdpAddress,
        activationCode: activation.activationCode
      },
      installationGuide: getDeviceSpecificInstructions(order.deviceType)
    }
  });
  
  // In-app notification
  await pushNotificationService.send({
    userId: order.userId,
    title: 'Your eSIM is ready!',
    body: 'Tap to install your eSIM profile',
    data: { orderId: order.id }
  });
}
```

**Integration Points**:
- Webhook: `/webhooks/esim-go/provisioning` - Receive provisioning status
- `GET /v1/orders/{orderId}/esim` - Retrieve eSIM details

### Phase 5: eSIM Installation and Activation

**User Actions**:
1. Receives eSIM delivery notification
2. Scans QR code or enters manual activation details
3. Installs eSIM profile on device

**Technical Implementation**:
```typescript
// Endpoint: GET /api/orders/{orderId}/activation
async function getActivationDetails(orderId: string) {
  const activation = await db.esimActivations.findByOrderId(orderId);
  
  // Security check
  if (activation.userId !== ctx.user.id) {
    throw new UnauthorizedError();
  }
  
  // Check expiration
  if (activation.expiresAt < new Date()) {
    throw new ActivationExpiredError();
  }
  
  // Log access for security
  await db.activationAccessLogs.create({
    activationId: activation.id,
    accessedAt: new Date(),
    ipAddress: ctx.ipAddress
  });
  
  return {
    qrCode: activation.qrCode,
    manual: {
      smdpAddress: activation.smdpAddress,
      activationCode: activation.activationCode,
      confirmationCode: activation.confirmationCode
    },
    instructions: getInstallationInstructions(ctx.deviceInfo)
  };
}

// Endpoint: POST /api/orders/{orderId}/confirm-activation
async function confirmActivation(orderId: string) {
  // User confirms successful installation
  await db.orders.update(orderId, { 
    status: 'ACTIVATED',
    activatedAt: new Date()
  });
  
  // Notify eSIM Go of activation (if supported)
  await esimGoClient.orders.updateStatus(order.esimGoOrderId, {
    status: 'ACTIVATED',
    activatedAt: new Date().toISOString()
  });
}
```

## Error Handling Strategy

### Network and Timeout Errors

```typescript
class ESIMGoAPIError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public retryable: boolean,
    message: string
  ) {
    super(message);
  }
}

async function handleAPIError(error: any, order: Order) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    // Network errors - retry with backoff
    await scheduleRetry(order, 'NETWORK_ERROR', 5 * 60 * 1000); // 5 min
    
  } else if (error.statusCode >= 500) {
    // Server errors - retry with longer backoff
    await scheduleRetry(order, 'SERVER_ERROR', 15 * 60 * 1000); // 15 min
    
  } else if (error.statusCode === 429) {
    // Rate limit - respect retry-after header
    const retryAfter = error.headers['retry-after'] || 60;
    await scheduleRetry(order, 'RATE_LIMITED', retryAfter * 1000);
    
  } else if (error.statusCode === 402) {
    // Payment required - insufficient balance
    await handleInsufficientBalance(order);
    
  } else {
    // Non-retryable errors
    await failOrder(order, error);
  }
}
```

### Bundle Availability Errors

```typescript
async function handleBundleUnavailable(order: Order) {
  // Check for alternative bundles
  const alternatives = await findAlternativeBundles(order.bundleId);
  
  if (alternatives.length > 0) {
    // Notify customer of alternatives
    await notifyAlternatives(order, alternatives);
  } else {
    // Initiate refund
    await initiateRefund(order);
  }
}
```

### Payment Failures

```typescript
async function handlePaymentFailure(order: Order, error: PaymentError) {
  await db.orders.update(order.id, {
    status: 'PAYMENT_FAILED',
    failureReason: error.code,
    failedAt: new Date()
  });
  
  // Cleanup any partial provisioning
  if (order.esimGoOrderId) {
    await esimGoClient.orders.cancel(order.esimGoOrderId);
  }
  
  // Notify customer
  await notifyPaymentFailure(order, error);
}
```

## Edge Cases and Solutions

### Duplicate Purchase Prevention

```typescript
async function preventDuplicatePurchase(userId: string, bundleId: string) {
  // Check for recent orders
  const recentOrder = await db.orders.findOne({
    userId,
    bundleId,
    createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }, // 5 min window
    status: { $in: ['PENDING', 'PAID', 'PROVISIONING'] }
  });
  
  if (recentOrder) {
    throw new DuplicateOrderError(recentOrder.id);
  }
}
```

### Partial Provisioning Recovery

```typescript
async function recoverPartialProvisioning(order: Order) {
  // Check eSIM Go order status
  const esimOrder = await esimGoClient.orders.get(order.esimGoOrderId);
  
  if (esimOrder.status === 'completed') {
    // Provisioning completed but webhook failed
    await processCompletedOrder(order, esimOrder);
  } else if (esimOrder.status === 'failed') {
    // Provisioning failed
    await handleProvisioningFailure(order, esimOrder.error);
  } else {
    // Still processing - schedule recheck
    await scheduleStatusCheck(order, 5 * 60 * 1000); // 5 min
  }
}
```

### Multiple Device Installation

```typescript
async function handleMultiDeviceInstallation(order: Order) {
  const activation = await db.esimActivations.findByOrderId(order.id);
  
  // Check if profile supports multiple installations
  if (activation.maxInstallations > 1) {
    await db.activationAttempts.create({
      activationId: activation.id,
      deviceId: ctx.deviceId,
      attemptedAt: new Date()
    });
    
    const attemptCount = await db.activationAttempts.count({
      activationId: activation.id
    });
    
    if (attemptCount >= activation.maxInstallations) {
      activation.qrCode = null; // Disable QR code
      await activation.save();
    }
  }
}
```

## Security Measures

### API Authentication

```typescript
// Middleware for eSIM Go webhook authentication
async function verifyESIMGoWebhook(req: Request) {
  const signature = req.headers['x-esim-go-signature'];
  const timestamp = req.headers['x-esim-go-timestamp'];
  
  // Verify timestamp is within 5 minutes
  if (Math.abs(Date.now() - parseInt(timestamp)) > 5 * 60 * 1000) {
    throw new WebhookAuthError('Timestamp too old');
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', ESIM_GO_WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(req.body)}`)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    throw new WebhookAuthError('Invalid signature');
  }
}
```

### Rate Limiting

```typescript
// Per-user purchase limits
const purchaseRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 purchases per hour
  keyGenerator: (req) => req.user.id
});

// Global API rate limits
const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
```

## Monitoring and Observability

### Key Metrics

```typescript
// Purchase funnel metrics
metrics.counter('esim.purchase.initiated', { bundle: bundleId });
metrics.counter('esim.purchase.completed', { bundle: bundleId });
metrics.counter('esim.purchase.failed', { bundle: bundleId, reason });
metrics.histogram('esim.purchase.duration', duration);

// API integration metrics
metrics.histogram('esim_go.api.latency', latency, { endpoint });
metrics.counter('esim_go.api.errors', { endpoint, error_code });

// Business metrics
metrics.gauge('esim.orders.pending', pendingCount);
metrics.gauge('esim.revenue.daily', dailyRevenue);
```

### Alerting Rules

- Purchase success rate < 95% over 15 minutes
- eSIM Go API error rate > 5% over 5 minutes
- Payment processing time > 30 seconds (p99)
- Provisioning queue depth > 100 orders
- Failed order retry queue > 50 orders

## Implementation Timeline

**Week 1-2**: Core purchase flow and payment integration
**Week 3**: eSIM Go API integration and order management
**Week 4**: Error handling and retry mechanisms
**Week 5**: Security measures and monitoring
**Week 6**: Testing, documentation, and deployment preparation

This comprehensive plan provides a robust foundation for implementing the eSIM Go purchase flow with minimal abstraction while ensuring reliability, security, and excellent user experience.