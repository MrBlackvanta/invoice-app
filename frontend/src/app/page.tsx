import { AppRail, Signature } from "@/components/layout";

export default function Home() {
  return (
    <>
      <AppRail />
      <div className="px-6 md:px-12">
        <main className="max-w-content mx-auto pt-8 md:pt-15.25 lg:pt-19.25">
          <h1 className="text-heading md:text-display">Invoices</h1>
        </main>
        <footer className="max-w-content relative mx-auto h-16">
          <Signature />
        </footer>
      </div>
    </>
  );
}
