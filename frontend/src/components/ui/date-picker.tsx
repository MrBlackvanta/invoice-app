"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@/components/icons";
import {
  afterMotion,
  bringIntoView,
  formatDay,
  fromIso,
  isSameMonth,
  monthLabel,
  monthWeeks,
  shiftDays,
  shiftMonths,
  toIso,
  todayIso,
  weekdays,
} from "@/lib";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { control, controlEdge } from "./control";
import usePopover from "./use-popover";

const weekStart = (date: Date) => (date.getDay() + 6) % 7;

export default function DatePicker({
  label,
  name,
  value,
  invalid,
  onChange,
  className,
  ...props
}: {
  label: string;
  name: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  className?: string;
  "aria-describedby"?: string;
}) {
  const { open, panelId, triggerRef, close, toggle, rootProps } = usePopover();
  const [cursor, setCursor] = useState(value);
  const grid = useRef<HTMLTableElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const monthId = useId();

  useEffect(() => {
    if (!open) return;
    grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [open, cursor]);

  const focused = fromIso(cursor || todayIso());
  const today = todayIso();

  const reveal = () => {
    const opening = !open;

    setCursor(value || todayIso());
    toggle();
    if (opening)
      afterMotion(panel.current).then(() => bringIntoView(panel.current));
  };

  const commit = (day: Date) => {
    onChange(toIso(day));
    setCursor(toIso(day));
    close();
  };

  const keys = (event: KeyboardEvent) => {
    const days: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekStart(focused),
      End: 6 - weekStart(focused),
    };

    if (event.key in days) {
      event.preventDefault();
      setCursor(toIso(shiftDays(focused, days[event.key])));
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      setCursor(toIso(shiftMonths(focused, event.key === "PageUp" ? -1 : 1)));
    }
  };

  const stepMonth = (by: number) => setCursor(toIso(shiftMonths(focused, by)));

  return (
    <div {...rootProps} className={`flex flex-col gap-2.25 ${className ?? ""}`}>
      <span id={labelId} className="text-meta text-muted">
        {label}
      </span>
      <div className="relative">
        <button
          {...props}
          ref={triggerRef}
          type="button"
          name={name}
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          aria-labelledby={labelId}
          onClick={reveal}
          className={`${control} ${controlEdge(invalid)} text-left`}
        >
          {formatDay(value)}
        </button>
        <CalendarIcon className="text-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
        <div
          ref={panel}
          id={panelId}
          data-open={open || undefined}
          role="dialog"
          aria-labelledby={monthId}
          className="v-menu bg-popover shadow-popover rounded-card absolute top-full left-1/2 z-20 mt-2 w-85 max-w-[calc(100vw-1rem)] -translate-x-1/2 p-4 md:left-0 md:translate-x-0"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              className="text-muted hover:text-accent grid size-11 place-items-center transition-colors"
            >
              <ArrowLeftIcon />
              <span className="sr-only">Previous month</span>
            </button>
            <span id={monthId} className="text-body text-ink font-bold">
              {monthLabel(focused)}
            </span>
            <button
              type="button"
              onClick={() => stepMonth(1)}
              className="text-muted hover:text-accent grid size-11 place-items-center transition-colors"
            >
              <ArrowRightIcon />
              <span className="sr-only">Next month</span>
            </button>
          </div>
          <table
            ref={grid}
            role="grid"
            aria-labelledby={monthId}
            onKeyDown={keys}
            className="mt-3 w-full table-fixed border-separate border-spacing-y-1"
          >
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th
                    key={day.full}
                    scope="col"
                    abbr={day.full}
                    className="text-note text-muted font-bold"
                  >
                    {day.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks(focused).map((week) => (
                <tr key={toIso(week[0])}>
                  {week.map((day) => {
                    const iso = toIso(day);

                    return (
                      <td key={iso} aria-selected={iso === value}>
                        <button
                          type="button"
                          tabIndex={iso === cursor ? 0 : -1}
                          onClick={() => commit(day)}
                          aria-label={formatDay(iso)}
                          className={`text-meta v-ink-center grid aspect-square w-full place-items-center rounded-full font-bold transition-colors ${
                            iso === value
                              ? "bg-accent text-white"
                              : `hover:bg-control ${isSameMonth(day, focused) ? "text-ink" : "text-muted/60"} ${iso === today ? "text-accent" : ""}`
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
