"use client";

import { IconCheck, IconChevronRight } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";

export type MenuItem =
  | "divider"
  | {
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      checked?: boolean;
      disabled?: boolean;
      hidden?: boolean;
      onSelect?: () => void;
      submenu?: MenuItem[];
      // Custom content shown as the submenu (e.g. the table size grid).
      panel?: (close: () => void) => React.ReactNode;
    };

export type TopMenu = { label: string; items: MenuItem[] };

// Google Docs–style menu bar: click a menu to open it, then hover to move
// between menus; Escape or an outside click closes. `menus` is a function so
// items (checkmarks, disabled states) reflect the editor when a menu opens.
export function MenuBar({ menus: getMenus }: { menus: () => TopMenu[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const menus = getMenus();
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(() => setOpen(null), { enabled: open !== null, ref });

  return (
    <div ref={ref} role="menubar" className="flex flex-wrap items-center text-sm">
      {menus.map((menu, i) => (
        <div key={menu.label} className="relative">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(open === i ? null : i)}
            onMouseEnter={() => open !== null && setOpen(i)}
            className={`rounded px-2 py-0.5 ${open === i ? "bg-slate-200" : "hover:bg-slate-100"}`}
          >
            {menu.label}
          </button>
          {open === i && <MenuList items={menu.items} close={() => setOpen(null)} className="left-0 top-full mt-0.5" />}
        </div>
      ))}
    </div>
  );
}

function MenuList({ items, close, className = "" }: { items: MenuItem[]; close: () => void; className?: string }) {
  const [sub, setSub] = useState<number | null>(null);
  const visible = items.filter((it) => it === "divider" || !it.hidden);
  return (
    <div role="menu" className={`absolute z-40 min-w-56 rounded-md border border-slate-200 bg-white py-1.5 shadow-lg ${className}`}>
      {visible.map((item, i) => {
        if (item === "divider") {
          const prev = visible[i - 1];
          return prev && prev !== "divider" && i < visible.length - 1 ? <div key={i} className="my-1.5 h-px bg-slate-200" /> : null;
        }
        const hasSub = Boolean(item.submenu || item.panel);
        return (
          <div key={item.label} className="relative" onMouseEnter={() => setSub(hasSub ? i : null)}>
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-haspopup={hasSub ? "menu" : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (hasSub) return setSub(i);
                item.onSelect?.();
                close();
              }}
              className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm text-slate-800 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <span className="flex w-4 justify-center text-slate-600">
                {item.checked ? <IconCheck size={16} /> : item.icon}
              </span>
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.shortcut && <span className="whitespace-nowrap text-xs text-slate-500">{item.shortcut}</span>}
              {hasSub && <IconChevronRight size={14} className="text-slate-500" />}
            </button>
            {sub === i && item.submenu && <MenuList items={item.submenu} close={close} className="left-full top-0 -mt-1.5" />}
            {sub === i && item.panel && (
              <div className="absolute left-full top-0 z-40 -mt-1.5 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                {item.panel(close)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
