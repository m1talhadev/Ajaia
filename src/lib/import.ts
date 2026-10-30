import mammoth from "mammoth";
import { marked } from "marked";
import { escapeHtml } from "./html";
import { detectImageType } from "./images";
import { markdownMathToHtml } from "./math";
import { IMPORT_EXTENSIONS, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./uploads";

export class ImportError extends Error {}

function extensionOf(filename: string) {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function textToHtml(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== "")
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function titleFromFilename(filename: string) {
  const ext = extensionOf(filename);
  const base = ext ? filename.slice(0, -ext.length) : filename;
  return base.trim().slice(0, 200) || "Imported document";
}

// Persists an image embedded in an imported file and returns the URL to reference it by.
export type SaveImage = (mimeType: string, data: Buffer) => Promise<string>;

// Converts an uploaded file into editor HTML. The result is only ever loaded
// through the TipTap schema, which drops anything it doesn't recognise.
export async function fileToHtml(
  filename: string,
  data: Buffer,
  saveImage?: SaveImage,
): Promise<{ title: string; html: string }> {
  if (data.byteLength > MAX_UPLOAD_BYTES) throw new ImportError(`File is larger than ${MAX_UPLOAD_LABEL}`);
  const ext = extensionOf(filename);
  let html: string;
  switch (ext) {
    case ".txt":
      html = textToHtml(data.toString("utf8"));
      break;
    case ".md":
      html = await marked.parse(markdownMathToHtml(data.toString("utf8")));
      break;
    case ".docx":
      try {
        const convertImage = mammoth.images.imgElement(async (image) => {
          const bytes = await image.readAsBuffer();
          const type = detectImageType(bytes);
          // Unsupported or skipped images are dropped rather than inlined as base64.
          return { src: type && saveImage ? await saveImage(type, bytes) : "" };
        });
        html = (await mammoth.convertToHtml({ buffer: data }, { convertImage })).value.replace(/<img src=""[^>]*>/g, "");
      } catch {
        throw new ImportError("Could not read this .docx file");
      }
      break;
    default:
      throw new ImportError(`Unsupported file type. Supported: ${IMPORT_EXTENSIONS.join(", ")}`);
  }
  return { title: titleFromFilename(filename), html };
}
