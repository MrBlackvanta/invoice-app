export default function FailureToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-danger-strong rounded-card shadow-popover max-w-prompt fixed inset-x-6 bottom-6 z-30 mx-auto flex items-center gap-4 px-6 py-4 text-white"
    >
      <p className="text-note flex-1 font-bold">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-note -mr-2 h-11 shrink-0 rounded-full px-3 font-bold transition-colors hover:bg-white/15"
      >
        Dismiss
      </button>
    </div>
  );
}
