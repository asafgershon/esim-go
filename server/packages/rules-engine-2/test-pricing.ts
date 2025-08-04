import { calculatePricing } from "./src/index";

async function testPricing() {
  console.log("Testing Rules Engine V2 Pricing Calculations\n");
  console.log("=" .repeat(50));

  // Test 1: Basic pricing for Australia
  console.log("\n1. Basic pricing - Australia, 7 days:");
  const result1 = await calculatePricing({
    days: 7,
    country: "AU",
    group: "Standard Unlimited Essential",
    paymentMethod: "ISRAELI_CARD"
  });
  console.log(JSON.stringify(result1.pricing, null, 2));
  
  // Test 2: International card (higher fees)
  console.log("\n2. International card payment - Australia, 7 days:");
  const result2 = await calculatePricing({
    days: 7,
    country: "AU", 
    group: "Standard Unlimited Essential",
    paymentMethod: "INTERNATIONAL_CARD"
  });
  console.log(JSON.stringify(result2.pricing, null, 2));

  // Test 3: Different duration to test unused days discount
  console.log("\n3. Unused days discount - Australia, 10 days:");
  const result3 = await calculatePricing({
    days: 10,
    country: "AU",
    group: "Standard Unlimited Essential",
    paymentMethod: "ISRAELI_CARD"
  });
  console.log(JSON.stringify(result3.pricing, null, 2));

  // Test 4: Region-based pricing
  console.log("\n4. Region pricing - Europe, 14 days:");
  const result4 = await calculatePricing({
    days: 14,
    region: "EUROPE",
    group: "Standard Unlimited Essential",
    paymentMethod: "ISRAELI_CARD"
  });
  console.log(JSON.stringify(result4.pricing, null, 2));

  // Test 5: Price comparison for different durations
  console.log("\n5. Price progression (1-10 days) for USA:");
  console.log("Days | Cost | Markup | Total | Discount | Final");
  console.log("-".repeat(55));
  
  for (let days = 1; days <= 10; days++) {
    const result = await calculatePricing({
      days,
      country: "US",
      group: "Standard Unlimited Essential",
      paymentMethod: "ISRAELI_CARD"
    });
    
    const p = result.pricing;
    console.log(
      `${days.toString().padStart(4)} | ` +
      `$${p.cost.toFixed(2).padStart(6)} | ` +
      `$${p.markup.toFixed(2).padStart(6)} | ` +
      `$${p.totalCost.toFixed(2).padStart(7)} | ` +
      `$${p.discountValue.toFixed(2).padStart(7)} | ` +
      `$${p.priceAfterDiscount.toFixed(2).padStart(7)}`
    );
  }

  console.log("\n" + "=".repeat(50));
  console.log("All tests completed successfully!");
}

testPricing().catch(console.error);