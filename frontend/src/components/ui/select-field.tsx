import { ArrowDownIcon } from "@/components/icons";
import type { ComponentProps, ReactNode } from "react";
import { control, controlEdge } from "./control";

type SelectFieldProps = Omit<ComponentProps<"select">, "className"> & {
  label: ReactNode;
  className?: string;
};

export default function SelectField({
  label,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <label className={`flex flex-col gap-2.25 ${className ?? ""}`}>
      <span className="text-meta text-muted">{label}</span>
      <span className="relative block">
        <select
          className={`${control} ${controlEdge()} appearance-none`}
          {...props}
        >
          {children}
        </select>
        <ArrowDownIcon className="text-accent pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
      </span>
    </label>
  );
}
