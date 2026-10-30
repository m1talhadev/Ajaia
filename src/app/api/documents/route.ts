import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listDocuments } from "@/lib/documents";
import { parseJson, requireUser, route } from "@/lib/http";
import { createDocumentSchema } from "@/lib/validation";

export const GET = route(async () => {
  const user = await requireUser();
  return NextResponse.json(await listDocuments(user.id));
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { title } = await parseJson(req, createDocumentSchema);
  const doc = await prisma.document.create({
    data: { title: title ?? "Untitled document", ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(doc, { status: 201 });
});
