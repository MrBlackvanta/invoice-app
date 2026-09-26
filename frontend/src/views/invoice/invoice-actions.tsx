import { Button } from "@/components/ui";

export default function InvoiceActions({ className }: { className?: string }) {
  return (
    <div className={`items-center gap-2 ${className ?? ""}`}>
      <Button variant="secondary">Edit</Button>
      <Button variant="danger">Delete</Button>
      <Button className="flex-1 md:flex-none">Mark as Paid</Button>
    </div>
  );
}
