"use client";

import { useState, useTransition } from "react";
import { FiImage, FiSend } from "react-icons/fi";
import { sendPublicityFlyer } from "./actions";

async function prepareImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP flyer.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process the flyer.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.86);
}

export function FlyerForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form className="rounded-[2rem] border border-purple-200 bg-white p-5 shadow-sm sm:p-7" onSubmit={(event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      if (!file) return setMessage("Choose a flyer image first.");
      startTransition(async () => {
        try {
          setMessage("Preparing and sending flyer…");
          await sendPublicityFlyer({
            title: String(form.get("title") ?? ""),
            instructions: String(form.get("instructions") ?? ""),
            deadlineAt: String(form.get("deadlineAt") ?? ""),
            imageData: await prepareImage(file),
            fileName: file.name,
            mimeType: "image/webp",
          });
          setFile(null);
          formElement.reset();
          setMessage("Flyer sent. Media team members have been notified.");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Flyer could not be sent."); }
      });
    }}>
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-lime-300 text-xl text-[#240046]"><FiImage /></span><div><h2 className="font-black">Send a flyer to Media</h2><p className="text-sm font-medium text-slate-500">The active Media team receives an instant dashboard notification.</p></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Announcement title<input className="min-h-12 rounded-xl border border-slate-200 px-4 font-medium" maxLength={180} name="title" required /></label>
        <label className="grid gap-2 text-sm font-bold">Needed by (optional)<input className="min-h-12 rounded-xl border border-slate-200 px-4 font-medium" name="deadlineAt" type="datetime-local" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Instructions<textarea className="min-h-24 rounded-xl border border-slate-200 p-4 font-medium" maxLength={2000} name="instructions" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Flyer image<input accept="image/jpeg,image/png,image/webp" className="rounded-xl border border-dashed border-purple-300 p-4" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required type="file" /></label>
      </div>
      <button className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#6b21a8] px-5 font-extrabold text-white disabled:opacity-50" disabled={pending} type="submit"><FiSend />{pending ? "Sending…" : "Send to Media"}</button>
      {message && <p className="mt-3 text-sm font-bold text-[#6b21a8]" role="status">{message}</p>}
    </form>
  );
}
