import { describe, expect, it } from "vitest";
import { detectImageType } from "@/lib/images";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("image type detection", () => {
  it("recognises PNG, JPEG, GIF and WebP by their signatures", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("image/gif");
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
  });

  it("rejects SVG and other files regardless of their claimed type", () => {
    expect(detectImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("hello"))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
