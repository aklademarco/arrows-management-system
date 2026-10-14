"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";

import { ProfileAvatar } from "@/components/profile-avatar";

import {
  removeLeadershipPhoto,
  uploadLeadershipPhoto,
  type ProfileWorkspace,
} from "@/app/leadership-profile-actions";

async function optimizeProfile(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  const bitmap = await createImageBitmap(file);

  const size = Math.min(bitmap.width, bitmap.height);

  const canvas = document.createElement("canvas");

  canvas.width = 640;
  canvas.height = 640;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser cannot process the image.");
  }

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

export function LeadershipProfilePhotoPicker({
  workspace,
  name,
  currentPhoto,
}: {
  workspace: ProfileWorkspace;
  name: string;
  currentPhoto?: string | null;
}) {
  const [preview, setPreview] = useState(currentPhoto ?? null);

  const [message, setMessage] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  const router = useRouter();

  async function choosePhoto(file?: File) {
    if (!file) return;

    try {
      setMessage("Preparing photo…");

      const image = await optimizeProfile(file);

      startTransition(async () => {
        try {
          setMessage("Uploading photo…");

          const url = await uploadLeadershipPhoto(workspace, image);

          setPreview(url);

          setMessage("Profile photo saved.");

          router.refresh();
        } catch {
          setMessage("We couldn't update your profile photo.");
        }
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Photo could not be processed.",
      );
    }
  }

  function removePhoto() {
    startTransition(async () => {
      try {
        setMessage("Removing photo…");

        await removeLeadershipPhoto(workspace);

        setPreview(null);

        setMessage("Profile photo removed.");

        router.refresh();
      } catch {
        setMessage("We couldn't remove your profile photo.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {preview ? (
          <Image
            alt={`${name} profile photo`}
            className="size-28 rounded-full object-cover ring-4 ring-white"
            height={128}
            src={preview}
            unoptimized
            width={128}
          />
        ) : (
          <ProfileAvatar name={name} size="xl" variant="admin" />
        )}

        <label
          aria-label="Change profile photo"
          className="absolute bottom-0 right-0 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-purple-700 text-white shadow-md"
        >
          <FiCamera />

          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={async (event) => {
              await choosePhoto(event.target.files?.[0]);

              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>

      {preview ? (
        <button
          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-red-600"
          disabled={pending}
          onClick={removePhoto}
          type="button"
        >
          <FiTrash2 />
          Remove
        </button>
      ) : null}

      {message ? (
        <p
          className="mt-2 text-center text-sm font-bold text-purple-600"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
