"use client";

import type { InvoiceStatus } from "@/lib";
import { reloadInvoices, useInvoices } from "@/store";
import { useState } from "react";
import EmptyState from "./empty-state";
import InvoiceRow from "./invoice-row";
import InvoiceSkeleton from "./invoice-skeleton";
import ListHeader, { type Count } from "./list-header";
import LoadFailure from "./load-failure";

export default function InvoiceList() {
  const { invoices, loading, failure } = useInvoices();
  const [statuses, setStatuses] = useState<InvoiceStatus[]>([]);

  const visible = statuses.length
    ? invoices.filter((invoice) => statuses.includes(invoice.status))
    : invoices;

  const toggle = (status: InvoiceStatus) =>
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );

  const unreachable = Boolean(failure) && !invoices.length;

  const count = (): Count => {
    if (loading) return "loading";
    if (unreachable) return "unavailable";

    return visible.length;
  };

  const body = () => {
    if (loading) return <InvoiceSkeleton />;
    if (unreachable) return <LoadFailure onRetry={reloadInvoices} />;
    if (!visible.length) return <EmptyState />;

    return (
      <ul className="mt-8 space-y-4 md:mt-13.75 lg:mt-16">
        {visible.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </ul>
    );
  };

  return (
    <main className="flex flex-1 flex-col px-6 pt-8 md:px-12 md:pt-15.25 lg:pt-19.25">
      <div className="max-w-content mx-auto flex w-full flex-1 flex-col">
        <ListHeader count={count()} statuses={statuses} onToggle={toggle} />
        {body()}
      </div>
    </main>
  );
}
