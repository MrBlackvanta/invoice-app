import { Button } from "@/components/ui";

export default function LoadFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="text-heading">We couldn’t load your invoices</h2>
      <p className="text-meta mt-5.75 max-w-72">
        The invoice service didn’t answer. It may be waking up, which can take
        up to a minute.
      </p>
      <Button onClick={onRetry} className="mt-8">
        Try again
      </Button>
    </div>
  );
}
