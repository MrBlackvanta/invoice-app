"use client";

import { invoices as seed, type Invoice } from "@/data";
import { useSyncExternalStore } from "react";

let invoices = seed;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInvoices() {
  return useSyncExternalStore(
    subscribe,
    () => invoices,
    () => seed,
  );
}

export function saveInvoice(invoice: Invoice) {
  const known = invoices.some(({ id }) => id === invoice.id);

  invoices = known
    ? invoices.map((current) => (current.id === invoice.id ? invoice : current))
    : [...invoices, invoice];

  listeners.forEach((listener) => listener());
}
