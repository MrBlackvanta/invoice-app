"use client";

import type { Invoice } from "@/data";
import { useSearchParams } from "next/navigation";
import { InvoiceList } from "./home";
import { InvoiceDetail } from "./invoice";

export default function InvoiceScreen({ invoices }: { invoices: Invoice[] }) {
  const selected = useSearchParams().get("invoice");
  const invoice = invoices.find(({ id }) => id === selected);

  return invoice ? (
    <InvoiceDetail invoice={invoice} />
  ) : (
    <InvoiceList invoices={invoices} />
  );
}
