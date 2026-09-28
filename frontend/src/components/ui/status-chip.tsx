import type { InvoiceStatus } from "@/data";
import type { ComponentProps } from "react";

const tone: Record<InvoiceStatus, string> = {
  draft: "bg-draft-tint text-draft",
  pending: "bg-pending-tint text-pending",
  paid: "bg-paid-tint text-paid",
};

const label: Record<InvoiceStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
};

export default function StatusChip({
  status,
  className,
  ...props
}: Omit<ComponentProps<"span">, "className"> & {
  status: InvoiceStatus;
  className?: string;
}) {
  return (
    <span
      className={`rounded-chip text-body v-ink-center inline-flex h-10 w-26 items-center justify-center gap-2 font-bold ${tone[status]} ${className ?? ""}`}
      {...props}
    >
      <span className="size-2 rounded-full bg-current" />
      {label[status]}
    </span>
  );
}
