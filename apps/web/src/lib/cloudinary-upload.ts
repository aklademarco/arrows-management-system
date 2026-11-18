import { createHash, randomUUID } from "node:crypto";

// Server-only: reads the Cloudinary API secret. Import it from server actions only.

/** Roughly 5 MB of image data once base64-encoded. */
const MAX_DATA_URL_LENGTH = 7_000_000;

const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export type UploadedImage = { url: string; publicId: string };

/**
 * Uploads an image (as a data URL) to Cloudinary with a signed request.
 * Callers must check the user's permission before calling this.
 *
 * The folder is written into the public ID itself so the result is the
 * same whether the Cloudinary account uses fixed or dynamic folders.
 */
export async function uploadImageToCloudinary(input: {
  dataUrl: string;
  folder: string;
  namePrefix: string;
}): Promise<UploadedImage> {
  if (
    input.dataUrl.length > MAX_DATA_URL_LENGTH ||
    !DATA_URL_PATTERN.test(input.dataUrl)
  ) {
    throw new Error("Choose a JPEG, PNG, or WebP image under 5 MB.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary image storage is not configured.");
  }

  const publicId = `${input.folder}/${input.namePrefix}-${randomUUID()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  // Cloudinary signs the parameters sorted alphabetically.
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.set("file", input.dataUrl);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("public_id", publicId);
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const body = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;
  if (!response.ok || !body?.secure_url || body.public_id !== publicId) {
    throw new Error(body?.error?.message ?? "The image could not be uploaded.");
  }
  return { url: body.secure_url, publicId: body.public_id };
}
