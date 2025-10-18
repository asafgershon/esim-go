import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AutoAuthPrompt } from "@/components/auto-auth-prompt";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
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
        <div className="flex items-center justify-start">
          <Link href="/" aria-label="חזרה לעמוד הראשי">
          <div className="flex items-center">
            <Image
              src="/images/logos/logo-header.svg"
              alt="eSIM Go Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
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
