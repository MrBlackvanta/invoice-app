"use client";

import { afterMotion } from "@/lib";
import { useEffect, useState, type ReactNode } from "react";

export default function Modal({
  onClose,
  className,
  children,
  ...props
}: {
  onClose: () => void;
  className?: string;
  children: (close: () => void) => ReactNode;
  role?: "alertdialog";
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);

  useEffect(() => {
    dialog?.showModal();
  }, [dialog]);

  const close = () => dialog?.close();

  return (
    <dialog
      ref={setDialog}
      onClose={() => afterMotion(dialog).then(onClose)}
      onClick={({ target, currentTarget }) => {
        if (target === currentTarget) close();
      }}
      className={`v-modal ${className ?? ""}`}
      {...props}
    >
      {children(close)}
    </dialog>
  );
}
