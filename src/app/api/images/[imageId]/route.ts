import { prisma } from "@/lib/db";
import { loadDocument } from "@/lib/documents";
import { HttpError, requireUser, route, type RouteContext } from "@/lib/http";

type Ctx = RouteContext<{ imageId: string }>;

// Images are only served to users who can view the document they belong to.
export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const image = await prisma.image.findUnique({ where: { id: (await params).imageId } });
  if (!image) throw new HttpError(404, "Image not found");
  await loadDocument(image.documentId, user.id, "view");
  return new Response(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
