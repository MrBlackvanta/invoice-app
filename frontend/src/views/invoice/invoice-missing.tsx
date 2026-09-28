import { ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";

export default function InvoiceMissing() {
  return (
    <main className="flex flex-1 flex-col px-6 pt-8.25 md:px-10 md:pt-12.25 lg:px-12 lg:pt-16.25">
      <div className="max-w-content mx-auto flex w-full flex-1 flex-col">
        <Link
          href="/"
          className="text-body text-ink hover:text-muted group flex w-fit items-center gap-5.25 font-bold transition-colors"
        >
          <ArrowLeftIcon className="text-accent group-hover:text-accent-soft transition-colors" />
          Go back
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-heading">We couldn’t find that invoice</h1>
          <p className="text-meta mt-5.75 max-w-72">
            It may have been deleted, or the link may be out of date.
          </p>
        </div>
      </div>
    </main>
  );
}
