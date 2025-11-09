import { Suspense } from "react";
import Link from "next/link";
import { AutoAuthPrompt } from "@/components/auto-auth-prompt";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import CheckoutHandler from "./checkout-handler";
import { AnimatedHeaderLogo } from "@/components/checkout/LoadingAnimation"; // ✅ החדש

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

      {/* Auto Authentication Prompt */}
      <AutoAuthPrompt />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-start">
          <Link href="/" aria-label="חזרה לעמוד הראשי">
            <div className="flex items-center">
              <AnimatedHeaderLogo /> {/* ✅ משתמש באנימציה */}
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutHandler searchParams={params} />
        </Suspense>
      </main>
    </div>
  );
}
