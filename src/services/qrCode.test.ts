import { describe, expect, it } from "vitest";
import { createQrSvgMarkup, getQrFilename } from "./qrCode";

describe("qrCode helpers", () => {
  it("creates a downloadable svg qr code for a classroom link", async () => {
    const svg = await createQrSvgMarkup("https://savegpa.online/play?lesson=abc123");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("uses a safe Chinese filename for downloaded classroom qr codes", () => {
    expect(getQrFilename("分数闯关挑战")).toBe("课游AI-分数闯关挑战-课堂二维码.svg");
  });
});
