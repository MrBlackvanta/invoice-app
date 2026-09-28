"use client";

import { ArrowDownIcon, CheckIcon } from "@/components/icons";
import { usePopover } from "@/components/ui";
import type { InvoiceStatus } from "@/lib";

const options: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
];

export default function StatusFilter({
  statuses,
  onToggle,
}: {
  statuses: InvoiceStatus[];
  onToggle: (status: InvoiceStatus) => void;
}) {
  const { open, panelId, triggerRef, toggle, rootProps } = usePopover();

  return (
    <div {...rootProps} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="text-body text-ink flex items-center gap-3.25 font-bold"
      >
        <span>
          Filter<span className="sr-only md:not-sr-only"> by status</span>
        </span>
        <ArrowDownIcon
          className={`text-accent shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={panelId}
        data-open={open || undefined}
        className="v-menu bg-popover shadow-popover rounded-card absolute top-full left-1/2 z-20 mt-6 w-48 -translate-x-1/2 space-y-4 p-6"
      >
        {options.map(({ value, label }) => {
          const checked = statuses.includes(value);

          return (
            <label
              key={value}
              className="group/option flex cursor-pointer items-center gap-3.25"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(value)}
                className="peer sr-only"
              />
              <span
                className={`peer-focus-visible:outline-accent-ink grid size-4 shrink-0 place-items-center rounded-xs border border-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${checked ? "bg-accent" : "bg-control group-hover/option:border-accent"}`}
              >
                {checked && <CheckIcon className="text-white" />}
              </span>
              <span className="text-body text-ink font-bold">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
