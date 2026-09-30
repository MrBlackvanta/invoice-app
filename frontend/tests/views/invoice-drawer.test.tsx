import type { Invoice } from "@/lib";
import InvoiceDrawer from "@/views/invoice-form/invoice-drawer";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { anInvoice } from "../support/factories";

const mocks = vi.hoisted(() => ({
  addInvoice: vi.fn(),
  editInvoice: vi.fn(),
}));

vi.mock("@/store", () => ({
  addInvoice: mocks.addInvoice,
  editInvoice: mocks.editInvoice,
}));

const ALL_FIELDS_MESSAGE = "- All fields must be added";
const NUMBER_MESSAGE = "- Quantity must be a whole number and price an amount";
const UNREACHABLE_MESSAGE =
  "- Couldn’t reach the invoice service. Try again in a moment.";

const open = (invoice?: Invoice) => {
  const onClose = vi.fn();
  const user = userEvent.setup();

  render(<InvoiceDrawer invoice={invoice} onClose={onClose} />);

  return { user, onClose };
};

const queryField = (name: string) =>
  document.querySelector<HTMLInputElement>(`[name="${name}"]`);

const field = (name: string) => {
  const control = queryField(name);

  if (!control) throw new Error(`The form has no control named ${name}`);

  return control;
};

const button = (name: RegExp | string) => screen.getByRole("button", { name });

beforeEach(() => {
  mocks.addInvoice.mockResolvedValue(true);
  mocks.editInvoice.mockResolvedValue(true);
});

describe("opening", () => {
  it("titles a new invoice", () => {
    open();

    expect(
      screen.getByRole("heading", { name: "New Invoice" }),
    ).toBeInTheDocument();
  });

  it("titles an edit with the invoice id", () => {
    open(anInvoice({ id: "RT3080" }));

    expect(
      screen.getByRole("heading", { name: "Edit #RT3080" }),
    ).toBeInTheDocument();
  });

  it("offers discard, draft and send for a new invoice", () => {
    open();

    expect(button("Discard")).toBeInTheDocument();
    expect(button("Save as Draft")).toBeInTheDocument();
    expect(button("Save & Send")).toBeInTheDocument();
  });

  it("offers cancel and save for an edit", () => {
    open(anInvoice());

    expect(button("Cancel")).toBeInTheDocument();
    expect(button("Save Changes")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save as Draft" })).toBeNull();
  });

  it("prefills the form from the invoice", () => {
    open(anInvoice());

    expect(field("clientName")).toHaveValue("Jensen Huang");
    expect(field("senderCity")).toHaveValue("London");
    expect(field("items.0.price")).toHaveValue("1800.90");
  });

  it("starts a new invoice with no items", () => {
    open();

    expect(queryField("items.0.name")).toBeNull();
  });

  it("shows no error before the first attempt", () => {
    open();

    expect(screen.queryByText(ALL_FIELDS_MESSAGE)).toBeNull();
  });
});

describe("rejecting an incomplete invoice", () => {
  it("names the problem instead of saving", async () => {
    const { user } = open();

    await user.click(button("Save & Send"));

    expect(screen.getByText(ALL_FIELDS_MESSAGE)).toBeInTheDocument();
    expect(mocks.addInvoice).not.toHaveBeenCalled();
  });

  it("moves focus to the first empty field", async () => {
    const { user } = open();

    await user.click(button("Save & Send"));

    expect(field("senderStreet")).toHaveFocus();
  });

  it("marks the empty fields invalid and points them at the message", async () => {
    const { user } = open();

    await user.click(button("Save & Send"));

    expect(field("clientEmail")).toHaveAttribute("aria-invalid", "true");
    expect(field("clientEmail")).toHaveAttribute(
      "aria-describedby",
      "invoice-form-error",
    );
  });

  it("announces the problem in a live region", async () => {
    const { user } = open();

    await user.click(button("Save & Send"));

    expect(screen.getByRole("alert")).toHaveTextContent(ALL_FIELDS_MESSAGE);
  });

  it("clears the message once the form is complete", async () => {
    const { user } = open(anInvoice());

    await user.clear(field("clientName"));
    await user.click(button("Save Changes"));
    expect(screen.getByText(ALL_FIELDS_MESSAGE)).toBeInTheDocument();

    await user.type(field("clientName"), "Jensen Huang");

    expect(screen.queryByText(ALL_FIELDS_MESSAGE)).toBeNull();
  });
});

describe("rejecting malformed numbers", () => {
  it("explains what a quantity and price must look like", async () => {
    const { user } = open(anInvoice());

    await user.clear(field("items.0.quantity"));
    await user.type(field("items.0.quantity"), "1.5");
    await user.click(button("Save Changes"));

    expect(screen.getByText(NUMBER_MESSAGE)).toBeInTheDocument();
    expect(mocks.editInvoice).not.toHaveBeenCalled();
  });

  it("rejects a price that is not an amount", async () => {
    const { user } = open(anInvoice());

    await user.clear(field("items.0.price"));
    await user.type(field("items.0.price"), "12.");
    await user.click(button("Save Changes"));

    expect(screen.getByText(NUMBER_MESSAGE)).toBeInTheDocument();
  });

  it("refuses to save a draft with a malformed number", async () => {
    const { user } = open();

    await user.click(button("+ Add New Item"));
    await user.type(field("items.0.quantity"), "2.5");
    await user.click(button("Save as Draft"));

    expect(screen.getByText(NUMBER_MESSAGE)).toBeInTheDocument();
    expect(mocks.addInvoice).not.toHaveBeenCalled();
  });
});

describe("saving a draft", () => {
  it("accepts an entirely empty invoice", async () => {
    const { user } = open();

    await user.click(button("Save as Draft"));

    await waitFor(() => expect(mocks.addInvoice).toHaveBeenCalledOnce());
    expect(mocks.addInvoice.mock.calls[0][0]).toMatchObject({
      status: "draft",
      clientName: "",
      items: [],
    });
  });

  it("does not complain about the empty fields", async () => {
    const { user } = open();

    await user.click(button("Save as Draft"));

    expect(screen.queryByText(ALL_FIELDS_MESSAGE)).toBeNull();
  });
});

describe("sending a complete invoice", () => {
  it("creates it as pending", async () => {
    const { user } = open();

    await user.type(field("senderStreet"), "19 Union Terrace");
    await user.type(field("senderCity"), "London");
    await user.type(field("senderPostCode"), "E1 3EZ");
    await user.type(field("senderCountry"), "United Kingdom");
    await user.type(field("clientName"), "Jensen Huang");
    await user.type(field("clientEmail"), "jensenh@mail.com");
    await user.type(field("clientStreet"), "106 Kendell Street");
    await user.type(field("clientCity"), "Sharrington");
    await user.type(field("clientPostCode"), "NR24 5WQ");
    await user.type(field("clientCountry"), "United Kingdom");
    await user.type(field("description"), "Re-branding");
    await user.click(button("+ Add New Item"));
    await user.type(field("items.0.name"), "Brand Guidelines");
    await user.type(field("items.0.quantity"), "1");
    await user.type(field("items.0.price"), "1800.90");
    await user.click(button("Save & Send"));

    await waitFor(() => expect(mocks.addInvoice).toHaveBeenCalledOnce());
    expect(mocks.addInvoice.mock.calls[0][0]).toMatchObject({
      status: "pending",
      clientName: "Jensen Huang",
      items: [{ name: "Brand Guidelines", quantity: 1, price: 1800.9 }],
    });
  });

  it("keeps an edited invoice pending", async () => {
    const { user } = open(anInvoice({ status: "pending" }));

    await user.click(button("Save Changes"));

    await waitFor(() => expect(mocks.editInvoice).toHaveBeenCalledOnce());
    expect(mocks.editInvoice.mock.calls[0][1]).toMatchObject({
      status: "pending",
    });
  });

  it("does not demote a paid invoice when it is edited", async () => {
    const { user } = open(anInvoice({ status: "paid" }));

    await user.click(button("Save Changes"));

    await waitFor(() => expect(mocks.editInvoice).toHaveBeenCalledOnce());
    expect(mocks.editInvoice.mock.calls[0][1]).toMatchObject({
      status: "paid",
    });
  });

  it("promotes an edited draft to pending", async () => {
    const { user } = open(anInvoice({ status: "draft" }));

    await user.click(button("Save Changes"));

    await waitFor(() => expect(mocks.editInvoice).toHaveBeenCalledOnce());
    expect(mocks.editInvoice.mock.calls[0][1]).toMatchObject({
      status: "pending",
    });
  });

  it("sends the edit to the invoice's own id", async () => {
    const { user } = open(anInvoice({ id: "RT3080" }));

    await user.click(button("Save Changes"));

    await waitFor(() =>
      expect(mocks.editInvoice.mock.calls[0][0]).toBe("RT3080"),
    );
  });
});

describe("while saving", () => {
  it("labels the pending button and disables the others", async () => {
    const { user } = open(anInvoice());
    mocks.editInvoice.mockReturnValue(new Promise(() => {}));

    await user.click(button("Save Changes"));

    expect(button("Saving…")).toBeDisabled();
    expect(button("Cancel")).toBeDisabled();
  });
});

describe("when the service cannot be reached", () => {
  it("says so and leaves the drawer open", async () => {
    const { user, onClose } = open(anInvoice());
    mocks.editInvoice.mockResolvedValue(false);

    await user.click(button("Save Changes"));

    expect(await screen.findByText(UNREACHABLE_MESSAGE)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("re-enables the buttons for another attempt", async () => {
    const { user } = open(anInvoice());
    mocks.editInvoice.mockResolvedValue(false);

    await user.click(button("Save Changes"));

    await waitFor(() => expect(button("Save Changes")).toBeEnabled());
  });
});

describe("items", () => {
  it("adds a row on request", async () => {
    const { user } = open();

    await user.click(button("+ Add New Item"));

    expect(field("items.0.name")).toBeInTheDocument();
  });

  it("numbers each row for assistive technology", async () => {
    const { user } = open();

    await user.click(button("+ Add New Item"));
    await user.click(button("+ Add New Item"));

    expect(button("Delete item 1")).toBeInTheDocument();
    expect(button("Delete item 2")).toBeInTheDocument();
  });

  it("shows a running total for the row", async () => {
    const { user } = open();

    await user.click(button("+ Add New Item"));
    await user.type(field("items.0.quantity"), "3");
    await user.type(field("items.0.price"), "1800.90");

    expect(screen.getByText("5,402.70")).toBeInTheDocument();
  });

  it("removes a row on request", async () => {
    const { user } = open(anInvoice());

    await user.click(button("Delete item 1"));

    await waitFor(() => expect(queryField("items.0.name")).toBeNull());
  });
});

describe("leaving without saving", () => {
  it("closes on discard", async () => {
    const { user, onClose } = open();

    await user.click(button("Discard"));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mocks.addInvoice).not.toHaveBeenCalled();
  });

  it("closes on cancel", async () => {
    const { user, onClose } = open(anInvoice());

    await user.click(button("Cancel"));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mocks.editInvoice).not.toHaveBeenCalled();
  });

  it("closes from the mobile back button", async () => {
    const { user, onClose } = open();

    await user.click(button("Go back"));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});
