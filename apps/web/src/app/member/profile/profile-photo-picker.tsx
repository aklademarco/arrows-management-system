"use client";

import { useEffect, useState } from "react";
import { FiCamera } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";

export function ProfilePhotoPicker({ name }: { name: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
      <div className="relative">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Selected profile preview" className="size-24 rounded-full object-cover ring-4 ring-purple-100" src={previewUrl} />
        ) : (
          <ProfileAvatar name={name} size="xl" />
        )}
        <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-white bg-slate-950 text-white">
          <FiCamera aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="font-extrabold text-slate-950">Profile photo</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Choose a photo to preview your future member avatar. Saving image uploads will be connected when profile media storage is available.</p>
        <label className="mt-3 inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          Choose photo
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(URL.createObjectURL(file));
            }}
            type="file"
          />
        </label>
      </div>
    </div>
  );
}
