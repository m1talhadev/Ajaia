import { describe, expect, it } from "vitest";
import { fileToHtml, ImportError, textToHtml, titleFromFilename } from "@/lib/import";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";

describe("file import", () => {
  it("turns plain text into escaped paragraphs", () => {
    expect(textToHtml("Hello <b>world</b>\r\nline two\n\n\nNext para")).toBe(
      "<p>Hello &lt;b&gt;world&lt;/b&gt;<br>line two</p><p>Next para</p>",
    );
  });

  it("converts markdown formatting to HTML", async () => {
    const { title, html } = await fileToHtml("Notes.md", Buffer.from("# Title\n\n**bold** and *italic*\n\n- one\n- two"));
    expect(title).toBe("Notes");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toMatch(/<ul>\s*<li>one<\/li>/);
  });

  it("rejects unsupported file types and oversized files", async () => {
    await expect(fileToHtml("image.png", Buffer.from("x"))).rejects.toThrow(ImportError);
    await expect(fileToHtml("big.txt", Buffer.alloc(MAX_UPLOAD_BYTES + 1))).rejects.toThrow(/2 MB/);
  });

  it("reports corrupt .docx files as an import error", async () => {
    await expect(fileToHtml("broken.docx", Buffer.from("not a zip"))).rejects.toThrow(ImportError);
  });

  it("derives a title from the filename", () => {
    expect(titleFromFilename("Q3 Plan.DOCX")).toBe("Q3 Plan");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});
