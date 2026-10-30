import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { updateShareSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string; userId: string }>;

// Change a collaborator's role. Owner, or editors when sharing is allowed.
export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await params;
  const doc = await loadDocument(id, user.id, "share");
  const { role } = await parseJson(req, updateShareSchema);
  const { count } = await prisma.documentShare.updateMany({ where: { documentId: doc.id, userId }, data: { role } });
  if (count === 0) throw new HttpError(404, "This person doesn't have access");
  return NextResponse.json({ userId, role });
});

// Remove a collaborator's access. Owner, or editors when sharing is allowed.
export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await params;
  const doc = await loadDocument(id, user.id, "share");
  await prisma.documentShare.deleteMany({ where: { documentId: doc.id, userId } });
  return NextResponse.json({ ok: true });
});
