"use client";

import { ArrowDownIcon } from "@/components/icons";
import { afterMotion, bringIntoView } from "@/lib";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { control, controlEdge } from "./control";
import usePopover from "./use-popover";

export default function SelectMenu({
  label,
  name,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  name: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
  className?: string;
}) {
  const { open, panelId, triggerRef, close, toggle, rootProps } = usePopover();
  const [active, setActive] = useState(value);
  const panel = useRef<HTMLUListElement>(null);
  const labelId = useId();

  const optionId = (option: number) => `${panelId}-${option}`;
  const selected = options.find((option) => option.value === value);

  const commit = (option: number) => {
    onChange(option);
    setActive(option);
    close();
  };

  const step = (by: number) => {
    const at = options.findIndex((option) => option.value === active);
    const next = Math.min(options.length - 1, Math.max(0, at + by));
    setActive(options[next].value);
  };

  const reveal = () => {
    const opening = !open;

    setActive(value);
    toggle();
    if (opening)
      afterMotion(panel.current).then(() => bringIntoView(panel.current));
  };

  const keys = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (open) step(event.key === "ArrowDown" ? 1 : -1);
      else reveal();
      return;
    }

    if (!open) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(active);
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(options[event.key === "Home" ? 0 : options.length - 1].value);
    }
  };

  return (
    <div {...rootProps} className={`flex flex-col gap-2.25 ${className ?? ""}`}>
      <span id={labelId} className="text-meta text-muted">
        {label}
      </span>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          aria-activedescendant={open ? optionId(active) : undefined}
          onClick={reveal}
          onKeyDown={keys}
          className={`${control} ${controlEdge()} text-left`}
        >
          {selected?.label}
        </button>
        <ArrowDownIcon
          className={`text-accent pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <ul
          ref={panel}
          id={panelId}
          data-open={open || undefined}
          role="listbox"
          aria-labelledby={labelId}
          className="v-menu bg-popover shadow-popover rounded-card absolute inset-x-0 top-full z-20 mt-2 overflow-hidden"
        >
          {options.map((option) => (
            <li
              key={option.value}
              id={optionId(option.value)}
              role="option"
              aria-selected={option.value === value}
              onClick={() => commit(option.value)}
              className={`text-body v-ink-center aria-selected:text-accent flex h-12 cursor-pointer items-center px-5 font-bold ${option.value === active ? "bg-control text-accent" : "text-ink"}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
