"use client";

import { ArrowLeftIcon } from "@/components/icons";
import { Button, Modal } from "@/components/ui";
import { bringIntoView, type Invoice, type InvoiceStatus } from "@/lib";
import { addInvoice, editInvoice } from "@/store";
import { useRef, useState, type SubmitEvent } from "react";
import { toDraft, toPayload, type Draft } from "./draft";
import InvoiceFields from "./invoice-fields";
import { findProblems, focusFirstProblem, NO_PROBLEMS } from "./validate";

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
  const [pending, setPending] = useState<InvoiceStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const alert = useRef<HTMLDivElement>(null);

  const problems = attempts > 0 ? findProblems(draft) : NO_PROBLEMS;
  const sendStatus = invoice?.status === "paid" ? "paid" : "pending";
  const busy = pending !== null;

  const label = (status: InvoiceStatus, text: string) =>
    pending === status ? "Saving…" : text;

  const change = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const reject = (form: HTMLFormElement, fields: string[]) => {
    setAttempts((count) => count + 1);
    focusFirstProblem(form, fields);
    requestAnimationFrame(() => bringIntoView(alert.current));
  };

  return (
    <Modal
      onClose={onClose}
      aria-labelledby={TITLE_ID}
      className="bg-scrim fixed inset-0 top-18 m-0 h-auto max-h-none w-auto max-w-none p-0 backdrop:bg-transparent md:top-20 lg:top-0 lg:left-25.75"
    >
      {(close) => {
        const save = async (status: InvoiceStatus) => {
          setPending(status);
          setFailed(false);

          const payload = toPayload(draft, status);
          const saved = invoice
            ? await editInvoice(invoice.id, payload)
            : await addInvoice(payload);

          if (saved) return close();

          setPending(null);
          setFailed(true);
          requestAnimationFrame(() => bringIntoView(alert.current));
        };

        const submit = (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          const found = findProblems(draft);

          if (found.fields.length > 0) {
            return reject(event.currentTarget, found.fields);
          }

          void save(sendStatus);
        };

        const saveDraft = (form: HTMLFormElement | null) => {
          const found = findProblems(draft);

          if (form && found.malformed) return reject(form, found.fields);

          void save("draft");
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
                problems={problems.fields}
                describedBy={ERROR_ID}
                onChange={change}
              />

              <div
                ref={alert}
                id={ERROR_ID}
                role="alert"
                className="bg-drawer relative z-10"
              >
                {problems.missing && (
                  <p
                    key={attempts}
                    className="text-note text-danger-ink mt-8.5 font-bold"
                  >
                    - All fields must be added
                  </p>
                )}
                {problems.malformed && (
                  <p
                    key={`malformed-${attempts}`}
                    className="text-note text-danger-ink mt-8.5 font-bold"
                  >
                    - Quantity must be a whole number and price an amount
                  </p>
                )}
                {failed && (
                  <p className="text-note text-danger-ink mt-8.5 font-bold">
                    - Couldn’t reach the invoice service. Try again in a moment.
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
                    disabled={busy}
                    onClick={close}
                    className="ml-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {label(sendStatus, "Save Changes")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" disabled={busy} onClick={close}>
                    Discard
                  </Button>
                  <Button
                    variant="draft"
                    disabled={busy}
                    onClick={(event) => saveDraft(event.currentTarget.form)}
                    className="md:ml-auto"
                  >
                    {label("draft", "Save as Draft")}
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {label(sendStatus, "Save & Send")}
                  </Button>
                </>
              )}
            </div>
          </form>
        );
      }}
    </Modal>
  );
}
