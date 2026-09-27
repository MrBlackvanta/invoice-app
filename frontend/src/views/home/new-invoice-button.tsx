import { PlusIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function NewInvoiceButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/?new")}
      className="bg-accent hover:bg-accent-strong rounded-pill text-body flex h-11 w-22.5 shrink-0 items-center gap-2 pl-1.5 font-bold text-white transition-colors md:h-12 md:w-37.5 md:gap-4 md:pl-2"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white">
        <PlusIcon className="text-accent" />
      </span>
      <span>
        New<span className="sr-only md:not-sr-only"> Invoice</span>
      </span>
    </button>
  );
}
