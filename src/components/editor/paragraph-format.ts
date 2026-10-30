import { type CommandProps, type Editor, Extension } from "@tiptap/core";

type RawCommand = (props: CommandProps) => boolean;

export const LINE_SPACINGS = ["1", "1.15", "1.5", "2"] as const;
export const PARAGRAPH_STYLES = ["normal", "title", "subtitle", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
export type ParagraphStyle = (typeof PARAGRAPH_STYLES)[number];
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const MAX_INDENT = 8;
const INDENT_STEP_EM = 2.5;
const BLOCKS = ["paragraph", "heading"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraphFormat: {
      setLineSpacing: (value: string | null) => ReturnType;
      setParagraphStyle: (style: ParagraphStyle) => ReturnType;
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

// Removes font size and font family set directly on text in the selected
// blocks, so they take the size and font of their paragraph style.
const clearStyleOverrides: RawCommand = ({ tr }) => {
  const textStyle = tr.doc.type.schema.marks.textStyle;
  tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
    if (!node.isTextblock) return true;
    node.forEach((child, offset) => {
      const mark = textStyle.isInSet(child.marks);
      if (!mark || (mark.attrs.fontSize == null && mark.attrs.fontFamily == null)) return;
      const from = pos + 1 + offset;
      const to = from + child.nodeSize;
      const attrs = { ...mark.attrs, fontSize: null, fontFamily: null };
      tr.removeMark(from, to, textStyle);
      if (Object.values(attrs).some((v) => v != null)) tr.addMark(from, to, textStyle.create(attrs));
    });
    return false;
  });
  return true;
};

// Paragraph-level formatting from Google Docs: paragraph styles (Normal text,
// Title, Subtitle, Heading 1–6), line spacing and indentation.
export const ParagraphFormat = Extension.create({
  name: "paragraphFormat",
  // Runs before StarterKit so its Ctrl+Alt+0–6 shortcuts use setParagraphStyle.
  priority: 101,

  addGlobalAttributes() {
    return [
      {
        types: BLOCKS,
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-line-spacing"),
            renderHTML: (attrs) =>
              attrs.lineSpacing ? { "data-line-spacing": attrs.lineSpacing, style: `line-height: ${attrs.lineSpacing}` } : {},
          },
          indent: {
            default: 0,
            parseHTML: (el) => Number(el.getAttribute("data-indent")) || 0,
            renderHTML: (attrs) =>
              attrs.indent ? { "data-indent": attrs.indent, style: `margin-left: ${attrs.indent * INDENT_STEP_EM}em` } : {},
          },
        },
      },
      {
        types: ["paragraph"],
        attributes: {
          docStyle: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-doc-style"),
            renderHTML: (attrs) => (attrs.docStyle ? { "data-doc-style": attrs.docStyle } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    // Applies `update` to every paragraph/heading in the selection; a null
    // result leaves that block unchanged.
    const updateBlocks =
      (update: (attrs: Record<string, unknown>) => Record<string, unknown> | null): RawCommand =>
      ({ tr, state }) => {
        let changed = false;
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (!BLOCKS.includes(node.type.name)) return true;
          const next = update(node.attrs);
          if (next) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...next });
            changed = true;
          }
          return false;
        });
        return changed;
      };

    const listItemType = (editor: Editor) =>
      editor.isActive("taskItem") ? "taskItem" : editor.isActive("listItem") ? "listItem" : null;

    return {
      setLineSpacing: (value) => updateBlocks(() => ({ lineSpacing: value })),
      // As in Google Docs, applying a style replaces the paragraph's font size and
      // font family; bold, italic, colour and links are kept.
      setParagraphStyle:
        (style) =>
        ({ chain }) => {
          const heading = style.match(/^h([1-6])$/);
          const c = chain();
          if (heading) c.setHeading({ level: Number(heading[1]) as HeadingLevel });
          else c.setParagraph().updateAttributes("paragraph", { docStyle: style === "normal" ? null : style });
          return c.command(clearStyleOverrides).run();
        },
      // In lists, indent nests the item (like Tab); elsewhere it shifts the paragraph.
      indent: () => (props) => {
        const item = listItemType(props.editor);
        if (item) return props.commands.sinkListItem(item);
        return updateBlocks((a) => ((a.indent as number) < MAX_INDENT ? { indent: (a.indent as number) + 1 } : null))(props);
      },
      outdent: () => (props) => {
        const item = listItemType(props.editor);
        if (item) return props.commands.liftListItem(item);
        return updateBlocks((a) => ((a.indent as number) > 0 ? { indent: (a.indent as number) - 1 } : null))(props);
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-]": () => this.editor.commands.indent(),
      "Mod-[": () => this.editor.commands.outdent(),
      "Mod-Alt-0": () => this.editor.commands.setParagraphStyle("normal"),
      ...Object.fromEntries(
        ([1, 2, 3, 4, 5, 6] as const).map((level) => [`Mod-Alt-${level}`, () => this.editor.commands.setParagraphStyle(`h${level}`)]),
      ),
    };
  },
});
