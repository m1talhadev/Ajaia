"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

const MAX = 10;

// Grid for choosing a table size, as in Insert > Table.
export function TablePicker({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [hover, setHover] = useState({ r: 1, c: 1 });
  return (
    <div className="p-1">
      {Array.from({ length: MAX }, (_, r) => (
        <div key={r} className="flex">
          {Array.from({ length: MAX }, (_, c) => (
            <button
              key={c}
              type="button"
              aria-label={`${r + 1} by ${c + 1} table`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
              onFocus={() => setHover({ r: r + 1, c: c + 1 })}
              onClick={() => {
                editor.chain().focus().insertTable({ rows: r + 1, cols: c + 1, withHeaderRow: true }).run();
                onDone();
              }}
              className={`m-px h-5 w-5 rounded-sm border ${
                r < hover.r && c < hover.c ? "border-blue-500 bg-blue-100" : "border-slate-300 bg-white"
              }`}
            />
          ))}
        </div>
      ))}
      <p className="mt-1 text-center text-xs text-slate-600">
        {hover.r} × {hover.c}
      </p>
    </div>
  );
}
