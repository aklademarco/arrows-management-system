import Link from "next/link";
import {
  FiClock,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiUserCheck,
} from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getAdminResource } from "../registrations/admin-api";
import { recordPastoralFollowUp } from "./actions";

type FollowUp = {
  id: string;
  method: string;
  outcome: string;
  notes: string | null;
  contactedAt: string;
  nextFollowUpOn: string | null;
  contactedByEmail: string;
};

type CareCandidate = {
  memberId: string;
  displayName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  absenceCount: number;
  lastMissedAt: string;
  careStatus:
    | "NEEDS_CONTACT"
    | "FOLLOW_UP_DUE"
    | "FOLLOW_UP_SCHEDULED"
    | "CONTACTED"
    | "CARE_COMPLETED";
  missedEvents: { id: string; name: string; startsAt: string }[];
  followUps: FollowUp[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusStyle(status: CareCandidate["careStatus"]) {
  if (status === "CARE_COMPLETED")
    return "border-emerald-400/20 bg-emerald-50 text-emerald-700";
  if (status === "FOLLOW_UP_DUE")
    return "border-rose-400/20 bg-rose-50 text-rose-700";
  if (status === "FOLLOW_UP_SCHEDULED")
    return "border-sky-400/20 bg-sky-400/10 text-sky-700";
  if (status === "CONTACTED")
    return "border-[#d4dcdd] bg-[#e4eaea] text-slate-700";
  return "border-amber-400/20 bg-amber-50 text-amber-800";
}

export default async function PastoralCarePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "attention" } = await searchParams;
  const candidates = await getAdminResource<CareCandidate[]>(
    "/pastoral-care/queue",
  );
  const attentionStatuses = new Set(["NEEDS_CONTACT", "FOLLOW_UP_DUE"]);
  const visibleCandidates = candidates.filter((member) => {
    if (view === "all") return true;
    if (view === "scheduled")
      return member.careStatus === "FOLLOW_UP_SCHEDULED";
    if (view === "completed") return member.careStatus === "CARE_COMPLETED";
    return attentionStatuses.has(member.careStatus);
  });
  const awaitingContact = candidates.filter(
    (member) => member.careStatus === "NEEDS_CONTACT",
  ).length;
  const due = candidates.filter(
    (member) => member.careStatus === "FOLLOW_UP_DUE",
  ).length;
  const tabs = [
    {
      value: "attention",
      label: "Needs attention",
      count: awaitingContact + due,
    },
    {
      value: "scheduled",
      label: "Scheduled",
      count: candidates.filter(
        (member) => member.careStatus === "FOLLOW_UP_SCHEDULED",
      ).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: candidates.filter(
        (member) => member.careStatus === "CARE_COMPLETED",
      ).length,
    },
    { value: "all", label: "All", count: candidates.length },
  ];

  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-10 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[#dce3e4] pb-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#527193]">
              Member care
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Pastoral follow-up
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Privately check on members with two or more unexcused absences
              during the last 90 days.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-violet-400/20 bg-[#e1eafa] px-4 py-2.5 text-sm font-semibold text-[#426b9f]">
            <FiHeart aria-hidden="true" /> {awaitingContact} awaiting first
            contact
          </div>
        </header>

        <nav
          aria-label="Care queue filters"
          className="mt-6 flex gap-2 overflow-x-auto rounded-xl border border-[#dce3e4] bg-white/70 p-2"
        >
          {tabs.map((tab) => (
            <Link
              aria-current={view === tab.value ? "page" : undefined}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === tab.value ? "bg-[#242929] text-white" : "text-slate-600 hover:bg-[#e4eaea] hover:text-slate-950"}`}
              href={`/admin/pastoral-care?view=${tab.value}`}
              key={tab.value}
            >
              {tab.label} <span className="ml-1 opacity-70">{tab.count}</span>
            </Link>
          ))}
        </nav>

        {visibleCandidates.length === 0 ? (
          <section className="mt-8 grid min-h-80 place-items-center rounded-xl border border-dashed border-[#d4dcdd] bg-white/70 text-center">
            <div>
              <FiUserCheck className="mx-auto text-5xl text-emerald-700" />
              <h2 className="mt-4 text-xl font-bold">Nothing in this view</h2>
              <p className="mt-2 text-sm text-slate-600">
                Choose another care filter to review other members.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {visibleCandidates.map((member) => {
              const latest = member.followUps[0];
              return (
                <article
                  className="overflow-hidden rounded-[1.5rem] border border-[#dce3e4] bg-white/70"
                  key={member.memberId}
                >
                  <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
                    <div>
                      <div className="flex items-start gap-4">
                        <ProfileAvatar
                          imageUrl={member.profilePhotoUrl}
                          name={member.displayName}
                          size="lg"
                          variant="admin"
                        />
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold">
                            {member.displayName}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {member.phone ?? member.email}
                          </p>
                          <span className="mt-3 inline-flex rounded-full border border-amber-400/20 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                            {member.absenceCount} absences
                          </span>
                          <span
                            className={`ml-2 mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(member.careStatus)}`}
                          >
                            {member.careStatus.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {member.phone ? (
                          <>
                            <a
                              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#242929] text-white px-4 text-sm font-semibold text-white transition hover:bg-[#3b4545]"
                              href={`tel:${member.phone}`}
                            >
                              <FiPhone aria-hidden="true" /> Call member
                            </a>
                            <a
                              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4dcdd] px-4 text-sm font-semibold text-slate-800 transition hover:bg-[#e4eaea]"
                              href={`sms:${member.phone}`}
                            >
                              <FiMessageCircle aria-hidden="true" /> Send SMS
                            </a>
                          </>
                        ) : (
                          <a
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4dcdd] px-4 text-sm font-semibold text-slate-800 transition hover:bg-[#e4eaea]"
                            href={`mailto:${member.email}`}
                          >
                            <FiMail aria-hidden="true" /> Email member
                          </a>
                        )}
                        <Link
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4dcdd] px-4 text-sm font-semibold text-slate-800 transition hover:bg-[#e4eaea]"
                          href={`/admin/members/${member.memberId}`}
                        >
                          View profile
                        </Link>
                      </div>
                      <div className="mt-5 border-t border-[#e1e7e8] pt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Recently missed
                        </p>
                        <div className="mt-3 grid gap-2">
                          {member.missedEvents.map((event) => (
                            <div
                              className="flex flex-wrap items-center justify-between gap-3 text-sm"
                              key={event.id}
                            >
                              <span className="truncate text-slate-700">
                                {event.name}
                              </span>
                              <span className="shrink-0 text-xs text-slate-500">
                                {dateFormatter.format(new Date(event.startsAt))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {latest ? (
                        <div className="mt-5 rounded-lg bg-white/[0.04] p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                            Latest follow-up
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {latest.method.replaceAll("_", " ")} ·{" "}
                            {latest.outcome.replaceAll("_", " ")}
                          </p>
                          {latest.notes ? (
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {latest.notes}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-500">
                            Recorded{" "}
                            {dateFormatter.format(new Date(latest.contactedAt))}{" "}
                            by {latest.contactedByEmail}
                          </p>
                        </div>
                      ) : null}
                      {member.followUps.length > 1 ? (
                        <details className="group mt-4 rounded-lg border border-[#dce3e4] bg-[#0c0d11]">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-2">
                              <FiClock className="text-[#527193]" /> Complete
                              care history
                            </span>
                            <span className="text-xs text-slate-500">
                              {member.followUps.length} records
                            </span>
                          </summary>
                          <ol className="border-t border-[#e1e7e8] px-4 py-1">
                            {member.followUps.map((followUp, index) => (
                              <li
                                className="relative border-l border-[#dce3e4] py-4 pl-5"
                                key={followUp.id}
                              >
                                <span className="absolute -left-1 top-5 size-2 rounded-full bg-[#3b4545]" />
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {followUp.method.replaceAll("_", " ")} ·{" "}
                                    {followUp.outcome.replaceAll("_", " ")}
                                  </p>
                                  <time
                                    className="text-xs text-slate-500"
                                    dateTime={followUp.contactedAt}
                                  >
                                    {dateFormatter.format(
                                      new Date(followUp.contactedAt),
                                    )}
                                  </time>
                                </div>
                                {followUp.notes ? (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {followUp.notes}
                                  </p>
                                ) : null}
                                <p className="mt-2 text-xs text-slate-500">
                                  By {followUp.contactedByEmail}
                                  {followUp.nextFollowUpOn
                                    ? ` · Next follow-up ${dateFormatter.format(new Date(`${followUp.nextFollowUpOn}T00:00:00Z`))}`
                                    : ""}
                                  {index === 0 ? " · Latest" : ""}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </details>
                      ) : null}
                    </div>

                    <form
                      action={recordPastoralFollowUp}
                      className="rounded-xl border border-[#dce3e4] bg-[#0c0d11] p-5"
                    >
                      <input
                        name="memberId"
                        type="hidden"
                        value={member.memberId}
                      />
                      <h3 className="flex items-center gap-2 font-semibold">
                        <FiMessageCircle className="text-[#527193]" /> Record
                        contact
                      </h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                          Contact method
                          <select
                            className="h-11 rounded-lg border border-[#d4dcdd] bg-white/70 px-3 text-sm text-[#252b2d]"
                            name="method"
                            required
                            defaultValue="CALL"
                          >
                            <option value="CALL">Phone call</option>
                            <option value="MESSAGE">Message</option>
                            <option value="VISIT">Visit</option>
                            <option value="IN_PERSON">In person</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                          Outcome
                          <select
                            className="h-11 rounded-lg border border-[#d4dcdd] bg-white/70 px-3 text-sm text-[#252b2d]"
                            name="outcome"
                            required
                            defaultValue="REACHED"
                          >
                            <option value="REACHED">Reached</option>
                            <option value="NO_RESPONSE">No response</option>
                            <option value="NEEDS_PRAYER">Needs prayer</option>
                            <option value="NEEDS_VISIT">Needs a visit</option>
                            <option value="SICK">Sick</option>
                            <option value="TRAVELLING">Travelling</option>
                            <option value="RETURNING_SOON">
                              Returning soon
                            </option>
                            <option value="CARE_COMPLETED">
                              Care completed
                            </option>
                          </select>
                        </label>
                      </div>
                      <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-600">
                        Private care note
                        <textarea
                          className="min-h-24 rounded-lg border border-[#d4dcdd] bg-white/70 p-3 text-sm text-[#252b2d]"
                          maxLength={2000}
                          name="notes"
                          placeholder="What did the member share, and what support is needed?"
                        />
                      </label>
                      <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-600">
                        Next follow-up date
                        <input
                          className="h-11 rounded-lg border border-[#d4dcdd] bg-white/70 px-3 text-sm text-[#252b2d]"
                          name="nextFollowUpOn"
                          type="date"
                        />
                      </label>
                      <button
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#242929] text-white px-4 font-bold text-white hover:bg-[#3b4545]"
                        type="submit"
                      >
                        <FiPhone /> Save follow-up
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
