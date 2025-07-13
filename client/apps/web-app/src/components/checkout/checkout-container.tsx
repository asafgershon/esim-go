"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { OrderDetailsSection } from "./order-details-section";
import { PaymentSection } from "./payment-section";
import { LoginSection } from "./login-section";
import { DeliveryMethodSection } from "./delivery-method-section";

export function CheckoutContainer() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Get checkout parameters from URL
  const numOfDays = parseInt(searchParams.get("numOfDays") || "7");
  const countryId = searchParams.get("countryId");
  const tripId = searchParams.get("tripId");
  const totalPrice = parseFloat(searchParams.get("totalPrice") || "0");

  const handlePurchase = async () => {
    setIsProcessing(true);
    // TODO: Implement purchase logic
    console.log("Processing purchase...");
    setTimeout(() => {
      setIsProcessing(false);
      alert("Purchase completed! (This is a placeholder)");
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <OrderDetailsSection 
            numOfDays={numOfDays}
            countryId={countryId}
            tripId={tripId}
            totalPrice={totalPrice}
          />
          
          <DeliveryMethodSection />
        </div>

        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          <LoginSection />
          
          <PaymentSection />
          
          {/* Purchase Button */}
          <Card className="p-6">
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || !isAuthenticated || authLoading}
              className="w-full h-12 text-lg font-medium"
            >
              {isProcessing 
                ? "מעבד..." 
                : !isAuthenticated 
                  ? "אנא התחבר כדי להמשיך" 
                  : "השלם רכישה"
              }
            </Button>
            
            {!isAuthenticated && !authLoading && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                עליך להיות מחובר כדי להשלים את הרכישה
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 