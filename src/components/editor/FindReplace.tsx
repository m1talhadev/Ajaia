"use client";

import { IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { useEffect, useState } from "react";
import { getSearch } from "./find-replace";

// Edit > Find and replace. Replace is only offered to people who can edit.
export function FindReplace({ editor, canReplace, onClose }: { editor: Editor; canReplace: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const { count, current } = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const s = getSearch(e.state);
      return { count: s?.matches.length ?? 0, current: s?.current ?? 0 };
    },
  });

  useEffect(() => {
    editor.commands.setSearch(query, matchCase);
  }, [editor, query, matchCase]);

  // Clear highlights when the panel closes.
  useEffect(() => () => void editor.commands.setSearch("", false), [editor]);

  const input = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-600";
  return (
    <div role="dialog" aria-label="Find and replace" className="fixed right-6 top-40 z-40 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">{canReplace ? "Find and replace" : "Find"}</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-slate-100">
          <IconX size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          aria-label="Find"
          placeholder="Find"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") editor.commands[e.shiftKey ? "findPrevious" : "findNext"]();
            if (e.key === "Escape") onClose();
          }}
          className={input}
        />
        <span className="whitespace-nowrap text-xs text-slate-500" aria-live="polite">
          {query ? `${count ? current + 1 : 0} of ${count}` : ""}
        </span>
      </div>
      {canReplace && (
        <input aria-label="Replace with" placeholder="Replace with" value={replacement} onChange={(e) => setReplacement(e.target.value)} className={`${input} mt-2`} />
      )}
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
        Match case
      </label>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" aria-label="Previous match" disabled={!count} onClick={() => editor.commands.findPrevious()} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40">
          <IconChevronUp size={16} />
        </button>
        <button type="button" aria-label="Next match" disabled={!count} onClick={() => editor.commands.findNext()} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40">
          <IconChevronDown size={16} />
        </button>
        {canReplace && (
          <div className="ml-auto flex gap-2">
            <button type="button" disabled={!count} onClick={() => editor.chain().focus().replaceCurrent(replacement).run()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40">
              Replace
            </button>
            <button type="button" disabled={!count} onClick={() => editor.chain().focus().replaceAll(replacement).run()} className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40">
              Replace all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
