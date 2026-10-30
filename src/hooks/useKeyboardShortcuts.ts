"use client";

import { useEffect, useRef } from "react";

// A Ctrl/Cmd shortcut. `shift` and `alt` must match exactly.
export type Shortcut = { key: string; shift?: boolean; alt?: boolean; when?: boolean; run: () => void };

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const current = useRef(shortcuts);
  current.current = shortcuts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      const match = current.current.find(
        (s) => s.when !== false && s.key === key && Boolean(s.shift) === e.shiftKey && Boolean(s.alt) === e.altKey,
      );
      if (!match) return;
      e.preventDefault();
      match.run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
