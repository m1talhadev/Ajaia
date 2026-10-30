"use client";

import { useRef } from "react";

// A hidden file input opened programmatically. Render `input` once; call `open` from any button or menu item.
export function useFilePicker(accept: string, onFile: (file: File) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) onFile(file);
      }}
    />
  );
  return { open: () => ref.current?.click(), input };
}
