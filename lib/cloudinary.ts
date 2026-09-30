/* =============================================================================
   Cloudinary Image Upload Service — server-only module.
   Provides a typed wrapper around the Cloudinary v2 SDK for uploading product
   and news images. All configuration is read from server-only env vars; the
   secret must NEVER be exposed to the browser.
   ============================================================================= */

import { v2 as cloudinaryV2 } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

const DEFAULT_FOLDER = "semek";
const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB decoded payload cap

let configured = false;
if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinaryV2.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Regex for a valid base64 image data URI prefix.
 * Only permits safe web image formats.
 */
const DATA_URI_RE =
  /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/;

/**
 * Upload a base64 data URI to Cloudinary.
 *
 * Steps:
 * 1. Validates that the input matches an image data URI.
 * 2. Guards against oversized payloads (approximate decoded size check).
 * 3. Uploads to Cloudinary under the specified folder (falls back to `semek/`).
 * 4. Returns the secure URL, public ID, and reported pixel dimensions.
 *
 * Throws an Error with a user-friendly message on invalid input or upload
 * failure; callers decide how to surface this to API responses.
 */
export async function uploadImageFromBase64(
  dataUri: string,
  options?: { folder?: string },
): Promise<CloudinaryUploadResult> {
  if (!configured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server.",
    );
  }
  if (!dataUri || typeof dataUri !== "string") {
    throw new Error("Image data URI is required.");
  }
  const match = dataUri.match(DATA_URI_RE);
  if (!match) {
    throw new Error(
      "Invalid image format. Expected a base64 data URI for PNG, JPEG, WEBP, or GIF.",
    );
  }
  const base64Body = match[2];
  // Approximate decoded size = base64 length * 3 / 4 (minus padding).
  const approxBytes = Math.floor((base64Body.length * 3) / 4);
  if (approxBytes > MAX_BASE64_BYTES) {
    throw new Error("Image too large. Maximum size is 5 MB.");
  }

  const folder = options?.folder?.trim() || DEFAULT_FOLDER;
  try {
    const result = await cloudinaryV2.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: typeof result.width === "number" ? result.width : 0,
      height: typeof result.height === "number" ? result.height : 0,
    };
  } catch (err) {
    console.error("[CLOUDINARY] Upload failed:", err);
    throw new Error(
      err instanceof Error ? err.message : "Image upload failed. Please try again.",
    );
  }
}
