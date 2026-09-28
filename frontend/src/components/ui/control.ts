export const control =
  "text-body text-ink bg-surface rounded-field v-ink-center block h-12 w-full border px-5 font-bold transition-colors";

export const controlEdge = (invalid?: boolean) =>
  invalid
    ? "border-danger-ink"
    : "border-field-edge hover:border-accent-ink focus:border-accent-ink";
