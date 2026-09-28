import { DatePicker, SelectMenu, TextField } from "@/components/ui";
import type { ChangeEvent } from "react";
import { blankItem, PAYMENT_TERMS, type Draft, type DraftItem } from "./draft";
import ItemRows from "./item-rows";

type TextKey = {
  [K in keyof Draft]: Draft[K] extends string ? K : never;
}[keyof Draft];

const terms = PAYMENT_TERMS.map((days) => ({
  value: days,
  label: `Net ${days} Day${days === 1 ? "" : "s"}`,
}));

export default function InvoiceFields({
  draft,
  missing,
  describedBy,
  onChange,
}: {
  draft: Draft;
  missing: string[];
  describedBy: string;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const fieldProps = (name: TextKey) => {
    const invalid = missing.includes(name);

    return {
      name,
      value: draft[name],
      invalid,
      "aria-describedby": invalid ? describedBy : undefined,
      onChange: ({ target }: ChangeEvent<HTMLInputElement>) =>
        onChange({ [name]: target.value } as Partial<Draft>),
    };
  };

  const changeItem = (index: number, patch: Partial<DraftItem>) =>
    onChange({
      items: draft.items.map((item, at) =>
        at === index ? { ...item, ...patch } : item,
      ),
    });

  return (
    <>
      <fieldset className="mt-5.5 md:mt-11.5">
        <legend className="text-body text-accent-ink font-bold">
          Bill From
        </legend>
        <div className="mt-6 grid grid-cols-2 gap-x-5.75 gap-y-6.25 md:grid-cols-3 md:gap-x-6">
          <TextField
            label="Street Address"
            autoComplete="street-address"
            className="col-span-2 md:col-span-3"
            {...fieldProps("senderStreet")}
          />
          <TextField
            label="City"
            autoComplete="address-level2"
            {...fieldProps("senderCity")}
          />
          <TextField
            label="Post Code"
            autoComplete="postal-code"
            {...fieldProps("senderPostCode")}
          />
          <TextField
            label="Country"
            autoComplete="country-name"
            className="col-span-2 md:col-span-1"
            {...fieldProps("senderCountry")}
          />
        </div>
      </fieldset>

      <fieldset className="mt-10.25 md:mt-12.25">
        <legend className="text-body text-accent-ink font-bold">Bill To</legend>
        <div className="mt-6 grid grid-cols-2 gap-x-5.75 gap-y-6.25 md:grid-cols-3 md:gap-x-6">
          <TextField
            label="Client’s Name"
            className="col-span-2 md:col-span-3"
            {...fieldProps("clientName")}
          />
          <TextField
            label="Client’s Email"
            type="email"
            className="col-span-2 md:col-span-3"
            {...fieldProps("clientEmail")}
          />
          <TextField
            label="Street Address"
            className="col-span-2 md:col-span-3"
            {...fieldProps("clientStreet")}
          />
          <TextField label="City" {...fieldProps("clientCity")} />
          <TextField label="Post Code" {...fieldProps("clientPostCode")} />
          <TextField
            label="Country"
            className="col-span-2 md:col-span-1"
            {...fieldProps("clientCountry")}
          />
        </div>
      </fieldset>

      <div className="mt-10.25 space-y-6.25 md:mt-12.25">
        <div className="grid gap-y-6.25 md:grid-cols-2 md:gap-x-6">
          <DatePicker
            label="Invoice Date"
            name="createdAt"
            value={draft.createdAt}
            invalid={missing.includes("createdAt")}
            aria-describedby={
              missing.includes("createdAt") ? describedBy : undefined
            }
            onChange={(createdAt) => onChange({ createdAt })}
          />
          <SelectMenu
            label="Payment Terms"
            name="paymentTerms"
            value={draft.paymentTerms}
            options={terms}
            onChange={(paymentTerms) => onChange({ paymentTerms })}
          />
        </div>
        <TextField label="Project Description" {...fieldProps("description")} />
      </div>

      <ItemRows
        items={draft.items}
        missing={missing}
        describedBy={describedBy}
        onChange={changeItem}
        onRemove={(key) =>
          onChange({ items: draft.items.filter((item) => item.key !== key) })
        }
        onAdd={() => onChange({ items: [...draft.items, blankItem()] })}
      />
    </>
  );
}
