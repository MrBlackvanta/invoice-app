import type { ComponentProps } from "react";

const tone = {
  primary: "bg-accent hover:bg-accent-strong text-white",
  secondary: "bg-sunken hover:bg-sunken-hover text-muted hover:text-graphite",
  draft: "bg-slate hover:bg-graphite text-slate-ink",
  danger: "bg-danger hover:bg-danger-strong text-white",
};

export default function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof tone }) {
  return (
    <button
      type="button"
      className={`rounded-pill text-body flex h-12 shrink-0 items-center justify-center px-6 font-bold transition-colors ${tone[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
