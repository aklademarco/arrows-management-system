"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { FiAlertCircle, FiCamera, FiCheckCircle, FiList } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { generateEventLiturgy } from "./liturgy-actions";

type Template = { id: string; name: string; recurrenceRule: string; items: { id: string }[] };

async function optimize(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 900;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot process the image.');
  const scale = Math.max(900 / bitmap.width, 900 / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (900 - width) / 2, (900 - height) / 2, width, height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.84);
}

export function LiturgyGenerator({ eventId, templates }: { eventId: string; templates: Template[] }) {
  const [imageData, setImageData] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("Generating event schedule…");
    startTransition(async () => {
      try {
        await generateEventLiturgy({ eventId, templateId: String(form.get("templateId") || "") || undefined, preacherName: String(form.get("preacherName") || "") || undefined, sermonTitle: String(form.get("sermonTitle") || "") || undefined, imageData });
        setMessage("Event liturgy generated successfully.");
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Event liturgy could not be generated."); }
    });
  }}>
    <label className="grid gap-1 text-sm font-bold">Schedule template<select className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3 font-normal" name="templateId"><option value="">Choose automatically from event date</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.items.length} items</option>)}</select></label>
    <label className="grid gap-1 text-sm font-bold">Preacher<input className="h-11 rounded-lg border border-white/15 px-3 font-normal" name="preacherName" placeholder="Name of preacher" /></label>
    <label className="grid gap-1 text-sm font-bold md:col-span-2">Sermon title<input className="h-11 rounded-lg border border-white/15 px-3 font-normal" name="sermonTitle" placeholder="Optional sermon title" /></label>
    <div className="md:col-span-2"><p className="text-sm font-bold">Preacher image</p><div className="mt-2 flex items-center gap-4">{imageData ? <Image alt="Preacher preview" className="size-20 rounded-xl object-cover" height={80} src={imageData} unoptimized width={80} /> : <span className="grid size-20 place-items-center rounded-xl border border-dashed border-white/20 text-2xl text-slate-500"><FiCamera /></span>}<label className="cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/5">Choose image<input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (event) => { try { const file = event.target.files?.[0]; if (file) setImageData(await optimize(file)); } catch (error) { setMessage(error instanceof Error ? error.message : "Image could not be processed."); } }} type="file" /></label></div></div>
    <div className="flex flex-wrap items-center gap-4 md:col-span-2"><button className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-5 font-bold text-white disabled:opacity-60" disabled={pending} type="submit"><FiList />{pending ? "Generating…" : "Generate liturgy"}</button>{message ? <p className={`flex items-center gap-2 text-sm font-bold ${message.includes("successfully") ? "text-emerald-300" : message.includes("Generating") ? "text-violet-300" : "text-red-300"}`} role="status">{message.includes("successfully") ? <FiCheckCircle /> : <FiAlertCircle />}{message}</p> : null}</div>
  </form>;
}
