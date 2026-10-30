"use client";

import { IconArrowLeft, IconLink, IconLock, IconSettings, IconWorld } from "@tabler/icons-react";
import { useState } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { type LinkAccess, ROLE_LABELS, SHARE_ROLES, type ShareRole } from "@/lib/access";
import { api, jsonBody } from "@/lib/api";
import { copyPageLink } from "@/lib/clipboard";
import type { SerializedDocument } from "@/lib/documents";
import type { UserSummary } from "@/lib/users";
import { Avatar } from "./ui/Avatar";
import { Dialog } from "./ui/Dialog";
import { ErrorMessage } from "./ui/Feedback";
import { Select, type SelectItem } from "./ui/Select";

type Collaborator = SerializedDocument["shares"][number];
export type GeneralAccess = Pick<SerializedDocument, "linkAccess" | "linkRole">;
export type ShareSettings = Pick<SerializedDocument, "editorsCanShare" | "viewersCanCopy">;

const ROLE_VERB: Record<ShareRole, string> = { viewer: "view", commenter: "comment", editor: "edit" };
type PersonAction = ShareRole | "transfer" | "remove";

const ROLE_ITEMS: SelectItem<ShareRole>[] = SHARE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

const ACCESS_ITEMS: SelectItem<LinkAccess>[] = [
  { value: "restricted", label: "Restricted", description: "Only people with access can open with the link" },
  { value: "anyone", label: "Anyone with the link", description: "Anyone signed in who has the link can open it" },
];

function personItems(canTransfer: boolean): SelectItem<PersonAction>[] {
  return [
    ...ROLE_ITEMS,
    "divider",
    ...(canTransfer ? [{ value: "transfer" as const, label: "Transfer ownership" }] : []),
    { value: "remove", label: "Remove access", danger: true },
  ];
}

// Google Docs–style share dialog:
// - add people as Viewer, Commenter or Editor; change roles; remove access
// - transfer ownership to an editor (owner only)
// - General access: Restricted, or Anyone with the link with a role
// - settings (owner only): editors can share; viewers/commenters can download, print and copy
// People who can't share see everything read-only.
export function ShareDialog({
  docId,
  title,
  owner,
  currentUserId,
  canShare,
  shares,
  onSharesChange,
  access,
  onAccessChange,
  settings,
  onSettingsChange,
  onOwnershipTransferred,
  onClose,
}: {
  docId: string;
  title: string;
  owner: UserSummary;
  currentUserId: string;
  canShare: boolean;
  shares: Collaborator[];
  onSharesChange: (shares: Collaborator[]) => void;
  access: GeneralAccess;
  onAccessChange: (access: GeneralAccess) => void;
  settings: ShareSettings;
  onSettingsChange: (settings: ShareSettings) => void;
  onOwnershipTransferred: () => void;
  onClose: () => void;
}) {
  const isOwner = owner.id === currentUserId;
  const [view, setView] = useState<"share" | "settings">("share");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [copied, setCopied] = useState(false);
  const { busy, error, run } = useAsyncAction();
  const sharesUrl = `/api/documents/${docId}/shares`;

  function add(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      const added = await api<Collaborator>(sharesUrl, { method: "POST", ...jsonBody({ email, role }) });
      onSharesChange([...shares, added]);
      setEmail("");
    });
  }

  // Applies a change immediately and reverts it if the request fails.
  function optimistic<T>(next: T, previous: T, apply: (value: T) => void, request: () => Promise<unknown>) {
    apply(next);
    return run(request, () => apply(previous));
  }

  function change(person: Collaborator, value: PersonAction) {
    if (value === "transfer") {
      if (!confirm(`Make ${person.name} the owner? You will become an editor and can no longer delete the document or change these settings.`)) return;
      return run(async () => {
        await api(`/api/documents/${docId}/owner`, { method: "POST", ...jsonBody({ userId: person.id }) });
        onOwnershipTransferred();
      });
    }
    const url = `${sharesUrl}/${person.id}`;
    if (value === "remove") {
      return optimistic(shares.filter((s) => s.id !== person.id), shares, onSharesChange, () => api(url, { method: "DELETE" }));
    }
    const next = shares.map((s) => (s.id === person.id ? { ...s, role: value } : s));
    return optimistic(next, shares, onSharesChange, () => api(url, { method: "PATCH", ...jsonBody({ role: value }) }));
  }

  const updateAccess = (body: Partial<GeneralAccess & ShareSettings>) =>
    api(`/api/documents/${docId}/access`, { method: "PATCH", ...jsonBody(body) });
  // Only the changed field is sent, so quick successive changes can't overwrite each other if their requests finish out of order.
  const changeAccess = (patch: Partial<GeneralAccess>) =>
    optimistic({ ...access, ...patch }, access, onAccessChange, () => updateAccess(patch));
  const changeSettings = (patch: Partial<ShareSettings>) =>
    optimistic({ ...settings, ...patch }, settings, onSettingsChange, () => updateAccess(patch));

  const copyLink = () =>
    run(async () => {
      await copyPageLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });

  return (
    <Dialog label="Share document" width="lg" onClose={onClose}>
      {view === "settings" ? (
        <>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Back" onClick={() => setView("share")} className="rounded-full p-1.5 hover:bg-slate-100">
              <IconArrowLeft size={20} />
            </button>
            <h2 className="truncate text-xl font-medium">Settings for “{title}”</h2>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={settings.editorsCanShare}
              onChange={(e) => changeSettings({ editorsCanShare: e.target.checked })}
            />
            Editors can change permissions and share
          </label>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={settings.viewersCanCopy}
              onChange={(e) => changeSettings({ viewersCanCopy: e.target.checked })}
            />
            Viewers and commenters can see the option to download, print, and copy
          </label>
          <ErrorMessage message={error} className="mt-3" />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-xl font-medium">Share “{title}”</h2>
            {isOwner && (
              <button type="button" aria-label="Settings" title="Settings" onClick={() => setView("settings")} className="rounded-full p-1.5 text-slate-600 hover:bg-slate-100">
                <IconSettings size={20} />
              </button>
            )}
          </div>

          {canShare && (
            <form onSubmit={add} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add people by email"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <Select label="Role for new person" value={role} items={ROLE_ITEMS} onChange={setRole} align="right" />
              <button disabled={busy} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50">
                Share
              </button>
            </form>
          )}

          <ErrorMessage message={error} className="mt-3" />

          <h3 className="mt-6 text-sm font-medium text-slate-700">People with access</h3>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
            <Person user={owner} you={isOwner}>
              <span className="px-2 text-sm text-slate-500">Owner</span>
            </Person>
            {shares.map((s) => (
              <Person key={s.id} user={s} you={s.id === currentUserId}>
                {canShare ? (
                  <Select<PersonAction>
                    label={`Role for ${s.name}`}
                    value={s.role}
                    items={personItems(isOwner && s.role === "editor")}
                    onChange={(v) => change(s, v)}
                    variant="ghost"
                    align="right"
                  />
                ) : (
                  <span className="px-2 text-sm text-slate-500">{ROLE_LABELS[s.role]}</span>
                )}
              </Person>
            ))}
          </ul>

          <h3 className="mt-6 text-sm font-medium text-slate-700">General access</h3>
          <GeneralAccessRow access={access} editable={canShare} onChange={changeAccess} />
          {!canShare && <p className="mt-2 text-xs text-slate-500">Only the owner{settings.editorsCanShare ? " and editors" : ""} can change who has access.</p>}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <IconLink size={16} />
              {copied ? "Link copied" : "Copy link"}
            </button>
            <button type="button" onClick={onClose} className="rounded-full bg-blue-700 px-6 py-2 text-sm font-medium text-white hover:bg-blue-800">
              Done
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}

function GeneralAccessRow({
  access,
  editable,
  onChange,
}: {
  access: GeneralAccess;
  editable: boolean;
  onChange: (patch: Partial<GeneralAccess>) => void;
}) {
  const open = access.linkAccess === "anyone";
  const description = open ? `Anyone with the link can ${ROLE_VERB[access.linkRole]}` : "Only people with access can open with the link";
  return (
    <div className="mt-2 flex items-center gap-3 rounded-md px-1 py-1.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${open ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
        {open ? <IconWorld size={18} /> : <IconLock size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        {editable ? (
          <Select
            label="General access"
            value={access.linkAccess}
            items={ACCESS_ITEMS}
            onChange={(linkAccess) => onChange({ linkAccess })}
            variant="ghost"
            className="-ml-2 w-fit font-medium"
          />
        ) : (
          <span className="block text-sm font-medium">{open ? "Anyone with the link" : "Restricted"}</span>
        )}
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      {open &&
        (editable ? (
          <Select
            label="Role for anyone with the link"
            value={access.linkRole}
            items={ROLE_ITEMS}
            onChange={(linkRole) => onChange({ linkRole })}
            variant="ghost"
            align="right"
          />
        ) : (
          <span className="text-sm text-slate-500">{ROLE_LABELS[access.linkRole]}</span>
        ))}
    </div>
  );
}

function Person({ user, you, children }: { user: UserSummary; you: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-md px-1 py-1.5">
      <Avatar name={user.name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {user.name} {you && <span className="font-normal text-slate-500">(you)</span>}
        </span>
        <span className="block truncate text-xs text-slate-500">{user.email}</span>
      </span>
      {children}
    </li>
  );
}
