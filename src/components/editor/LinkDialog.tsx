"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { Modal } from "@/components/ui/Dialog";

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

// Insert or edit a link. Clearing the URL removes an existing link.
export function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const existing = (editor.getAttributes("link").href as string | undefined) ?? "";
  const { from, to } = editor.state.selection;
  const selected = editor.state.doc.textBetween(from, to, " ");
  const [text, setText] = useState(selected || existing);
  const [url, setUrl] = useState(existing);

  function apply() {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else if (existing && text === selected) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: text || href, marks: [{ type: "link", attrs: { href } }] })
        .run();
    }
    onClose();
  }

  return (
    <Modal title={existing ? "Edit link" : "Add link"} onClose={onClose} onConfirm={apply} confirmLabel={existing && !url ? "Remove" : "Apply"} confirmDisabled={!existing && !url.trim()}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label className="block text-sm font-medium text-slate-600">
          Link text
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter link text" className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-600">
          URL
          <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className={inputClass} />
        </label>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
