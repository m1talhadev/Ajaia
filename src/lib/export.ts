import { gfm } from "@joplin/turndown-plugin-gfm";
import type { Editor } from "@tiptap/react";
import TurndownService from "turndown";
import { escapeHtml } from "./html";

// File > Download. Runs in the browser on the editor's content.

export type ExportFormat = "html" | "md" | "txt";

const safeName = (title: string) => title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "Untitled document";
const filenameFor = (title: string, ext: ExportFormat) => `${safeName(title)}.${ext}`;

export async function exportDocument(editor: Editor, title: string, format: ExportFormat) {
  const filename = filenameFor(title, format);
  if (format === "md") return download(filename, toMarkdown(editor.getHTML()), "text/markdown");
  if (format === "txt") return download(filename, editor.getText({ blockSeparator: "\n\n" }), "text/plain");
  // The HTML export uses what the editor renders (e.g. KaTeX output), minus the editing controls.
  const clone = editor.view.dom.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".editor-image-bar, .ProseMirror-trailingBreak, .column-resize-handle").forEach((n) => n.remove());
  clone.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
  download(filename, await toHtmlPage(title, clone.innerHTML), "text/html");
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { credentials: "same-origin" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// A standalone web page. Document images need a signed-in session to load,
// so they are embedded as data URLs; equations keep their KaTeX rendering.
async function toHtmlPage(title: string, renderedHtml: string) {
  const doc = new DOMParser().parseFromString(`<body>${renderedHtml}</body>`, "text/html");
  await Promise.all(
    [...doc.querySelectorAll("img")].map(async (img) => {
      const src = img.getAttribute("src");
      const data = src ? await toDataUrl(src) : null;
      if (data) img.setAttribute("src", data);
    }),
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/katex.min.css">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; max-width: 8.5in; margin: 1in auto; padding: 0 1in; color: #000; }
  table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #999; padding: 4px 8px; vertical-align: top; }
  blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
  pre { background: #f1f3f4; padding: 8px 12px; border-radius: 4px; overflow-x: auto; }
  img { max-width: 100%; height: auto; }
  p[data-doc-style="title"] { font-size: 26pt; } p[data-doc-style="subtitle"] { font-size: 15pt; color: #666; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; } ul[data-type="taskList"] li { display: flex; gap: .5em; }
  .math-block { text-align: center; margin: 1em 0; }
</style>
</head>
<body>
${doc.body.innerHTML}
</body>
</html>`;
}

// Markdown with GitHub extensions (tables, strikethrough, task lists) and
// math as $...$ / ```math blocks, so it round-trips through the .md importer.
function toMarkdown(storedHtml: string) {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  td.use(gfm);
  td.addRule("inlineMath", {
    filter: (node) => node.nodeName === "SPAN" && node.hasAttribute("data-inline-math"),
    replacement: (_c, node) => `$${(node as HTMLElement).getAttribute("data-latex") ?? ""}$`,
  });
  td.addRule("mathBlock", {
    filter: (node) => node.nodeName === "DIV" && node.hasAttribute("data-math-block"),
    replacement: (_c, node) => `\n\n\`\`\`math\n${(node as HTMLElement).getAttribute("data-latex") ?? ""}\n\`\`\`\n\n`,
  });
  td.addRule("underline", { filter: ["u"], replacement: (c) => `<u>${c}</u>` });
  td.addRule("absoluteImages", {
    filter: "img",
    replacement: (_c, node) => {
      const img = node as HTMLImageElement;
      const src = new URL(img.getAttribute("src") ?? "", window.location.origin).href;
      return `![${img.getAttribute("alt") ?? ""}](${src})`;
    },
  });
  return td.turndown(storedHtml);
}
