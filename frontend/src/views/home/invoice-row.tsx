import { ArrowRightIcon } from "@/components/icons";
import { StatusChip } from "@/components/ui";
import type { Invoice } from "@/data";
import { formatAmount, formatDay } from "@/lib";
import Link from "next/link";

export default function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <li>
      <Link
        href={`/?invoice=${invoice.id}`}
        className="bg-surface shadow-card rounded-card hover:inset-ring-accent grid grid-cols-2 px-6 pt-6.25 pb-5.5 inset-ring-1 inset-ring-transparent transition-shadow md:flex md:h-18 md:items-center md:py-0 md:pr-5.5 lg:pl-8"
      >
        <span className="text-body text-ink col-start-1 row-start-1 pb-6 font-bold md:w-21.75 md:pb-0 lg:w-25.75">
          <span className="text-hash">#</span>
          {invoice.id}
        </span>
        <span className="text-meta text-muted col-start-1 row-start-2 pb-2.25 md:w-35.75 md:pb-0 lg:w-37.75">
          Due {formatDay(invoice.paymentDue)}
        </span>
        <span className="text-meta text-client col-start-2 row-start-1 truncate text-right md:min-w-0 md:flex-1 md:text-left">
          {invoice.clientName}
        </span>
        <span className="text-amount text-ink col-start-1 row-start-3 font-bold md:text-right">
          {formatAmount(invoice.total)}
        </span>
        <StatusChip
          status={invoice.status}
          className="col-start-2 row-span-2 row-start-2 self-center justify-self-end md:ml-10"
        />
        <ArrowRightIcon className="text-accent hidden shrink-0 md:ml-4.75 md:block" />
      </Link>
    </li>
  );
}
