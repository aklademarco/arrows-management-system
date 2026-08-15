import Image from "next/image";
import { FiMusic } from "react-icons/fi";
import { getLeaderResource } from "../leader-api";
import { SongListForm } from "./song-list-form";
import { FlyerForm } from "../../member/media-hub/flyer-form";
import { updateMinistryWorkStatus } from "../../member/media-hub/actions";
import { AdminActionButton } from "@/components/admin-action-button";

type Song = { id: string; position: number; title: string; musicalKey: string | null; lyrics: string | null; notes: string | null };
type Item = { id: string; type: string; title: string; instructions: string | null; status: string; sentAt: string | null; createdAt: string; attachmentUrl: string | null; songs: Song[] };
type Overview = { canSubmitSongList: boolean; canSubmitFlyer: boolean; canManageMediaWork: boolean; choirDepartment?: { name: string }; mediaDepartment?: { name: string }; items: Item[] };
const formatter = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });

export default async function LeaderMinistryPage() {
  const overview = await getLeaderResource<Overview>("/ministry-content");
  const songLists = overview.items.filter((item) => item.type === "SONG_LIST");
  const flyers = overview.items.filter((item) => item.type === "PUBLICITY_FLYER");
  return <main className="min-h-screen p-4 sm:p-6 xl:p-8"><div className="mx-auto max-w-6xl">
    <header><p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Service preparation</p><h1 className="mt-2 text-3xl font-black tracking-tight">Choir and Media</h1><p className="mt-2 text-sm text-slate-400">Prepare worship material once and keep both teams working from the same list.</p></header>
    {overview.canSubmitSongList ? <div className="mt-7"><SongListForm /></div> : <section className="mt-7 rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5 text-sm text-slate-400">Song-list publishing is available to the assigned Choir or Music leader.</section>}
    {overview.canSubmitFlyer ? <div className="mt-7 text-slate-950"><FlyerForm /></div> : null}
    {flyers.length ? <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-purple-300">Publicity handoff</p><h2 className="mt-1 text-2xl font-black">Announcement flyers</h2></div><span className="text-sm font-bold text-slate-500">{flyers.filter((item) => item.status !== "COMPLETED").length} outstanding</span></div><div className="mt-4 grid gap-4 md:grid-cols-2">{flyers.map((item) => <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#24202e]" key={item.id}>{item.attachmentUrl ? <div className="relative aspect-[16/8] bg-[#17131f]"><Image alt={item.title} className="object-cover" fill sizes="50vw" src={item.attachmentUrl} unoptimized /></div> : null}<div className="p-5"><div className="flex justify-between gap-3"><h3 className="font-black">{item.title}</h3><span className="h-fit rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-black text-purple-200">{item.status}</span></div>{item.instructions ? <p className="mt-2 text-sm text-slate-400">{item.instructions}</p> : null}<MediaAction canManage={overview.canManageMediaWork} item={item} /></div></article>)}</div></section> : null}
    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-purple-300">Published sets</p><h2 className="mt-1 text-2xl font-black">Song lists</h2></div><span className="text-sm font-bold text-slate-500">{songLists.length}</span></div>
      {songLists.length ? <div className="mt-4 space-y-4">{songLists.map((list) => <article className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5 sm:p-6" key={list.id}><div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg font-black">{list.title}</h3><p className="mt-1 text-xs font-bold text-slate-500">{formatter.format(new Date(list.sentAt ?? list.createdAt))}</p></div><span className="h-fit rounded-full bg-lime-300/10 px-3 py-1 text-[10px] font-black text-lime-300">{list.status}</span></div>{list.instructions ? <p className="mt-3 text-sm text-slate-400">{list.instructions}</p> : null}<ol className="mt-5 divide-y divide-white/[0.07]">{list.songs.map((song) => <li className="py-3" key={song.id}><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-purple-500/15 text-xs font-black text-purple-300">{song.position}</span><p className="font-bold">{song.title}</p>{song.musicalKey ? <span className="ml-auto rounded-lg bg-white/5 px-2 py-1 text-xs font-black text-slate-300">Key {song.musicalKey}</span> : null}</div>{song.notes ? <p className="ml-11 mt-1 text-xs text-slate-500">{song.notes}</p> : null}</li>)}</ol></article>)}</div> : <div className="mt-4 grid min-h-56 place-items-center rounded-[1.5rem] border border-dashed border-white/15 bg-[#24202e]"><div className="text-center"><FiMusic className="mx-auto text-4xl text-purple-400" /><p className="mt-3 font-black">No song lists published yet</p></div></div>}
    </section>
  </div></main>;
}

function MediaAction({ canManage, item }: { canManage: boolean; item: Item }) { if (!canManage || !["SENT", "ACKNOWLEDGED"].includes(item.status)) return null; const action = item.status === "SENT" ? "ACKNOWLEDGE" : "COMPLETE"; return <form action={updateMinistryWorkStatus} className="mt-4"><input name="contentId" type="hidden" value={item.id} /><input name="action" type="hidden" value={action} /><AdminActionButton className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white" pendingLabel="Updating…">{action === "ACKNOWLEDGE" ? "Accept work" : "Mark complete"}</AdminActionButton></form>; }
