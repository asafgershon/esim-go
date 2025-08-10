"use client";

import { useState } from "react";
import { Label, Input, Card, Button } from "@workspace/ui";
import { CreditCard, Lock } from "lucide-react";
import { SectionHeader } from "./section-header";

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

  return (
    <Card className="p-6 relative" dir="rtl">
      <SectionHeader
        sectionNumber={sectionNumber || 4}
        title="פרטי תשלום"
        icon={<CreditCard className="h-5 w-5 text-primary" />}
        isCompleted={isCompleted}
      />

      <div className="space-y-4">
        {/* Card Number */}
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

        {/* Payment Submit Button */}
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
      </div>
    </Card>
  );
}
