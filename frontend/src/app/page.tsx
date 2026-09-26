import { AppRail, Signature } from "@/components/layout";
import { invoices } from "@/data";
import { InvoiceList } from "@/views/home";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppRail />
      <div className="flex flex-1 flex-col px-6 md:px-12">
        <main className="max-w-content mx-auto flex w-full flex-1 flex-col pt-8 md:pt-15.25 lg:pt-19.25">
          <InvoiceList invoices={invoices} />
        </main>
      </div>
      <footer className="px-6 md:px-12">
        <div className="max-w-content relative mx-auto h-16">
          <Signature />
        </div>
      </footer>
    </div>
  );
}
