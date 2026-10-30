import { type CommandProps, Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { type EditorState, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { indexText, toRange } from "./text-index";

type Match = { from: number; to: number };
type SearchState = { query: string; matchCase: boolean; matches: Match[]; current: number; decorations: DecorationSet };

const findReplaceKey = new PluginKey<SearchState>("findReplace");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findReplace: {
      setSearch: (query: string, matchCase: boolean) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
    };
  }
}

function findMatches(doc: PMNode, query: string, matchCase: boolean): Match[] {
  if (!query) return [];
  const { text, positions } = indexText(doc);
  const haystack = matchCase ? text : text.toLowerCase();
  const needle = matchCase ? query : query.toLowerCase();
  const matches: Match[] = [];
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) {
    // Skip matches that span a paragraph break; they can't be replaced as one range.
    if (!text.slice(i, i + needle.length).includes("\n")) matches.push(toRange(positions, i, needle.length));
  }
  return matches;
}

function decorate(doc: PMNode, matches: Match[], current: number) {
  return DecorationSet.create(
    doc,
    matches.map((m, i) => Decoration.inline(m.from, m.to, { class: i === current ? "search-match current" : "search-match" })),
  );
}

export const getSearch = (state: EditorState) => findReplaceKey.getState(state);

// Edit > Find and replace: highlights every match, steps through them and
// replaces one or all. Matches are recomputed as the document changes.
export const FindReplace = Extension.create({
  name: "findReplace",

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: findReplaceKey,
        state: {
          init: () => ({ query: "", matchCase: false, matches: [], current: 0, decorations: DecorationSet.empty }),
          apply(tr, prev, _old, state) {
            const meta = tr.getMeta(findReplaceKey) as Partial<SearchState> | undefined;
            if (!meta && !tr.docChanged) return prev;
            const query = meta?.query ?? prev.query;
            const matchCase = meta?.matchCase ?? prev.matchCase;
            const matches = findMatches(state.doc, query, matchCase);
            const current = Math.min(meta?.current ?? prev.current, Math.max(matches.length - 1, 0));
            return { query, matchCase, matches, current, decorations: decorate(state.doc, matches, current) };
          },
        },
        props: { decorations: (state) => findReplaceKey.getState(state)?.decorations },
      }),
    ];
  },

  addCommands() {
    // Moves to the next/previous match, selecting it so the view scrolls there.
    const select =
      (step: 1 | -1) =>
      () =>
      ({ state, tr, dispatch }: CommandProps) => {
        const s = getSearch(state);
        if (!s?.matches.length) return false;
        const current = (s.current + step + s.matches.length) % s.matches.length;
        if (dispatch) {
          const m = s.matches[current];
          tr.setMeta(findReplaceKey, { current }).setSelection(TextSelection.create(tr.doc, m.from, m.to)).scrollIntoView();
        }
        return true;
      };

    return {
      setSearch:
        (query, matchCase) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(findReplaceKey, { query, matchCase, current: 0 });
          return true;
        },
      findNext: select(1),
      findPrevious: select(-1),
      replaceCurrent:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const s = getSearch(state);
          const m = s?.matches[s.current];
          if (!m) return false;
          if (dispatch) tr.insertText(replacement, m.from, m.to);
          return true;
        },
      replaceAll:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const matches = getSearch(state)?.matches ?? [];
          if (!matches.length) return false;
          // Replace from the end so earlier positions stay valid.
          if (dispatch) for (const m of [...matches].reverse()) tr.insertText(replacement, m.from, m.to);
          return true;
        },
    };
  },
});
