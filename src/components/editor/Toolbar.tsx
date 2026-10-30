"use client";

import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconBrush,
  IconChevronDown,
  IconClearFormatting,
  IconCloudUpload,
  IconCode,
  IconColumnInsertRight,
  IconColumnRemove,
  IconHighlight,
  IconIndentDecrease,
  IconIndentIncrease,
  IconItalic,
  IconLineHeight,
  IconLink,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconMath,
  IconMessagePlus,
  IconMinus,
  IconMoodSmile,
  IconPlus,
  IconPrinter,
  IconRowInsertBottom,
  IconRowRemove,
  IconSeparator,
  IconStrikethrough,
  IconTable,
  IconTableOff,
  IconUnderline,
  type Icon,
} from "@tabler/icons-react";
import type { Mark } from "@tiptap/pm/model";
import { Editor, useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { EmojiPicker } from "./EmojiPicker";
import {
  ALIGNMENTS,
  applyStyle,
  COLOR_ROWS,
  currentFontSize,
  currentStyle,
  DEFAULT_LINE_SPACING,
  FONT_FAMILIES,
  MATH_MODES,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  type MathMode,
  setFontSize,
  SPACING_LABELS,
  STYLES,
  stepFontSize,
  TABLE_ACTIONS,
  ZOOM_LEVELS,
} from "./formatting";
import { LINE_SPACINGS } from "./paragraph-format";
import { TablePicker } from "./TablePicker";

const chain = (e: Editor) => e.chain().focus();

type Menu = "zoom" | "style" | "font" | "color" | "highlight" | "align" | "spacing" | "table" | "math" | "emoji" | null;

export function Toolbar({
  editor,
  editing,
  canComment,
  zoom,
  onZoom,
  onPrint,
  onLink,
  onMath,
  onComment,
  onInsertImage,
  imageUploading,
}: {
  editor: Editor;
  editing: boolean;
  canComment: boolean;
  zoom: number;
  onZoom: (zoom: number) => void;
  onPrint: (() => void) | null;
  onLink: () => void;
  onMath: (mode: MathMode) => void;
  onComment: () => void;
  onInsertImage: () => void;
  imageUploading: boolean;
}) {
  const [menu, setMenu] = useState<Menu>(null);
  const [paint, setPaint] = useState<readonly Mark[] | null>(null);

  // Re-render only when formatting state under the cursor changes.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      table: e.isActive("table"),
      math: e.isActive("inlineMath") || e.isActive("mathBlock"),
      style: currentStyle(e),
      font: (e.getAttributes("textStyle").fontFamily as string | undefined) ?? "Arial",
      size: currentFontSize(e),
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "#000000",
      highlight: (e.getAttributes("textStyle").backgroundColor as string | undefined) ?? null,
      align: ALIGNMENTS.find((a) => e.isActive({ textAlign: a.value }))?.value ?? "left",
      spacing: (e.getAttributes("paragraph").lineSpacing as string | null) ?? null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      hasSelection: !e.state.selection.empty,
    }),
  });

  // Paint format: copy the marks under the cursor, then apply them to the
  // next text the user selects with the mouse.
  useEffect(() => {
    if (!paint) return;
    const dom = editor.view.dom;
    const apply = () => {
      if (editor.state.selection.empty) return;
      const c = editor.chain().focus().unsetAllMarks();
      paint.forEach((m) => c.setMark(m.type.name, m.attrs));
      c.run();
      setPaint(null);
    };
    dom.addEventListener("mouseup", apply);
    dom.classList.add("paint-format");
    return () => {
      dom.removeEventListener("mouseup", apply);
      dom.classList.remove("paint-format");
    };
  }, [paint, editor]);

  const toggle = (m: Exclude<Menu, null>) => (open: boolean) => setMenu(open ? m : null);
  const openMenu = (m: Exclude<Menu, null>) => () => setMenu(menu === m ? null : m);
  const pick = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };

  const AlignIcon = ALIGN_ICONS[s.align] ?? IconAlignLeft;

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-full bg-[#edf2fa] px-3 py-1" role="toolbar" aria-label="Formatting">
      {editing && (
        <>
          <Btn title="Undo (Ctrl+Z)" icon={IconArrowBackUp} disabled={!s.canUndo} onClick={() => chain(editor).undo().run()} />
          <Btn title="Redo (Ctrl+Y)" icon={IconArrowForwardUp} disabled={!s.canRedo} onClick={() => chain(editor).redo().run()} />
        </>
      )}
      {onPrint && <Btn title="Print (Ctrl+P)" icon={IconPrinter} onClick={onPrint} />}
      {editing && (
        <Btn
          title="Paint format"
          icon={IconBrush}
          active={paint !== null}
          onClick={() => setPaint(paint ? null : editor.state.selection.$from.marks())}
        />
      )}
      <Popover
        open={menu === "zoom"}
        onOpenChange={toggle("zoom")}
        trigger={<Dropdown title="Zoom" label={`${zoom}%`} width="w-20" onClick={openMenu("zoom")} />}
      >
        {ZOOM_LEVELS.map((z) => (
          <Item key={z} active={z === zoom} onClick={pick(() => onZoom(z))}>
            {z}%
          </Item>
        ))}
      </Popover>

      {editing && (
        <>
          <Sep />
          <Popover
            open={menu === "style"}
            onOpenChange={toggle("style")}
            trigger={<Dropdown title="Styles" label={STYLES.find((x) => x.id === s.style)?.label ?? "Normal text"} width="w-32" onClick={openMenu("style")} />}
          >
            {STYLES.map((style) => (
              <Item key={style.id} active={style.id === s.style} onClick={pick(() => applyStyle(editor, style.id))}>
                <span className={style.preview}>{style.label}</span>
              </Item>
            ))}
          </Popover>
          <Sep />
          <Popover
            open={menu === "font"}
            onOpenChange={toggle("font")}
            trigger={<Dropdown title="Font" label={s.font} width="w-28" onClick={openMenu("font")} />}
          >
            {FONT_FAMILIES.map((f) => (
              <Item key={f} active={f === s.font} onClick={pick(() => chain(editor).setFontFamily(f).run())}>
                <span style={{ fontFamily: f }}>{f}</span>
              </Item>
            ))}
          </Popover>
          <Sep />
          <Btn title="Decrease font size (Ctrl+Shift+,)" icon={IconMinus} onClick={() => stepFontSize(editor, -1)} />
          <FontSizeInput size={s.size} onCommit={(n) => setFontSize(editor, n)} />
          <Btn title="Increase font size (Ctrl+Shift+.)" icon={IconPlus} onClick={() => stepFontSize(editor, 1)} />
          <Sep />
          <Btn title="Bold (Ctrl+B)" icon={IconBold} active={s.bold} onClick={() => chain(editor).toggleBold().run()} />
          <Btn title="Italic (Ctrl+I)" icon={IconItalic} active={s.italic} onClick={() => chain(editor).toggleItalic().run()} />
          <Btn title="Underline (Ctrl+U)" icon={IconUnderline} active={s.underline} onClick={() => chain(editor).toggleUnderline().run()} />
          <Btn title="Strikethrough (Alt+Shift+5)" icon={IconStrikethrough} active={s.strike} onClick={() => chain(editor).toggleStrike().run()} />
          <Popover
            open={menu === "color"}
            onOpenChange={toggle("color")}
            trigger={<ColorButton title="Text color" letter onClick={openMenu("color")} color={s.color} />}
          >
            <Palette
              resetLabel="Default"
              onReset={pick(() => chain(editor).unsetColor().run())}
              onPick={(c) => pick(() => chain(editor).setColor(c).run())()}
            />
          </Popover>
          <Popover
            open={menu === "highlight"}
            onOpenChange={toggle("highlight")}
            trigger={<ColorButton title="Highlight color" onClick={openMenu("highlight")} color={s.highlight ?? "transparent"} />}
          >
            <Palette
              resetLabel="None"
              onReset={pick(() => chain(editor).unsetBackgroundColor().run())}
              onPick={(c) => pick(() => chain(editor).setBackgroundColor(c).run())()}
            />
          </Popover>
          <Sep />
          <Btn title="Insert link (Ctrl+K)" icon={IconLink} active={s.link} onClick={onLink} />
        </>
      )}
      {canComment && <Btn title="Add comment (Ctrl+Alt+M)" icon={IconMessagePlus} onClick={onComment} />}
      {editing && (
        <>
          <Btn title="Insert image (PNG, JPEG, GIF, WebP)" icon={IconCloudUpload} disabled={imageUploading} onClick={onInsertImage} />
          <Sep />
          <Popover open={menu === "align"} onOpenChange={toggle("align")} trigger={<Btn title="Align" icon={AlignIcon} caret onClick={openMenu("align")} />}>
            <div className="flex gap-0.5">
              {ALIGNMENTS.map((a) => (
                <Btn
                  key={a.value}
                  title={`${a.label} (${a.shortcut})`}
                  icon={ALIGN_ICONS[a.value]}
                  active={s.align === a.value}
                  onClick={pick(() => chain(editor).setTextAlign(a.value).run())}
                />
              ))}
            </div>
          </Popover>
          <Popover
            open={menu === "spacing"}
            onOpenChange={toggle("spacing")}
            trigger={<Btn title="Line & paragraph spacing" icon={IconLineHeight} caret onClick={openMenu("spacing")} />}
          >
            {LINE_SPACINGS.map((v) => (
              <Item key={v} active={(s.spacing ?? DEFAULT_LINE_SPACING) === v} onClick={pick(() => chain(editor).setLineSpacing(v).run())}>
                {SPACING_LABELS[v]}
              </Item>
            ))}
          </Popover>
          <Btn title="Checklist (Ctrl+Shift+9)" icon={IconListCheck} active={s.task} onClick={() => chain(editor).toggleTaskList().run()} />
          <Btn title="Bulleted list (Ctrl+Shift+8)" icon={IconList} active={s.bullet} onClick={() => chain(editor).toggleBulletList().run()} />
          <Btn title="Numbered list (Ctrl+Shift+7)" icon={IconListNumbers} active={s.ordered} onClick={() => chain(editor).toggleOrderedList().run()} />
          <Btn title="Decrease indent (Ctrl+[)" icon={IconIndentDecrease} onClick={() => chain(editor).outdent().run()} />
          <Btn title="Increase indent (Ctrl+])" icon={IconIndentIncrease} onClick={() => chain(editor).indent().run()} />
          <Btn title="Clear formatting (Ctrl+\)" icon={IconClearFormatting} onClick={() => chain(editor).unsetAllMarks().run()} />
          <Sep />
          <Btn title="Quote" icon={IconBlockquote} active={s.quote} onClick={() => chain(editor).toggleBlockquote().run()} />
          <Btn title="Code block" icon={IconCode} active={s.codeBlock} onClick={() => chain(editor).toggleCodeBlock().run()} />
          <Btn title="Horizontal line" icon={IconSeparator} onClick={() => chain(editor).setHorizontalRule().run()} />
          <Popover open={menu === "table"} onOpenChange={toggle("table")} trigger={<Btn title="Insert table" icon={IconTable} active={s.table} onClick={openMenu("table")} />}>
            <TablePicker editor={editor} onDone={() => setMenu(null)} />
          </Popover>
          <Popover open={menu === "math"} onOpenChange={toggle("math")} trigger={<Btn title="Insert equation" icon={IconMath} active={s.math} onClick={openMenu("math")} />}>
            {MATH_MODES.map(({ label, mode }) => (
              <Item key={label} onClick={pick(() => onMath(mode))}>
                {label}
              </Item>
            ))}
          </Popover>
          <Popover open={menu === "emoji"} onOpenChange={toggle("emoji")} trigger={<Btn title="Emoji" icon={IconMoodSmile} onClick={openMenu("emoji")} />}>
            <EmojiPicker onPick={(emoji) => pick(() => chain(editor).insertContent(emoji).run())()} />
          </Popover>
        </>
      )}

      {editing && s.table && (
        <div className="flex w-full items-center gap-0.5 border-t border-slate-300/60 pt-1">
          <span className="mr-1 text-xs text-slate-600">Table:</span>
          {TABLE_TOOLBAR.map(({ action, icon }) => (
            <Btn key={action} title={TABLE_ACTIONS[action].label} icon={icon} onClick={() => TABLE_ACTIONS[action].run(editor)} />
          ))}
        </div>
      )}
    </div>
  );
}

const ALIGN_ICONS: Record<string, Icon> = {
  left: IconAlignLeft,
  center: IconAlignCenter,
  right: IconAlignRight,
  justify: IconAlignJustified,
};

const TABLE_TOOLBAR: { action: keyof typeof TABLE_ACTIONS; icon: Icon }[] = [
  { action: "addRowAfter", icon: IconRowInsertBottom },
  { action: "addColumnAfter", icon: IconColumnInsertRight },
  { action: "deleteRow", icon: IconRowRemove },
  { action: "deleteColumn", icon: IconColumnRemove },
  { action: "deleteTable", icon: IconTableOff },
];

function Btn({
  title,
  icon: I,
  active,
  disabled,
  caret,
  onClick,
}: {
  title: string;
  icon: Icon;
  active?: boolean;
  disabled?: boolean;
  caret?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex items-center rounded p-1.5 disabled:opacity-40 ${active ? "bg-[#d3e3fd] text-[#041e49]" : "text-slate-700 hover:bg-slate-300/50"}`}
    >
      <I size={18} />
      {caret && <IconChevronDown size={12} />}
    </button>
  );
}

function Dropdown({ title, label, width, onClick }: { title: string; label: string; width: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex ${width} items-center justify-between gap-1 rounded px-2 py-1 text-sm text-slate-800 hover:bg-slate-300/50`}
    >
      <span className="truncate">{label}</span>
      <IconChevronDown size={14} className="shrink-0" />
    </button>
  );
}

function ColorButton({ title, color, letter, onClick }: { title: string; color: string; letter?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex flex-col items-center rounded px-1.5 pb-0.5 pt-1 text-slate-700 hover:bg-slate-300/50"
    >
      {letter ? <span className="text-[15px] font-semibold leading-4">A</span> : <IconHighlight size={16} />}
      <span className="mt-0.5 h-1 w-4 rounded-sm border border-slate-300" style={{ background: color }} />
    </button>
  );
}

function Palette({ onPick, onReset, resetLabel }: { onPick: (c: string) => void; onReset: () => void; resetLabel: string }) {
  return (
    <div className="p-1">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onReset}
        className="mb-2 w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100"
      >
        {resetLabel}
      </button>
      {COLOR_ROWS.map((row, r) => (
        <div key={r} className={`flex ${r === 1 ? "mb-2" : ""}`}>
          {row.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={`Color ${c}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(c)}
              className="m-0.5 h-5 w-5 rounded-full border border-slate-300 hover:scale-110"
              style={{ background: c }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// As in Google Docs: clicking selects the number so typing replaces it, Enter or
// leaving the box applies it (clamped to the allowed range), Escape cancels.
function FontSizeInput({ size, onCommit }: { size: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  // Enter applies and moves focus to the document, which then blurs the box;
  // this makes sure each edit is applied or cancelled only once.
  const finished = useRef(false);

  const finish = (apply: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const n = Number(draft);
    if (apply && draft && n > 0) onCommit(Math.min(Math.max(n, MIN_FONT_SIZE), MAX_FONT_SIZE));
    setDraft(null);
  };

  return (
    <input
      aria-label="Font size"
      title="Font size"
      inputMode="decimal"
      value={draft ?? String(size)}
      onChange={(e) => {
        finished.current = false;
        setDraft(e.target.value.replace(/[^\d.]/g, ""));
      }}
      onFocus={(e) => {
        finished.current = false;
        e.currentTarget.select();
      }}
      onMouseUp={(e) => e.preventDefault()}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          finish(false);
          e.currentTarget.blur();
        }
      }}
      className="h-7 w-9 rounded border border-slate-400 bg-transparent text-center text-sm"
    />
  );
}

function Item({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`block w-full whitespace-nowrap rounded px-3 py-1.5 text-left text-sm ${active ? "bg-blue-50 text-blue-900" : "hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-slate-300" />;
