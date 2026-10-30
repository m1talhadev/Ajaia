import { prisma } from "./db";
import { HttpError } from "./http";
import { accessIsViaLink, PERMISSION_CHECKS, type Permission, permissionsFor, roleFor, type ShareRole } from "./access";
import { userSummarySelect } from "./users";

const include = {
  owner: { select: userSummarySelect },
  lastEditedBy: { select: { id: true, name: true } },
  shares: { include: { user: { select: userSummarySelect } }, orderBy: { createdAt: "asc" } },
} as const;

// Loads a document and enforces the requested permission. Unknown and
// unviewable documents both return 404 so ids can't be probed.
export async function loadDocument(id: string, userId: string, need: Permission) {
  const doc = await prisma.document.findUnique({ where: { id }, include });
  if (!doc || !PERMISSION_CHECKS.view(doc, userId)) throw new HttpError(404, "Document not found");
  if (!PERMISSION_CHECKS[need](doc, userId)) throw new HttpError(403, "You don't have permission to do that");
  return doc;
}

type LoadedDocument = Awaited<ReturnType<typeof loadDocument>>;

export function serializeDocument(doc: LoadedDocument, userId: string) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    revision: doc.revision,
    owner: doc.owner,
    role: roleFor(doc, userId),
    viaLink: accessIsViaLink(doc, userId),
    permissions: permissionsFor(doc, userId),
    linkAccess: doc.linkAccess,
    linkRole: doc.linkRole,
    editorsCanShare: doc.editorsCanShare,
    viewersCanCopy: doc.viewersCanCopy,
    shares: doc.shares.map((s) => ({ ...s.user, role: s.role })),
  };
}

export type SerializedDocument = ReturnType<typeof serializeDocument>;

// PATCH /api/documents/:id responds 409 with this when the save is based on an old revision.
export type SaveConflict = { error: string; revision: number; editedBy: string };

// GET /api/documents/:id/sync. `latest` is omitted when the caller already has the current revision.
export type SyncResponse = {
  revision: number;
  latest?: { title: string; content: string; editedBy: { id: string; name: string } | null };
};

export type DocumentListItem = { id: string; title: string; updatedAt: string; ownerName: string; role: "owner" | ShareRole };

// The dashboard: documents the user owns, and documents shared with them directly.
export async function listDocuments(userId: string) {
  const select = { id: true, title: true, updatedAt: true, owner: { select: { name: true } } } as const;
  const [owned, shared] = await Promise.all([
    prisma.document.findMany({ where: { ownerId: userId }, select, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({
      where: { shares: { some: { userId } } },
      select: { ...select, shares: { where: { userId }, select: { role: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const item = (d: (typeof owned)[number], role: DocumentListItem["role"]): DocumentListItem => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
    ownerName: d.owner.name,
    role,
  });
  return {
    owned: owned.map((d) => item(d, "owner")),
    shared: shared.map((d) => item(d, d.shares[0].role)),
  };
}
