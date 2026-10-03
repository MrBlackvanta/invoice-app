import { Button } from "@/components/ui";
import type { InvoiceStatus } from "@/lib";
import { markInvoicePaid } from "@/store";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  id,
  status,
  onDelete,
  className,
}: {
  id: string;
  status: InvoiceStatus;
  onDelete: () => void;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={`items-center justify-center gap-2 ${className ?? ""}`}>
      <Button
        variant="secondary"
        onClick={() => router.push(`/?invoice=${id}&edit`)}
      >
        Edit
      </Button>
      <Button variant="danger" onClick={onDelete}>
        Delete
      </Button>
      {status === "pending" && (
        <Button
          onClick={() => markInvoicePaid(id)}
          className="flex-1 md:flex-none"
        >
          Mark as Paid
        </Button>
      )}
    </div>
  );
}
