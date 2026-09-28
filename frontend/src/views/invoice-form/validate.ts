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

export const NO_PROBLEMS = { fields: [], missing: false, malformed: false };

export const itemFieldName = (index: number, field: string) =>
  `items.${index}.${field}`;

const isWholeNumber = (value: string) => /^\d+$/.test(value);

const isAmount = (value: string) => /^\d+(\.\d+)?$/.test(value);

export const findProblems = (draft: Draft) => {
  const empty: string[] = REQUIRED.filter((name) => !draft[name].trim());
  const malformed: string[] = [];

  draft.items.forEach((item, index) => {
    ITEM_FIELDS.forEach((field) => {
      if (!item[field].trim()) empty.push(itemFieldName(index, field));
    });

    if (item.quantity.trim() && !isWholeNumber(item.quantity.trim())) {
      malformed.push(itemFieldName(index, "quantity"));
    }

    if (item.price.trim() && !isAmount(item.price.trim())) {
      malformed.push(itemFieldName(index, "price"));
    }
  });

  if (!draft.items.length) empty.push(ADD_ITEM);

  return {
    fields: [...empty, ...malformed],
    missing: empty.length > 0,
    malformed: malformed.length > 0,
  };
};

export const focusFirstProblem = (form: HTMLFormElement, fields: string[]) => {
  const control = form.elements.namedItem(fields[0]);
  if (control instanceof HTMLElement) control.focus({ preventScroll: true });
};
