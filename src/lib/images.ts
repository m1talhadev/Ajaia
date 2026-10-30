import type { ImageType } from "./uploads";

// Identifies an image from its leading bytes rather than the client-supplied MIME type.
export function detectImageType(data: Uint8Array): ImageType | null {
  const starts = (...bytes: number[]) => bytes.every((b, i) => data[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

export const imageUrl = (id: string) => `/api/images/${id}`;

// Matches image URLs in stored document HTML; group 1 is the image id.
export const IMAGE_URL_PATTERN = /\/api\/images\/(\w+)/g;
