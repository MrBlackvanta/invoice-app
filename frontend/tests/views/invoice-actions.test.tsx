import type { InvoiceStatus } from "@/lib";
import InvoiceActions from "@/views/invoice/invoice-actions";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markInvoicePaid: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/store", () => ({
  markInvoicePaid: mocks.markInvoicePaid,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const showing = (status: InvoiceStatus) =>
  render(<InvoiceActions id="RT3080" status={status} onDelete={() => {}} />);

const markAsPaid = () => screen.queryByRole("button", { name: "Mark as Paid" });

describe("InvoiceActions", () => {
  it("offers Mark as Paid on a pending invoice", () => {
    showing("pending");

    expect(markAsPaid()).toBeInTheDocument();
  });

  it.each<InvoiceStatus>(["draft", "paid"])(
    "withholds Mark as Paid from a %s invoice",
    (status) => {
      showing(status);

      expect(markAsPaid()).not.toBeInTheDocument();
    },
  );

  it.each<InvoiceStatus>(["draft", "pending", "paid"])(
    "keeps Edit and Delete on a %s invoice",
    (status) => {
      showing(status);

      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).toBeInTheDocument();
    },
  );

  it("marks the invoice it was given paid", async () => {
    showing("pending");

    await userEvent.click(markAsPaid()!);

    expect(mocks.markInvoicePaid).toHaveBeenCalledWith("RT3080");
  });

  it("opens the editor for the invoice it was given", async () => {
    showing("paid");

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(mocks.push).toHaveBeenCalledWith("/?invoice=RT3080&edit");
  });
});
