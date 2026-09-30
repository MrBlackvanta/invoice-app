import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { anInvoice } from "../support/factories";

vi.mock("@/api", () => ({
  listInvoices: vi.fn(),
  createInvoice: vi.fn(),
  replaceInvoice: vi.fn(),
  changeInvoiceStatus: vi.fn(),
  deleteInvoice: vi.fn(),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const defer = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });

  return { promise, resolve, reject };
};

const pending = anInvoice({ id: "RT3080", status: "pending" });
const draft = anInvoice({ id: "XM9141", status: "draft" });

const loadStore = async () => {
  vi.resetModules();

  const api = vi.mocked(await import("@/api"));
  const store = await import("@/store/invoices");

  return { api, store };
};

const mountWith = async (invoices = [pending, draft]) => {
  const { api, store } = await loadStore();
  api.listInvoices.mockResolvedValue(invoices);

  const view = renderHook(() => store.useInvoices());
  await waitFor(() => expect(view.result.current.loading).toBe(false));

  return { api, store, view };
};

beforeEach(() => vi.clearAllMocks());

describe("first load", () => {
  it("starts in a loading state with nothing to show", async () => {
    const { api, store } = await loadStore();
    api.listInvoices.mockReturnValue(defer<never>().promise);

    const { result } = renderHook(() => store.useInvoices());

    expect(result.current).toEqual({
      invoices: [],
      loading: true,
      failure: null,
    });
  });

  it("publishes the invoices once they arrive", async () => {
    const { view } = await mountWith();

    expect(view.result.current.invoices).toEqual([pending, draft]);
    expect(view.result.current.failure).toBeNull();
  });

  it("fetches only once however many components subscribe", async () => {
    const { api, store } = await mountWith();

    renderHook(() => store.useInvoices());
    renderHook(() => store.useInvoices());

    expect(api.listInvoices).toHaveBeenCalledTimes(1);
  });

  it("stops loading and reports failure when the API is unreachable", async () => {
    const { api, store } = await loadStore();
    api.listInvoices.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => store.useInvoices());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.failure).toBe("We couldn’t load your invoices.");
    expect(result.current.invoices).toEqual([]);
  });
});

describe("reloadInvoices", () => {
  it("returns to loading and clears the previous failure", async () => {
    const { api, store } = await loadStore();
    api.listInvoices.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => store.useInvoices());
    await waitFor(() => expect(result.current.failure).not.toBeNull());

    api.listInvoices.mockResolvedValue([pending]);
    await act(async () => store.reloadInvoices());

    expect(result.current.failure).toBeNull();
    expect(result.current.invoices).toEqual([pending]);
  });

  it("refetches even after a successful load", async () => {
    const { api, store } = await mountWith();

    await act(async () => store.reloadInvoices());

    expect(api.listInvoices).toHaveBeenCalledTimes(2);
  });
});

describe("dismissFailure", () => {
  it("clears the message without touching the invoices", async () => {
    const { api, store, view } = await mountWith();
    api.changeInvoiceStatus.mockRejectedValue(new Error("offline"));

    await act(async () => store.markInvoicePaid(pending.id));
    expect(view.result.current.failure).not.toBeNull();

    act(() => store.dismissFailure());

    expect(view.result.current.failure).toBeNull();
    expect(view.result.current.invoices).toEqual([pending, draft]);
  });
});

describe("addInvoice", () => {
  it("reports success and reloads the list", async () => {
    const { api, store } = await mountWith();
    api.createInvoice.mockResolvedValue(anInvoice());

    let saved: boolean | undefined;
    await act(async () => {
      saved = await store.addInvoice({ description: "new" } as never);
    });

    expect(saved).toBe(true);
    expect(api.listInvoices).toHaveBeenCalledTimes(2);
  });

  it("reports failure without disturbing what is on screen", async () => {
    const { api, store, view } = await mountWith();
    api.createInvoice.mockRejectedValue(new Error("offline"));

    let saved: boolean | undefined;
    await act(async () => {
      saved = await store.addInvoice({ description: "new" } as never);
    });

    expect(saved).toBe(false);
    expect(view.result.current.invoices).toEqual([pending, draft]);
    expect(view.result.current.failure).toBeNull();
  });
});

describe("editInvoice", () => {
  it("sends the id through to the API and reloads", async () => {
    const { api, store } = await mountWith();
    api.replaceInvoice.mockResolvedValue(anInvoice());

    await act(async () => {
      await store.editInvoice("RT3080", { description: "edit" } as never);
    });

    expect(api.replaceInvoice).toHaveBeenCalledWith("RT3080", {
      description: "edit",
    });
    expect(api.listInvoices).toHaveBeenCalledTimes(2);
  });

  it("reports failure rather than throwing", async () => {
    const { api, store } = await mountWith();
    api.replaceInvoice.mockRejectedValue(new Error("offline"));

    let saved: boolean | undefined;
    await act(async () => {
      saved = await store.editInvoice("RT3080", {} as never);
    });

    expect(saved).toBe(false);
  });
});

describe("markInvoicePaid", () => {
  it("shows the new status before the request finishes", async () => {
    const { api, store, view } = await mountWith();
    const inFlight = defer<unknown>();
    api.changeInvoiceStatus.mockReturnValue(inFlight.promise as never);

    act(() => store.markInvoicePaid(pending.id));

    expect(view.result.current.invoices[0].status).toBe("paid");
    expect(view.result.current.failure).toBeNull();

    await act(async () => {
      inFlight.resolve(undefined);
      await inFlight.promise;
    });
  });

  it("leaves the other invoices alone", async () => {
    const { api, store, view } = await mountWith();
    api.changeInvoiceStatus.mockResolvedValue(anInvoice());

    await act(async () => store.markInvoicePaid(pending.id));

    expect(view.result.current.invoices[1]).toEqual(draft);
  });

  it("replaces the optimistic list with the server's answer", async () => {
    const { api, store, view } = await mountWith();
    const confirmed = anInvoice({ id: "RT3080", status: "paid" });
    api.changeInvoiceStatus.mockResolvedValue(confirmed);
    api.listInvoices.mockResolvedValue([confirmed]);

    await act(async () => store.markInvoicePaid(pending.id));

    expect(view.result.current.invoices).toEqual([confirmed]);
  });

  it("rolls back and explains itself when the request fails", async () => {
    const { api, store, view } = await mountWith();
    api.changeInvoiceStatus.mockRejectedValue(new Error("offline"));

    await act(async () => store.markInvoicePaid(pending.id));

    expect(view.result.current.invoices).toEqual([pending, draft]);
    expect(view.result.current.failure).toBe("That change didn’t save.");
  });

  it("ignores an id that is not in the list", async () => {
    const { api, store, view } = await mountWith();
    api.changeInvoiceStatus.mockResolvedValue(anInvoice());

    act(() => store.markInvoicePaid("NOPE00"));

    expect(view.result.current.invoices).toEqual([pending, draft]);
  });
});

describe("deleteInvoice", () => {
  it("removes the row before the request finishes", async () => {
    const { api, store, view } = await mountWith();
    const inFlight = defer<unknown>();
    api.deleteInvoice.mockReturnValue(inFlight.promise as never);

    act(() => store.deleteInvoice(pending.id));

    expect(view.result.current.invoices).toEqual([draft]);

    await act(async () => {
      inFlight.resolve(undefined);
      await inFlight.promise;
    });
  });

  it("restores the row when the request fails", async () => {
    const { api, store, view } = await mountWith();
    api.deleteInvoice.mockRejectedValue(new Error("offline"));

    await act(async () => store.deleteInvoice(pending.id));

    expect(view.result.current.invoices).toEqual([pending, draft]);
    expect(view.result.current.failure).toBe("That change didn’t save.");
  });

  it("empties the list when the only invoice goes", async () => {
    const { api, store, view } = await mountWith([pending]);
    api.deleteInvoice.mockResolvedValue(new Response(null, { status: 204 }));
    api.listInvoices.mockResolvedValue([]);

    await act(async () => store.deleteInvoice(pending.id));

    expect(view.result.current.invoices).toEqual([]);
    expect(view.result.current.failure).toBeNull();
  });
});

describe("a reload that fails after a change was saved", () => {
  it("keeps the change the server accepted", async () => {
    const { api, store, view } = await mountWith();
    api.changeInvoiceStatus.mockResolvedValue(anInvoice());
    api.listInvoices.mockRejectedValue(new Error("offline"));

    await act(async () => store.markInvoicePaid(pending.id));

    expect(view.result.current.invoices[0].status).toBe("paid");
    expect(view.result.current.failure).not.toBe("That change didn’t save.");
  });

  it("blames the reload rather than the change", async () => {
    const { api, store, view } = await mountWith();
    api.deleteInvoice.mockResolvedValue(new Response(null, { status: 204 }));
    api.listInvoices.mockRejectedValue(new Error("offline"));

    await act(async () => store.deleteInvoice(pending.id));

    expect(view.result.current.invoices).toEqual([draft]);
    expect(view.result.current.failure).toBe("We couldn’t load your invoices.");
  });

  it("still reports a created invoice as saved", async () => {
    const { api, store } = await mountWith();
    api.createInvoice.mockResolvedValue(anInvoice());
    api.listInvoices.mockRejectedValue(new Error("offline"));

    let saved: boolean | undefined;
    await act(async () => {
      saved = await store.addInvoice({ description: "new" } as never);
    });

    expect(saved).toBe(true);
  });
});
