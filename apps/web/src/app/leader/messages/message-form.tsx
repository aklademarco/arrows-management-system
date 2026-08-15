"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiSend, FiUsers } from "react-icons/fi";
import { sendLeadershipMessage, type MessageState } from "./actions";

type Department = { id: string; name: string };
const initialState: MessageState = { status: "idle", message: "" };

export function MessageForm({ canMessageChurch, departments, smsAvailable }: { canMessageChurch: boolean; departments: Department[]; smsAvailable: boolean }) {
  const [audience, setAudience] = useState<"CHURCH" | "DEPARTMENT">(canMessageChurch ? "CHURCH" : "DEPARTMENT");
  const [state, action, pending] = useActionState(sendLeadershipMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  if (!canMessageChurch && departments.length === 0) {
    return <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-slate-900 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-xl text-amber-700"><FiAlertCircle /></span>
        <div><h2 className="font-black">No team assigned yet</h2><p className="mt-1 text-sm leading-6 text-slate-600">Your Messages page is ready, but an administrator must assign you as an active department leader before you can message a team.</p></div>
      </div>
    </section>;
  }
  return <form action={action} className="rounded-[1.75rem] border border-white/10 bg-[#24202e] p-5 sm:p-6" ref={formRef}>
    <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-purple-500/15 text-xl text-purple-300"><FiSend /></span><div><h2 className="font-black">New message</h2><p className="text-sm text-slate-400">This appears immediately in each recipient&apos;s church inbox.</p></div></div>
    <div className="mt-5 grid gap-4">
      {canMessageChurch && departments.length ? <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Audience</legend><div className="grid grid-cols-2 gap-2"><AudienceChoice checked={audience === "CHURCH"} label="Whole church" onChange={() => setAudience("CHURCH")} value="CHURCH" /><AudienceChoice checked={audience === "DEPARTMENT"} label="My teams" onChange={() => setAudience("DEPARTMENT")} value="DEPARTMENT" /></div></fieldset> : <input name="audience" type="hidden" value={audience} />}
      {audience === "DEPARTMENT" ? <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Choose teams</legend><div className="grid gap-2 sm:grid-cols-2">{departments.map((department) => <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#17131f] px-4 text-sm font-bold" key={department.id}><input className="size-4 accent-purple-500" name="departmentIds" type="checkbox" value={department.id} />{department.name}</label>)}</div></fieldset> : null}
      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">Title<input className="h-12 rounded-xl border border-white/10 bg-[#17131f] px-4 text-sm normal-case tracking-normal text-white outline-none focus:border-purple-500" maxLength={180} name="title" placeholder="A clear subject for members" required /></label>
      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">Message<textarea className="min-h-40 rounded-xl border border-white/10 bg-[#17131f] p-4 text-sm normal-case leading-6 tracking-normal text-white outline-none focus:border-purple-500" maxLength={5000} name="body" placeholder="Write your church message…" required /></label>
      {smsAvailable ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#17131f] p-4"><input className="mt-0.5 size-5 accent-purple-500" name="smsRequested" type="checkbox" /><span><span className="block text-sm font-black">Also send by SMS</span><span className="mt-1 block text-xs leading-5 text-slate-500">Only recipients with a phone number will be queued. SMS may use multiple billable segments for long messages.</span></span></label> : <p className="rounded-xl bg-amber-300/10 px-4 py-3 text-xs font-bold leading-5 text-amber-200">SMS is not configured yet. This message will still reach everyone through their dashboard inbox.</p>}
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs text-slate-500"><FiUsers /> The API verifies your audience before delivery.</p><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-6 text-sm font-black transition hover:bg-purple-500 disabled:opacity-60" disabled={pending} type="submit"><FiSend />{pending ? "Sending…" : "Send message"}</button></div>
    {state.message ? <p className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`} role={state.status === "error" ? "alert" : "status"}>{state.status === "success" ? <FiCheckCircle /> : <FiAlertCircle />}{state.message}</p> : null}
  </form>;
}

function AudienceChoice({ checked, label, onChange, value }: { checked: boolean; label: string; onChange: () => void; value: string }) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-black ${checked ? "border-purple-400 bg-purple-500/15 text-purple-200" : "border-white/10 bg-[#17131f] text-slate-400"}`}><input checked={checked} className="accent-purple-500" name="audience" onChange={onChange} type="radio" value={value} />{label}</label>;
}
