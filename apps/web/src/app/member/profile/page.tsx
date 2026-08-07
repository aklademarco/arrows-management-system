import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMail, FiPhone } from "react-icons/fi";
import { getMemberProfile } from "../member-api";
import { updateOwnProfile } from "../profile-actions";
import type { MemberProfile } from "../member-types";
import { ProfilePhotoPicker } from "./profile-photo-picker";
import { CoverPhotoPicker } from "./cover-photo-picker";

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [member, parameters] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    searchParams,
  ]);
  const memberName = `${member.firstName} ${member.lastName}`;

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#6b21a8] hover:text-[#240046]"
          href="/member"
        >
          <FiArrowLeft aria-hidden="true" /> Back to dashboard
        </Link>
        <header className="mt-6">
          <p className="text-sm font-extrabold text-[#6b21a8]">
            Account settings
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Make your profile yours.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Keep your details recognizable and current for leaders and
            administrators.
          </p>
        </header>

        {parameters.updated === "1" ? (
          <p
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-extrabold text-emerald-800"
            role="status"
          >
            <FiCheckCircle aria-hidden="true" /> Profile updated successfully.
          </p>
        ) : null}

        <CoverPhotoPicker currentCover={member.coverPhotoUrl}>
          <ProfilePhotoPicker
            compact
            currentPhoto={member.profilePhotoUrl}
            name={memberName}
          />
        </CoverPhotoPicker>

        <form
          action={updateOwnProfile}
          className="mt-5 grid gap-6 rounded-[2rem] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(70,40,100,0.07)] sm:p-8"
        >
          <div>
            <p className="text-sm font-extrabold text-[#6b21a8]">
              Personal details
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
              The basics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your email address remains managed by your church account.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label
              className="grid gap-2 text-sm font-extrabold"
              htmlFor="firstName"
            >
              First name
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-medium outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
                defaultValue={member.firstName}
                id="firstName"
                name="firstName"
                required
              />
            </label>
            <label
              className="grid gap-2 text-sm font-extrabold"
              htmlFor="lastName"
            >
              Last name
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-medium outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
                defaultValue={member.lastName}
                id="lastName"
                name="lastName"
                required
              />
            </label>
          </div>
          <label
            className="grid gap-2 text-sm font-extrabold"
            htmlFor="otherNames"
          >
            Other names
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-medium outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
              defaultValue={member.otherNames ?? ""}
              id="otherNames"
              name="otherNames"
            />
          </label>
          <label className="grid gap-2 text-sm font-extrabold" htmlFor="email">
            Email address
            <div className="relative">
              <FiMail
                aria-hidden="true"
                className="absolute left-4 top-4 text-slate-400"
              />
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 font-medium text-slate-500"
                defaultValue={member.email}
                id="email"
                readOnly
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-extrabold" htmlFor="phone">
            Phone number
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-medium outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
              defaultValue={member.phone ?? ""}
              id="phone"
              name="phone"
              placeholder="+233240000000"
              type="tel"
            />
          </label>
          <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <FiPhone aria-hidden="true" /> Use international phone format.
            </p>
            <button
              className="h-12 rounded-2xl bg-[#6b21a8] px-6 font-extrabold text-white shadow-[0_8px_20px_rgba(107,33,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#581b89]"
              type="submit"
            >
              Save profile
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
