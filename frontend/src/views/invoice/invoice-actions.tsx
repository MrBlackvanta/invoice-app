import { Button } from "@/components/ui";
import { markInvoicePaid } from "@/store";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  id,
  onDelete,
  className,
}: {
  id: string;
  onDelete: () => void;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={`items-center gap-2 ${className ?? ""}`}>
      <Button
        variant="secondary"
        onClick={() => router.push(`/?invoice=${id}&edit`)}
      >
        Edit
      </Button>
      <Button variant="danger" onClick={onDelete}>
        Delete
      </Button>
      <Button
        onClick={() => markInvoicePaid(id)}
        className="flex-1 md:flex-none"
      >
        Mark as Paid
      </Button>
    </div>
  );
}
