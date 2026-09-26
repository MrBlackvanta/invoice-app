"use client";

import type { Invoice, InvoiceStatus } from "@/data";
import { useState } from "react";
import EmptyState from "./empty-state";
import InvoiceRow from "./invoice-row";
import ListHeader from "./list-header";

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
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
    <>
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
    </>
  );
}
