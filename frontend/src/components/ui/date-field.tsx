import { CalendarIcon } from "@/components/icons";
import type { ComponentProps, ReactNode } from "react";
import { control, controlEdge } from "./control";

type DateFieldProps = Omit<ComponentProps<"input">, "className" | "type"> & {
  label: ReactNode;
  className?: string;
  invalid?: boolean;
};

export default function DateField({
  label,
  className,
  invalid,
  ...props
}: DateFieldProps) {
  return (
    <label className={`flex flex-col gap-2.25 ${className ?? ""}`}>
      <span className="text-meta text-muted">{label}</span>
      <span className="relative block">
        <input
          type="date"
          aria-invalid={invalid}
          className={`${control} ${controlEdge(invalid)} relative`}
          {...props}
        />
        <CalendarIcon className="text-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
      </span>
    </label>
  );
}
