import {
  blankItem,
  itemTotal,
  PAYMENT_TERMS,
  toDraft,
  toPayload,
} from "@/views/invoice-form/draft";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aDraft, aDraftItem, anInvoice } from "../support/factories";

describe("toDraft", () => {
  afterEach(() => vi.useRealTimers());

  it("opens a new invoice on today with thirty-day terms", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 10, 17));

    const draft = toDraft();

    expect(draft.createdAt).toBe("2026-09-30");
    expect(draft.paymentTerms).toBe(30);
    expect(draft.items).toEqual([]);
  });

  it("leaves every text field of a new invoice empty", () => {
    const { items, paymentTerms, createdAt, ...text } = toDraft();

    expect(Object.values(text).every((value) => value === "")).toBe(true);
    expect(createdAt).not.toBe("");
    expect(items).toEqual([]);
    expect(PAYMENT_TERMS).toContain(paymentTerms);
  });

  it("flattens an existing invoice's nested addresses", () => {
    const draft = toDraft(anInvoice());

    expect(draft.senderStreet).toBe("19 Union Terrace");
    expect(draft.senderPostCode).toBe("E1 3EZ");
    expect(draft.clientCity).toBe("Sharrington");
    expect(draft.clientCountry).toBe("United Kingdom");
  });

  it("carries the invoice's own date and terms", () => {
    const draft = toDraft(
      anInvoice({ createdAt: "2021-08-18", paymentTerms: 7 }),
    );

    expect(draft.createdAt).toBe("2021-08-18");
    expect(draft.paymentTerms).toBe(7);
  });

  it("renders item numbers as editable strings", () => {
    const draft = toDraft(
      anInvoice({
        items: [{ name: "Banner", quantity: 3, price: 1800.9, total: 5402.7 }],
      }),
    );

    expect(draft.items[0]).toMatchObject({
      name: "Banner",
      quantity: "3",
      price: "1800.90",
    });
  });

  it("pads a whole-number price to two places", () => {
    const draft = toDraft(
      anInvoice({
        items: [{ name: "Logo", quantity: 1, price: 200, total: 200 }],
      }),
    );

    expect(draft.items[0].price).toBe("200.00");
  });

  it("gives every item a distinct identity", () => {
    const draft = toDraft(
      anInvoice({
        items: [
          { name: "One", quantity: 1, price: 1, total: 1 },
          { name: "Two", quantity: 1, price: 1, total: 1 },
        ],
      }),
    );

    expect(draft.items[0]).not.toMatchObject({ key: draft.items[1].key });
  });
});

describe("blankItem", () => {
  it("starts empty", () => {
    expect(blankItem()).toMatchObject({ name: "", quantity: "", price: "" });
  });

  it("never repeats an identity", () => {
    const seen = Array.from({ length: 50 }, () => blankItem().key);

    expect(new Set(seen).size).toBe(50);
  });
});

describe("itemTotal", () => {
  it("multiplies quantity by price", () => {
    expect(itemTotal(aDraftItem({ quantity: "2", price: "3.50" }))).toBe(7);
  });

  it("treats an empty field as zero", () => {
    expect(itemTotal(aDraftItem({ quantity: "", price: "3.50" }))).toBe(0);
  });

  it("treats an unparseable field as zero", () => {
    expect(itemTotal(aDraftItem({ quantity: "abc", price: "3.50" }))).toBe(0);
  });

  it("returns zero rather than NaN for a blank row", () => {
    expect(itemTotal(aDraftItem({ quantity: "", price: "" }))).toBe(0);
  });
});

describe("toPayload", () => {
  it("nests the address fields back together", () => {
    const payload = toPayload(aDraft(), "pending");

    expect(payload.senderAddress).toEqual({
      street: "19 Union Terrace",
      city: "London",
      postCode: "E1 3EZ",
      country: "United Kingdom",
    });
    expect(payload.clientAddress.city).toBe("Sharrington");
  });

  it("carries the status it is given", () => {
    expect(toPayload(aDraft(), "draft").status).toBe("draft");
    expect(toPayload(aDraft(), "paid").status).toBe("paid");
  });

  it("converts item strings to numbers", () => {
    const payload = toPayload(
      aDraft({ items: [aDraftItem({ quantity: "3", price: "1800.90" })] }),
      "pending",
    );

    expect(payload.items[0]).toEqual({
      name: "Brand Guidelines",
      quantity: 3,
      price: 1800.9,
    });
  });

  it("sends zero rather than NaN for unparseable numbers", () => {
    const payload = toPayload(
      aDraft({ items: [aDraftItem({ quantity: "abc", price: "" })] }),
      "draft",
    );

    expect(payload.items[0].quantity).toBe(0);
    expect(payload.items[0].price).toBe(0);
  });

  it("sends only the fields the API accepts", () => {
    const payload = toPayload(aDraft(), "pending");

    expect(Object.keys(payload.items[0]).sort()).toEqual([
      "name",
      "price",
      "quantity",
    ]);
  });

  it("sends an empty item list unchanged", () => {
    expect(toPayload(aDraft({ items: [] }), "draft").items).toEqual([]);
  });
});
