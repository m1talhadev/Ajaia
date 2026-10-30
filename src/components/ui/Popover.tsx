"use client";

import { useRef } from "react";
import { useDismiss } from "@/hooks/useDismiss";

// A trigger with an anchored dropdown that closes on an outside click or Escape.
export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(() => onOpenChange(false), { enabled: open, ref });

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
