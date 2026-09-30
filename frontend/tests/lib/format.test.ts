import { formatAmount, formatDay, formatDecimal } from "@/lib/format";
import { describe, expect, it } from "vitest";

describe("formatDecimal", () => {
  it("always shows two fraction digits", () => {
    expect(formatDecimal(0)).toBe("0.00");
    expect(formatDecimal(2.5)).toBe("2.50");
  });

  it("groups thousands", () => {
    expect(formatDecimal(1234.5)).toBe("1,234.50");
    expect(formatDecimal(1000000)).toBe("1,000,000.00");
  });

  it("rounds to two places rather than truncating", () => {
    expect(formatDecimal(1234.567)).toBe("1,234.57");
    expect(formatDecimal(1234.564)).toBe("1,234.56");
  });

  it("keeps the sign on a negative amount", () => {
    expect(formatDecimal(-50)).toBe("-50.00");
  });
});

describe("formatAmount", () => {
  it("prefixes a spaced pound sign", () => {
    expect(formatAmount(1234.5)).toBe("£ 1,234.50");
  });

  it("formats zero as a real amount", () => {
    expect(formatAmount(0)).toBe("£ 0.00");
  });
});

describe("formatDay", () => {
  it("renders a plain ISO date", () => {
    expect(formatDay("2021-08-21")).toBe("21 Aug 2021");
  });

  it("keeps the padding on a single-digit day", () => {
    expect(formatDay("2021-08-01")).toBe("01 Aug 2021");
  });

  it("ignores a time component", () => {
    expect(formatDay("2021-12-31T23:59:59.000Z")).toBe("31 Dec 2021");
  });

  it("returns an empty string for an empty input", () => {
    expect(formatDay("")).toBe("");
  });

  it("names every month correctly", () => {
    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    names.forEach((name, index) => {
      const month = `${index + 1}`.padStart(2, "0");

      expect(formatDay(`2026-${month}-15`)).toBe(`15 ${name} 2026`);
    });
  });
});
