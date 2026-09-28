import { ArrowLeftIcon } from "@/components/icons";
import { StatusChip } from "@/components/ui";
import type { Invoice } from "@/lib";
import { deleteInvoice } from "@/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeletePrompt from "./delete-prompt";
import InvoiceActions from "./invoice-actions";
import InvoiceSummary from "./invoice-summary";

export default function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const confirmDelete = () => setConfirming(true);

  const remove = () => {
    deleteInvoice(invoice.id);
    router.push("/");
  };

  return (
    <>
      <main className="flex flex-1 flex-col px-6 pt-8.25 md:px-10 md:pt-12.25 lg:px-12 lg:pt-16.25">
        <div className="max-w-content mx-auto w-full">
          <Link
            href="/"
            className="text-body text-ink hover:text-muted group flex w-fit items-center gap-5.25 font-bold transition-colors"
          >
            <ArrowLeftIcon className="text-accent group-hover:text-accent-soft transition-colors" />
            Go back
          </Link>
          <div className="bg-surface shadow-card rounded-card mt-7.75 flex h-22.75 items-center px-6 md:h-22 md:px-8">
            <span className="text-meta">Status</span>
            <StatusChip
              status={invoice.status}
              aria-live="polite"
              className="ml-auto md:ml-5"
            />
            <InvoiceActions
              id={invoice.id}
              onDelete={confirmDelete}
              className="ml-auto hidden md:flex"
            />
          </div>
          <InvoiceSummary invoice={invoice} />
          <InvoiceActions
            id={invoice.id}
            onDelete={confirmDelete}
            className="bg-surface shadow-card -mx-6 mt-14 flex h-22.75 px-6 md:hidden"
          />
        </div>
      </main>
      {confirming && (
        <DeletePrompt
          id={invoice.id}
          onConfirm={remove}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
