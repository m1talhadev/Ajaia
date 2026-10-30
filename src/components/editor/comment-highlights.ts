import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { indexText, toRange } from "./text-index";

export type Anchor = { id: string; quote: string };
type HighlightState = { anchors: Anchor[]; activeId: string | null; decorations: DecorationSet; positions: Record<string, number> };

const commentHighlightsKey = new PluginKey<HighlightState>("commentHighlights");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentHighlights: { setCommentAnchors: (anchors: Anchor[], activeId: string | null) => ReturnType };
  }
}

// Finds each thread's quote in the document text and highlights it.
function build(doc: PMNode, anchors: Anchor[], activeId: string | null) {
  const { text, positions } = indexText(doc);
  const decorations: Decoration[] = [];
  const found: Record<string, number> = {};
  for (const a of anchors) {
    const i = a.quote ? text.indexOf(a.quote) : -1;
    if (i === -1) continue;
    const { from, to } = toRange(positions, i, a.quote.length);
    found[a.id] = from;
    decorations.push(
      Decoration.inline(from, to, {
        class: a.id === activeId ? "comment-highlight active" : "comment-highlight",
        "data-comment-id": a.id,
      }),
    );
  }
  return { decorations: DecorationSet.create(doc, decorations), positions: found };
}

export const getCommentPositions = (state: EditorState) =>
  commentHighlightsKey.getState(state)?.positions ?? {};

// Comments store the text they were made on rather than marks in the document,
// so commenters can comment without editing it. Each open thread's quote is
// highlighted, and its position is exposed so the sidebar can follow document order.
export const CommentHighlights = Extension.create({
  name: "commentHighlights",

  addProseMirrorPlugins() {
    return [
      new Plugin<HighlightState>({
        key: commentHighlightsKey,
        state: {
          init: () => ({ anchors: [], activeId: null, decorations: DecorationSet.empty, positions: {} }),
          apply(tr, prev, _old, state) {
            const meta = tr.getMeta(commentHighlightsKey) as Pick<HighlightState, "anchors" | "activeId"> | undefined;
            if (!meta && !tr.docChanged) return prev;
            const anchors = meta?.anchors ?? prev.anchors;
            const activeId = meta ? meta.activeId : prev.activeId;
            return { anchors, activeId, ...build(state.doc, anchors, activeId) };
          },
        },
        props: { decorations: (state) => commentHighlightsKey.getState(state)?.decorations },
      }),
    ];
  },

  addCommands() {
    return {
      setCommentAnchors:
        (anchors, activeId) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(commentHighlightsKey, { anchors, activeId }).setMeta("addToHistory", false);
          return true;
        },
    };
  },
});
