import type { Invoice, InvoiceStatus } from "@/data";
import { addDays, todayIso } from "@/lib";

export type DraftItem = {
  key: string;
  name: string;
  quantity: string;
  price: string;
};

export type Draft = {
  senderStreet: string;
  senderCity: string;
  senderPostCode: string;
  senderCountry: string;
  clientName: string;
  clientEmail: string;
  clientStreet: string;
  clientCity: string;
  clientPostCode: string;
  clientCountry: string;
  createdAt: string;
  paymentTerms: number;
  description: string;
  items: DraftItem[];
};

export const PAYMENT_TERMS = [1, 7, 14, 30];

const DEFAULT_TERMS = 30;

let nextKey = 0;
const takeKey = () => `${nextKey++}`;

export const blankItem = (): DraftItem => ({
  key: takeKey(),
  name: "",
  quantity: "",
  price: "",
});

export const toDraft = (invoice?: Invoice): Draft => ({
  senderStreet: invoice?.senderAddress.street ?? "",
  senderCity: invoice?.senderAddress.city ?? "",
  senderPostCode: invoice?.senderAddress.postCode ?? "",
  senderCountry: invoice?.senderAddress.country ?? "",
  clientName: invoice?.clientName ?? "",
  clientEmail: invoice?.clientEmail ?? "",
  clientStreet: invoice?.clientAddress.street ?? "",
  clientCity: invoice?.clientAddress.city ?? "",
  clientPostCode: invoice?.clientAddress.postCode ?? "",
  clientCountry: invoice?.clientAddress.country ?? "",
  createdAt: invoice?.createdAt ?? todayIso(),
  paymentTerms: invoice?.paymentTerms ?? DEFAULT_TERMS,
  description: invoice?.description ?? "",
  items:
    invoice?.items.map(({ name, quantity, price }) => ({
      key: takeKey(),
      name,
      quantity: `${quantity}`,
      price: price.toFixed(2),
    })) ?? [],
});

export const itemTotal = ({ quantity, price }: DraftItem) =>
  (Number(quantity) || 0) * (Number(price) || 0);

export const toInvoice = (
  draft: Draft,
  id: string,
  status: InvoiceStatus,
): Invoice => {
  const items = draft.items.map((item) => ({
    name: item.name,
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    total: itemTotal(item),
  }));

  return {
    id,
    createdAt: draft.createdAt,
    paymentDue: draft.createdAt
      ? addDays(draft.createdAt, draft.paymentTerms)
      : "",
    description: draft.description,
    paymentTerms: draft.paymentTerms,
    clientName: draft.clientName,
    clientEmail: draft.clientEmail,
    status,
    senderAddress: {
      street: draft.senderStreet,
      city: draft.senderCity,
      postCode: draft.senderPostCode,
      country: draft.senderCountry,
    },
    clientAddress: {
      street: draft.clientStreet,
      city: draft.clientCity,
      postCode: draft.clientPostCode,
      country: draft.clientCountry,
    },
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
};
