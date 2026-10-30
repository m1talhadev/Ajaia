"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import { Modal } from "@/components/ui/Dialog";

function countText(text: string) {
  return {
    words: text.split(/\s+/).filter(Boolean).length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
  };
}

function useCounts(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const { from, to, empty } = e.state.selection;
      const all = countText(e.state.doc.textBetween(0, e.state.doc.content.size, "\n", " "));
      return { all, selection: empty ? null : countText(e.state.doc.textBetween(from, to, "\n", " ")) };
    },
  });
}

// Tools > Word count, with the "Display word count while typing" option.
export function WordCountDialog({
  editor,
  showWhileTyping,
  onShowWhileTyping,
  onClose,
}: {
  editor: Editor;
  showWhileTyping: boolean;
  onShowWhileTyping: (v: boolean) => void;
  onClose: () => void;
}) {
  const { all, selection } = useCounts(editor);
  const rows: [string, keyof typeof all][] = [
    ["Words", "words"],
    ["Characters", "characters"],
    ["Characters excluding spaces", "charactersNoSpaces"],
  ];
  return (
    <Modal title="Word count" onClose={onClose} onConfirm={onClose} confirmLabel="OK" hideCancel>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key} className="border-b border-slate-100">
              <td className="py-2">{label}</td>
              <td className="py-2 text-right font-medium tabular-nums">
                {selection ? `${selection[key].toLocaleString()} of ${all[key].toLocaleString()}` : all[key].toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showWhileTyping} onChange={(e) => onShowWhileTyping(e.target.checked)} />
        Display word count while typing
      </label>
    </Modal>
  );
}

export function WordCountBadge({ editor, onClick }: { editor: Editor; onClick: () => void }) {
  const { all, selection } = useCounts(editor);
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 left-4 z-30 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow print:hidden"
    >
      {selection ? `${selection.words.toLocaleString()} of ${all.words.toLocaleString()} words` : `${all.words.toLocaleString()} words`}
    </button>
  );
}
