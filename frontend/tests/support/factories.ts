import type { Invoice } from "@/lib";
import type { Draft, DraftItem } from "@/views/invoice-form/draft";

export const anInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "RT3080",
  createdAt: "2021-08-18",
  paymentDue: "2021-08-19",
  description: "Re-branding",
  paymentTerms: 1,
  clientName: "Jensen Huang",
  clientEmail: "jensenh@mail.com",
  status: "pending",
  senderAddress: {
    street: "19 Union Terrace",
    city: "London",
    postCode: "E1 3EZ",
    country: "United Kingdom",
  },
  clientAddress: {
    street: "106 Kendell Street",
    city: "Sharrington",
    postCode: "NR24 5WQ",
    country: "United Kingdom",
  },
  items: [
    { name: "Brand Guidelines", quantity: 1, price: 1800.9, total: 1800.9 },
  ],
  total: 1800.9,
  ...overrides,
});

export const aDraftItem = (overrides: Partial<DraftItem> = {}): DraftItem => ({
  key: "item-0",
  name: "Brand Guidelines",
  quantity: "1",
  price: "1800.90",
  ...overrides,
});

export const aDraft = (overrides: Partial<Draft> = {}): Draft => ({
  senderStreet: "19 Union Terrace",
  senderCity: "London",
  senderPostCode: "E1 3EZ",
  senderCountry: "United Kingdom",
  clientName: "Jensen Huang",
  clientEmail: "jensenh@mail.com",
  clientStreet: "106 Kendell Street",
  clientCity: "Sharrington",
  clientPostCode: "NR24 5WQ",
  clientCountry: "United Kingdom",
  createdAt: "2021-08-18",
  paymentTerms: 30,
  description: "Re-branding",
  items: [aDraftItem()],
  ...overrides,
});
