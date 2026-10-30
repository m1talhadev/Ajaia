"use client";

import { IconX } from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";

type Entry = { text: string; level: number; pos: number };

// View > Show outline: titles and headings, click to jump.
export function OutlinePanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const entries = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const out: Entry[] = [];
      e.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.textContent.trim()) {
          out.push({ text: node.textContent, level: node.attrs.level as number, pos });
        } else if (node.type.name === "paragraph" && node.attrs.docStyle === "title" && node.textContent.trim()) {
          out.push({ text: node.textContent, level: 0, pos });
        }
        return node.isBlock && !node.isTextblock;
      });
      return out;
    },
    equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });

  return (
    <aside aria-label="Document outline" className="sticky top-4 w-56 shrink-0 self-start print:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-700">Outline</h2>
        <button type="button" aria-label="Close outline" onClick={onClose} className="rounded p-1 hover:bg-slate-200">
          <IconX size={14} />
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">Headings you add to the document will appear here.</p>
      ) : (
        <ul className="space-y-0.5">
          {entries.map((h) => (
            <li key={h.pos}>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setTextSelection(h.pos + 1).scrollIntoView().run();
                  editor.view.domAtPos(h.pos + 1).node.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
                }}
                style={{ paddingLeft: `${Math.max(h.level - 1, 0) * 12 + 8}px` }}
                className={`block w-full truncate rounded py-1 pr-2 text-left text-sm hover:bg-slate-200 ${h.level <= 1 ? "font-medium" : "text-slate-600"}`}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
