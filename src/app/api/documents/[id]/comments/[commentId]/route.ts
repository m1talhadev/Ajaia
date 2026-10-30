import { NextResponse } from "next/server";
import { canModerateComment } from "@/lib/access";
import { loadThread } from "@/lib/comments";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { updateCommentSchema } from "@/lib/validation";

type Ctx = RouteContext<{ id: string; commentId: string }>;

async function loadComment({ params }: Ctx, userId: string) {
  const { id, commentId } = await params;
  const doc = await loadDocument(id, userId, "comment");
  const comment = await prisma.comment.findFirst({ where: { id: commentId, documentId: doc.id } });
  if (!comment) throw new HttpError(404, "Comment not found");
  return { doc, comment };
}

// Edit the text (author only), or resolve/reopen a thread (author or an editor).
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { doc, comment } = await loadComment(ctx, user.id);
  const { body, resolved } = await parseJson(req, updateCommentSchema);
  if (body !== undefined && comment.authorId !== user.id) throw new HttpError(403, "You can only edit your own comments");
  if (resolved !== undefined) {
    if (comment.parentId) throw new HttpError(400, "Resolve the thread, not a reply");
    if (!canModerateComment(doc, user.id, comment.authorId)) throw new HttpError(403, "You don't have permission to do that");
  }
  await prisma.comment.update({ where: { id: comment.id }, data: { body, resolved } });
  return NextResponse.json(await loadThread(comment.parentId ?? comment.id));
});

// Delete a comment (author or an editor). Deleting a thread removes its replies.
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { doc, comment } = await loadComment(ctx, user.id);
  if (!canModerateComment(doc, user.id, comment.authorId)) throw new HttpError(403, "You don't have permission to do that");
  await prisma.comment.delete({ where: { id: comment.id } });
  return NextResponse.json({ ok: true });
});
