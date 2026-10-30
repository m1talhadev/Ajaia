"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/Dialog";
import { ErrorMessage } from "@/components/ui/Feedback";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { api, jsonBody } from "@/lib/api";

// File > Make a copy.
export function CopyDialog({ docId, title, canShare, onClose }: { docId: string; title: string; canShare: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(`Copy of ${title}`.slice(0, 200));
  const [shareWithSamePeople, setShare] = useState(false);
  const { busy, error, run } = useAsyncAction();

  const copy = () =>
    run(async () => {
      const { id } = await api<{ id: string }>(`/api/documents/${docId}/copy`, {
        method: "POST",
        ...jsonBody({ title: name, shareWithSamePeople }),
      });
      router.push(`/docs/${id}`);
    });

  return (
    <Modal title="Copy document" onClose={onClose} onConfirm={copy} confirmLabel={busy ? "Copying…" : "Make a copy"} confirmDisabled={busy || !name.trim()}>
      <label className="block text-sm font-medium text-slate-600">
        Name
        <input
          autoFocus
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </label>
      {canShare && (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={shareWithSamePeople} onChange={(e) => setShare(e.target.checked)} />
          Share it with the same people
        </label>
      )}
      <ErrorMessage message={error} className="mt-3" />
    </Modal>
  );
}
