"use client";

import { IconEye, IconFileText, IconLock, IconMessageCircle, IconPencil, IconWorld } from "@tabler/icons-react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useFilePicker } from "@/hooks/useFilePicker";
import { type Shortcut, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useStoredState } from "@/hooks/useStoredState";
import { useToast } from "@/hooks/useToast";
import { ROLE_LABELS } from "@/lib/access";
import { api, createDocument, importDocument, uploadImage } from "@/lib/api";
import { copyPageLink } from "@/lib/clipboard";
import type { SerializedDocument } from "@/lib/documents";
import { exportDocument } from "@/lib/export";
import { IMAGE_ACCEPT, IMPORT_ACCEPT } from "@/lib/uploads";
import { Modal } from "./ui/Dialog";
import { ErrorMessage, Toast } from "./ui/Feedback";
import { Select, type SelectItem } from "./ui/Select";
import { CommentsPanel, type CommentDraft } from "./editor/CommentsPanel";
import { CopyDialog } from "./editor/CopyDialog";
import { buildMenus, type DownloadFormat, type Mode } from "./editor/docMenus";
import { EmojiPicker } from "./editor/EmojiPicker";
import { buildExtensions } from "./editor/extensions";
import { FindReplace } from "./editor/FindReplace";
import type { MathMode } from "./editor/formatting";
import { LinkDialog } from "./editor/LinkDialog";
import { MathDialog, type MathRequest } from "./editor/MathDialog";
import { MenuBar } from "./editor/Menu";
import { OutlinePanel } from "./editor/OutlinePanel";
import { ConflictBanner, SaveIndicator } from "./editor/SaveStatus";
import { ShortcutsDialog } from "./editor/ShortcutsDialog";
import { Toolbar } from "./editor/Toolbar";
import { type RemoteChange, useDocumentSync } from "./editor/useDocumentSync";
import { WordCountBadge, WordCountDialog } from "./editor/WordCount";
import { type GeneralAccess, ShareDialog, type ShareSettings } from "./ShareDialog";

type Dialog = "link" | "share" | "copy" | "wordCount" | "shortcuts" | "emoji" | null;

const MAX_QUOTE_CHARS = 1000;

const MODE_ITEMS: SelectItem<Mode>[] = [
  { value: "editing", label: "Editing", description: "Edit document directly", icon: <IconPencil size={16} /> },
  { value: "viewing", label: "Viewing", description: "Read or print final document", icon: <IconEye size={16} /> },
];

export function DocumentEditor({ initial, currentUserId }: { initial: SerializedDocument; currentUserId: string }) {
  const router = useRouter();
  const perms = initial.permissions;
  const isOwner = initial.role === "owner";

  const [shares, setShares] = useState(initial.shares);
  const [access, setAccess] = useState<GeneralAccess>({ linkAccess: initial.linkAccess, linkRole: initial.linkRole });
  const [settings, setSettings] = useState<ShareSettings>({ editorsCanShare: initial.editorsCanShare, viewersCanCopy: initial.viewersCanCopy });
  const [title, setTitle] = useState(initial.title);
  const [savedTitle, setSavedTitle] = useState(initial.title);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [mathRequest, setMathRequest] = useState<MathRequest | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState<CommentDraft | null>(null);
  const [mode, setMode] = useState<Mode>("editing");
  const [zoom, setZoom] = useState(100);
  const [showOutline, setShowOutline] = useStoredState("ajaia-docs:showOutline", false);
  const [showWordCount, setShowWordCount] = useStoredState("ajaia-docs:showWordCount", false);
  const [toast, showToast] = useToast();
  const action = useAsyncAction();
  const upload = useAsyncAction();
  const titleInput = useRef<HTMLInputElement>(null);

  const editing = perms.canEdit && mode === "editing";

  const editor = useEditor({
    extensions: buildExtensions({
      onEditMath: ({ latex, pos, kind }) => setMathRequest({ kind, latex, pos, chem: latex.includes("\\ce{") }),
    }),
    content: initial.content,
    editable: editing,
    immediatelyRender: false,
    editorProps: { attributes: { class: "doc-content", spellcheck: "true" } },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editing) editor.setEditable(editing, false);
  }, [editor, editing]);

  const sync = useDocumentSync({
    docId: initial.id,
    initialRevision: initial.revision,
    editor,
    onRemoteChange: ({ title: latestTitle, editedBy }: RemoteChange) => {
      setSavedTitle(latestTitle);
      if (document.activeElement !== titleInput.current) setTitle(latestTitle);
      if (editedBy && editedBy.id !== currentUserId) showToast(`${editedBy.name} edited this document`);
    },
  });

  const openDocument = (create: () => Promise<{ id: string }>) =>
    action.run(async () => router.push(`/docs/${(await create()).id}`));

  const importPicker = useFilePicker(IMPORT_ACCEPT, (file) => openDocument(() => importDocument(file)));
  const imagePicker = useFilePicker(IMAGE_ACCEPT, (file) =>
    upload.run(async () => {
      const src = await uploadImage(initial.id, file);
      editor?.chain().focus().setImage({ src, alt: file.name }).run();
    }),
  );

  function commitTitle() {
    const next = title.trim();
    if (!next) return setTitle(savedTitle);
    if (next === savedTitle) return;
    setSavedTitle(next);
    sync.save({ title: next });
    void sync.flush();
  }

  // The text a comment is made on. Commenters can't edit, so the editor has no
  // selection of its own; fall back to the browser selection.
  function selectedQuote(): string | null {
    if (!editor) return null;
    let { from, to } = editor.state.selection;
    const sel = window.getSelection();
    if (from === to && sel && !sel.isCollapsed && sel.anchorNode && sel.focusNode && editor.view.dom.contains(sel.anchorNode)) {
      try {
        const a = editor.view.posAtDOM(sel.anchorNode, sel.anchorOffset);
        const b = editor.view.posAtDOM(sel.focusNode, sel.focusOffset);
        [from, to] = [Math.min(a, b), Math.max(a, b)];
      } catch {
        return null;
      }
    }
    const quote = editor.state.doc.textBetween(from, to, "\n");
    return quote.trim() ? quote : null;
  }

  function addComment() {
    const quote = selectedQuote();
    if (!quote) return showToast("Select the text you want to comment on.");
    if (quote.length > MAX_QUOTE_CHARS) return showToast("Select less text to comment on (up to 1,000 characters).");
    setCommentDraft({ quote });
    setCommentsOpen(true);
  }

  function deleteDocument() {
    if (!confirm(`Delete "${savedTitle}"? This cannot be undone.`)) return;
    action.run(async () => {
      await api(`/api/documents/${initial.id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    });
  }

  function print() {
    if (!perms.canCopy) return;
    void sync.flush();
    window.print();
  }

  function download(format: DownloadFormat) {
    if (!editor) return;
    if (format === "pdf") return print();
    action.run(() => exportDocument(editor, savedTitle, format));
  }

  function paste() {
    action.run(async () => {
      const text = await navigator.clipboard.readText().catch(() => {
        throw new Error("Your browser blocked pasting from the menu. Use Ctrl+V instead.");
      });
      editor?.chain().focus().insertContent(text).run();
    });
  }

  const copyLink = () =>
    action.run(async () => {
      await copyPageLink();
      showToast("Link copied");
    });
  const openMath = (mode: MathMode) => setMathRequest({ ...mode, latex: "", pos: null });

  const shortcuts: Shortcut[] = [
    { key: "f", run: () => setFindOpen(true) },
    { key: "h", run: () => setFindOpen(true) },
    { key: "p", run: print },
    { key: "s", run: () => void sync.flush() },
    { key: "o", run: () => router.push("/") },
    { key: "/", run: () => setDialog("shortcuts") },
    { key: "k", when: editing, run: () => setDialog("link") },
    { key: "m", alt: true, when: perms.canComment, run: addComment },
    { key: "c", shift: true, run: () => setDialog("wordCount") },
  ];
  useKeyboardShortcuts(shortcuts);

  const menus = () =>
    editor
      ? buildMenus({
          editor,
          editing,
          perms,
          zoom,
          mode,
          showOutline,
          showWordCount,
          actions: {
            newDocument: () => openDocument(createDocument),
            openDocuments: () => router.push("/"),
            importFile: importPicker.open,
            makeCopy: () => setDialog("copy"),
            share: () => setDialog("share"),
            copyLink,
            download,
            rename: () => titleInput.current?.select(),
            print,
            remove: deleteDocument,
            paste,
            find: () => setFindOpen(true),
            link: () => setDialog("link"),
            math: openMath,
            emoji: () => setDialog("emoji"),
            comment: addComment,
            insertImage: imagePicker.open,
            wordCount: () => setDialog("wordCount"),
            shortcuts: () => setDialog("shortcuts"),
            setZoom,
            setMode,
            toggleOutline: () => setShowOutline((v) => !v),
            toggleWordCount: () => setShowWordCount((v) => !v),
            fullScreen: () => void document.documentElement.requestFullscreen?.().catch(() => {}),
          },
        })
      : [];

  const roleBadge = isOwner
    ? ROLE_LABELS.owner
    : `${initial.viaLink ? "Link shared" : "Shared"} by ${initial.owner.name} · ${ROLE_LABELS[initial.role ?? "viewer"]}`;

  return (
    <div
      className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#f9fbfd]"
      onCopy={(e) => !perms.canCopy && e.preventDefault()}
      onCut={(e) => !perms.canCopy && e.preventDefault()}
    >
      <div className="sticky top-14 z-20 border-b border-slate-200 bg-[#f9fbfd] px-4 pt-2 pb-2 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" onClick={() => void sync.flush()} title="Docs home" className="text-blue-600">
            <IconFileText size={32} stroke={1.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={titleInput}
                aria-label="Document title"
                value={title}
                readOnly={!perms.canEdit}
                maxLength={200}
                size={Math.max(title.length, 8)}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), editor?.commands.focus("start"))}
                className={`max-w-full truncate rounded border border-transparent px-1.5 py-0.5 text-lg outline-none ${
                  perms.canEdit ? "hover:border-slate-300 focus:border-blue-600" : "cursor-default"
                }`}
              />
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOwner ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                {roleBadge}
              </span>
              {perms.canEdit ? (
                <SaveIndicator state={sync.state} onRetry={sync.flush} />
              ) : (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {perms.canComment ? "Comment only" : "View only"}
                </span>
              )}
            </div>
            <MenuBar menus={menus} />
          </div>
          <div className="flex items-center gap-1">
            {perms.canComment && (
              <button
                type="button"
                title="Open comment history"
                aria-label="Open comment history"
                aria-pressed={commentsOpen}
                onClick={() => setCommentsOpen((open) => !open)}
                className={`rounded-full p-2 ${commentsOpen ? "bg-[#d3e3fd] text-[#041e49]" : "text-slate-700 hover:bg-slate-200"}`}
              >
                <IconMessageCircle size={20} />
              </button>
            )}
            <button
              onClick={() => setDialog("share")}
              className="ml-2 flex items-center gap-2 rounded-full bg-[#c2e7ff] px-5 py-2 text-sm font-medium text-[#001d35] hover:bg-[#b3dcf5]"
            >
              {access.linkAccess === "anyone" ? <IconWorld size={16} /> : <IconLock size={16} />}
              Share
            </button>
          </div>
        </div>
        {editor && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <Toolbar
                editor={editor}
                editing={editing}
                canComment={perms.canComment}
                zoom={zoom}
                onZoom={setZoom}
                onPrint={perms.canCopy ? print : null}
                onLink={() => setDialog("link")}
                onMath={openMath}
                onComment={addComment}
                onInsertImage={imagePicker.open}
                imageUploading={upload.busy}
              />
            </div>
            {perms.canEdit && (
              <Select label="Mode" value={mode} items={MODE_ITEMS} onChange={setMode} variant="pill" align="right" />
            )}
          </div>
        )}
        {sync.conflict && <ConflictBanner conflict={sync.conflict} onLoadLatest={sync.loadLatest} onKeepMine={sync.keepMine} />}
        <ErrorMessage
          message={action.error ?? upload.error}
          onDismiss={() => {
            action.setError(null);
            upload.setError(null);
          }}
          className="mt-2"
        />
        <ErrorMessage message={sync.error} className="mt-2" />
      </div>

      <div className="flex flex-1 gap-6 px-4 py-6">
        {showOutline && editor && <OutlinePanel editor={editor} onClose={() => setShowOutline(false)} />}

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="doc-page" style={{ zoom: zoom / 100 }}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {editor && perms.canComment && (
          // Kept mounted while closed so comment highlights stay in the document.
          <div className={commentsOpen ? "" : "hidden"}>
            <CommentsPanel
              editor={editor}
              docId={initial.id}
              currentUserId={currentUserId}
              canModerate={perms.canEdit}
              draft={commentDraft}
              onDraftDone={() => setCommentDraft(null)}
              onHasComments={() => setCommentsOpen(true)}
              onClose={() => setCommentsOpen(false)}
            />
          </div>
        )}
      </div>

      <Toast message={toast} />
      {editor && showWordCount && <WordCountBadge editor={editor} onClick={() => setDialog("wordCount")} />}
      {imagePicker.input}
      {importPicker.input}

      {editor && findOpen && <FindReplace editor={editor} canReplace={editing} onClose={() => setFindOpen(false)} />}
      {editor && mathRequest && <MathDialog editor={editor} request={mathRequest} onClose={() => setMathRequest(null)} />}
      {editor && dialog === "link" && <LinkDialog editor={editor} onClose={() => setDialog(null)} />}
      {editor && dialog === "wordCount" && (
        <WordCountDialog editor={editor} showWhileTyping={showWordCount} onShowWhileTyping={setShowWordCount} onClose={() => setDialog(null)} />
      )}
      {editor && dialog === "emoji" && (
        <Modal title="Insert emoji" onClose={() => setDialog(null)} onConfirm={() => setDialog(null)} confirmLabel="Done" hideCancel>
          <EmojiPicker onPick={(emoji) => (editor.chain().focus().insertContent(emoji).run(), setDialog(null))} />
        </Modal>
      )}
      {dialog === "shortcuts" && <ShortcutsDialog onClose={() => setDialog(null)} />}
      {dialog === "copy" && <CopyDialog docId={initial.id} title={savedTitle} canShare={perms.canShare} onClose={() => setDialog(null)} />}
      {dialog === "share" && (
        <ShareDialog
          docId={initial.id}
          title={savedTitle}
          owner={initial.owner}
          currentUserId={currentUserId}
          canShare={perms.canShare}
          shares={shares}
          onSharesChange={setShares}
          access={access}
          onAccessChange={setAccess}
          settings={settings}
          onSettingsChange={setSettings}
          onOwnershipTransferred={() => window.location.reload()}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
