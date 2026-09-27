"use client";

import { useInvoices } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { InvoiceList } from "./home";
import { InvoiceDetail } from "./invoice";
import { InvoiceDrawer } from "./invoice-form";

function useRouterSyncedToQuery() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.search) router.replace(`/${window.location.search}`);
  }, [router]);

  return router;
}

export default function InvoiceScreen() {
  const invoices = useInvoices();
  const params = useSearchParams();
  const router = useRouterSyncedToQuery();

  const invoice = invoices.find(({ id }) => id === params.get("invoice"));
  const editing = params.has("edit") && invoice;
  const closeDrawer = () =>
    router.push(invoice ? `/?invoice=${invoice.id}` : "/");

  return (
    <>
      {invoice ? <InvoiceDetail invoice={invoice} /> : <InvoiceList />}
      {(params.has("new") || editing) && (
        <InvoiceDrawer
          invoice={editing ? invoice : undefined}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
