import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";

// Backspace in an empty cell of a completely empty table deletes the table.
export const TableBackspace = Extension.create({
  name: "tableBackspace",

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (!editor.isActive("table")) return false;
        const { selection } = editor.state;
        if (!selection.empty || selection.$from.parent.content.size > 0) return false;

        let table: PMNode | null = null;
        for (let d = selection.$from.depth; d > 0; d--) {
          const node = selection.$from.node(d);
          if (node.type.name === "table") {
            table = node;
            break;
          }
        }
        if (!table) return false;

        let hasContent = false;
        table.descendants((node) => {
          if ((node.type.name === "tableCell" || node.type.name === "tableHeader") && node.textContent.length > 0) {
            hasContent = true;
          }
          return !hasContent;
        });
        return hasContent ? false : editor.commands.deleteTable();
      },
    };
  },
});
