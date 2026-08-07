"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { removeMemberPhoto, uploadMemberPhoto } from "../profile-actions";

async function optimizeProfile(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  const bitmap = await createImageBitmap(file),
    size = Math.min(bitmap.width, bitmap.height),
    canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process the image.");
  context.drawImage(
    bitmap,
    (bitmap.width - size) / 2,
    (bitmap.height - size) / 2,
    size,
    size,
    0,
    0,
    640,
    640,
  );
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.82);
}

export function ProfilePhotoPicker({
  name,
  currentPhoto,
}: {
  name: string;
  currentPhoto?: string | null;
}) {
  const [preview, setPreview] = useState(currentPhoto ?? null),
    [message, setMessage] = useState<string | null>(null),
    [pending, startTransition] = useTransition();
  const router = useRouter();
  const upload = (data: string) =>
    startTransition(async () => {
      try {
        setMessage("Uploading to Cloudinary…");
        const url = await uploadMemberPhoto("profile", data);
        setPreview(url);
        setMessage("Profile photo saved.");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Profile photo could not be saved.",
        );
      }
    });
  const remove = () =>
    startTransition(async () => {
      try {
        setMessage("Removing photo…");
        await removeMemberPhoto("profile");
        setPreview(null);
        setMessage("Profile photo removed.");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Profile photo could not be removed.",
        );
      }
    });
  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <div className="relative">
        {preview ? (
          <Image
            alt={`${name} profile photo`}
            className="size-24 rounded-full object-cover ring-4 ring-purple-100"
            height={96}
            src={preview}
            unoptimized
            width={96}
          />
        ) : (
          <ProfileAvatar name={name} size="xl" />
        )}
        <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-white bg-slate-950 text-white">
          <FiCamera />
        </span>
      </div>
      <div className="flex-1">
        <p className="font-extrabold">Profile photo</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Choose a clear square photo. It is cropped automatically and stored
          securely in Cloudinary.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">
            {pending ? "Saving…" : "Choose photo"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={pending}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setMessage("Preparing photo…");
                  upload(await optimizeProfile(file));
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Photo could not be processed.",
                  );
                }
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          {preview ? (
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600"
              disabled={pending}
              onClick={remove}
              type="button"
            >
              <FiTrash2 /> Remove
            </button>
          ) : null}
        </div>
        {message ? (
          <p className="mt-2 text-sm font-bold text-[#6b21a8]" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
