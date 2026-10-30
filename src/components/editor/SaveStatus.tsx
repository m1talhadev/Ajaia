import type { SaveConflict } from "@/lib/documents";
import type { SaveState } from "./useDocumentSync";

const LABELS: Record<Exclude<SaveState, "error">, string> = {
  saved: "All changes saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  conflict: "Not saved",
};

export function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button onClick={onRetry} className="text-xs text-red-600 underline">
        Save failed, retry
      </button>
    );
  }
  return <span className="text-xs text-slate-500">{LABELS[state]}</span>;
}

export function ConflictBanner({ conflict, onLoadLatest, onKeepMine }: { conflict: SaveConflict; onLoadLatest: () => void; onKeepMine: () => void }) {
  return (
    <div role="alert" className="mt-2 flex flex-wrap items-center gap-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <span className="flex-1">
        <strong>{conflict.editedBy}</strong> edited this document while you were making changes. Your latest changes haven&apos;t been saved.
      </span>
      <button onClick={onLoadLatest} className="rounded-md bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700">
        Load latest version
      </button>
      <button onClick={onKeepMine} className="rounded-md border border-amber-600 px-3 py-1 font-medium hover:bg-amber-100">
        Keep my version
      </button>
    </div>
  );
}
