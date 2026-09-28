"use client";

import { ArrowLeftIcon } from "@/components/icons";
import { Button, Modal } from "@/components/ui";
import type { Invoice } from "@/data";
import { bringIntoView, createInvoiceId } from "@/lib";
import { saveInvoice } from "@/store";
import { useRef, useState, type SubmitEvent } from "react";
import { toDraft, toInvoice, type Draft } from "./draft";
import InvoiceFields from "./invoice-fields";
import { findMissing, focusFirstMissing, NOTHING_MISSING } from "./validate";

const TITLE_ID = "invoice-form-title";
const ERROR_ID = "invoice-form-error";

export default function InvoiceDrawer({
  invoice,
  onClose,
}: {
  invoice?: Invoice;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(invoice));
  const [attempts, setAttempts] = useState(0);
  const alert = useRef<HTMLDivElement>(null);

  const missing = attempts > 0 ? findMissing(draft) : NOTHING_MISSING;

  const change = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const reject = (form: HTMLFormElement, problems: string[]) => {
    setAttempts((count) => count + 1);
    focusFirstMissing(form, problems);
    requestAnimationFrame(() => bringIntoView(alert.current));
  };

  return (
    <Modal
      onClose={onClose}
      aria-labelledby={TITLE_ID}
      className="bg-scrim fixed inset-0 top-18 m-0 h-auto max-h-none w-auto max-w-none p-0 backdrop:bg-transparent md:top-20 lg:top-0 lg:left-25.75"
    >
      {(close) => {
        const save = (id: string, status: Invoice["status"]) => {
          saveInvoice(toInvoice(draft, id, status));
          close();
        };

        const submit = (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          const problems = findMissing(draft);

          if (problems.length > 0) return reject(event.currentTarget, problems);

          save(
            invoice?.id ?? createInvoiceId(),
            invoice?.status === "paid" ? "paid" : "pending",
          );
        };

        return (
          <form
            noValidate
            onSubmit={submit}
            className="bg-drawer md:max-w-drawer md:rounded-r-rail v-drawer absolute inset-y-0 left-0 flex w-full flex-col overflow-hidden"
          >
            <div className="v-no-scrollbar flex-1 overflow-y-auto overscroll-contain px-6 pt-8.25 pb-8 md:px-14 md:pt-14.75 md:pb-0">
              <button
                type="button"
                onClick={close}
                className="text-body text-ink hover:text-muted group flex w-fit items-center gap-5.25 font-bold transition-colors md:hidden"
              >
                <ArrowLeftIcon className="text-accent group-hover:text-accent-soft transition-colors" />
                Go back
              </button>
              <h2 id={TITLE_ID} className="text-title mt-6.5 md:mt-0">
                {invoice ? `Edit #${invoice.id}` : "New Invoice"}
              </h2>

              <InvoiceFields
                draft={draft}
                missing={missing}
                describedBy={ERROR_ID}
                onChange={change}
              />

              <div ref={alert} role="alert" className="bg-drawer relative z-10">
                {missing.length > 0 && (
                  <p
                    key={attempts}
                    id={ERROR_ID}
                    className="text-note text-danger-ink mt-8.5 font-bold"
                  >
                    - All fields must be added
                  </p>
                )}
              </div>
            </div>

            <div className="relative flex shrink-0 justify-between gap-1.75 px-6 pt-5.25 pb-5.5 md:gap-2 md:px-14 md:pt-9.75 md:pb-8">
              <span className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-linear-to-b/srgb from-black/0 to-black/10 md:h-50" />
              {invoice ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={close}
                    className="ml-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={close}>
                    Discard
                  </Button>
                  <Button
                    variant="draft"
                    onClick={() => save(createInvoiceId(), "draft")}
                    className="md:ml-auto"
                  >
                    Save as Draft
                  </Button>
                  <Button type="submit">Save &amp; Send</Button>
                </>
              )}
            </div>
          </form>
        );
      }}
    </Modal>
  );
}
