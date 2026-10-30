"use client";

import type { Editor } from "@tiptap/react";
import type { MathfieldElement } from "mathlive";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Dialog";
import { normalizeChemLatex } from "@/lib/math";
import type { MathMode } from "./formatting";

// `pos` is the position of the equation being edited, or null to insert a new one.
export type MathRequest = MathMode & { latex: string; pos: number | null };

const CHEM_SHORTCUTS = {
  "->": "\\longrightarrow",
  "<-": "\\longleftarrow",
  "<->": "\\longleftrightarrow",
  "<=>": "\\rightleftharpoons",
};

// MathLive equation editor. Inserts a new math node, or updates the one at
// `pos` when editing an existing equation.
export function MathDialog({ editor, request, onClose }: { editor: Editor; request: MathRequest; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Keep focus in the field while tapping the virtual keyboard.
    const keepFocus = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest?.(".ML__keyboard")) e.preventDefault();
    };
    document.addEventListener("pointerdown", keepFocus, true);

    // MathLive is loaded on demand. If the chunk can't be fetched (e.g. a tab
    // left open across a redeploy), show an error instead of crashing.
    import("mathlive").then(({ MathfieldElement }) => {
      if (cancelled || !host.current) return;
      MathfieldElement.fontsDirectory = "/mathlive/fonts";
      MathfieldElement.soundsDirectory = null;
      const mf = new MathfieldElement();
      mf.className = "w-full rounded border border-slate-300 p-1 text-lg";
      // Mount first: MathLive creates the field in connectedCallback, and
      // setters like menuItems/inlineShortcuts throw until then.
      host.current.appendChild(mf);
      mf.mathVirtualKeyboardPolicy = "manual";
      mf.menuItems = [];
      mf.smartFence = !request.chem;
      if (request.chem) {
        mf.mathModeSpace = "\\ ";
        mf.inlineShortcuts = { ...mf.inlineShortcuts, ...CHEM_SHORTCUTS };
        mf.addEventListener("keydown", (e) => {
          const literal: Record<string, () => void> = {
            " ": () => mf.insert("\\ "),
            "(": () => mf.insert("("),
            ")": () => mf.insert(")"),
            '"': () => mf.insert('\\text{"}'),
          };
          if (literal[e.key]) {
            e.preventDefault();
            e.stopPropagation();
            literal[e.key]();
          }
        });
      }
      mf.value = request.latex;
      field.current = mf;
      setReady(true);
      mf.focus();
      window.mathVirtualKeyboard?.show();
    }, () => {
      if (!cancelled) setLoadError(true);
    });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", keepFocus, true);
      window.mathVirtualKeyboard?.hide();
      field.current?.remove();
    };
  }, [request]);

  function confirm() {
    const raw = field.current?.value.replace(/#\?/g, "") ?? "";
    const latex = request.chem ? normalizeChemLatex(raw) : raw.trim();
    if (!latex) return;
    const chain = editor.chain().focus();
    if (request.pos !== null) {
      const pos = request.pos;
      chain.command(({ tr }) => {
        tr.setNodeMarkup(pos, undefined, { latex });
        return true;
      });
    } else if (request.kind === "inline") {
      chain.insertInlineMath(latex);
    } else {
      chain.insertMathBlock(latex);
    }
    chain.run();
    onClose();
  }

  const title = `${request.pos !== null ? "Edit" : "Insert"} ${request.chem ? "chemical equation" : "equation"}`;
  return (
    <Modal title={title} onClose={onClose} onConfirm={confirm} confirmLabel={request.pos !== null ? "Update" : "Insert"} confirmDisabled={!ready}>
      <div ref={host} />
      {loadError ? (
        <p className="text-sm text-red-600">Couldn&apos;t load the equation editor. Refresh the page and try again.</p>
      ) : (
        !ready && <p className="text-sm text-slate-500">Loading equation editor…</p>
      )}
      {request.chem && <p className="mt-2 text-xs text-slate-500">Type -&gt;, &lt;-, &lt;-&gt; or &lt;=&gt; for reaction arrows.</p>}
    </Modal>
  );
}
