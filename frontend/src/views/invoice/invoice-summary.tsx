import type { Invoice } from "@/data";
import { formatDay } from "@/lib";
import AddressBlock from "./address-block";
import Field from "./field";
import InvoiceItems from "./invoice-items";

export default function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <article className="bg-surface shadow-card rounded-card mt-4 p-6 md:mt-6 md:p-8 lg:p-12">
      <div className="flex flex-col gap-7.5 md:flex-row md:justify-between md:gap-4">
        <div>
          <h1 className="text-body md:text-amount">
            <span className="sr-only">Invoice </span>
            <span className="text-hash">#</span>
            {invoice.id}
          </h1>
          <p className="text-meta mt-1 md:mt-1.75">{invoice.description}</p>
        </div>
        <AddressBlock
          address={invoice.senderAddress}
          className="md:text-right"
        />
      </div>
      <div className="mt-8.5 grid grid-cols-2 gap-y-8 md:mt-6 md:flex">
        <div className="md:w-49">
          <Field label="Invoice Date" value={formatDay(invoice.createdAt)} />
          <Field
            label="Payment Due"
            value={formatDay(invoice.paymentDue)}
            className="mt-7.75"
          />
        </div>
        <div className="md:w-50.75">
          <Field label="Bill To" value={invoice.clientName} />
          <AddressBlock address={invoice.clientAddress} className="mt-1.75" />
        </div>
        <Field
          label="Sent to"
          value={invoice.clientEmail}
          className="col-span-2 md:col-auto"
        />
      </div>
      <InvoiceItems items={invoice.items} total={invoice.total} />
    </article>
  );
}
