import { formatAmount, type InvoiceItem } from "@/lib";

export default function InvoiceItems({
  items,
  total,
}: {
  items: InvoiceItem[];
  total: number;
}) {
  return (
    <div className="mt-10 md:mt-12">
      <div className="bg-sunken rounded-t-card px-6 pb-6 md:px-8 md:pb-10">
        <table className="w-full table-fixed">
          <caption className="sr-only">Items on this invoice</caption>
          <thead className="text-prose hidden md:table-header-group">
            <tr>
              <th scope="col" className="pt-8 text-left font-medium">
                Item Name
              </th>
              <th scope="col" className="w-15 pt-8 text-center font-medium">
                QTY.
              </th>
              <th scope="col" className="w-26 pt-8 text-right font-medium">
                Price
              </th>
              <th scope="col" className="w-34.25 pt-8 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="text-body font-bold">
            {items.map((item) => (
              <tr key={item.name}>
                <td className="text-ink pt-6 md:pt-8">
                  {item.name}
                  <span className="mt-2 block md:hidden">
                    {item.quantity} x {formatAmount(item.price)}
                  </span>
                </td>
                <td className="hidden pt-8 text-center md:table-cell">
                  {item.quantity}
                </td>
                <td className="hidden pt-8 text-right md:table-cell">
                  {formatAmount(item.price)}
                </td>
                <td className="text-ink pt-6 text-right md:pt-8">
                  {formatAmount(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-raised rounded-b-card flex h-20 items-center justify-between px-6 text-white md:px-8">
        <span className="text-prose">
          <span className="md:hidden">Grand Total</span>
          <span className="hidden md:inline">Amount Due</span>
        </span>
        <span className="text-title font-bold">{formatAmount(total)}</span>
      </div>
    </div>
  );
}
