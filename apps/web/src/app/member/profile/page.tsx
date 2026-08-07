import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { getMemberProfile } from "../member-api";
import { updateOwnProfile } from "../profile-actions";
import type { MemberProfile } from "../member-types";

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [member, parameters] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    searchParams,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#6b21a8] hover:text-[#240046]" href="/member">
          <FiArrowLeft aria-hidden="true" /> Back to dashboard
        </Link>
        <header className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">Account settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">My profile</h1>
          <p className="mt-2 text-slate-600">Keep your contact details current so church administrators can reach you.</p>
        </header>

        {parameters.updated === "1" ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800" role="status">
            <FiCheckCircle aria-hidden="true" /> Profile updated successfully.
          </p>
        ) : null}

        <form action={updateOwnProfile} className="mt-8 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <span className="grid size-12 place-items-center rounded-full bg-purple-50 text-xl text-[#6b21a8]"><FiUser aria-hidden="true" /></span>
            <div>
              <h2 className="font-bold">Personal details</h2>
              <p className="text-sm text-slate-500">Your email address is managed by the church account.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold" htmlFor="firstName">First name<input className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]" defaultValue={member.firstName} id="firstName" name="firstName" required /></label>
            <label className="grid gap-2 text-sm font-semibold" htmlFor="lastName">Last name<input className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]" defaultValue={member.lastName} id="lastName" name="lastName" required /></label>
          </div>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="otherNames">Other names<input className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]" defaultValue={member.otherNames ?? ""} id="otherNames" name="otherNames" /></label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="email">Email address<div className="relative"><FiMail aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" /><input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-normal text-slate-500" defaultValue={member.email} id="email" readOnly /></div></label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="phone">Phone number<input className="h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]" defaultValue={member.phone ?? ""} id="phone" name="phone" placeholder="+233240000000" type="tel" /></label>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <p className="inline-flex items-center gap-2 text-sm text-slate-500"><FiPhone aria-hidden="true" /> Phone uses international format.</p>
            <button className="h-11 rounded-xl bg-[#240046] px-5 font-bold text-white transition hover:bg-[#17002e]" type="submit">Save changes</button>
          </div>
        </form>
      </div>
    </main>
  );
}
