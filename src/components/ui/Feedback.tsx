import { IconX } from "@tabler/icons-react";

export function ErrorMessage({ message, onDismiss, className = "" }: { message: string | null; onDismiss?: () => void; className?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}>
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="rounded p-0.5 hover:bg-red-100">
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
