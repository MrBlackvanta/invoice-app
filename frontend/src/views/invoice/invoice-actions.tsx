import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  id,
  className,
}: {
  id: string;
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
      <Button variant="danger">Delete</Button>
      <Button className="flex-1 md:flex-none">Mark as Paid</Button>
    </div>
  );
}
