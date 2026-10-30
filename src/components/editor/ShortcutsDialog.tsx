"use client";

import { Modal } from "@/components/ui/Dialog";

const GROUPS: [string, [string, string][]][] = [
  [
    "Common actions",
    [
      ["Undo / Redo", "Ctrl+Z / Ctrl+Y"],
      ["Find and replace", "Ctrl+H"],
      ["Find", "Ctrl+F"],
      ["Print", "Ctrl+P"],
      ["Insert link", "Ctrl+K"],
      ["Add comment", "Ctrl+Alt+M"],
      ["Keyboard shortcuts", "Ctrl+/"],
    ],
  ],
  [
    "Text formatting",
    [
      ["Bold / Italic / Underline", "Ctrl+B / Ctrl+I / Ctrl+U"],
      ["Strikethrough", "Alt+Shift+5"],
      ["Superscript / Subscript", "Ctrl+. / Ctrl+,"],
      ["Increase / decrease font size", "Ctrl+Shift+. / Ctrl+Shift+,"],
      ["Clear formatting", "Ctrl+\\"],
    ],
  ],
  [
    "Paragraph formatting",
    [
      ["Normal text", "Ctrl+Alt+0"],
      ["Heading 1–6", "Ctrl+Alt+1 … 6"],
      ["Align left / center / right / justify", "Ctrl+Shift+L / E / R / J"],
      ["Numbered / bulleted list / checklist", "Ctrl+Shift+7 / 8 / 9"],
      ["Increase / decrease indent", "Ctrl+] / Ctrl+["],
    ],
  ],
];

// Help > Keyboard shortcuts (Ctrl+/).
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose} onConfirm={onClose} confirmLabel="Close" hideCancel width="xl">
      <div className="max-h-[60vh] space-y-5 overflow-y-auto">
        {GROUPS.map(([group, rows]) => (
          <section key={group}>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">{group}</h3>
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([action, keys]) => (
                  <tr key={action} className="border-b border-slate-100">
                    <td className="py-1.5">{action}</td>
                    <td className="py-1.5 text-right font-mono text-xs text-slate-600">{keys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </Modal>
  );
}
