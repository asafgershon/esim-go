import { Suspense } from "react";
import { AutoAuthPrompt } from "@/components/auto-auth-prompt";
import CheckoutHandler from "./checkout-handler";

interface CheckoutPageProps {
  searchParams: Promise<{
    token?: string;
    numOfDays?: string;
    countryId?: string;
    regionId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Auto Authentication Prompt - triggers automatically based on device */}
      <AutoAuthPrompt />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-primary font-extrabold">Hiii</span>
              <span className="text-foreground font-medium">lo</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="p-8 text-center">טוען הזמנה...</div>}>
          <CheckoutHandler searchParams={params} />
        </Suspense>
      </main>
    </div>
  );
}
