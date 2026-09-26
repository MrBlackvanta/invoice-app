import type { InvoiceStatus } from "@/data";
import NewInvoiceButton from "./new-invoice-button";
import StatusFilter from "./status-filter";

function countLabels(count: number, statuses: InvoiceStatus[]) {
  if (count === 0) return { short: "No invoices", long: "No invoices" };

  const scope = statuses.length === 1 ? ` ${statuses[0]}` : "";
  const noun = count === 1 ? "invoice" : "invoices";
  const verb = count === 1 ? "is" : "are";

  return {
    short: `${count}${scope} ${noun}`,
    long: `There ${verb} ${count}${scope || " total"} ${noun}`,
  };
}

export default function ListHeader({
  count,
  statuses,
  onToggle,
}: {
  count: number;
  statuses: InvoiceStatus[];
  onToggle: (status: InvoiceStatus) => void;
}) {
  const { short, long } = countLabels(count, statuses);

  return (
    <div className="flex items-end justify-between md:items-start">
      <div className="md:mt-0.25">
        <h1 className="text-heading md:text-display">Invoices</h1>
        <p className="text-meta mt-0.75 md:mt-1.5">
          <span className="md:hidden">{short}</span>
          <span className="hidden md:inline">{long}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4.25 md:gap-9.75">
        <StatusFilter statuses={statuses} onToggle={onToggle} />
        <NewInvoiceButton />
      </div>
    </div>
  );
}
