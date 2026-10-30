"use client";

import { IconCheck, IconDots, IconMessageCircle, IconX } from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorMessage } from "@/components/ui/Feedback";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { api, jsonBody } from "@/lib/api";
import type { UserSummary } from "@/lib/users";
import { getCommentPositions } from "./comment-highlights";

type Reply = { id: string; body: string; createdAt: string; author: UserSummary };
type Thread = Reply & { quote: string; resolved: boolean; replies: Reply[] };
export type CommentDraft = { quote: string };

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Comment threads in the right margin, as in Google Docs. Threads are anchored
// to the text they were made on, which is highlighted in the document.
export function CommentsPanel({
  editor,
  docId,
  currentUserId,
  canModerate,
  draft,
  onDraftDone,
  onHasComments,
  onClose,
}: {
  editor: Editor;
  docId: string;
  currentUserId: string;
  canModerate: boolean;
  draft: CommentDraft | null;
  onDraftDone: () => void;
  onHasComments: () => void;
  onClose: () => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const { error, run } = useAsyncAction();
  const positions = useEditorState({ editor, selector: ({ editor: e }) => getCommentPositions(e.state) });

  const threadsUrl = `/api/documents/${docId}/comments`;

  useEffect(() => {
    run(async () => {
      const loaded = await api<Thread[]>(threadsUrl);
      setThreads(loaded);
      if (loaded.some((t) => !t.resolved)) onHasComments();
    });
    // Load once per document; onHasComments is only a notification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadsUrl]);

  // Highlight open threads in the document; clear on unmount.
  useEffect(() => {
    const anchors = threads.filter((t) => !t.resolved).map((t) => ({ id: t.id, quote: t.quote }));
    editor.commands.setCommentAnchors(anchors, activeId);
  }, [editor, threads, activeId]);
  useEffect(() => () => void editor.commands.setCommentAnchors([], null), [editor]);

  // Clicking highlighted text selects its thread.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const id = (e.target as HTMLElement).closest?.("[data-comment-id]")?.getAttribute("data-comment-id");
      if (id) setActiveId(id);
    };
    const dom = editor.view.dom;
    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor]);

  const upsert = useCallback((thread: Thread) => {
    setThreads((ts) => (ts.some((t) => t.id === thread.id) ? ts.map((t) => (t.id === thread.id ? thread : t)) : [...ts, thread]));
  }, []);

  const post = (body: string, extra: { quote?: string; parentId?: string }) =>
    api<Thread>(threadsUrl, { method: "POST", ...jsonBody({ body, ...extra }) });

  const visible = threads
    .filter((t) => showResolved || !t.resolved)
    .sort((a, b) => (positions[a.id] ?? Infinity) - (positions[b.id] ?? Infinity));

  return (
    <aside aria-label="Comments" className="w-80 shrink-0 self-start print:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <IconMessageCircle size={16} /> Comments
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            Show resolved
          </label>
          <button type="button" aria-label="Close comments" onClick={onClose} className="rounded p-1 hover:bg-slate-200">
            <IconX size={14} />
          </button>
        </div>
      </div>
      <ErrorMessage message={error} className="mb-2" />

      {draft && (
        <div className="mb-3 rounded-xl border border-blue-300 bg-white p-3 shadow-md">
          <Quote text={draft.quote} />
          <Composer
            autoFocus
            placeholder="Comment"
            submitLabel="Comment"
            onCancel={onDraftDone}
            onSubmit={(body) =>
              run(async () => {
                const thread = await post(body, { quote: draft.quote });
                upsert(thread);
                setActiveId(thread.id);
                onDraftDone();
              })
            }
          />
        </div>
      )}

      {visible.length === 0 && !draft && (
        <p className="text-xs text-slate-500">
          {threads.length ? "No open comments." : "Select text and click Add comment to start a discussion."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((t) => {
          const active = t.id === activeId;
          const canModerateThread = t.author.id === currentUserId || canModerate;
          return (
            <li
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`cursor-pointer rounded-xl border bg-white p-3 text-sm transition ${
                active ? "border-blue-300 shadow-md" : "border-slate-200 hover:shadow-sm"
              } ${t.resolved ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-2">
                <CommentBody c={t} />
                <div className="flex shrink-0 gap-1">
                  {canModerateThread && (
                    <button
                      type="button"
                      title={t.resolved ? "Reopen" : "Mark as done and hide discussion"}
                      aria-label={t.resolved ? "Reopen" : "Resolve"}
                      onClick={(e) => {
                        e.stopPropagation();
                        run(async () =>
                          upsert(await api<Thread>(`${threadsUrl}/${t.id}`, { method: "PATCH", ...jsonBody({ resolved: !t.resolved }) })),
                        );
                      }}
                      className="rounded-full p-1 text-blue-700 hover:bg-blue-50"
                    >
                      <IconCheck size={16} />
                    </button>
                  )}
                  {canModerateThread && (
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete comment thread"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!confirm("Delete this comment thread?")) return;
                        run(async () => {
                          await api(`${threadsUrl}/${t.id}`, { method: "DELETE" });
                          setThreads((ts) => ts.filter((x) => x.id !== t.id));
                        });
                      }}
                      className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                    >
                      <IconDots size={16} />
                    </button>
                  )}
                </div>
              </div>
              {t.quote && <Quote text={t.quote} missing={positions[t.id] === undefined && !t.resolved} />}
              {t.replies.map((r) => (
                <div key={r.id} className="mt-3 border-t border-slate-100 pt-3">
                  <CommentBody c={r} />
                </div>
              ))}
              {t.resolved && <p className="mt-2 text-xs font-medium text-green-700">Resolved</p>}
              {active && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <Composer
                    placeholder="Reply"
                    submitLabel="Reply"
                    onSubmit={(body) => run(async () => upsert(await post(body, { parentId: t.id })))}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function CommentBody({ c }: { c: Reply }) {
  return (
    <div className="flex min-w-0 flex-1 gap-2">
      <Avatar name={c.author.name} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{c.author.name}</p>
        <p className="text-xs text-slate-500">{when(c.createdAt)}</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{c.body}</p>
      </div>
    </div>
  );
}

function Quote({ text, missing }: { text: string; missing?: boolean }) {
  return (
    <div className="mt-2 border-l-2 border-amber-400 pl-2 text-xs text-slate-600">
      <p className="line-clamp-2">{text}</p>
      {missing && <p className="mt-0.5 italic text-slate-400">The original text was changed or deleted.</p>}
    </div>
  );
}

function Composer({
  placeholder,
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    await onSubmit(body.trim());
    setBusy(false);
    setBody("");
  };
  return (
    <div className="mt-2">
      <textarea
        autoFocus={autoFocus}
        aria-label={placeholder}
        placeholder={placeholder}
        value={body}
        rows={2}
        maxLength={5000}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && submit()}
        className="w-full resize-y rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-600"
      />
      <div className="mt-2 flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-3 py-1 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={submit}
          className="rounded-full bg-blue-700 px-4 py-1 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
