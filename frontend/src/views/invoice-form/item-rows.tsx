import { DeleteIcon } from "@/components/icons";
import { Button, TextField } from "@/components/ui";
import { formatDecimal } from "@/lib";
import { itemTotal, type DraftItem } from "./draft";
import { ADD_ITEM, itemFieldName } from "./validate";

const HEADINGS = [
  { label: "Item Name", width: "flex-1" },
  { label: "Qty.", width: "w-11.5" },
  { label: "Price", width: "w-25" },
  { label: "Total", width: "w-14" },
];

export default function ItemRows({
  items,
  missing,
  describedBy,
  onChange,
  onRemove,
  onAdd,
}: {
  items: DraftItem[];
  missing: string[];
  describedBy: string;
  onChange: (index: number, patch: Partial<DraftItem>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  const fieldProps = (index: number, field: "name" | "quantity" | "price") => {
    const name = itemFieldName(index, field);
    const invalid = missing.includes(name);

    return {
      name,
      value: items[index][field],
      invalid,
      "aria-describedby": invalid ? describedBy : undefined,
      onChange: ({ target }: { target: { value: string } }) =>
        onChange(index, { [field]: target.value }),
    };
  };

  return (
    <section className="mt-17.25 md:mt-8.75">
      <h3 className="text-section text-subhead">Item List</h3>
      <div className="text-meta text-muted mt-3.5 hidden gap-4 md:flex">
        {HEADINGS.map(({ label, width }) => (
          <span key={label} className={width} aria-hidden="true">
            {label}
          </span>
        ))}
        <span className="w-6" />
      </div>
      {items.length > 0 && (
        <ul className="mt-5.5 space-y-12.25 md:mt-3.75 md:space-y-4.5">
          {items.map((item, index) => (
            <li key={item.key} className="md:flex md:items-end md:gap-4">
              <TextField
                label={
                  <>
                    Item Name<span className="sr-only"> {index + 1}</span>
                  </>
                }
                className="md:flex-1 md:[&>span]:sr-only"
                {...fieldProps(index, "name")}
              />
              <div className="mt-6.25 flex items-end gap-4 md:contents">
                <TextField
                  label={
                    <>
                      Qty.<span className="sr-only"> for item {index + 1}</span>
                    </>
                  }
                  inputMode="numeric"
                  className="w-16 md:w-11.5 md:[&>input]:px-1 md:[&>input]:text-center md:[&>span]:sr-only"
                  {...fieldProps(index, "quantity")}
                />
                <TextField
                  label={
                    <>
                      Price
                      <span className="sr-only"> for item {index + 1}</span>
                    </>
                  }
                  inputMode="decimal"
                  className="w-25 md:[&>span]:sr-only"
                  {...fieldProps(index, "price")}
                />
                <p className="flex flex-1 flex-col gap-2.25 md:w-14 md:flex-none">
                  <span className="text-meta text-muted md:sr-only">
                    Total<span className="sr-only"> for item {index + 1}</span>
                  </span>
                  <span className="text-body text-muted flex h-12 items-center font-bold">
                    {formatDecimal(itemTotal(item))}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-muted hover:text-danger-ink flex h-12 w-6 shrink-0 items-center justify-center transition-colors"
                >
                  <DeleteIcon />
                  <span className="sr-only">Delete item {index + 1}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="secondary"
        name={ADD_ITEM}
        onClick={onAdd}
        className="mt-12 w-full md:mt-4.5"
      >
        + Add New Item
      </Button>
    </section>
  );
}
