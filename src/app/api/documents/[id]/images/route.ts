import { NextResponse } from "next/server";
import { loadDocument } from "@/lib/documents";
import { HttpError, readUploadedFile, requireUser, route, type RouteContext } from "@/lib/http";
import { storeImage } from "@/lib/image-store";
import { detectImageType } from "@/lib/images";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";

export const POST = route(async (req: Request, { params }: RouteContext<{ id: string }>) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "edit");
  const { data } = await readUploadedFile(req, MAX_UPLOAD_BYTES, `Image is larger than ${MAX_UPLOAD_LABEL}`);
  const mimeType = detectImageType(data);
  if (!mimeType) throw new HttpError(400, "Unsupported image. Use PNG, JPEG, GIF or WebP");
  return NextResponse.json({ url: await storeImage(doc.id, mimeType, data) }, { status: 201 });
});
