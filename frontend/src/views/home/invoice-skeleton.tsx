const ROWS = [0, 1, 2];

export default function InvoiceSkeleton() {
  return (
    <ul aria-hidden="true" className="mt-8 space-y-4 md:mt-13.75 lg:mt-16">
      {ROWS.map((row) => (
        <li
          key={row}
          className="bg-surface shadow-card rounded-card v-skeleton h-33.5 md:h-18"
        />
      ))}
    </ul>
  );
}
