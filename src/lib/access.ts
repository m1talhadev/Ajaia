// Pure access rules, kept free of I/O so they can be unit tested.
// Model (as in Google Docs):
// - owner: everything, including delete, transfer ownership and share settings
// - editor: view, comment, edit; share too when "Editors can change permissions and share" is on
// - commenter: view and comment
// - viewer: view only
// Access comes from being added, or from General access when the document is
// open to anyone with the link; the stronger of the two wins. Downloading,
// printing and copying is limited to editors unless "Viewers and commenters can
// see the option to download, print, and copy" is on.

export const SHARE_ROLES = ["viewer", "commenter", "editor"] as const;
export type ShareRole = (typeof SHARE_ROLES)[number];
export const LINK_ACCESS = ["restricted", "anyone"] as const;
export type LinkAccess = (typeof LINK_ACCESS)[number];
export type Role = "owner" | ShareRole | null;

export const ROLE_LABELS: Record<Exclude<Role, null>, string> = {
  owner: "Owner",
  editor: "Editor",
  commenter: "Commenter",
  viewer: "Viewer",
};

export type AccessDoc = {
  ownerId: string;
  shares: { userId: string; role: ShareRole }[];
  linkAccess: LinkAccess;
  linkRole: ShareRole;
  editorsCanShare: boolean;
  viewersCanCopy: boolean;
};

const RANK: Record<ShareRole, number> = { viewer: 1, commenter: 2, editor: 3 };

const directRole = (doc: AccessDoc, userId: string) => doc.shares.find((s) => s.userId === userId)?.role;

export function roleFor(doc: AccessDoc, userId: string): Role {
  if (doc.ownerId === userId) return "owner";
  const direct = directRole(doc, userId);
  const viaLink = doc.linkAccess === "anyone" ? doc.linkRole : undefined;
  if (direct && viaLink) return RANK[viaLink] > RANK[direct] ? viaLink : direct;
  return direct ?? viaLink ?? null;
}

// True when the user can open the document only because of link sharing.
export function accessIsViaLink(doc: AccessDoc, userId: string): boolean {
  if (doc.ownerId === userId || doc.linkAccess !== "anyone") return false;
  const direct = directRole(doc, userId);
  return !direct || RANK[doc.linkRole] > RANK[direct];
}

const isAtLeast = (role: Role, min: ShareRole) => role === "owner" || (role !== null && RANK[role] >= RANK[min]);

export const canView = (doc: AccessDoc, userId: string) => roleFor(doc, userId) !== null;
export const canComment = (doc: AccessDoc, userId: string) => isAtLeast(roleFor(doc, userId), "commenter");
export const canEdit = (doc: AccessDoc, userId: string) => isAtLeast(roleFor(doc, userId), "editor");
export const canShare = (doc: AccessDoc, userId: string) => {
  const role = roleFor(doc, userId);
  return role === "owner" || (role === "editor" && doc.editorsCanShare);
};
export const canManage = (doc: AccessDoc, userId: string) => roleFor(doc, userId) === "owner";
export const canCopy = (doc: AccessDoc, userId: string) => canEdit(doc, userId) || (canView(doc, userId) && doc.viewersCanCopy);

// A comment can be resolved or deleted by its author or by anyone who can edit.
export const canModerateComment = (doc: AccessDoc, userId: string, authorId: string) =>
  authorId === userId || canEdit(doc, userId);

export type Permission = "view" | "comment" | "edit" | "share" | "manage" | "copy";

export const PERMISSION_CHECKS: Record<Permission, (doc: AccessDoc, userId: string) => boolean> = {
  view: canView,
  comment: canComment,
  edit: canEdit,
  share: canShare,
  manage: canManage,
  copy: canCopy,
};

export type DocumentPermissions = ReturnType<typeof permissionsFor>;

export function permissionsFor(doc: AccessDoc, userId: string) {
  return {
    canComment: canComment(doc, userId),
    canEdit: canEdit(doc, userId),
    canShare: canShare(doc, userId),
    canManage: canManage(doc, userId),
    canCopy: canCopy(doc, userId),
  };
}

type ShareCheck = { ok: true } | { ok: false; status: number; error: string };

export function checkShareTarget(doc: AccessDoc, targetUserId: string): ShareCheck {
  if (targetUserId === doc.ownerId) return { ok: false, status: 400, error: "The owner already has access" };
  if (doc.shares.some((s) => s.userId === targetUserId)) {
    return { ok: false, status: 409, error: "This person already has access. Change their role instead" };
  }
  return { ok: true };
}

// Ownership can only go to someone who already has edit access, as in Google Docs.
export function checkOwnershipTarget(doc: AccessDoc, targetUserId: string): ShareCheck {
  if (targetUserId === doc.ownerId) return { ok: false, status: 400, error: "This person is already the owner" };
  const share = doc.shares.find((s) => s.userId === targetUserId);
  if (!share) return { ok: false, status: 400, error: "Add this person before making them the owner" };
  if (share.role !== "editor") return { ok: false, status: 400, error: "Only editors can be made the owner" };
  return { ok: true };
}
