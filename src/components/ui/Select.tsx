"use client";

import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  danger?: boolean;
};
export type SelectItem<T extends string> = SelectOption<T> | "divider";

const TRIGGER_STYLES = {
  outline: "rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50",
  pill: "rounded-full border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50",
  ghost: "rounded-md px-2 py-1 hover:bg-slate-100",
};

const MENU_GAP = 4;
const MENU_MAX_HEIGHT = 320;

type Position = { top?: number; bottom?: number; left?: number; right?: number; minWidth: number };

// A dropdown in the style of the toolbar menus, replacing the native <select>.
// The menu is positioned against the viewport so scrolling containers (like the
// share dialog's people list) don't clip it, and opens upwards when there is no
// room below. Keyboard: arrows, Home/End, Enter/Space to choose, Escape to close.
export function Select<T extends string>({
  label,
  value,
  items,
  onChange,
  variant = "outline",
  align = "left",
  className = "",
}: {
  label: string;
  value: T;
  items: SelectItem<T>[];
  onChange: (value: T) => void;
  variant?: keyof typeof TRIGGER_STYLES;
  align?: "left" | "right";
  className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [active, setActive] = useState(-1);

  const options = items.filter((item): item is SelectOption<T> => item !== "divider");
  const selected = options.find((o) => o.value === value);
  const open = position !== null;

  const close = () => setPosition(null);
  useDismiss(close, { enabled: open, ref: root });

  function show() {
    const rect = trigger.current!.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom;
    const vertical =
      roomBelow < MENU_MAX_HEIGHT && rect.top > roomBelow
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP };
    const horizontal = align === "right" ? { right: window.innerWidth - rect.right } : { left: rect.left };
    setPosition({ ...vertical, ...horizontal, minWidth: rect.width });
    setActive(Math.max(options.indexOf(selected!), 0));
  }

  function choose(option: SelectOption<T>) {
    close();
    trigger.current?.focus();
    if (option.value !== value) onChange(option.value);
  }

  // The menu is fixed in place, so close it rather than leave it behind when the page or a container scrolls.
  useEffect(() => {
    if (!open) return;
    const hide = () => setPosition(null);
    const onScroll = (e: Event) => !root.current?.contains(e.target as Node) && hide();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    const keys: Record<string, () => void> = open
      ? {
          ArrowDown: () => setActive((i) => (i + 1) % options.length),
          ArrowUp: () => setActive((i) => (i - 1 + options.length) % options.length),
          Home: () => setActive(0),
          End: () => setActive(options.length - 1),
          Enter: () => options[active] && choose(options[active]),
          " ": () => options[active] && choose(options[active]),
          Escape: close,
          Tab: close,
        }
      : { ArrowDown: show, ArrowUp: show, Enter: show, " ": show };
    const handler = keys[e.key];
    if (!handler) return;
    // preventDefault also marks Escape as handled, so a surrounding dialog stays open.
    if (e.key !== "Tab") e.preventDefault();
    handler();
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-1.5 text-sm text-slate-800 ${TRIGGER_STYLES[variant]}`}
      >
        {selected?.icon}
        <span className="truncate">{selected?.label ?? label}</span>
        <IconChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          style={{ ...position, maxHeight: MENU_MAX_HEIGHT }}
          className="fixed z-50 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          {items.map((item, i) => {
            if (item === "divider") return <li key={`divider-${i}`} role="separator" className="my-1.5 h-px bg-slate-200" />;
            const index = options.indexOf(item);
            const isSelected = item.value === value;
            return (
              <li
                key={item.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
                className={`flex cursor-pointer items-start gap-3 whitespace-nowrap px-3 py-1.5 text-sm ${index === active ? "bg-slate-100" : ""} ${
                  item.danger ? "text-red-700" : "text-slate-800"
                }`}
              >
                <span className="mt-0.5 flex w-4 shrink-0 justify-center text-slate-700">{isSelected && <IconCheck size={16} />}</span>
                {item.icon && <span className="mt-0.5 shrink-0 text-slate-600">{item.icon}</span>}
                <span>
                  <span className="block">{item.label}</span>
                  {item.description && <span className="block text-xs text-slate-500">{item.description}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
