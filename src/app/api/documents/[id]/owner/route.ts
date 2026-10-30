import { NextResponse } from "next/server";
import { checkOwnershipTarget } from "@/lib/access";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { transferOwnershipSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

// Transfer ownership to an existing editor. The previous owner stays on the
// document as an editor, as in Google Docs.
export const POST = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "manage");
  const { userId } = await parseJson(req, transferOwnershipSchema);
  const check = checkOwnershipTarget(doc, userId);
  if (!check.ok) throw new HttpError(check.status, check.error);

  await prisma.$transaction([
    prisma.documentShare.delete({ where: { documentId_userId: { documentId: doc.id, userId } } }),
    prisma.document.update({ where: { id: doc.id }, data: { ownerId: userId } }),
    prisma.documentShare.create({ data: { documentId: doc.id, userId: user.id, role: "editor" } }),
  ]);
  return NextResponse.json({ ownerId: userId });
});
