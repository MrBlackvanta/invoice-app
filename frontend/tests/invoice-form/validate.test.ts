import {
  ADD_ITEM,
  findProblems,
  focusFirstProblem,
  itemFieldName,
  NO_PROBLEMS,
} from "@/views/invoice-form/validate";
import { afterEach, describe, expect, it } from "vitest";
import { aDraft, aDraftItem } from "../support/factories";

const blankDraft = () =>
  aDraft({
    senderStreet: "",
    senderCity: "",
    senderPostCode: "",
    senderCountry: "",
    clientName: "",
    clientEmail: "",
    clientStreet: "",
    clientCity: "",
    clientPostCode: "",
    clientCountry: "",
    createdAt: "",
    description: "",
    items: [],
  });

const formWith = (names: string[]) => {
  const form = document.createElement("form");

  names.forEach((name) => {
    const input = document.createElement("input");
    input.name = name;
    form.append(input);
  });

  document.body.append(form);

  return form;
};

describe("findProblems", () => {
  it("passes a complete draft", () => {
    expect(findProblems(aDraft())).toEqual(NO_PROBLEMS);
  });

  it("reports every required field on an empty draft", () => {
    const { fields, missing, malformed } = findProblems(blankDraft());

    expect(missing).toBe(true);
    expect(malformed).toBe(false);
    expect(fields).toContain("senderStreet");
    expect(fields).toContain("clientCountry");
    expect(fields).toContain("createdAt");
    expect(fields).toContain("description");
    expect(fields).toContain(ADD_ITEM);
  });

  it("treats whitespace as empty", () => {
    const { fields } = findProblems(aDraft({ clientName: "   " }));

    expect(fields).toContain("clientName");
  });

  it("asks for an item when the list is empty", () => {
    expect(findProblems(aDraft({ items: [] })).fields).toContain(ADD_ITEM);
  });

  it("does not ask for an item when one is present", () => {
    expect(findProblems(aDraft()).fields).not.toContain(ADD_ITEM);
  });

  it("names the empty fields of each item by index", () => {
    const { fields } = findProblems(
      aDraft({
        items: [aDraftItem(), aDraftItem({ key: "1", name: "", price: "" })],
      }),
    );

    expect(fields).toContain(itemFieldName(1, "name"));
    expect(fields).toContain(itemFieldName(1, "price"));
    expect(fields).not.toContain(itemFieldName(0, "name"));
  });

  it("rejects a fractional quantity", () => {
    const { fields, malformed, missing } = findProblems(
      aDraft({ items: [aDraftItem({ quantity: "1.5" })] }),
    );

    expect(malformed).toBe(true);
    expect(missing).toBe(false);
    expect(fields).toEqual([itemFieldName(0, "quantity")]);
  });

  it("rejects a negative quantity", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ quantity: "-1" })] }))
        .malformed,
    ).toBe(true);
  });

  it("accepts a leading-zero quantity", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ quantity: "007" })] }))
        .malformed,
    ).toBe(false);
  });

  it("accepts a whole-number price", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ price: "1800" })] }))
        .malformed,
    ).toBe(false);
  });

  it("rejects a price with a trailing dot", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ price: "18." })] })).malformed,
    ).toBe(true);
  });

  it("rejects a price with no leading digit", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ price: ".5" })] })).malformed,
    ).toBe(true);
  });

  it("rejects a price with a thousands separator", () => {
    expect(
      findProblems(aDraft({ items: [aDraftItem({ price: "1,800.90" })] }))
        .malformed,
    ).toBe(true);
  });

  it("counts a blank number as missing rather than malformed", () => {
    const { missing, malformed } = findProblems(
      aDraft({ items: [aDraftItem({ quantity: "" })] }),
    );

    expect(missing).toBe(true);
    expect(malformed).toBe(false);
  });

  it("lists empty fields before malformed ones", () => {
    const { fields } = findProblems(
      aDraft({ clientName: "", items: [aDraftItem({ price: "abc" })] }),
    );

    expect(fields[0]).toBe("clientName");
    expect(fields.at(-1)).toBe(itemFieldName(0, "price"));
  });

  it("reports both flags when a draft is empty and malformed at once", () => {
    const { missing, malformed } = findProblems(
      aDraft({ description: "", items: [aDraftItem({ quantity: "2.5" })] }),
    );

    expect(missing).toBe(true);
    expect(malformed).toBe(true);
  });
});

describe("focusFirstProblem", () => {
  afterEach(() => document.body.replaceChildren());

  it("focuses the first named control", () => {
    const form = formWith(["clientName", "description"]);

    focusFirstProblem(form, ["description", "clientName"]);

    expect(document.activeElement).toBe(form.elements.namedItem("description"));
  });

  it("does nothing when the field has no control", () => {
    const form = formWith(["clientName"]);

    expect(() => focusFirstProblem(form, [ADD_ITEM])).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });

  it("does nothing when the problem list is empty", () => {
    const form = formWith(["clientName"]);

    expect(() => focusFirstProblem(form, [])).not.toThrow();
  });
});
