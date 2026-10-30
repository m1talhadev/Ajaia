import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { accessSettingsSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

// General access (Restricted / Anyone with the link + role) can be changed by
// anyone allowed to share; the share settings themselves are owner-only.
export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const data = await parseJson(req, accessSettingsSchema);
  const changesSettings = data.editorsCanShare !== undefined || data.viewersCanCopy !== undefined;
  const doc = await loadDocument((await params).id, user.id, changesSettings ? "manage" : "share");
  const updated = await prisma.document.update({
    where: { id: doc.id },
    data,
    select: { linkAccess: true, linkRole: true, editorsCanShare: true, viewersCanCopy: true },
  });
  return NextResponse.json(updated);
});
