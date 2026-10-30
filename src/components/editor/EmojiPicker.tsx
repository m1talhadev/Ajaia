"use client";

import { useEffect, useRef, useState } from "react";

// Mounts the emoji-picker-element web component (loaded on demand).
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let picker: HTMLElement | null = null;
    let cancelled = false;
    import("emoji-picker-element").then(() => {
      if (cancelled || !host.current) return;
      picker = document.createElement("emoji-picker");
      picker.classList.add("light");
      picker.addEventListener("emoji-click", (e) => {
        const unicode = (e as CustomEvent<{ unicode?: string }>).detail.unicode;
        if (unicode) pick.current(unicode);
      });
      host.current.appendChild(picker);
    }, () => {
      if (!cancelled) setLoadError(true);
    });
    return () => {
      cancelled = true;
      picker?.remove();
    };
  }, []);

  return (
    <div ref={host} className="min-h-[300px] min-w-[320px]">
      {loadError && <p className="p-3 text-sm text-red-600">Couldn&apos;t load emoji. Refresh the page and try again.</p>}
    </div>
  );
}
