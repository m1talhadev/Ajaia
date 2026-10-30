"use client";

import { type RefObject, useEffect, useRef } from "react";

// Calls `onDismiss` on Escape and, when `ref` is given, on a pointer press outside it.
// An Escape that something nested already handled (e.g. a dropdown inside a
// dialog calling preventDefault) is left alone, so only the innermost one closes.
export function useDismiss(onDismiss: () => void, { enabled = true, ref }: { enabled?: boolean; ref?: RefObject<HTMLElement | null> } = {}) {
  const callback = useRef(onDismiss);
  callback.current = onDismiss;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && callback.current();
    const onPointer = (e: PointerEvent) => ref?.current && !ref.current.contains(e.target as Node) && callback.current();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [enabled, ref]);
}
