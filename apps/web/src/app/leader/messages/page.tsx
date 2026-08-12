import { FiMessageCircle, FiUsers } from "react-icons/fi";
import { getLeaderResource } from "../leader-api";
import { MessageForm } from "./message-form";

type Context = { canMessageChurch: boolean; departments: { id: string; name: string }[] };
type SentMessage = { id: string; audience: string; title: string; body: string; sentAt: string; recipientCount: number };
const formatter = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });

export default async function LeaderMessagesPage() {
  const [context, sent] = await Promise.all([
    getLeaderResource<Context>("/leadership-messages/compose-context"),
    getLeaderResource<SentMessage[]>("/leadership-messages/sent"),
  ]);
  return <main className="min-h-screen p-4 sm:p-6 xl:p-8"><div className="mx-auto max-w-6xl">
    <header><p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Stay connected</p><h1 className="mt-2 text-3xl font-black tracking-tight">Messages</h1><p className="mt-2 text-sm text-slate-400">Reach people beyond Sunday while keeping ministry boundaries clear.</p></header>
    <div className="mt-7"><MessageForm canMessageChurch={context.canMessageChurch} departments={context.departments} /></div>
    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-purple-300">Delivery history</p><h2 className="mt-1 text-2xl font-black">Sent messages</h2></div><span className="text-sm font-bold text-slate-500">{sent.length}</span></div>
      {sent.length ? <div className="mt-4 space-y-3">{sent.map((message) => <article className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5" key={message.id}><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-500/15 text-purple-300"><FiMessageCircle /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-black">{message.title}</h3><time className="text-xs font-bold text-slate-500">{formatter.format(new Date(message.sentAt))}</time></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">{message.body}</p><p className="mt-3 flex items-center gap-2 text-xs font-bold text-purple-300"><FiUsers /> {message.recipientCount} recipient{message.recipientCount === 1 ? "" : "s"} · {message.audience === "CHURCH" ? "Whole church" : "Department"}</p></div></div></article>)}</div> : <div className="mt-4 grid min-h-52 place-items-center rounded-[1.5rem] border border-dashed border-white/15 bg-[#24202e]"><div className="text-center"><FiMessageCircle className="mx-auto text-4xl text-purple-400" /><p className="mt-3 font-black">No messages sent yet</p></div></div>}
    </section>
  </div></main>;
}
