import { put, del } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Image upload rules, shared by the API and referenced by the UI.
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // ~3 MB per image

// Resize down to a sane web size and re-encode to WebP to shrink storage.
// Falls back to the original bytes if sharp is unavailable or errors.
async function compress(
  buffer: Buffer,
  contentType: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(buffer)
      .rotate() // honour EXIF orientation, then strip metadata
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { buffer: out, contentType: "image/webp", ext: ".webp" };
  } catch (e) {
    console.error("Image compression skipped (sharp unavailable):", e);
    return { buffer, contentType, ext: ALLOWED_IMAGE_TYPES[contentType] ?? ".jpg" };
  }
}

/**
 * Stores an uploaded image and returns its public URL.
 * - In production (BLOB_READ_WRITE_TOKEN set): uploads to Vercel Blob.
 * - In local dev without a token: writes to public/uploads so the flow still works.
 */
export async function storeImage(file: File): Promise<string> {
  const original = Buffer.from(await file.arrayBuffer());
  const { buffer, contentType, ext } = await compress(original, file.type);
  const key = `lost-found/${crypto.randomBytes(12).toString("hex")}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Dev fallback — local filesystem (ephemeral; not used on Vercel).
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const localName = key.replace("lost-found/", "");
  await writeFile(path.join(dir, localName), buffer);
  return `/uploads/${localName}`;
}

/** Best-effort deletion of Blob-hosted images. Ignores local-dev paths. */
export async function deleteImages(urls: (string | null | undefined)[]): Promise<void> {
  const blobUrls = urls.filter(
    (u): u is string => typeof u === "string" && u.startsWith("http")
  );
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls);
  } catch (e) {
    console.error("Failed to delete blob images:", e);
  }
}
