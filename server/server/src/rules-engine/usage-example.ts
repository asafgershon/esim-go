import { PricingRuleEngine } from './rule-engine';
import { RuleBuilder } from './rule-builder';
import type { PricingContext } from './types';
import { RuleType } from '../types';

// Example usage of the pricing rule engine with streaming

async function demonstratePricingEngine() {
  // Create the engine
  const engine = new PricingRuleEngine();
  
  // Add system rules (markup and processing)
  engine.addSystemRules([
    new RuleBuilder()
      .name("Standard Unlimited Lite 7-day Markup")
      .type(RuleType.SystemMarkup)
      .when()
        .bundleGroup().equals("Standard - Unlimited Lite")
      .when()
        .duration().equals(7)
      .then()
        .addMarkup(12.00)
      .priority(100)
      .build(),
      
    new RuleBuilder()
      .name("Israeli Card Processing")
      .type(RuleType.SystemProcessing)
      .when()
        .field("paymentMethod").equals("ISRAELI_CARD")
      .then()
        .setProcessingRate(1.4)
      .priority(90)
      .build()
  ]);
  
  // Add business rules
  engine.addRules([
    new RuleBuilder()
      .name("Germany 20% Discount")
      .type(RuleType.BusinessDiscount)
      .when()
        .country().equals("DE")
      .then()
        .applyDiscount(20)
      .priority(50)
      .build(),
      
    new RuleBuilder()
      .name("Europe Unlimited Special")
      .type(RuleType.BusinessDiscount)
      .when()
        .region().equals("Europe")
      .when()
        .field("bundle.isUnlimited").equals(true)
      .then()
        .applyDiscount(15)
      .priority(40)
      .build()
  ]);
  
  // Create pricing context
  const context: PricingContext = {
    bundle: {
      id: "bundle-123",
      name: "Germany Unlimited 7 Days",
      group: "Standard - Unlimited Lite",
      duration: 7,
      cost: 15.00,
      countryId: "DE",
      countryName: "Germany",
      regionId: "EU",
      regionName: "Europe",
      isUnlimited: true,
      dataAmount: "Unlimited"
    },
    user: {
      id: "user-456",
      isNew: false,
      isFirstPurchase: false,
      purchaseCount: 3,
      segment: "regular"
    },
    paymentMethod: "ISRAELI_CARD",
    requestedDuration: 5, // User only needs 5 days
    currentDate: new Date(),
    // Helper fields
    country: "DE",
    region: "Europe",
    bundleGroup: "Standard - Unlimited Lite",
    duration: 7
  };
  
  console.log("=== STREAMING PRICING CALCULATION ===\n");
  
  // Example 1: Stream pricing steps in real-time
  console.log("1. Streaming each step:");
  for await (const step of engine.calculatePriceSteps(context)) {
    console.log(`[${step.type}] ${step.message}`);
    
    // You could send these to a WebSocket or SSE stream
    if ('data' in step) {
      console.log("  Data:", JSON.stringify(step.data, null, 2));
    }
    
    // Simulate real-time delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("\n=== FINAL CALCULATION ===\n");
  
  // Example 2: Get just the final result
  const result = await engine.calculatePrice(context);
  
  console.log("Final Pricing Breakdown:");
  console.log(`- Base Cost: $${result.baseCost.toFixed(2)}`);
  console.log(`- Markup: $${result.markup.toFixed(2)}`);
  console.log(`- Subtotal: $${result.subtotal.toFixed(2)}`);
  
  console.log("\nDiscounts Applied:");
  result.discounts.forEach(discount => {
    console.log(`- ${discount.ruleName}: -$${discount.amount.toFixed(2)} (${discount.type})`);
  });
  
  console.log(`\nTotal Discount: -$${result.totalDiscount.toFixed(2)}`);
  console.log(`Price After Discount: $${result.priceAfterDiscount.toFixed(2)}`);
  console.log(`Processing Fee (${(result.processingRate * 100).toFixed(1)}%): $${result.processingFee.toFixed(2)}`);
  console.log(`\nFinal Price: $${result.finalPrice.toFixed(2)}`);
  console.log(`Final Revenue: $${result.finalRevenue.toFixed(2)}`);
  console.log(`Revenue After Processing: $${result.revenueAfterProcessing.toFixed(2)}`);
  console.log(`Profit: $${result.profit.toFixed(2)}`);
  
  console.log("\nRecommendations:");
  console.log(`- Max Recommended Price: $${result.maxRecommendedPrice.toFixed(2)}`);
  console.log(`- Max Discount %: ${result.maxDiscountPercentage.toFixed(1)}%`);
  
  console.log("\nApplied Rules:");
  result.appliedRules.forEach(rule => {
    console.log(`- ${rule.name} (${rule.type}): Impact $${rule.impact.toFixed(2)}`);
  });
  
  // Example 3: Use in GraphQL subscription
  console.log("\n=== GRAPHQL SUBSCRIPTION EXAMPLE ===\n");
  
  // This could be used in a GraphQL subscription resolver
  async function* pricingSubscription(context: PricingContext) {
    for await (const update of engine.streamPricing(context)) {
      yield {
        pricingUpdate: update
      };
    }
  }
  
  // Simulate subscription
  for await (const update of pricingSubscription(context)) {
    if ('type' in update.pricingUpdate) {
      console.log(`Subscription Update: ${update.pricingUpdate.type}`);
    } else {
      console.log("Subscription Complete: Final price $" + update.pricingUpdate.finalPrice.toFixed(2));
    }
  }
}

// Run the demonstration
if (require.main === module) {
  demonstratePricingEngine().catch(console.error);
}