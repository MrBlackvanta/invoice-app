"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export default function usePopover() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return {
    open,
    panelId,
    triggerRef,
    close,
    toggle: () => setOpen((isOpen) => !isOpen),
    rootProps: {
      ref: root,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        close();
      },
    },
  };
}
