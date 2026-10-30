import type { Node as PMNode } from "@tiptap/pm/model";

// Flattens a document to plain text the same way `doc.textBetween(from, to, "\n")`
// does (a newline between textblocks), keeping the document position of every
// character so text matches can be mapped back to ranges.
export function indexText(doc: PMNode) {
  let text = "";
  const positions: number[] = [];
  let first = true;
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (!first) {
        text += "\n";
        positions.push(pos);
      }
      first = false;
    } else if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) positions.push(pos + i);
      text += node.text;
    }
    return true;
  });
  return { text, positions };
}

// Maps a match [start, start + length) in the flattened text to a document range.
export const toRange = (positions: number[], start: number, length: number) => ({
  from: positions[start],
  to: positions[start + length - 1] + 1,
});
