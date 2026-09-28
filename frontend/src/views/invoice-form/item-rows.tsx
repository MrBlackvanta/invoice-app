"use client";

import { DeleteIcon } from "@/components/icons";
import { Button, TextField } from "@/components/ui";
import { afterMotion, formatDecimal } from "@/lib";
import { useState, type MouseEvent } from "react";
import { itemTotal, type DraftItem, type ItemField } from "./draft";
import { ADD_ITEM, itemFieldName } from "./validate";

const HEADINGS = [
  { label: "Item Name", width: "flex-1" },
  { label: "Qty.", width: "w-11.5" },
  { label: "Price", width: "w-25" },
  { label: "Total", width: "w-14" },
];

export default function ItemRows({
  items,
  problems,
  describedBy,
  onChange,
  onRemove,
  onAdd,
}: {
  items: DraftItem[];
  problems: string[];
  describedBy: string;
  onChange: (index: number, patch: Partial<DraftItem>) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
}) {
  const [leaving, setLeaving] = useState<string[]>([]);
  const [mounted] = useState(() => new Set(items.map((item) => item.key)));

  const fieldProps = (index: number, field: ItemField) => {
    const name = itemFieldName(index, field);
    const invalid = problems.includes(name);

    return {
      name,
      value: items[index][field],
      invalid,
      "aria-describedby": invalid ? describedBy : undefined,
      onChange: ({ target }: { target: { value: string } }) =>
        onChange(index, { [field]: target.value }),
    };
  };

  const remove = (key: string, event: MouseEvent<HTMLButtonElement>) => {
    const row = event.currentTarget.closest("li");

    setLeaving((keys) => [...keys, key]);
    afterMotion(row).then(() => {
      onRemove(key);
      setLeaving((keys) => keys.filter((leavingKey) => leavingKey !== key));
    });
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
        <ul className="mt-5.5 md:mt-3.75">
          {items.map((item, index) => (
            <li
              key={item.key}
              data-leaving={leaving.includes(item.key) || undefined}
              className={`v-row md:flex md:items-end md:gap-4 ${mounted.has(item.key) ? "" : "v-row-enter"}`}
            >
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
                  <span className="text-body text-muted v-ink-center flex h-12 items-center font-bold">
                    {formatDecimal(itemTotal(item))}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={(event) => remove(item.key, event)}
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
