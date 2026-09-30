/* =============================================================================
   QR Code Image Render Endpoint — GET /api/qrcode
   -----------------------------------------------------------------------------
   Renders a scannable QR code that encodes the SEMEK verification deep-link
   for the provided verification code. Outputs either a PNG (binary) or SVG
   (text) image so it can be embedded directly on packaging or labels.

   Authorization: PUBLIC (unauthenticated). The QR encodes a deep link that
   itself resolves against /verify, which runs the real authorization checks.
   ============================================================================= */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRBuffer, generateQRSvg } from "@/lib/qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_SIZE = 64;
const MAX_SIZE = 1024;
const DEFAULT_SIZE = 256;
const MAX_CODE_LEN = 128;

function clampSize(raw: string | null): number {
  if (!raw) return DEFAULT_SIZE;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return DEFAULT_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
}

type Format = "png" | "svg";
function parseFormat(raw: string | null): Format {
  if (!raw) return "png";
  const lowered = raw.trim().toLowerCase();
  if (lowered === "svg") return "svg";
  return "png";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();
    const format = parseFormat(searchParams.get("format"));
    const size = clampSize(searchParams.get("size"));

    /* ---------------- Input validation ---------------- */
    if (!code) {
      return NextResponse.json(
        { error: "Query parameter `code` is required." },
        { status: 400 },
      );
    }
    if (code.length > MAX_CODE_LEN) {
      return NextResponse.json(
        {
          error: `Verification code is too long (max ${MAX_CODE_LEN} characters).`,
        },
        { status: 400 },
      );
    }
    // Reject obviously invalid characters to avoid junk QRs / injection.
    if (!/^[A-Za-z0-9\-_]+$/.test(code)) {
      return NextResponse.json(
        { error: "Verification code contains invalid characters." },
        { status: 400 },
      );
    }

    /* ---------------- Optional DB lookup ---------------- */
    // We require the code to exist before rendering so that callers can
    // be confident the QR points to a real record. Missing codes return
    // 404 JSON instead of a useless image.
    const existing = await prisma.qRCode.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Unknown verification code — no QR rendered." },
        { status: 404 },
      );
    }

    /* ---------------- Render and respond ---------------- */
    if (format === "svg") {
      const svg = await generateQRSvg(code, size);
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const buffer = await generateQRBuffer(code, size);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[API /api/qrcode]", err);
    return NextResponse.json(
      { error: "Could not render QR code. Please try again in a moment." },
      { status: 500 },
    );
  }
}
