import { useEffect, useState } from "react";
import QRCode from "qrcode";

const darkCells = new Set([
  0, 1, 2, 6, 7, 8, 9, 13, 17, 18, 20, 24, 26, 27, 28, 29, 33, 35, 37, 39, 40,
  41, 43, 45, 47, 48, 50, 52, 53, 54, 56, 60, 62, 63, 64, 65, 69, 71, 72, 73,
  74, 78, 79, 80
]);

type QRCodeMockProps = {
  value?: string;
  title?: string;
};

export function QRCodeMock({ value = "https://savegpa.online/student", title = "课堂二维码" }: QRCodeMockProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 168,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF"
      }
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (qrDataUrl) {
    return (
      <div className="rounded-[18px] bg-white p-3 shadow-[inset_0_0_0_2px_rgba(18,32,71,0.08),0_12px_22px_rgba(18,32,71,0.12)]">
        <img src={qrDataUrl} alt={title} className="h-36 w-36 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="qr-grid" aria-label="课堂二维码加载中">
      {Array.from({ length: 81 }, (_, index) => (
        <span
          className={["qr-cell", darkCells.has(index) ? "" : "light"].join(" ")}
          key={index}
        />
      ))}
    </div>
  );
}
