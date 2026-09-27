import type { ComponentProps, ReactNode } from "react";
import { control, controlEdge } from "./control";

type TextFieldProps = Omit<ComponentProps<"input">, "className"> & {
  label: ReactNode;
  className?: string;
  invalid?: boolean;
};

export default function TextField({
  label,
  className,
  invalid,
  ...props
}: TextFieldProps) {
  return (
    <label className={`flex flex-col gap-2.25 ${className ?? ""}`}>
      <span className="text-meta text-muted">{label}</span>
      <input
        aria-invalid={invalid}
        className={`${control} ${controlEdge(invalid)}`}
        {...props}
      />
    </label>
  );
}
