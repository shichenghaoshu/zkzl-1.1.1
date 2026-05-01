const darkCells = new Set([
  0, 1, 2, 6, 7, 8, 9, 13, 17, 18, 20, 24, 26, 27, 28, 29, 33, 35, 37, 39, 40,
  41, 43, 45, 47, 48, 50, 52, 53, 54, 56, 60, 62, 63, 64, 65, 69, 71, 72, 73,
  74, 78, 79, 80
]);

export function QRCodeMock() {
  return (
    <div className="qr-grid" aria-label="模拟二维码">
      {Array.from({ length: 81 }, (_, index) => (
        <span
          className={["qr-cell", darkCells.has(index) ? "" : "light"].join(" ")}
          key={index}
        />
      ))}
    </div>
  );
}
