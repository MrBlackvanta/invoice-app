import type { Address, Invoice, InvoiceStatus } from "@/lib";

const DEV_ORIGIN = "http://localhost:5180";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? DEV_ORIGIN;

export type InvoicePayload = {
  createdAt: string;
  paymentTerms: number;
  status: InvoiceStatus;
  description: string;
  clientName: string;
  clientEmail: string;
  senderAddress: Address;
  clientAddress: Address;
  items: { name: string; quantity: number; price: number }[];
};

async function call(
  method: string,
  path: string,
  payload?: InvoicePayload | { status: InvoiceStatus },
) {
  const response = await fetch(`${apiOrigin}${path}`, {
    method,
    headers: payload ? { "content-type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    throw new Error(`${method} ${path} answered ${response.status}`);
  }

  return response;
}

const json = async <T>(
  method: string,
  path: string,
  payload?: InvoicePayload | { status: InvoiceStatus },
) => (await call(method, path, payload)).json() as Promise<T>;

export const listInvoices = () => json<Invoice[]>("GET", "/invoices");

export const createInvoice = (payload: InvoicePayload) =>
  json<Invoice>("POST", "/invoices", payload);

export const replaceInvoice = (id: string, payload: InvoicePayload) =>
  json<Invoice>("PUT", `/invoices/${id}`, payload);

export const changeInvoiceStatus = (id: string, status: InvoiceStatus) =>
  json<Invoice>("PATCH", `/invoices/${id}/status`, { status });

export const deleteInvoice = (id: string) => call("DELETE", `/invoices/${id}`);
