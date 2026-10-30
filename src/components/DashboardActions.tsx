"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useFilePicker } from "@/hooks/useFilePicker";
import { createDocument, importDocument } from "@/lib/api";
import { IMPORT_ACCEPT, IMPORT_EXTENSIONS, MAX_UPLOAD_LABEL } from "@/lib/uploads";

export function DashboardActions() {
  const router = useRouter();
  const { error, run } = useAsyncAction();
  // Which action is running. Stays set after success while the new document page loads.
  const [pending, setPending] = useState<"import" | "create" | null>(null);

  async function open(action: "import" | "create", create: () => Promise<{ id: string }>) {
    setPending(action);
    const opened = await run(async () => {
      router.push(`/docs/${(await create()).id}`);
      return true;
    });
    if (!opened) setPending(null);
  }

  const importPicker = useFilePicker(IMPORT_ACCEPT, (file) => open("import", () => importDocument(file)));

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          disabled={pending !== null}
          onClick={importPicker.open}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {pending === "import" ? "Importing…" : "Import file"}
        </button>
        <button
          disabled={pending !== null}
          onClick={() => open("create", createDocument)}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {pending === "create" ? "Creating…" : "New document"}
        </button>
        {importPicker.input}
      </div>
      <p className="text-xs text-slate-500">
        Import supports {IMPORT_EXTENSIONS.join(", ")} (max {MAX_UPLOAD_LABEL})
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
