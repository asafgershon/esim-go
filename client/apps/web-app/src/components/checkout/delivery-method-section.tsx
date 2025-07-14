"use client";

import { cn } from "@/lib/utils";
import { Card, Input, Label } from "@workspace/ui";
import { Mail, QrCode, Truck } from "lucide-react";

interface DeliveryMethodSectionProps {
  sectionNumber?: number;
  selectedMethod: "qr" | "email";
  setSelectedMethod: (method: "qr" | "email") => void;
  email: string;
  setEmail: (email: string) => void;
}

export function DeliveryMethodSection({ sectionNumber, selectedMethod, setSelectedMethod, email, setEmail }: DeliveryMethodSectionProps) {

  const deliveryOptions = [
    {
      id: "qr" as const,
      name: "QR Code",
      description: "הפעלה מיידית באמצעות QR Code",
      icon: QrCode,
      recommended: true,
    },
    {
      id: "email" as const,
      name: "משלוח למייל",
      description: "קבלת eSIM באמצעות מייל",
      icon: Mail,
      recommended: false,
    },
  ];

  return (
    <Card className="p-6 relative" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        {sectionNumber && (
          <div className="bg-primary/80 text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-md font-bold shadow-lg">
            {sectionNumber}
          </div>
        )}
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">שיטת משלוח</h2>
      </div>

      <div className="space-y-4">
        {/* Delivery Options */}
        <div className="grid gap-3">
          {deliveryOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "relative flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
                selectedMethod === option.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => setSelectedMethod(option.id)}
            >
              {/* Radio Button */}
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    selectedMethod === option.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedMethod === option.id && (
                    <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                  )}
                </div>
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
                <option.icon className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{option.name}</h3>
                  {option.recommended && (
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      מומלץ
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Email Input for Email Delivery */}
        {selectedMethod === "email" && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <Label htmlFor="deliveryEmail">כתובת מייל</Label>
            <Input
              id="deliveryEmail"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              נשלח את פרטי הפעלת ה-eSIM לכתובת המייל הזו
            </p>
          </div>
        )}

        {/* QR Code Info */}
        {selectedMethod === "qr" && (
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-start gap-3">
              <QrCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">הפעלה מיידית</h4>
                <p className="text-xs text-muted-foreground">
                  לאחר הרכישה, תקבל QR Code לסריקה עם מצלמת הטלפון שלך. 
                  ה-eSIM יופעל מיידית ללא כל הגדרה נוספת.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 