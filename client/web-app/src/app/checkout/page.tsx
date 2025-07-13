import { Suspense } from "react";
import { CheckoutContainer } from "@/components/checkout/checkout-container";
import { AutoAuthPrompt } from "@/components/auto-auth-prompt";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Auto Authentication Prompt - triggers automatically based on device */}
      <AutoAuthPrompt />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <span className="text-xl font-bold text-primary-foreground">
                🌍
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">Hiilo</span>
          </div>
          <div className="text-sm text-muted-foreground">תשלום</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>טוען...</div>}>
          <CheckoutContainer />
        </Suspense>
      </main>
    </div>
  );
}
