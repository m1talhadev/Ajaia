"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage, jsonBody } from "@/lib/api";
import type { SaveConflict, SyncResponse } from "@/lib/documents";

export type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
export type RemoteChange = NonNullable<SyncResponse["latest"]>;
type Patch = { title?: string; content?: string };

const AUTOSAVE_MS = 800;
const POLL_MS = 3000;

const isEmpty = (patch: Patch) => patch.title === undefined && patch.content === undefined;

// Keeps an open document in step with the server:
// - autosaves edits, debounced and one request at a time, against the revision they were made on;
// - polls for changes saved by other people and applies them in place while this tab has no unsaved changes;
// - when a save conflicts with someone else's, pauses autosave until the user loads the latest version or keeps theirs.
export function useDocumentSync({
  docId,
  initialRevision,
  editor,
  onRemoteChange,
}: {
  docId: string;
  initialRevision: number;
  editor: Editor | null;
  onRemoteChange: (change: RemoteChange) => void;
}) {
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<SaveConflict | null>(null);

  const revision = useRef(initialRevision);
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const paused = useRef(false);
  const remoteChange = useRef(onRemoteChange);
  remoteChange.current = onRemoteChange;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) await inFlight.current;
    const patch = pending.current;
    if (paused.current || isEmpty(patch)) return;
    pending.current = {};
    setState("saving");
    inFlight.current = api<{ revision: number }>(`/api/documents/${docId}`, {
      method: "PATCH",
      ...jsonBody({ ...patch, baseRevision: revision.current }),
    })
      .then((res) => {
        revision.current = res.revision;
        setError(null);
        setState(isEmpty(pending.current) ? "saved" : "dirty");
      })
      .catch((e: unknown) => {
        pending.current = { ...patch, ...pending.current };
        if (e instanceof ApiError && e.status === 409) {
          paused.current = true;
          setConflict(e.body as SaveConflict);
          setState("conflict");
        } else {
          setError(errorMessage(e));
          setState("error");
        }
      })
      .finally(() => {
        inFlight.current = null;
      });
    await inFlight.current;
  }, [docId]);

  const save = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      if (paused.current) return;
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush],
  );

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => save({ content: editor.getHTML() });
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, save]);

  // Replaces the content without a reload or an undo step, keeping the cursor
  // where it was as far as the new content allows.
  const applyRemote = useCallback(
    (latestRevision: number, change: RemoteChange) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      editor.chain().setMeta("addToHistory", false).setContent(change.content, { emitUpdate: false }).setTextSelection({ from, to }).run();
      revision.current = latestRevision;
      remoteChange.current(change);
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    let active = true;
    const hasLocalChanges = () => paused.current || timer.current !== null || inFlight.current !== null || !isEmpty(pending.current);
    const poll = async () => {
      if (document.hidden || hasLocalChanges()) return;
      try {
        const res = await api<SyncResponse>(`/api/documents/${docId}/sync?revision=${revision.current}`);
        if (active && res.latest && res.revision > revision.current && !hasLocalChanges()) applyRemote(res.revision, res.latest);
      } catch {
        // Offline or signed out; the next poll retries.
      }
    };
    const interval = setInterval(poll, POLL_MS);
    window.addEventListener("focus", poll);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", poll);
    };
  }, [editor, docId, applyRemote]);

  // Conflict resolution: discard this tab's unsaved changes.
  const loadLatest = useCallback(async () => {
    try {
      const res = await api<SyncResponse>(`/api/documents/${docId}/sync`);
      if (!res.latest) return;
      pending.current = {};
      paused.current = false;
      setConflict(null);
      setError(null);
      setState("saved");
      applyRemote(res.revision, res.latest);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [docId, applyRemote]);

  // Conflict resolution: save this tab's version over the other person's.
  const keepMine = useCallback(() => {
    if (!editor || !conflict) return;
    revision.current = conflict.revision;
    paused.current = false;
    setConflict(null);
    pending.current = { ...pending.current, content: editor.getHTML() };
    void flush();
  }, [editor, conflict, flush]);

  useEffect(() => {
    const warnIfUnsaved = (e: BeforeUnloadEvent) => {
      if (state !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", warnIfUnsaved);
    return () => window.removeEventListener("beforeunload", warnIfUnsaved);
  }, [state]);

  return { state, error, conflict, save, flush, loadLatest, keepMine };
}
