"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@workspace/ui";
import { Button } from "@workspace/ui";
import { useAuth } from "@/hooks/useAuth";
import { OrderDetailsSection } from "./order-details-section";
import { PaymentSection } from "./payment-section";
import { LoginSection } from "./login-section";
import { DeliveryMethodSection } from "./delivery-method-section";

export function CheckoutContainer() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get checkout parameters from URL
  const numOfDays = parseInt(searchParams.get("numOfDays") || "7");
  const countryId = searchParams.get("countryId");
  const tripId = searchParams.get("tripId");
  const totalPrice = parseFloat(searchParams.get("totalPrice") || "0");

  const [email, setEmail] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"qr" | "email">("qr");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Helper to check if payment info is valid
  const isPaymentValid = cardNumber.length >= 16 && expiry.length === 5 && cvv.length >= 3;
  const isDeliveryValid = selectedMethod === "qr" || (selectedMethod === "email" && email.length > 3);

  const allSectionsCompleted = isAuthenticated && isPaymentValid && isDeliveryValid;

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
            sectionNumber={1}
          />
          <DeliveryMethodSection 
            sectionNumber={2}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            email={email}
            setEmail={setEmail}
          />
        </div>
        {/* Right Column - Payment & Login */}
        <div className="space-y-6">
          <LoginSection sectionNumber={3} />
          <PaymentSection 
            sectionNumber={4}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            expiry={expiry}
            setExpiry={setExpiry}
            cvv={cvv}
            setCvv={setCvv}
          />
          {/* Purchase Button */}
          <Card className="p-6">
            <Button
              onClick={handlePurchase}
              disabled={!allSectionsCompleted || isProcessing}
              className="w-full h-12 text-lg font-medium"
            >
              {isProcessing 
                ? "מעבד..." 
                : "קבל קוד"
              }
            </Button>
            {!allSectionsCompleted && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                יש להשלים את כל השלבים כדי להמשיך
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 