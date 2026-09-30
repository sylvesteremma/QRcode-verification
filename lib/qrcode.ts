/* =============================================================================
   QR Code Generation Helpers — safe for server-side use only.
   Produces either a PNG data URL (ready for inline <img src=...>) or a raw
   SVG string. Every QR encodes the public verification deep-link so that
   consumers scanning with a generic camera app are taken straight to the
   verify page.
   ============================================================================= */

import QRCode from "qrcode";
import { appConfig } from "@/lib/config";

const MIN_SIZE = 64;
const MAX_SIZE = 1024;
const DEFAULT_SIZE = 256;

/**
 * Clamp a requested pixel size between MIN_SIZE and MAX_SIZE.
 * Also protects against NaN / non-number inputs by falling back to the
 * default size.
 */
function clampSize(requested: number | undefined | null): number {
  if (typeof requested !== "number" || Number.isNaN(requested)) {
    return DEFAULT_SIZE;
  }
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(requested)));
}

/**
 * Build the verification deep-link that will be encoded inside the QR code.
 * The QR scanner / camera app opens this URL on the user's device which then
 * runs through /verify?code=... automatically.
 */
function buildVerificationUrl(code: string): string {
  const base = appConfig.appUrl.replace(/\/+$/, "");
  const encoded = encodeURIComponent(code);
  return `${base}/verify?code=${encoded}`;
}

/**
 * Generate a QR code and return it as a PNG data URL (base64).
 * The returned string is ready to drop into an <img src="..."> on the client.
 *
 * @param code  The SEMEK verification code (e.g. "SMK-ABC123...")
 * @param size  Optional pixel width/height. Defaults to 256. Clamped 64..1024.
 */
export async function generateQRDataUrl(
  code: string,
  size?: number,
): Promise<string> {
  const pixelSize = clampSize(size);
  const content = buildVerificationUrl(code);
  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: pixelSize,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error(`[QRCODE] Failed to render PNG data URL for "${code}":`, err);
    throw new Error("Could not generate QR code image.");
  }
}

/**
 * Generate a QR code and return it as a standalone SVG string.
 * The SVG can be served directly as `image/svg+xml` or embedded in HTML.
 *
 * @param code  The SEMEK verification code.
 * @param size  Optional pixel width/height. Defaults to 256. Clamped 64..1024.
 */
export async function generateQRSvg(
  code: string,
  size?: number,
): Promise<string> {
  const pixelSize = clampSize(size);
  const content = buildVerificationUrl(code);
  try {
    const raw = await QRCode.toString(content, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      width: pixelSize,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    // qrcode@latest returns the full <?xml ...?><svg>...</svg> document.
    // Strip standalone XML declaration if present so embedders can also drop
    // this straight into an HTML context without warnings.
    return raw.replace(/^<\?xml[^>]*\?>\s*/i, "");
  } catch (err) {
    console.error(`[QRCODE] Failed to render SVG for "${code}":`, err);
    throw new Error("Could not generate QR code SVG.");
  }
}

/**
 * Low-level helper that returns a raw PNG Buffer.
 * Used by the /api/qrcode endpoint when it wants to stream binary bytes
 * directly with `Content-Type: image/png`.
 *
 * @param code  The SEMEK verification code.
 * @param size  Optional pixel width/height. Defaults to 256. Clamped 64..1024.
 */
export async function generateQRBuffer(
  code: string,
  size?: number,
): Promise<Buffer> {
  const pixelSize = clampSize(size);
  const content = buildVerificationUrl(code);
  try {
    return await QRCode.toBuffer(content, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: pixelSize,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error(`[QRCODE] Failed to render PNG buffer for "${code}":`, err);
    throw new Error("Could not generate QR code image.");
  }
}
