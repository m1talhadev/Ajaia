import { NextResponse } from "next/server";
import { canShare } from "@/lib/access";
import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { parseJson, requireUser, route, type RouteContext } from "@/lib/http";
import { copyImages } from "@/lib/image-store";
import { copyDocumentSchema } from "@/lib/validation";

// File > Make a copy. The copy belongs to the current user and gets its own
// copies of the images, so it doesn't depend on access to the original.
export const POST = route(async (req: Request, { params }: RouteContext<{ id: string }>) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "copy");
  const { title, shareWithSamePeople } = await parseJson(req, copyDocumentSchema);

  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: { title: title ?? `Copy of ${doc.title}`.slice(0, 200), ownerId: user.id },
      select: { id: true },
    });
    const content = await copyImages(doc.content, doc.id, created.id, tx);
    await tx.document.update({ where: { id: created.id }, data: { content } });

    // "Share it with the same people": collaborators keep their roles and the
    // original owner becomes an editor.
    if (shareWithSamePeople && canShare(doc, user.id)) {
      const people = new Map(doc.shares.map((s) => [s.userId, s.role]));
      if (doc.ownerId !== user.id) people.set(doc.ownerId, "editor");
      people.delete(user.id);
      await tx.documentShare.createMany({
        data: [...people].map(([userId, role]) => ({ documentId: created.id, userId, role })),
      });
    }
    return created;
  });

  return NextResponse.json(copy, { status: 201 });
});
