import type { Draft } from "./draft";

const REQUIRED = [
  "senderStreet",
  "senderCity",
  "senderPostCode",
  "senderCountry",
  "clientName",
  "clientEmail",
  "clientStreet",
  "clientCity",
  "clientPostCode",
  "clientCountry",
  "createdAt",
  "description",
] as const;

const ITEM_FIELDS = ["name", "quantity", "price"] as const;

export const ADD_ITEM = "addItem";

export const NOTHING_MISSING: string[] = [];

export const itemFieldName = (index: number, field: string) =>
  `items.${index}.${field}`;

export const findMissing = (draft: Draft) => {
  const missing: string[] = REQUIRED.filter((name) => !draft[name].trim());

  draft.items.forEach((item, index) => {
    ITEM_FIELDS.forEach((field) => {
      if (!item[field].trim()) missing.push(itemFieldName(index, field));
    });
  });

  if (!draft.items.length) missing.push(ADD_ITEM);

  return missing;
};

export const focusFirstMissing = (form: HTMLFormElement, missing: string[]) => {
  const control = form.elements.namedItem(missing[0]);
  if (control instanceof HTMLElement) control.focus({ preventScroll: true });
};
