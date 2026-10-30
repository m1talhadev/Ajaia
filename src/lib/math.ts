import { escapeHtml } from "./html";

// Helpers shared by the math editor and the Markdown importer.

export const inlineMathHtml = (latex: string) => `<span data-inline-math="" data-latex="${escapeHtml(latex)}"></span>`;
export const mathBlockHtml = (latex: string) => `<div data-math-block="" data-latex="${escapeHtml(latex)}"></div>`;

// Turns MathLive output for a chemical equation into mhchem syntax: arrows
// become mhchem arrows and the whole expression is wrapped in \ce{...}.
export function normalizeChemLatex(latex: string): string | null {
  let out = latex.replace(/#\?/g, "");
  if (!out.trim() || out === "\\ce{}" || out === "\\ce") return null;
  // `(?![a-zA-Z])` rather than `\b`: LaTeX commands end at any non-letter,
  // including digits (e.g. `\longrightarrow2H_2O`).
  out = out
    .replace(/\\rightleftharpoons(?![a-zA-Z])/g, " <=> ")
    .replace(/\\(long)?leftrightarrow(?![a-zA-Z])/g, " <-> ")
    .replace(/\\(long)?rightarrow(?![a-zA-Z])/g, " -> ")
    .replace(/\\to(?![a-zA-Z])/g, " -> ")
    .replace(/\\(long)?leftarrow(?![a-zA-Z])/g, " <- ")
    .replace(/\s+/g, " ")
    .trim();
  return out.includes("\\ce{") ? out : `\\ce{${out}}`;
}

// Converts ```math fences and $...$ spans in Markdown into math node HTML,
// leaving other fenced code blocks and inline code untouched.
export function markdownMathToHtml(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => {
      if (i % 2 === 1) {
        const fence = part.match(/^```math[ \t]*\n([\s\S]*?)\n?```$/);
        return fence ? `\n\n${mathBlockHtml(fence[1].trim())}\n\n` : part;
      }
      return part.replace(/\$([^$\n]+?)\$/g, (_, latex: string) => inlineMathHtml(latex.trim()));
    })
    .join("");
}
