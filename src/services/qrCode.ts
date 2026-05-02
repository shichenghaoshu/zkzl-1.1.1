import QRCode from "qrcode";

export async function createQrSvgMarkup(value: string) {
  return QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF"
    }
  });
}

export function getQrFilename(lessonTitle: string) {
  const safeTitle = lessonTitle.trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 32) || "课堂";
  return `课游AI-${safeTitle}-课堂二维码.svg`;
}

export async function downloadQrSvg(value: string, lessonTitle: string) {
  const svg = await createQrSvgMarkup(value);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getQrFilename(lessonTitle);
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
