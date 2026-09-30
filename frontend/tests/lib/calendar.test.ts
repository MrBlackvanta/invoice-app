import {
  fromIso,
  isSameMonth,
  monthLabel,
  monthWeeks,
  shiftDays,
  shiftMonths,
  todayIso,
  toIso,
  weekdays,
} from "@/lib/calendar";
import { afterEach, describe, expect, it, vi } from "vitest";

const at = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

describe("toIso", () => {
  it("pads single-digit months and days", () => {
    expect(toIso(at(2026, 1, 5))).toBe("2026-01-05");
  });

  it("keeps two-digit parts unpadded", () => {
    expect(toIso(at(2026, 12, 31))).toBe("2026-12-31");
  });

  it("reads local calendar fields, not UTC ones", () => {
    const lateEvening = new Date(2026, 0, 5, 23, 59, 59);

    expect(toIso(lateEvening)).toBe("2026-01-05");
  });
});

describe("fromIso", () => {
  it("builds a local date rather than a UTC instant", () => {
    const parsed = fromIso("2026-01-05");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(5);
    expect(parsed.getHours()).toBe(0);
  });

  it("round-trips every day of a leap February", () => {
    for (let day = 1; day <= 29; day++) {
      const iso = `2024-02-${`${day}`.padStart(2, "0")}`;

      expect(toIso(fromIso(iso))).toBe(iso);
    }
  });
});

describe("todayIso", () => {
  afterEach(() => vi.useRealTimers());

  it("formats the current local day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 10, 17));

    expect(todayIso()).toBe("2026-09-30");
  });
});

describe("shiftDays", () => {
  it("crosses a month boundary", () => {
    expect(toIso(shiftDays(at(2026, 1, 31), 1))).toBe("2026-02-01");
  });

  it("crosses a year boundary backwards", () => {
    expect(toIso(shiftDays(at(2026, 1, 1), -1))).toBe("2025-12-31");
  });

  it("lands on 29 February in a leap year", () => {
    expect(toIso(shiftDays(at(2024, 2, 28), 1))).toBe("2024-02-29");
  });

  it("skips 29 February in a common year", () => {
    expect(toIso(shiftDays(at(2026, 2, 28), 1))).toBe("2026-03-01");
  });

  it("returns the same day for a zero shift", () => {
    expect(toIso(shiftDays(at(2026, 6, 15), 0))).toBe("2026-06-15");
  });

  it("does not mutate its argument", () => {
    const original = at(2026, 6, 15);

    shiftDays(original, 40);

    expect(toIso(original)).toBe("2026-06-15");
  });
});

describe("shiftMonths", () => {
  it("clamps the 31st onto a 28-day February", () => {
    expect(toIso(shiftMonths(at(2026, 1, 31), 1))).toBe("2026-02-28");
  });

  it("clamps the 31st onto a 29-day February", () => {
    expect(toIso(shiftMonths(at(2024, 1, 31), 1))).toBe("2024-02-29");
  });

  it("clamps the 31st onto a 30-day month", () => {
    expect(toIso(shiftMonths(at(2026, 5, 31), 1))).toBe("2026-06-30");
  });

  it("rolls forward across a year boundary", () => {
    expect(toIso(shiftMonths(at(2026, 12, 31), 1))).toBe("2027-01-31");
  });

  it("rolls backward across a year boundary", () => {
    expect(toIso(shiftMonths(at(2026, 1, 15), -1))).toBe("2025-12-15");
  });

  it("does not drift when stepping forward then back", () => {
    expect(toIso(shiftMonths(shiftMonths(at(2026, 3, 15), 1), -1))).toBe(
      "2026-03-15",
    );
  });

  it("does not mutate its argument", () => {
    const original = at(2026, 1, 31);

    shiftMonths(original, 1);

    expect(toIso(original)).toBe("2026-01-31");
  });
});

describe("monthWeeks", () => {
  it("always returns six rows of seven days", () => {
    for (let month = 1; month <= 12; month++) {
      const weeks = monthWeeks(at(2026, month, 1));

      expect(weeks).toHaveLength(6);
      weeks.forEach((week) => expect(week).toHaveLength(7));
    }
  });

  it("starts every row on a Monday", () => {
    monthWeeks(at(2026, 1, 1)).forEach((week) =>
      expect(week[0].getDay()).toBe(1),
    );
  });

  it("begins on the Monday of the week holding the first", () => {
    expect(toIso(monthWeeks(at(2026, 1, 1))[0][0])).toBe("2025-12-29");
  });

  it("begins on the first itself when the month opens on a Monday", () => {
    expect(toIso(monthWeeks(at(2026, 6, 1))[0][0])).toBe("2026-06-01");
  });

  it("covers every day of the month it was asked about", () => {
    const days = monthWeeks(at(2026, 2, 1))
      .flat()
      .map(toIso);

    for (let day = 1; day <= 28; day++) {
      expect(days).toContain(`2026-02-${`${day}`.padStart(2, "0")}`);
    }
  });

  it("returns consecutive days with no gaps or repeats", () => {
    const days = monthWeeks(at(2026, 3, 1)).flat();

    expect(new Set(days.map(toIso)).size).toBe(42);
    days.slice(1).forEach((day, index) => {
      expect(toIso(day)).toBe(toIso(shiftDays(days[index], 1)));
    });
  });

  it("is unaffected by which day of the month it is given", () => {
    expect(
      monthWeeks(at(2026, 4, 1))
        .flat()
        .map(toIso),
    ).toEqual(
      monthWeeks(at(2026, 4, 30))
        .flat()
        .map(toIso),
    );
  });
});

describe("isSameMonth", () => {
  it("accepts two days in the same month", () => {
    expect(isSameMonth(at(2026, 4, 1), at(2026, 4, 30))).toBe(true);
  });

  it("rejects the same month number in different years", () => {
    expect(isSameMonth(at(2025, 4, 1), at(2026, 4, 1))).toBe(false);
  });

  it("rejects adjacent months", () => {
    expect(isSameMonth(at(2026, 4, 30), at(2026, 5, 1))).toBe(false);
  });
});

describe("monthLabel", () => {
  it("names the month and year", () => {
    expect(monthLabel(at(2026, 9, 30))).toBe("September 2026");
  });

  it("names December without rolling the year", () => {
    expect(monthLabel(at(2026, 12, 1))).toBe("December 2026");
  });
});

describe("weekdays", () => {
  it("lists seven days starting on Monday", () => {
    expect(weekdays).toHaveLength(7);
    expect(weekdays[0].full).toBe("Monday");
    expect(weekdays[6].full).toBe("Sunday");
  });

  it("gives every short label a distinct full name", () => {
    expect(new Set(weekdays.map(({ full }) => full)).size).toBe(7);
  });
});
