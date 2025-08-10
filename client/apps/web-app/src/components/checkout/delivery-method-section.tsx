"use client";

import { Card } from "@workspace/ui";
import { Mail, Phone, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DeliveryMethodSectionProps {
  sectionNumber?: number;
  selectedMethod: "QR" | "EMAIL";
  setSelectedMethod: (method: "QR" | "EMAIL") => void;
  email: string;
  setEmail: (email: string) => void;
}

export function DeliveryMethodSection({ 
  sectionNumber
}: DeliveryMethodSectionProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Determine if user logged in with email (Apple/Google) or phone
  const hasUserEmail = user?.email && !user.email.includes('@phone.esim-go.com');
  const isPhoneAuth = user?.email?.includes('@phone.esim-go.com');
  const userPhone = user?.phoneNumber;

  // Only show if user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="p-6 relative bg-muted-foreground" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        {sectionNumber && (
          <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-md font-bold shadow-lg">
            {sectionNumber}
          </div>
        )}
        <Smartphone className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">אופן קבלת ה-eSIM</h2>
      </div>

      <div className="space-y-4">
        {/* Show delivery info based on auth method */}
        <div className="p-4 bg-muted rounded-lg">
          {hasUserEmail ? (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">מייל ישלח לכתובת:</p>
                  <span className="text-sm font-medium" dir="ltr">{user.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ה-eSIM יופיע כאן לאחר השלמת הרכישה
                </p>
              </div>
            </div>
          ) : isPhoneAuth && userPhone ? (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">SMS ישלח למספר:</p>
                  <span className="text-sm font-medium" dir="ltr">{userPhone}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ה-eSIM יופיע כאן לאחר השלמת הרכישה
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-2">ה-eSIM יהיה זמין כאן</p>
                <p className="text-xs text-muted-foreground">
                  ה-eSIM יופיע כאן לאחר השלמת הרכישה
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 