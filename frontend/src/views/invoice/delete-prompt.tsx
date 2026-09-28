"use client";

import { Button, Modal } from "@/components/ui";

const TITLE_ID = "delete-prompt-title";
const BODY_ID = "delete-prompt-body";

export default function DeletePrompt({
  id,
  onConfirm,
  onClose,
}: {
  id: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      role="alertdialog"
      aria-labelledby={TITLE_ID}
      aria-describedby={BODY_ID}
      className="backdrop:bg-scrim fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none items-center justify-center bg-transparent p-6 open:flex"
    >
      {(close) => (
        <div className="bg-surface rounded-card max-w-prompt w-full px-8 pt-8.5 pb-8 md:px-12 md:pt-12.75 md:pb-12">
          <h2 id={TITLE_ID} className="text-title">
            Confirm Deletion
          </h2>
          <p id={BODY_ID} className="text-prompt text-muted mt-2 md:mt-3">
            Are you sure you want to delete invoice #{id}? This action cannot be
            undone.
          </p>
          <div className="mt-5.5 flex justify-end gap-2 md:mt-3.5">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
