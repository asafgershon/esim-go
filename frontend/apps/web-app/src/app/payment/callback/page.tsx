import { Suspense } from "react";
import { PaymentCallbackHandler } from "./payment-callback-handler";

interface PaymentCallbackPageProps {
  searchParams: Promise<{
    transactionID?: string;
  }>;
}


export default async function PaymentCallbackPage({ searchParams }: PaymentCallbackPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-lg">מעבד תשלום...</p>
        </div>
      }>
        <PaymentCallbackHandler params={params} />
      </Suspense>
    </div>
  );
}