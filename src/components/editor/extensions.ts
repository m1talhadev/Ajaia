import StarterKit from "@tiptap/starter-kit";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Selection } from "@tiptap/extensions";
import { CommentHighlights } from "./comment-highlights";
import { FindReplace } from "./find-replace";
import { EditorImage } from "./image";
import { InlineMath, MathBlock, type MathEditRequest } from "./math";
import { ParagraphFormat } from "./paragraph-format";
import { GoogleShortcuts } from "./shortcuts";
import { TableBackspace } from "./table-backspace";

export function buildExtensions({ onEditMath }: { onEditMath: (req: MathEditRequest) => void }) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      },
    }),
    // Font family, font size, text color and highlight (background) color.
    // Line spacing is paragraph-level instead (ParagraphFormat), as in Google Docs.
    TextStyleKit.configure({ lineHeight: false }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Subscript,
    Superscript,
    ParagraphFormat,
    // Keeps selected text highlighted while the toolbar has focus (e.g. the font size box).
    Selection.configure({ className: "kept-selection" }),
    GoogleShortcuts,
    FindReplace,
    CommentHighlights,
    EditorImage.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TableBackspace,
    TaskList,
    TaskItem.configure({ nested: true }),
    InlineMath.configure({ onEdit: onEditMath }),
    MathBlock.configure({ onEdit: onEditMath }),
  ];
}
