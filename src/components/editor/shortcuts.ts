import { Extension } from "@tiptap/core";
import { stepFontSize } from "./formatting";

// Google Docs shortcuts that TipTap doesn't define by default.
export const GoogleShortcuts = Extension.create({
  name: "googleShortcuts",
  addKeyboardShortcuts() {
    return {
      "Alt-Shift-5": () => this.editor.commands.toggleStrike(),
      "Mod-\\": () => this.editor.commands.unsetAllMarks(),
      "Mod-Shift-.": () => (stepFontSize(this.editor, 1), true),
      "Mod-Shift-,": () => (stepFontSize(this.editor, -1), true),
    };
  },
});
