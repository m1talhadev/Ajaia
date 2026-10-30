import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, readUploadedFile, requireUser, route } from "@/lib/http";
import { storeImage } from "@/lib/image-store";
import { fileToHtml, ImportError } from "@/lib/import";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const file = await readUploadedFile(req, MAX_UPLOAD_BYTES, `File is larger than ${MAX_UPLOAD_LABEL}`);

  try {
    // The document is created first so images embedded in a .docx can be
    // attached to it; any failure rolls the whole import back.
    const doc = await prisma.$transaction(
      async (tx) => {
        const doc = await tx.document.create({ data: { title: file.name, ownerId: user.id }, select: { id: true } });
        const { title, html } = await fileToHtml(file.name, file.data, (mimeType, bytes) => storeImage(doc.id, mimeType, bytes, tx));
        await tx.document.update({ where: { id: doc.id }, data: { title, content: html } });
        return doc;
      },
      { timeout: 20_000 },
    );
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof ImportError) throw new HttpError(400, err.message);
    throw err;
  }
});
