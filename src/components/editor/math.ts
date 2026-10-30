import { mergeAttributes, Node } from "@tiptap/core";
import katex from "katex";
import "katex/contrib/mhchem";

export type MathEditRequest = { latex: string; pos: number; kind: "inline" | "block" };

type MathOptions = { onEdit?: (req: MathEditRequest) => void };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineMath: { insertInlineMath: (latex: string) => ReturnType };
    mathBlock: { insertMathBlock: (latex: string) => ReturnType };
  }
}

const latexAttr = {
  latex: {
    default: "",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") ?? "",
    renderHTML: (attrs: { latex: string }) => ({ "data-latex": attrs.latex }),
  },
};

// KaTeX renders into a non-editable element; clicking it asks the host to
// open the math dialog for that node. `trust` stays off so \href etc. are inert.
function mathNodeView(tag: "span" | "div", kind: MathEditRequest["kind"]) {
  return function (this: { options: MathOptions }) {
    const options = this.options;
    return ({
      node,
      getPos,
      editor,
    }: {
      node: { attrs: Record<string, string>; type: { name: string } };
      getPos: () => number | undefined;
      editor: { isEditable: boolean };
    }) => {
      const dom = document.createElement(tag);
      dom.className = kind === "inline" ? "inline-math" : "math-block";
      dom.contentEditable = "false";
      let current = node;
      const render = () => {
        dom.innerHTML = katex.renderToString(current.attrs.latex, { displayMode: kind === "block", throwOnError: false });
      };
      render();
      dom.addEventListener("click", () => {
        if (!editor.isEditable) return;
        const pos = getPos();
        if (typeof pos === "number") options.onEdit?.({ latex: current.attrs.latex, pos, kind });
      });
      return {
        dom,
        update: (updated: typeof node) => {
          if (updated.type.name !== current.type.name) return false;
          current = updated;
          render();
          return true;
        },
      };
    };
  };
}

export const InlineMath = Node.create<MathOptions>({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addOptions: () => ({ onEdit: undefined }),
  addAttributes: () => latexAttr,
  parseHTML: () => [{ tag: "span[data-inline-math]" }],
  renderHTML: ({ HTMLAttributes }) => ["span", mergeAttributes(HTMLAttributes, { "data-inline-math": "" })],
  addNodeView: mathNodeView("span", "inline"),
  addCommands() {
    return {
      insertInlineMath:
        (latex) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },
});

export const MathBlock = Node.create<MathOptions>({
  name: "mathBlock",
  group: "block",
  atom: true,
  isolating: true,
  selectable: true,
  addOptions: () => ({ onEdit: undefined }),
  addAttributes: () => latexAttr,
  parseHTML: () => [{ tag: "div[data-math-block]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-math-block": "" })],
  addNodeView: mathNodeView("div", "block"),
  addCommands() {
    return {
      insertMathBlock:
        (latex) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },
});
