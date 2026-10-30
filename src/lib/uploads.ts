// Upload limits and accepted formats, shared by the browser file pickers and the API.

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "2 MB";

export const IMPORT_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const IMPORT_ACCEPT = IMPORT_EXTENSIONS.join(",");

// SVG is excluded because it can carry script.
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export type ImageType = (typeof IMAGE_TYPES)[number];
