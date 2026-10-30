import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { IMAGE_URL_PATTERN, imageUrl } from "./images";

type Db = Prisma.TransactionClient;

// Stores an image for a document and returns the URL the document references it by.
export async function storeImage(documentId: string, mimeType: string, data: Uint8Array, db: Db = prisma) {
  const image = await db.image.create({
    data: { documentId, mimeType, size: data.byteLength, data: new Uint8Array(data) },
    select: { id: true },
  });
  return imageUrl(image.id);
}

// Copies the images referenced by `content` into another document and returns
// the content with its image URLs pointing at the copies.
export async function copyImages(content: string, fromDocumentId: string, toDocumentId: string, db: Db) {
  const ids = [...new Set([...content.matchAll(IMAGE_URL_PATTERN)].map((m) => m[1]))];
  const images = await db.image.findMany({ where: { id: { in: ids }, documentId: fromDocumentId } });
  const urls = new Map<string, string>();
  for (const img of images) urls.set(img.id, await storeImage(toDocumentId, img.mimeType, img.data, db));
  return content.replace(IMAGE_URL_PATTERN, (match, id: string) => urls.get(id) ?? match);
}
