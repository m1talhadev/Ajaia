import type { Editor } from "@tiptap/react";
import type { LINE_SPACINGS, ParagraphStyle } from "./paragraph-format";

// Formatting options and commands shared by the toolbar and the menu bar.

// Google Docs defaults: Arial 11pt body text and its standard style sizes.
export const DEFAULT_FONT_SIZE = 11;

export const FONT_FAMILIES = [
  "Arial",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Impact",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];
export const MIN_FONT_SIZE = 1;
export const MAX_FONT_SIZE = 400;

export const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

export const ALIGNMENTS = [
  { value: "left", label: "Left align", shortcut: "Ctrl+Shift+L" },
  { value: "center", label: "Center align", shortcut: "Ctrl+Shift+E" },
  { value: "right", label: "Right align", shortcut: "Ctrl+Shift+R" },
  { value: "justify", label: "Justify", shortcut: "Ctrl+Shift+J" },
] as const;

export const SPACING_LABELS: Record<(typeof LINE_SPACINGS)[number], string> = { "1": "Single", "1.15": "1.15", "1.5": "1.5", "2": "Double" };
export const DEFAULT_LINE_SPACING = "1.15";

export type MathMode = { kind: "inline" | "block"; chem: boolean };

export const MATH_MODES: { label: string; mode: MathMode }[] = [
  { label: "Inline equation", mode: { kind: "inline", chem: false } },
  { label: "Block equation", mode: { kind: "block", chem: false } },
  { label: "Chemical equation (inline)", mode: { kind: "inline", chem: true } },
  { label: "Chemical equation (block)", mode: { kind: "block", chem: true } },
];

const focus = (e: Editor) => e.chain().focus();

export const TABLE_ACTIONS = {
  addRowBefore: { label: "Insert row above", run: (e: Editor) => focus(e).addRowBefore().run() },
  addRowAfter: { label: "Insert row below", run: (e: Editor) => focus(e).addRowAfter().run() },
  addColumnBefore: { label: "Insert column left", run: (e: Editor) => focus(e).addColumnBefore().run() },
  addColumnAfter: { label: "Insert column right", run: (e: Editor) => focus(e).addColumnAfter().run() },
  deleteRow: { label: "Delete row", run: (e: Editor) => focus(e).deleteRow().run() },
  deleteColumn: { label: "Delete column", run: (e: Editor) => focus(e).deleteColumn().run() },
  deleteTable: { label: "Delete table", run: (e: Editor) => focus(e).deleteTable().run() },
};

// `size` is the style's font size in pt; `preview` styles its entry in the Styles dropdown.
export const STYLES: { id: ParagraphStyle; label: string; size: number; preview: string; shortcut?: string }[] = [
  { id: "normal", label: "Normal text", size: 11, preview: "text-sm", shortcut: "Ctrl+Alt+0" },
  { id: "title", label: "Title", size: 26, preview: "text-2xl" },
  { id: "subtitle", label: "Subtitle", size: 15, preview: "text-lg text-slate-500" },
  { id: "h1", label: "Heading 1", size: 20, preview: "text-xl", shortcut: "Ctrl+Alt+1" },
  { id: "h2", label: "Heading 2", size: 16, preview: "text-lg", shortcut: "Ctrl+Alt+2" },
  { id: "h3", label: "Heading 3", size: 14, preview: "text-base", shortcut: "Ctrl+Alt+3" },
  { id: "h4", label: "Heading 4", size: 12, preview: "text-sm font-semibold", shortcut: "Ctrl+Alt+4" },
  { id: "h5", label: "Heading 5", size: 11, preview: "text-sm font-semibold", shortcut: "Ctrl+Alt+5" },
  { id: "h6", label: "Heading 6", size: 11, preview: "text-sm italic", shortcut: "Ctrl+Alt+6" },
];

export const applyStyle = (e: Editor, style: ParagraphStyle) => e.chain().focus().setParagraphStyle(style).run();

export function currentStyle(e: Editor): ParagraphStyle {
  for (let level = 1; level <= 6; level++) if (e.isActive("heading", { level })) return `h${level}` as ParagraphStyle;
  return (e.getAttributes("paragraph").docStyle as ParagraphStyle | null) ?? "normal";
}

export function currentFontSize(e: Editor) {
  const explicit = parseFloat((e.getAttributes("textStyle").fontSize as string | undefined) ?? "");
  if (explicit) return explicit;
  return STYLES.find((s) => s.id === currentStyle(e))?.size ?? DEFAULT_FONT_SIZE;
}

export const setFontSize = (e: Editor, pt: number) => e.chain().focus().setFontSize(`${pt}pt`).run();

// Steps through Google's preset sizes, like its -/+ buttons.
export function stepFontSize(e: Editor, dir: 1 | -1) {
  const size = currentFontSize(e);
  const next = dir === 1 ? FONT_SIZES.find((s) => s > size) : [...FONT_SIZES].reverse().find((s) => s < size);
  if (next) setFontSize(e, next);
}

// Google Docs' standard palette: greys, bright colours, then tints and shades.
export const COLOR_ROWS = [
  ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"],
  ["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"],
  ["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"],
  ["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
  ["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"],
  ["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"],
  ["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"],
];
