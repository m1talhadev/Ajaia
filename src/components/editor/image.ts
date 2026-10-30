import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

const DEFAULT_WIDTH = 400;
const WIDTH_PRESETS = [200, 300, 400, 600];

const toPx = (value: unknown) => {
  const px = parseInt(String(value), 10);
  return !isNaN(px) && px > 0 ? px : null;
};
const maxWidthFor = (px: number) => `min(${px}px, 100%)`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, props: Record<string, unknown> = {}) {
  return Object.assign(document.createElement(tag), { className }, props) as HTMLElementTagNameMap[K];
}

// Image with a persisted width and an inline width control (number input and presets).
export const EditorImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: String(DEFAULT_WIDTH),
        parseHTML: (element: HTMLElement) => {
          const attr = element.getAttribute("width");
          if (attr) return attr;
          const match = (element.getAttribute("style") ?? "").match(/max-width:\s*min\((\d+)px/);
          return match ? match[1] : null;
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const px = toPx(HTMLAttributes.width);
    const widthStyle = px ? `max-width: ${maxWidthFor(px)}; width: 100%;` : "max-width: 100%;";
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { style: `${widthStyle} height: auto;` })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      let attrs = node.attrs;
      const img = el("img", "editor-image", { src: attrs.src, alt: attrs.alt ?? "" });

      const input = el("input", "editor-image-width-input", { type: "number", min: "50", max: "2000", step: "20" });
      const presets = WIDTH_PRESETS.map((size) => {
        const btn = el("button", "editor-image-preset", { type: "button", textContent: String(size) });
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          commit(size);
        });
        return { btn, size };
      });

      const show = (px: number) => {
        img.style.maxWidth = maxWidthFor(px);
        presets.forEach(({ btn, size }) => btn.classList.toggle("active", size === px));
        if (document.activeElement !== input) input.value = String(px);
      };

      const commit = (value: unknown) => {
        const px = toPx(value);
        const pos = getPos();
        if (px === null || typeof pos !== "number") return;
        show(px);
        editor.commands.command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...attrs, width: String(px) });
          return true;
        });
      };

      input.addEventListener("change", () => commit(input.value));
      // Keep clicks and keystrokes in the input away from ProseMirror.
      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("keydown", (e) => e.stopPropagation());

      const bar = el("div", "editor-image-bar");
      const presetWrap = el("div", "editor-image-presets");
      presets.forEach(({ btn }) => presetWrap.appendChild(btn));
      bar.append(el("span", "", { textContent: "Width:" }), input, el("span", "", { textContent: "px" }), presetWrap);

      const dom = el("div", "editor-image-block", { contentEditable: "false" });
      dom.append(img, bar);
      show(toPx(attrs.width) ?? DEFAULT_WIDTH);

      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== "image") return false;
          attrs = updated.attrs;
          img.src = attrs.src;
          img.alt = attrs.alt ?? "";
          show(toPx(attrs.width) ?? DEFAULT_WIDTH);
          return true;
        },
      };
    };
  },
});
