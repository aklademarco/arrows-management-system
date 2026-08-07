"use client";

import { useState, useTransition } from "react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateCoverPhoto } from "../profile-actions";

async function optimizeCover(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const bitmap = await createImageBitmap(file);
  const width = Math.min(1200, bitmap.width);
  const height = Math.round(width * Math.min(bitmap.height / bitmap.width, 0.55));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(320, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot process the image.');
  const sourceHeight = Math.min(bitmap.height, bitmap.width * (canvas.height / canvas.width));
  context.drawImage(bitmap, 0, (bitmap.height - sourceHeight) / 2, bitmap.width, sourceHeight, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.78);
}

export function CoverPhotoPicker({ currentCover }: { currentCover?: string | null }) {
  const [preview, setPreview] = useState(currentCover ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = (value: string | null) => startTransition(async () => {
    try {
      await updateCoverPhoto(value);
      setPreview(value);
      setMessage(value ? 'Cover photo saved.' : 'Cover photo removed.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cover photo could not be saved.');
    }
  });

  return <section className="mt-5 overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-[0_18px_45px_rgba(70,40,100,0.07)]">
    <div className="relative h-48 bg-gradient-to-br from-[#4c1677] to-[#8b3bc0]">
      {preview ? <Image alt="Your cover preview" className="object-cover" fill sizes="(min-width: 768px) 896px, 100vw" src={preview} unoptimized /> : null}
      <div className="absolute inset-0 bg-purple-950/25" />
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-lg"><FiCamera /> {pending ? 'Saving…' : 'Choose cover'}<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending} type="file" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setMessage('Preparing photo…'); save(await optimizeCover(file)); } catch (error) { setMessage(error instanceof Error ? error.message : 'Photo could not be processed.'); } event.target.value = ''; }} /></label>
        {preview ? <button className="inline-flex items-center gap-2 rounded-xl bg-black/55 px-4 py-2 text-sm font-extrabold text-white backdrop-blur" disabled={pending} onClick={() => save(null)} type="button"><FiTrash2 /> Remove</button> : null}
      </div>
    </div>
    <div className="p-5"><h2 className="font-extrabold">Profile cover</h2><p className="mt-1 text-sm text-slate-500">Choose a wide photo. It will be cropped and optimized automatically.</p>{message ? <p className="mt-2 text-sm font-bold text-[#6b21a8]" role="status">{message}</p> : null}</div>
  </section>;
}
