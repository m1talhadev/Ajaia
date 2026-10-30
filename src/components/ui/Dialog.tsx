"use client";

import { useDismiss } from "@/hooks/useDismiss";

const WIDTHS = { md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

// Modal overlay: closes on Escape or a click on the backdrop.
export function Dialog({
  label,
  width = "md",
  onClose,
  children,
}: {
  label: string;
  width?: keyof typeof WIDTHS;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useDismiss(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-20"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-label={label} className={`w-full ${WIDTHS[width]} rounded-xl bg-white p-5 shadow-xl`}>
        {children}
      </div>
    </div>
  );
}

// A titled dialog with a confirm button and, unless `hideCancel`, a Cancel button.
export function Modal({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  hideCancel,
  width,
  children,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
  hideCancel?: boolean;
  width?: keyof typeof WIDTHS;
  children: React.ReactNode;
}) {
  return (
    <Dialog label={title} width={width} onClose={onClose}>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
      <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
        {!hideCancel && (
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
