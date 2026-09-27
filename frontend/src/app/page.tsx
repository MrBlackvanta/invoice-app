import { AppRail, Signature } from "@/components/layout";
import { InvoiceList, InvoiceScreen } from "@/views";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppRail />
      <Suspense fallback={<InvoiceList />}>
        <InvoiceScreen />
      </Suspense>
      <footer className="px-6 md:px-12">
        <div className="max-w-content relative mx-auto h-16">
          <Signature />
        </div>
      </footer>
    </div>
  );
}
