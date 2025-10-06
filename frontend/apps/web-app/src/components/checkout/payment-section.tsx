"use client";

import { useState } from "react";
import { Label, Input, Card, Button } from "@workspace/ui";
import { CreditCard, Lock, ArrowLeft } from "lucide-react";
import { SectionHeader } from "./section-header";

interface PaymentIntentUrls {
  paymentIntentId?: string;
  url?: string;
  applePayJavaScriptUrl?: string;
}

interface PaymentSectionProps {
  sectionNumber?: number;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  expiry: string;
  setExpiry: (v: string) => void;
  cvv: string;
  setCvv: (v: string) => void;
  onPaymentSubmit: (paymentMethodId: string) => Promise<void>;
  isProcessing?: boolean;
  canSubmit?: boolean;
  isCompleted?: boolean;
  paymentIntentUrls?: PaymentIntentUrls;
}

export function PaymentSection({
  sectionNumber,
  cardNumber,
  setCardNumber,
  expiry,
  setExpiry,
  cvv,
  setCvv,
  onPaymentSubmit,
  isProcessing = false,
  isCompleted = false,
  paymentIntentUrls,
}: PaymentSectionProps) {
  const [isCreatingPaymentMethod, setIsCreatingPaymentMethod] = useState(false);

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, "");
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setExpiry(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 4);
    setCvv(value);
  };

  const handlePaymentSubmit = async () => {
    setIsCreatingPaymentMethod(true);
    try {
      // TODO: Integration with real payment provider (Stripe, etc.)
      // For now, create a mock payment method ID
      const mockPaymentMethodId = `pm_mock_${Date.now()}`;

      // In real implementation, this would be:
      // const paymentMethod = await stripe.createPaymentMethod({
      //   type: 'card',
      //   card: cardElement,
      // });

      // Send payment method to backend - backend will process and wait for webhook
      await onPaymentSubmit(mockPaymentMethodId);
    } catch (error) {
      console.error("Payment submission failed:", error);
    } finally {
      setIsCreatingPaymentMethod(false);
    }
  };

  const handleContinueToPayment = () => {
    if (paymentIntentUrls?.url) {
      // Redirect to EasyCard payment page
      window.location.href = paymentIntentUrls.url;
    }
  };

  return (
    <Card className="relative" dir="rtl">
      <SectionHeader
        sectionNumber={sectionNumber || 4}
        title="פרטי תשלום"
        icon={<CreditCard className="h-5 w-5 text-primary" />}
        isCompleted={isCompleted}
      />

      <div className="space-y-4">
        {/* Show payment options if payment intent is available */}
        {paymentIntentUrls?.url ? (
          <>
            {/* Continue to Payment Button */}
            <Button
              onClick={handleContinueToPayment}
              disabled={isProcessing}
              className="w-full h-12 text-lg font-medium"
              variant="default"
            >
              {isProcessing ? (
                "מעבד תשלום..."
              ) : (
                <>
                  המשך לתשלום מאובטח
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Apple Pay Button (if available) */}
            {paymentIntentUrls.applePayJavaScriptUrl && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">או</span>
                </div>
              </div>
            )}

            {paymentIntentUrls.applePayJavaScriptUrl && (
              <Button
                onClick={() => {
                  // TODO: Implement Apple Pay integration
                  console.log("Apple Pay integration coming soon");
                }}
                className="w-full h-12 text-lg font-medium bg-black hover:bg-gray-800"
              >
                <svg className="h-6 w-auto mr-2" viewBox="0 0 165 165" fill="white">
                  <path d="M150.734 78.731c-.275-28.539 23.288-42.213 24.336-42.875-13.248-19.381-33.872-22.023-41.214-22.336-17.539-1.774-34.221 10.325-43.12 10.325-8.877 0-22.601-10.067-37.129-9.801-19.115.271-36.735 11.114-46.563 28.223-19.854 34.402-5.082 85.349 14.278 113.3 9.467 13.69 20.755 29.066 35.583 28.523 14.278-.572 19.682-9.241 36.948-9.241 17.249 0 22.098 9.241 37.152 8.954 15.349-.282 25.098-13.963 34.467-27.725 10.852-15.89 15.317-31.273 15.583-32.062-.338-.155-29.893-11.478-30.171-45.509zM121.773 29.371c7.873-9.546 13.185-22.807 11.735-36.029-11.35.462-25.098 7.564-33.241 17.11-7.304 8.434-13.701 21.9-11.975 34.825 12.667.981 25.607-6.434 33.481-15.906z"/>
                </svg>
                 Apple Pay
              </Button>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">או הזן פרטי כרטיס</span>
              </div>
            </div>
          </>
        ) : null}

        {/* Card Input Fields (always shown as fallback) */}
        <div className="space-y-2">
          <Label htmlFor="cardNumber">מספר כרטיס</Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            className="font-mono"
            dir="ltr"
          />
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">תאריך תפוגה</Label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              maxLength={5}
              className="font-mono"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
              maxLength={4}
              className="font-mono"
              dir="ltr"
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <Lock className="h-4 w-4" />
          <span>פרטי התשלום שלך מוצפנים ומאובטחים</span>
        </div>

        {/* Payment Submit Button (for card payment) */}
        {!paymentIntentUrls?.url && (
          <Button
            onClick={handlePaymentSubmit}
            disabled={false}
            // disabled={!canSubmit || !isPaymentValid || isCreatingPaymentMethod || isProcessing}
            className="w-full h-12 text-lg font-medium"
          >
            {isCreatingPaymentMethod
              ? "יוצר אמצעי תשלום..."
              : isProcessing
              ? "מעבד תשלום..."
              : "שלח תשלום"}
          </Button>
        )}
      </div>
    </Card>
  );
}
