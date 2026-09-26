export default function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-meta">{label}</p>
      <p className="text-field text-ink mt-3.25 font-bold">{value}</p>
    </div>
  );
}
