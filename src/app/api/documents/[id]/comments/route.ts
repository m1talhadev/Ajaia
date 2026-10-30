import { NextResponse } from "next/server";
import { listThreads, loadThread } from "@/lib/comments";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { createCommentSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

// Comments are visible to people who can comment; viewers don't see them, as in Google Docs.
export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "comment");
  return NextResponse.json(await listThreads(doc.id));
});

// Start a thread on selected text, or reply to one (`parentId`). Replying reopens a resolved thread.
export const POST = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "comment");
  const { body, quote, parentId } = await parseJson(req, createCommentSchema);
  if (parentId) {
    const parent = await prisma.comment.findFirst({ where: { id: parentId, documentId: doc.id, parentId: null } });
    if (!parent) throw new HttpError(404, "Comment not found");
    if (parent.resolved) await prisma.comment.update({ where: { id: parent.id }, data: { resolved: false } });
  }
  const comment = await prisma.comment.create({
    data: { documentId: doc.id, authorId: user.id, body, quote: parentId ? "" : quote, parentId },
    select: { id: true },
  });
  return NextResponse.json(await loadThread(parentId ?? comment.id), { status: 201 });
});
