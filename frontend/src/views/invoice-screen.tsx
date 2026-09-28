"use client";

import { dismissFailure, useInvoices } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import FailureToast from "./failure-toast";
import { InvoiceList } from "./home";
import { DetailSkeleton, InvoiceDetail, InvoiceMissing } from "./invoice";
import { InvoiceDrawer } from "./invoice-form";

function useRouterSyncedToQuery() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.search) router.replace(`/${window.location.search}`);
  }, [router]);

  return router;
}

export default function InvoiceScreen() {
  const { invoices, loading, failure } = useInvoices();
  const params = useSearchParams();
  const router = useRouterSyncedToQuery();

  const wanted = params.get("invoice");
  const invoice = invoices.find(({ id }) => id === wanted);
  const editing = params.has("edit") && invoice;
  const closeDrawer = () =>
    router.push(invoice ? `/?invoice=${invoice.id}` : "/");

  const view = () => {
    if (!wanted) return <InvoiceList />;
    if (loading) return <DetailSkeleton />;
    if (!invoice) return <InvoiceMissing />;

    return <InvoiceDetail invoice={invoice} />;
  };

  return (
    <>
      {view()}
      {(params.has("new") || editing) && (
        <InvoiceDrawer
          invoice={editing ? invoice : undefined}
          onClose={closeDrawer}
        />
      )}
      {failure && invoices.length > 0 && (
        <FailureToast message={failure} onDismiss={dismissFailure} />
      )}
    </>
  );
}
