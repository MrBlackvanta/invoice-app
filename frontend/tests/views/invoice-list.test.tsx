import type { Invoice } from "@/lib";
import InvoiceList from "@/views/home/invoice-list";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImgHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { anInvoice } from "../support/factories";

const mocks = vi.hoisted(() => ({
  useInvoices: vi.fn(),
  reloadInvoices: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/store", () => ({
  useInvoices: mocks.useInvoices,
  reloadInvoices: mocks.reloadInvoices,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string } & ImgHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={typeof src === "string" ? src : ""} alt={alt} {...rest} />
  ),
}));

const pending = anInvoice({ id: "RT3080", status: "pending", total: 1800.9 });
const draft = anInvoice({
  id: "XM9141",
  status: "draft",
  clientName: "Alex Grim",
  total: 556,
});
const paid = anInvoice({
  id: "RG0314",
  status: "paid",
  clientName: "John Morrison",
  total: 14002.33,
});

const showing = (state: {
  invoices?: Invoice[];
  loading?: boolean;
  failure?: string | null;
}) => {
  mocks.useInvoices.mockReturnValue({
    invoices: state.invoices ?? [],
    loading: state.loading ?? false,
    failure: state.failure ?? null,
  });

  const user = userEvent.setup();
  render(<InvoiceList />);

  return { user };
};

const rows = () => screen.queryAllByRole("listitem");

const filterBy = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(screen.getByRole("button", { name: /^filter/i }));
  await user.click(screen.getByRole("checkbox", { name }));
};

beforeEach(() => vi.clearAllMocks());

describe("while loading", () => {
  it("says so in the heading area", () => {
    showing({ loading: true });

    expect(screen.getByText("Loading your invoices")).toBeInTheDocument();
  });

  it("shows no invoice rows", () => {
    showing({ loading: true });

    expect(rows()).toHaveLength(0);
  });

  it("hides the placeholder from assistive technology", () => {
    showing({ loading: true });

    const placeholder = document.querySelector("ul[aria-hidden='true']");

    expect(placeholder).toBeInTheDocument();
  });
});

describe("when the service cannot be reached", () => {
  it("explains the failure instead of showing an empty list", () => {
    showing({ failure: "We couldn’t load your invoices." });

    expect(
      screen.getByRole("heading", { name: /couldn’t load your invoices/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("There is nothing here")).not.toBeInTheDocument();
  });

  it("marks the count unavailable rather than zero", () => {
    showing({ failure: "offline" });

    expect(screen.getByText("Invoices unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No invoices")).not.toBeInTheDocument();
  });

  it("retries on request", async () => {
    const { user } = showing({ failure: "offline" });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(mocks.reloadInvoices).toHaveBeenCalledOnce();
  });

  it("keeps showing invoices it already has", () => {
    showing({ invoices: [pending], failure: "That change didn’t save." });

    expect(rows()).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});

describe("with no invoices", () => {
  it("invites the user to create one", () => {
    showing({ invoices: [] });

    expect(screen.getByText("There is nothing here")).toBeInTheDocument();
  });

  it("counts them as none at both widths", () => {
    showing({ invoices: [] });

    expect(screen.getAllByText("No invoices")).toHaveLength(2);
  });
});

describe("with invoices", () => {
  it("renders one row per invoice", () => {
    showing({ invoices: [pending, draft, paid] });

    expect(rows()).toHaveLength(3);
  });

  it("links each row to its own invoice", () => {
    showing({ invoices: [pending] });

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/?invoice=RT3080",
    );
  });

  it("shows the id, client, due date and total", () => {
    showing({ invoices: [pending] });

    expect(screen.getByText("RT3080")).toBeInTheDocument();
    expect(screen.getByText("Jensen Huang")).toBeInTheDocument();
    expect(screen.getByText("Due 19 Aug 2021")).toBeInTheDocument();
    expect(screen.getByText("£ 1,800.90")).toBeInTheDocument();
  });

  it("counts them in the plural", () => {
    showing({ invoices: [pending, draft] });

    expect(screen.getByText("There are 2 total invoices")).toBeInTheDocument();
  });

  it("counts a single invoice in the singular", () => {
    showing({ invoices: [pending] });

    expect(screen.getByText("There is 1 total invoice")).toBeInTheDocument();
  });
});

describe("filtering", () => {
  it("narrows the list to the chosen status", async () => {
    const { user } = showing({ invoices: [pending, draft, paid] });

    await filterBy(user, "Draft");

    expect(rows()).toHaveLength(1);
    expect(screen.getByText("XM9141")).toBeInTheDocument();
    expect(screen.queryByText("RT3080")).not.toBeInTheDocument();
  });

  it("names the filtered status in the count", async () => {
    const { user } = showing({ invoices: [pending, draft, paid] });

    await filterBy(user, "Draft");

    expect(screen.getByText("There is 1 draft invoice")).toBeInTheDocument();
  });

  it("drops the status name once two are chosen", async () => {
    const { user } = showing({ invoices: [pending, draft, paid] });

    await filterBy(user, "Draft");
    await user.click(screen.getByRole("checkbox", { name: "Paid" }));

    expect(rows()).toHaveLength(2);
    expect(screen.getByText("There are 2 total invoices")).toBeInTheDocument();
  });

  it("restores the full list when the filter is cleared", async () => {
    const { user } = showing({ invoices: [pending, draft, paid] });

    await filterBy(user, "Draft");
    await user.click(screen.getByRole("checkbox", { name: "Draft" }));

    expect(rows()).toHaveLength(3);
  });

  it("shows the empty state when a filter matches nothing", async () => {
    const { user } = showing({ invoices: [pending] });

    await filterBy(user, "Paid");

    expect(screen.getByText("There is nothing here")).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
  });

  it("counts a filter that matches nothing as none", async () => {
    const { user } = showing({ invoices: [pending] });

    await filterBy(user, "Paid");

    expect(screen.getAllByText("No invoices")).toHaveLength(2);
  });
});

describe("page structure", () => {
  it("puts the list inside the main landmark under one h1", () => {
    showing({ invoices: [pending] });

    const main = screen.getByRole("main");

    expect(
      screen.getByRole("heading", { level: 1, name: "Invoices" }),
    ).toBeInTheDocument();
    expect(main).toContainElement(screen.getByRole("list"));
  });

  it("opens the new-invoice route from the header button", async () => {
    const { user } = showing({ invoices: [] });

    await user.click(screen.getByRole("button", { name: /^new/i }));

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/?new");
  });
});
