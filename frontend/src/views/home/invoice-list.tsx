"use client";

import type { InvoiceStatus } from "@/data";
import { useInvoices } from "@/store";
import { useState } from "react";
import EmptyState from "./empty-state";
import InvoiceRow from "./invoice-row";
import ListHeader from "./list-header";

export default function InvoiceList() {
  const invoices = useInvoices();
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

  return (
    <main className="flex flex-1 flex-col px-6 pt-8 md:px-12 md:pt-15.25 lg:pt-19.25">
      <div className="max-w-content mx-auto flex w-full flex-1 flex-col">
        <ListHeader
          count={visible.length}
          statuses={statuses}
          onToggle={toggle}
        />
        {visible.length ? (
          <ul className="mt-8 space-y-4 md:mt-13.75 lg:mt-16">
            {visible.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}
