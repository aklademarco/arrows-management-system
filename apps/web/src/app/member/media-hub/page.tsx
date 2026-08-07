import Image from "next/image";
import { FiClock, FiImage } from "react-icons/fi";
import { getMemberResource } from "../member-api";
import { FlyerForm } from "./flyer-form";

type Flyer = { id: string; title: string; instructions: string | null; status: string; deadlineAt: string | null; sentAt: string | null; createdAt: string; attachmentUrl: string; fileName: string };
type Overview = { canSubmitFlyer: boolean; mediaDepartment?: { id: string; name: string }; items: Flyer[] };
const formatter = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });

export default async function MediaHubPage() {
  const overview = await getMemberResource<Overview>("/ministry-content");
  return <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9"><div className="mx-auto max-w-6xl">
    <header><p className="text-sm font-extrabold text-[#6b21a8]">Ministry collaboration</p><h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Media hub</h1><p className="mt-2 text-sm font-medium text-slate-500">One clear handoff from Publicity to the Media team.</p></header>
    {overview.canSubmitFlyer && <div className="mt-7"><FlyerForm /></div>}
    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-sm font-extrabold text-[#6b21a8]">Shared work</p><h2 className="text-2xl font-black">Announcement flyers</h2></div><span className="text-sm font-bold text-slate-400">{overview.items.length} items</span></div>
      {overview.items.length === 0 ? <div className="mt-4 rounded-[2rem] border border-purple-100 bg-white p-12 text-center"><FiImage className="mx-auto text-3xl text-purple-300" /><p className="mt-3 font-black">No flyers shared yet</p></div> : <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{overview.items.map((item) => <article className="overflow-hidden rounded-[1.75rem] border border-purple-100 bg-white shadow-sm" key={item.id}><div className="relative aspect-[4/3] bg-purple-50"><Image alt={item.title} className="object-cover" fill sizes="(max-width: 640px) 100vw, 33vw" src={item.attachmentUrl} unoptimized /></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-black">{item.title}</h3><span className="rounded-full bg-lime-100 px-2 py-1 text-[10px] font-black text-lime-800">{item.status}</span></div>{item.instructions && <p className="mt-2 text-sm leading-6 text-slate-500">{item.instructions}</p>}<p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400"><FiClock />{formatter.format(new Date(item.sentAt ?? item.createdAt))}</p><a className="mt-4 inline-flex text-sm font-extrabold text-[#6b21a8]" href={item.attachmentUrl} rel="noreferrer" target="_blank">Open full flyer →</a></div></article>)}</div>}
    </section>
  </div></main>;
}
