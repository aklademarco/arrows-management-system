export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Runs in the browser: shrinks an image so its longest side is at most
 * `maxSide` pixels and re-encodes it as WebP, returning a data URL.
 */
export async function prepareImage(file: File, maxSide = 1800) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.86);
}
