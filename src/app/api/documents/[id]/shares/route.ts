import { NextResponse } from "next/server";
import { checkShareTarget } from "@/lib/access";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { userSummarySelect } from "@/lib/users";
import { shareSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

// Add a person with a role. Owner, or editors when sharing is allowed.
export const POST = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "share");
  const { email, role } = await parseJson(req, shareSchema);

  const target = await prisma.user.findUnique({ where: { email }, select: userSummarySelect });
  if (!target) throw new HttpError(404, `No user with email ${email}`);
  const check = checkShareTarget(doc, target.id);
  if (!check.ok) throw new HttpError(check.status, check.error);

  await prisma.documentShare.create({ data: { documentId: doc.id, userId: target.id, role } });
  return NextResponse.json({ ...target, role }, { status: 201 });
});
