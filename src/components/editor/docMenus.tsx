import type { Editor } from "@tiptap/react";
import type { DocumentPermissions } from "@/lib/access";
import type { ExportFormat } from "@/lib/export";
import type { MenuItem, TopMenu } from "./Menu";
import {
  ALIGNMENTS,
  applyStyle,
  DEFAULT_LINE_SPACING,
  MATH_MODES,
  type MathMode,
  SPACING_LABELS,
  STYLES,
  stepFontSize,
  TABLE_ACTIONS,
  ZOOM_LEVELS,
} from "./formatting";
import { LINE_SPACINGS } from "./paragraph-format";
import { TablePicker } from "./TablePicker";

export type DownloadFormat = ExportFormat | "pdf";
export type Mode = "editing" | "viewing";

export type MenuContext = {
  editor: Editor;
  editing: boolean;
  perms: DocumentPermissions;
  zoom: number;
  mode: Mode;
  showOutline: boolean;
  showWordCount: boolean;
  actions: {
    newDocument: () => void;
    openDocuments: () => void;
    importFile: () => void;
    makeCopy: () => void;
    share: () => void;
    copyLink: () => void;
    download: (format: DownloadFormat) => void;
    rename: () => void;
    print: () => void;
    remove: () => void;
    paste: () => void;
    find: () => void;
    link: () => void;
    math: (mode: MathMode) => void;
    emoji: () => void;
    comment: () => void;
    insertImage: () => void;
    wordCount: () => void;
    shortcuts: () => void;
    setZoom: (z: number) => void;
    setMode: (m: Mode) => void;
    toggleOutline: () => void;
    toggleWordCount: () => void;
    fullScreen: () => void;
  };
};

// The Google Docs menu bar. Items a user can't use are hidden (e.g. editing
// commands for viewers, Delete for non-owners) rather than shown disabled.
export function buildMenus({ editor, editing, perms, zoom, mode, showOutline, showWordCount, actions: a }: MenuContext): TopMenu[] {
  const c = () => editor.chain().focus();
  const inTable = editor.isActive("table");
  const noEdit = !editing;
  const tableItems = (...ids: (keyof typeof TABLE_ACTIONS)[]): MenuItem[] =>
    ids.map((id) => ({ label: TABLE_ACTIONS[id].label, disabled: !inTable, onSelect: () => TABLE_ACTIONS[id].run(editor) }));

  const file: MenuItem[] = [
    { label: "New document", onSelect: a.newDocument },
    { label: "Open", shortcut: "Ctrl+O", onSelect: a.openDocuments },
    { label: "Import", onSelect: a.importFile },
    { label: "Make a copy", onSelect: a.makeCopy, hidden: !perms.canCopy },
    "divider",
    {
      label: "Share",
      submenu: [
        { label: "Share with others", onSelect: a.share },
        { label: "Copy link", onSelect: a.copyLink },
      ],
    },
    {
      label: "Download",
      hidden: !perms.canCopy,
      submenu: [
        { label: "Web page (.html)", onSelect: () => a.download("html") },
        { label: "Markdown (.md)", onSelect: () => a.download("md") },
        { label: "Plain text (.txt)", onSelect: () => a.download("txt") },
        { label: "PDF document (.pdf)", onSelect: () => a.download("pdf") },
      ],
    },
    "divider",
    { label: "Rename", onSelect: a.rename, hidden: !perms.canEdit },
    { label: "Delete", onSelect: a.remove, hidden: !perms.canManage },
    "divider",
    { label: "Print", shortcut: "Ctrl+P", onSelect: a.print, hidden: !perms.canCopy },
  ];

  const edit: MenuItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z", disabled: noEdit || !editor.can().undo(), onSelect: () => c().undo().run() },
    { label: "Redo", shortcut: "Ctrl+Y", disabled: noEdit || !editor.can().redo(), onSelect: () => c().redo().run() },
    "divider",
    { label: "Cut", shortcut: "Ctrl+X", hidden: noEdit, onSelect: () => (editor.commands.focus(), document.execCommand("cut")) },
    { label: "Copy", shortcut: "Ctrl+C", hidden: !perms.canCopy, onSelect: () => (editor.commands.focus(), document.execCommand("copy")) },
    { label: "Paste", shortcut: "Ctrl+V", hidden: noEdit, onSelect: a.paste },
    "divider",
    { label: "Select all", shortcut: "Ctrl+A", onSelect: () => c().selectAll().run() },
    { label: "Delete", hidden: noEdit, onSelect: () => c().deleteSelection().run() },
    "divider",
    { label: editing ? "Find and replace" : "Find", shortcut: editing ? "Ctrl+H" : "Ctrl+F", onSelect: a.find },
  ];

  const view: MenuItem[] = [
    {
      label: "Mode",
      hidden: !perms.canEdit,
      submenu: [
        { label: "Editing", checked: mode === "editing", onSelect: () => a.setMode("editing") },
        { label: "Viewing", checked: mode === "viewing", onSelect: () => a.setMode("viewing") },
      ],
    },
    "divider",
    { label: "Show outline", checked: showOutline, onSelect: a.toggleOutline },
    { label: "Show word count", checked: showWordCount, onSelect: a.toggleWordCount },
    "divider",
    { label: "Zoom", submenu: ZOOM_LEVELS.map((z) => ({ label: `${z}%`, checked: z === zoom, onSelect: () => a.setZoom(z) })) },
    { label: "Full screen", onSelect: a.fullScreen },
  ];

  const insert: MenuItem[] = [
    { label: "Image", submenu: [{ label: "Upload from computer", onSelect: a.insertImage }] },
    { label: "Table", panel: (close) => <TablePicker editor={editor} onDone={close} /> },
    { label: "Equation", submenu: MATH_MODES.map(({ label, mode }) => ({ label, onSelect: () => a.math(mode) })) },
    "divider",
    { label: "Emoji", onSelect: a.emoji },
    { label: "Horizontal line", onSelect: () => c().setHorizontalRule().run() },
    { label: "Code block", onSelect: () => c().toggleCodeBlock().run() },
    { label: "Quote", onSelect: () => c().toggleBlockquote().run() },
    "divider",
    { label: "Link", shortcut: "Ctrl+K", onSelect: a.link },
    { label: "Comment", shortcut: "Ctrl+Alt+M", onSelect: a.comment, hidden: !perms.canComment },
  ];

  const format: MenuItem[] = [
    {
      label: "Text",
      submenu: [
        { label: "Bold", shortcut: "Ctrl+B", checked: editor.isActive("bold"), onSelect: () => c().toggleBold().run() },
        { label: "Italic", shortcut: "Ctrl+I", checked: editor.isActive("italic"), onSelect: () => c().toggleItalic().run() },
        { label: "Underline", shortcut: "Ctrl+U", checked: editor.isActive("underline"), onSelect: () => c().toggleUnderline().run() },
        { label: "Strikethrough", shortcut: "Alt+Shift+5", checked: editor.isActive("strike"), onSelect: () => c().toggleStrike().run() },
        { label: "Superscript", shortcut: "Ctrl+.", checked: editor.isActive("superscript"), onSelect: () => c().toggleSuperscript().run() },
        { label: "Subscript", shortcut: "Ctrl+,", checked: editor.isActive("subscript"), onSelect: () => c().toggleSubscript().run() },
        { label: "Code", shortcut: "Ctrl+E", checked: editor.isActive("code"), onSelect: () => c().toggleCode().run() },
        "divider",
        { label: "Increase font size", shortcut: "Ctrl+Shift+.", onSelect: () => stepFontSize(editor, 1) },
        { label: "Decrease font size", shortcut: "Ctrl+Shift+,", onSelect: () => stepFontSize(editor, -1) },
      ],
    },
    {
      label: "Paragraph styles",
      submenu: STYLES.map((s) => ({ label: s.label, shortcut: s.shortcut, onSelect: () => applyStyle(editor, s.id) })),
    },
    {
      label: "Align & indent",
      submenu: [
        ...ALIGNMENTS.map((al) => ({
          label: al.label,
          shortcut: al.shortcut,
          checked: editor.isActive({ textAlign: al.value }),
          onSelect: () => c().setTextAlign(al.value).run(),
        })),
        "divider",
        { label: "Increase indent", shortcut: "Ctrl+]", onSelect: () => c().indent().run() },
        { label: "Decrease indent", shortcut: "Ctrl+[", onSelect: () => c().outdent().run() },
      ],
    },
    {
      label: "Line & paragraph spacing",
      submenu: LINE_SPACINGS.map((v) => ({
        label: SPACING_LABELS[v],
        checked: ((editor.getAttributes("paragraph").lineSpacing as string | null) ?? DEFAULT_LINE_SPACING) === v,
        onSelect: () => c().setLineSpacing(v).run(),
      })),
    },
    {
      label: "Bullets & numbering",
      submenu: [
        { label: "Bulleted list", shortcut: "Ctrl+Shift+8", checked: editor.isActive("bulletList"), onSelect: () => c().toggleBulletList().run() },
        { label: "Numbered list", shortcut: "Ctrl+Shift+7", checked: editor.isActive("orderedList"), onSelect: () => c().toggleOrderedList().run() },
        { label: "Checklist", shortcut: "Ctrl+Shift+9", checked: editor.isActive("taskList"), onSelect: () => c().toggleTaskList().run() },
      ],
    },
    {
      label: "Table",
      submenu: [
        ...tableItems("addRowBefore", "addRowAfter", "addColumnBefore", "addColumnAfter"),
        "divider",
        ...tableItems("deleteRow", "deleteColumn", "deleteTable"),
        "divider",
        { label: "Merge cells", disabled: !editor.can().mergeCells(), onSelect: () => c().mergeCells().run() },
        { label: "Unmerge cells", disabled: !editor.can().splitCell(), onSelect: () => c().splitCell().run() },
        { label: "Toggle header row", disabled: !inTable, onSelect: () => c().toggleHeaderRow().run() },
      ],
    },
    "divider",
    { label: "Clear formatting", shortcut: "Ctrl+\\", onSelect: () => c().unsetAllMarks().run() },
  ];

  const tools: MenuItem[] = [{ label: "Word count", shortcut: "Ctrl+Shift+C", onSelect: a.wordCount }];
  const help: MenuItem[] = [{ label: "Keyboard shortcuts", shortcut: "Ctrl+/", onSelect: a.shortcuts }];

  return [
    { label: "File", items: file },
    { label: "Edit", items: edit },
    { label: "View", items: view },
    ...(editing ? [{ label: "Insert", items: insert }, { label: "Format", items: format }] : []),
    ...(!editing && perms.canComment ? [{ label: "Insert", items: insert.filter((i) => i !== "divider" && i.label === "Comment") }] : []),
    { label: "Tools", items: tools },
    { label: "Help", items: help },
  ];
}
