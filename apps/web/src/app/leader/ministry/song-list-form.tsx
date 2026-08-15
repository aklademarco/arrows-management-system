"use client";

import { useActionState, useState } from "react";
import { FiCheckCircle, FiMusic, FiPlus, FiTrash2 } from "react-icons/fi";
import { publishSongList, type SongListState } from "./actions";

type Song = { title: string; musicalKey: string; lyrics: string; notes: string };
const emptySong = (): Song => ({ title: "", musicalKey: "", lyrics: "", notes: "" });
const initialState: SongListState = { status: "idle", message: "" };

export function SongListForm() {
  const [songs, setSongs] = useState<Song[]>([emptySong()]);
  const [state, action, pending] = useActionState(async (previousState: SongListState, formData: FormData) => {
    const nextState = await publishSongList(previousState, formData);
    if (nextState.status === "success") setSongs([emptySong()]);
    return nextState;
  }, initialState);
  const update = (index: number, field: keyof Song, value: string) => setSongs((current) => current.map((song, songIndex) => songIndex === index ? { ...song, [field]: value } : song));

  return (
    <form action={action} className="rounded-[1.75rem] border border-white/10 bg-[#24202e] p-5 sm:p-6">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-purple-500/15 text-xl text-purple-300"><FiMusic /></span><div><h2 className="font-black">Prepare a service song list</h2><p className="text-sm text-slate-400">Songs remain in this order for Choir and Media.</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-xs font-black text-slate-300">LIST NAME<input className="h-12 rounded-xl border border-white/10 bg-[#17131f] px-4 text-sm text-white outline-none focus:border-purple-500" name="title" placeholder="Sunday worship set" required /></label>
        <label className="grid gap-2 text-xs font-black text-slate-300">GENERAL NOTES<input className="h-12 rounded-xl border border-white/10 bg-[#17131f] px-4 text-sm text-white outline-none focus:border-purple-500" name="instructions" placeholder="Rehearsal or projection notes" /></label>
      </div>
      <input name="songs" type="hidden" value={JSON.stringify(songs)} />
      <div className="mt-6 space-y-4">
        {songs.map((song, index) => (
          <fieldset className="rounded-2xl border border-white/10 bg-[#1d1926] p-4" key={index}>
            <legend className="px-2 text-xs font-black uppercase tracking-wider text-purple-300">{index + 1}. Song</legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <input aria-label={`Song ${index + 1} title`} className="h-11 rounded-xl border border-white/10 bg-[#17131f] px-3 text-sm outline-none focus:border-purple-500" onChange={(event) => update(index, "title", event.target.value)} placeholder="Song title" required value={song.title} />
              <input aria-label={`Song ${index + 1} key`} className="h-11 rounded-xl border border-white/10 bg-[#17131f] px-3 text-sm outline-none focus:border-purple-500" onChange={(event) => update(index, "musicalKey", event.target.value)} placeholder="Key (e.g. G)" value={song.musicalKey} />
              <button aria-label={`Remove song ${index + 1}`} className="grid size-11 place-items-center rounded-xl border border-red-400/20 text-red-300 disabled:opacity-30" disabled={songs.length === 1} onClick={() => setSongs((current) => current.filter((_, songIndex) => songIndex !== index))} type="button"><FiTrash2 /></button>
            </div>
            <textarea aria-label={`Song ${index + 1} lyrics`} className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-[#17131f] p-3 text-sm leading-6 outline-none focus:border-purple-500" onChange={(event) => update(index, "lyrics", event.target.value)} placeholder="Lyrics for projection (optional)" value={song.lyrics} />
            <input aria-label={`Song ${index + 1} notes`} className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#17131f] px-3 text-sm outline-none focus:border-purple-500" onChange={(event) => update(index, "notes", event.target.value)} placeholder="Arrangement, lead singer, or transition notes" value={song.notes} />
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black hover:bg-white/5" disabled={songs.length >= 30} onClick={() => setSongs((current) => [...current, emptySong()])} type="button"><FiPlus /> Add song</button>
        <button className="min-h-11 rounded-xl bg-purple-600 px-6 text-sm font-black transition hover:bg-purple-500 disabled:opacity-60" disabled={pending} type="submit">{pending ? "Publishing…" : "Publish song list"}</button>
      </div>
      {state.message ? <p className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`} role={state.status === "error" ? "alert" : "status"}><FiCheckCircle />{state.message}</p> : null}
    </form>
  );
}
