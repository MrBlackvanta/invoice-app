"use client";

import * as api from "@/api";
import type { Invoice } from "@/lib";
import { useSyncExternalStore } from "react";

type InvoiceStore = {
  invoices: Invoice[];
  loading: boolean;
  failure: string | null;
};

const LOAD_FAILED = "We couldn’t load your invoices.";
const CHANGE_FAILED = "That change didn’t save.";

const INITIAL: InvoiceStore = { invoices: [], loading: true, failure: null };

let store = INITIAL;
let started = false;
const listeners = new Set<() => void>();

function publish(next: InvoiceStore) {
  store = next;
  listeners.forEach((listener) => listener());
}

const loaded = (invoices: Invoice[]): InvoiceStore => ({
  invoices,
  loading: false,
  failure: null,
});

async function load() {
  try {
    publish(loaded(await api.listInvoices()));
  } catch {
    publish({ ...store, loading: false, failure: LOAD_FAILED });
  }
}

async function send(request: () => Promise<unknown>) {
  await request();
  await load();
}

async function showImmediately(
  invoices: Invoice[],
  request: () => Promise<unknown>,
) {
  const rollback = store;

  publish({ ...store, invoices, failure: null });

  try {
    await send(request);
  } catch {
    publish({ ...rollback, failure: CHANGE_FAILED });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!started) {
    started = true;
    void load();
  }

  return () => {
    listeners.delete(listener);
  };
}

export function useInvoices() {
  return useSyncExternalStore(
    subscribe,
    () => store,
    () => INITIAL,
  );
}

export function reloadInvoices() {
  publish({ ...store, loading: true, failure: null });
  void load();
}

export function dismissFailure() {
  publish({ ...store, failure: null });
}

export async function addInvoice(payload: api.InvoicePayload) {
  try {
    await send(() => api.createInvoice(payload));
    return true;
  } catch {
    return false;
  }
}

export async function editInvoice(id: string, payload: api.InvoicePayload) {
  try {
    await send(() => api.replaceInvoice(id, payload));
    return true;
  } catch {
    return false;
  }
}

export function markInvoicePaid(id: string) {
  const paid = store.invoices.map((invoice) =>
    invoice.id === id ? { ...invoice, status: "paid" as const } : invoice,
  );

  void showImmediately(paid, () => api.changeInvoiceStatus(id, "paid"));
}

export function deleteInvoice(id: string) {
  const remaining = store.invoices.filter((invoice) => invoice.id !== id);

  void showImmediately(remaining, () => api.deleteInvoice(id));
}
