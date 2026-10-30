import { describe, expect, it } from "vitest";
import { markdownMathToHtml, normalizeChemLatex } from "@/lib/math";
import { fileToHtml } from "@/lib/import";

describe("chemical equation normalisation", () => {
  it("converts MathLive arrows to mhchem and wraps in \\ce{}", () => {
    expect(normalizeChemLatex("2H_2+O_2\\longrightarrow2H_2O")).toBe("\\ce{2H_2+O_2 -> 2H_2O}");
    expect(normalizeChemLatex("A\\rightleftharpoons B")).toBe("\\ce{A <=> B}");
    expect(normalizeChemLatex("A\\longleftarrow B")).toBe("\\ce{A <- B}");
  });

  it("keeps an existing \\ce{} wrapper and rejects empty input", () => {
    expect(normalizeChemLatex("\\ce{H2O}")).toBe("\\ce{H2O}");
    expect(normalizeChemLatex("#?")).toBeNull();
    expect(normalizeChemLatex("\\ce{}")).toBeNull();
  });
});

describe("markdown math import", () => {
  it("turns $...$ and ```math fences into math nodes", () => {
    const html = markdownMathToHtml("Energy $E=mc^2$ here\n\n```math\n\\frac{a}{b}\n```\n");
    expect(html).toContain('<span data-inline-math="" data-latex="E=mc^2"></span>');
    expect(html).toContain('<div data-math-block="" data-latex="\\frac{a}{b}"></div>');
  });

  it("leaves code untouched and escapes attribute content", () => {
    expect(markdownMathToHtml("`$x$` and ```js\nconst a = '$b$'\n```")).toBe("`$x$` and ```js\nconst a = '$b$'\n```");
    expect(markdownMathToHtml('$a<"b"$')).toBe('<span data-inline-math="" data-latex="a&lt;&quot;b&quot;"></span>');
  });

  it("survives Markdown parsing without mangling the LaTeX", async () => {
    const { html } = await fileToHtml("m.md", Buffer.from("Sum $x_1 + y_1$ and *text*"));
    expect(html).toContain('data-latex="x_1 + y_1"');
    expect(html).toContain("<em>text</em>");
  });
});
