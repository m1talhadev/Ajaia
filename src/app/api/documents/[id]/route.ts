import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadDocument, type SaveConflict, serializeDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { updateDocumentSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "view");
  return NextResponse.json(serializeDocument(doc, user.id));
});

// A save applies only on top of the revision the client last saw. If someone
// else saved in between, it is rejected with 409 rather than overwriting them.
export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "edit");
  const { baseRevision, ...data } = await parseJson(req, updateDocumentSchema);
  const { count } = await prisma.document.updateMany({
    where: { id: doc.id, revision: baseRevision },
    data: { ...data, revision: { increment: 1 }, lastEditedById: user.id },
  });
  if (count === 0) {
    const current = await loadDocument(doc.id, user.id, "edit");
    const editedBy = current.lastEditedBy?.name ?? "Someone";
    const conflict: Omit<SaveConflict, "error"> = { revision: current.revision, editedBy };
    throw new HttpError(409, `${editedBy} edited this document while you were making changes.`, conflict);
  }
  return NextResponse.json({ revision: baseRevision + 1 });
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "manage");
  await prisma.document.delete({ where: { id: doc.id } });
  return NextResponse.json({ ok: true });
});
