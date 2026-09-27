"use client";

import { invoices as seed, type Invoice } from "@/data";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "invoice-app:invoices";

let invoices = seed;
let restored = false;
let persisting = true;
const listeners = new Set<() => void>();

function readStored(): Invoice[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved && JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function restoreOnce() {
  if (restored) return;
  restored = true;

  const saved = readStored();
  if (saved) invoices = saved;
}

function persist() {
  if (!persisting) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    persisting = false;
  }
}

function subscribe(listener: () => void) {
  restoreOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish() {
  persist();
  listeners.forEach((listener) => listener());
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

  publish();
}

export function markInvoicePaid(id: string) {
  invoices = invoices.map((invoice) =>
    invoice.id === id ? { ...invoice, status: "paid" } : invoice,
  );

  publish();
}

export function deleteInvoice(id: string) {
  invoices = invoices.filter((invoice) => invoice.id !== id);

  publish();
}
