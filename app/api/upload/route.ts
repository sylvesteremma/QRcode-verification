/* =============================================================================
   Admin Image Upload Endpoint — POST /api/upload
   -----------------------------------------------------------------------------
   Accepts a JSON payload with a base64 image data URI and optional folder,
   uploads the image to Cloudinary (server-side secret auth required), and
   returns the resulting secure URL plus metadata.

   Authorization: requires at least the OPERATIONS role via signed cookie.
   ============================================================================= */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadSchema } from "@/lib/validation";
import { uploadImageFromBase64 } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid upload request." },
        { status: 400 },
      );
    }

    const result = await uploadImageFromBase64(parsed.data.image, {
      folder: parsed.data.folder || undefined,
    });

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      },
      { status: 201 },
    );
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : error.message && (status === 400 || status === 413)
            ? error.message
            : "Failed to upload image. Please try again in a moment.";

    // 413 Payload Too Large for size-related rejections surfaced from lib/cloudinary
    const httpStatus =
      /too large/i.test(message) ? 413 : status;

    return NextResponse.json({ error: message }, { status: httpStatus });
  }
}
