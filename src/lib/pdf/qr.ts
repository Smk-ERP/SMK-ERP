import QRCode from "qrcode";

/**
 * Generate a data URL containing a PNG QR code for the given payload.
 *
 * Use this server-side (inside an API route) to embed payment / bank
 * QR codes into PDFs via `<Image src={dataUrl} />` in @react-pdf/renderer.
 *
 * Tips:
 * - Keep payload < 200 chars for readable scanning at typical print sizes.
 * - For BCEL / OnePay one-time QR codes, encode the merchant payload string
 *   exactly as the bank gateway returns it.
 * - For a static "scan to pay" code, encode plain text with bank name +
 *   account number + holder.
 */
export async function generateQRDataUrl(payload: string, size = 200): Promise<string | null> {
  if (!payload || !payload.trim()) return null;
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      width: size,
      margin: 1,
      color: { dark: "#0B1F3A", light: "#FFFFFF" }
    });
  } catch (err) {
    console.warn("[qr] generation failed:", err);
    return null;
  }
}
