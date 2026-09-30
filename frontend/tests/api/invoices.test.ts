import { beforeEach, describe, expect, it, vi } from "vitest";
import { anInvoice } from "../support/factories";

const DEV_ORIGIN = "http://localhost:5180";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const loadApi = async (origin?: string) => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", origin);

  return import("@/api/invoices");
};

const lastCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];

  return { url, init };
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse([]));
  vi.stubGlobal("fetch", fetchMock);
});

describe("api origin", () => {
  it("falls back to the local API when the variable is unset", async () => {
    const api = await loadApi(undefined);

    await api.listInvoices();

    expect(lastCall(fetchMock).url).toBe(`${DEV_ORIGIN}/invoices`);
  });

  it("uses the configured origin when the variable is set", async () => {
    const api = await loadApi("https://api.example.test");

    await api.listInvoices();

    expect(lastCall(fetchMock).url).toBe("https://api.example.test/invoices");
  });
});

describe("listInvoices", () => {
  it("sends a bare GET with no body or content type", async () => {
    const api = await loadApi(undefined);

    await api.listInvoices();

    const { init } = lastCall(fetchMock);

    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toBeUndefined();
  });

  it("returns the parsed invoices", async () => {
    const api = await loadApi(undefined);
    const invoice = anInvoice();
    fetchMock.mockResolvedValueOnce(jsonResponse([invoice]));

    await expect(api.listInvoices()).resolves.toEqual([invoice]);
  });
});

describe("createInvoice", () => {
  it("posts the payload as JSON", async () => {
    const api = await loadApi(undefined);
    const payload = { description: "Re-branding" } as never;

    await api.createInvoice(payload);

    const { url, init } = lastCall(fetchMock);

    expect(url).toBe(`${DEV_ORIGIN}/invoices`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
    expect(init.body).toBe(JSON.stringify(payload));
  });
});

describe("replaceInvoice", () => {
  it("puts to the invoice's own path", async () => {
    const api = await loadApi(undefined);

    await api.replaceInvoice("RT3080", { description: "Edit" } as never);

    const { url, init } = lastCall(fetchMock);

    expect(url).toBe(`${DEV_ORIGIN}/invoices/RT3080`);
    expect(init.method).toBe("PUT");
  });
});

describe("changeInvoiceStatus", () => {
  it("patches only the status", async () => {
    const api = await loadApi(undefined);

    await api.changeInvoiceStatus("RT3080", "paid");

    const { url, init } = lastCall(fetchMock);

    expect(url).toBe(`${DEV_ORIGIN}/invoices/RT3080/status`);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ status: "paid" }));
  });
});

describe("deleteInvoice", () => {
  it("sends a DELETE with no body", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await api.deleteInvoice("RT3080");

    const { url, init } = lastCall(fetchMock);

    expect(url).toBe(`${DEV_ORIGIN}/invoices/RT3080`);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });

  it("does not try to parse an empty 204 body", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(api.deleteInvoice("RT3080")).resolves.toBeInstanceOf(Response);
  });
});

describe("failure handling", () => {
  it("throws naming the method, path and status", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(api.listInvoices()).rejects.toThrow(
      "GET /invoices answered 404",
    );
  });

  it("throws on a server error rather than returning a body", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));

    await expect(
      api.createInvoice({ description: "x" } as never),
    ).rejects.toThrow("POST /invoices answered 500");
  });

  it("names the invoice path on a failed status change", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 409));

    await expect(api.changeInvoiceStatus("RT3080", "paid")).rejects.toThrow(
      "PATCH /invoices/RT3080/status answered 409",
    );
  });

  it("propagates a network failure untouched", async () => {
    const api = await loadApi(undefined);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(api.listInvoices()).rejects.toThrow("Failed to fetch");
  });
});
