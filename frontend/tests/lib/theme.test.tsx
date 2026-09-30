import { setTheme, useTheme } from "@/lib/theme";
import { themeStorageKey } from "@/lib/themeScript";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { prefersDark } from "../support/media";

const isDark = () => document.documentElement.classList.contains("dark");

const storedTheme = () => localStorage.getItem(themeStorageKey);

const announceStorageChange = (name: string, value: string | null) =>
  window.dispatchEvent(
    new StorageEvent("storage", { key: name, newValue: value }),
  );

describe("useTheme", () => {
  it("reads light from a document with no dark class", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe("light");
  });

  it("reads dark from a document the pre-paint script already marked", () => {
    document.documentElement.classList.add("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe("dark");
  });
});

describe("setTheme", () => {
  it("paints dark and tells every subscriber", () => {
    const { result } = renderHook(() => useTheme());

    act(() => setTheme("dark"));

    expect(result.current).toBe("dark");
    expect(isDark()).toBe(true);
  });

  it("paints light again", () => {
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useTheme());

    act(() => setTheme("light"));

    expect(result.current).toBe("light");
    expect(isDark()).toBe(false);
  });

  it("remembers the choice for the next visit", () => {
    renderHook(() => useTheme());

    act(() => setTheme("dark"));

    expect(storedTheme()).toBe("dark");
  });

  it("updates every mounted subscriber at once", () => {
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());

    act(() => setTheme("dark"));

    expect(first.result.current).toBe("dark");
    expect(second.result.current).toBe("dark");
  });
});

describe("following the system", () => {
  it("repaints when the system flips and nothing was chosen", () => {
    const { result } = renderHook(() => useTheme());

    act(() => prefersDark(true));

    expect(result.current).toBe("dark");
    expect(isDark()).toBe(true);
  });

  it("repaints back to light when the system returns", () => {
    const { result } = renderHook(() => useTheme());

    act(() => prefersDark(true));
    act(() => prefersDark(false));

    expect(result.current).toBe("light");
  });

  it("ignores the system once the user has chosen", () => {
    const { result } = renderHook(() => useTheme());

    act(() => setTheme("light"));
    act(() => prefersDark(true));

    expect(result.current).toBe("light");
    expect(isDark()).toBe(false);
  });

  it("stops listening once the last subscriber unmounts", () => {
    const { unmount } = renderHook(() => useTheme());

    unmount();
    act(() => prefersDark(true));

    expect(isDark()).toBe(false);
  });
});

describe("following another tab", () => {
  it("adopts a theme stored by a sibling tab", () => {
    const { result } = renderHook(() => useTheme());

    localStorage.setItem(themeStorageKey, "dark");
    act(() => announceStorageChange(themeStorageKey, "dark"));

    expect(result.current).toBe("dark");
  });

  it("falls back to the system when a sibling tab clears the choice", () => {
    const { result } = renderHook(() => useTheme());

    act(() => setTheme("dark"));
    localStorage.removeItem(themeStorageKey);
    act(() => prefersDark(false));
    act(() => announceStorageChange(themeStorageKey, null));

    expect(result.current).toBe("light");
  });

  it("ignores changes to unrelated storage entries", () => {
    const { result } = renderHook(() => useTheme());

    localStorage.setItem("basket", "dark");
    act(() => announceStorageChange("basket", "dark"));

    expect(result.current).toBe("light");
    expect(isDark()).toBe(false);
  });
});

describe("when storage is unavailable", () => {
  it("still paints rather than throwing", () => {
    const original = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    ) ?? {
      configurable: true,
      get: () => window.localStorage,
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });

    try {
      const { result } = renderHook(() => useTheme());

      expect(() => act(() => setTheme("dark"))).not.toThrow();
      expect(result.current).toBe("dark");
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });
});
