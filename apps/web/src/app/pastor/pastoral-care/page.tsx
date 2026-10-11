import Link from "next/link";
import { FiHeart, FiMessageCircle, FiPhone, FiUser } from "react-icons/fi";

import { AdminActionButton } from "@/components/admin-action-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getPastorResource } from "../pastor-api";
import {
  recordPastorFollowUp,
  updatePastoralRequestStatus,
} from "./actions";

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
  careStatus:
    | "NEEDS_CONTACT"
    | "FOLLOW_UP_DUE"
    | "FOLLOW_UP_SCHEDULED"
    | "CONTACTED"
    | "CARE_COMPLETED";
  followUps: FollowUp[];
};

type CareRequest = {
  id: string;
  memberId: string;
  type: "MESSAGE" | "PRAYER_REQUEST";
  subject: string;
  body: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
  handledAt: string | null;
  createdAt: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  email: string;
  phone: string | null;
};

const submittedAtFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function PastorCarePage() {
  const [members, requests] = await Promise.all([
    getPastorResource<CareCandidate[]>("/pastoral-care/queue"),
    getPastorResource<CareRequest[]>("/pastoral-care/requests/inbox"),
  ]);
  const openRequests = requests.filter(
    (request) => request.status !== "RESOLVED",
  );

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
            Member care
          </p>

          <h1 className="mt-2 text-3xl font-black">Pastoral Care</h1>

          <p className="mt-2 text-sm text-slate-500">
            Respond to private requests and members needing pastoral follow-up.
          </p>
        </header>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">
                Private inbox
              </p>
              <h2 className="mt-1 text-2xl font-black">Member requests</h2>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
              {openRequests.length} open
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-purple-200 bg-white px-6 py-10 text-center">
              <FiMessageCircle className="mx-auto text-4xl text-purple-300" />
              <h3 className="mt-3 font-black">No member requests yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Private messages and prayer requests will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {requests.map((request) => {
                const name = `${request.firstName} ${request.lastName}`;
                return (
                  <article
                    className="rounded-3xl border border-purple-100 bg-white p-5 shadow-[0_12px_35px_rgba(70,40,100,0.06)]"
                    key={request.id}
                  >
                    <div className="flex items-start gap-3">
                      <ProfileAvatar
                        imageUrl={request.profilePhotoUrl}
                        name={name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-black">{name}</p>
                            <p className="mt-0.5 text-xs font-bold text-purple-600">
                              {request.type === "PRAYER_REQUEST"
                                ? "Prayer request"
                                : "Private message"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${request.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : request.status === "IN_REVIEW" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"}`}
                          >
                            {request.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <time
                          className="mt-1 block text-xs font-semibold text-slate-400"
                          dateTime={request.createdAt}
                        >
                          {submittedAtFormatter.format(
                            new Date(request.createdAt),
                          )}
                        </time>
                      </div>
                    </div>

                    <h3 className="mt-4 font-black">{request.subject}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {request.body}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      {request.phone ? (
                        <a
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-purple-100 px-3 text-sm font-bold text-purple-700"
                          href={`tel:${request.phone}`}
                        >
                          <FiPhone aria-hidden="true" /> Call
                        </a>
                      ) : null}
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-purple-100 px-3 text-sm font-bold text-purple-700"
                        href={`/pastor/members/${request.memberId}`}
                      >
                        <FiUser aria-hidden="true" /> Member profile
                      </Link>
                      <div className="ml-auto flex gap-2">
                        {request.status === "NEW" ? (
                          <form action={updatePastoralRequestStatus}>
                            <input
                              name="requestId"
                              type="hidden"
                              value={request.id}
                            />
                            <input
                              name="status"
                              type="hidden"
                              value="IN_REVIEW"
                            />
                            <AdminActionButton
                              className="min-h-10 rounded-xl bg-amber-100 px-3 text-xs font-black text-amber-800"
                              pendingLabel="Updating…"
                            >
                              Start review
                            </AdminActionButton>
                          </form>
                        ) : null}
                        {request.status !== "RESOLVED" ? (
                          <form action={updatePastoralRequestStatus}>
                            <input
                              name="requestId"
                              type="hidden"
                              value={request.id}
                            />
                            <input
                              name="status"
                              type="hidden"
                              value="RESOLVED"
                            />
                            <AdminActionButton
                              className="min-h-10 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white"
                              pendingLabel="Completing…"
                            >
                              Mark resolved
                            </AdminActionButton>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">
            Attendance care
          </p>
          <h2 className="mt-1 text-2xl font-black">Follow-up queue</h2>
        </div>

        {members.length === 0 ? (
          <section className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-purple-200 bg-white text-center">
            <div>
              <FiHeart className="mx-auto text-5xl text-purple-300" />

              <h2 className="mt-4 text-xl font-black">No follow-ups needed</h2>

              <p className="mt-2 text-sm text-slate-500">
                Members needing care will appear here.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-5">
            {members.map((member) => (
              <article
                className="rounded-2xl border border-purple-100 bg-white p-5"
                key={member.memberId}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      imageUrl={member.profilePhotoUrl}
                      name={member.displayName}
                      size="lg"
                    />

                    <div>
                      <h2 className="text-lg font-black">
                        {member.displayName}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {member.phone ?? member.email}
                      </p>

                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {member.absenceCount} recent absences
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                    {member.careStatus.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {member.phone && (
                    <>
                      <a
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white"
                        href={`tel:${member.phone}`}
                      >
                        <FiPhone />
                        Call
                      </a>

                      <a
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-100 px-4 py-2 text-sm font-bold text-purple-700"
                        href={`sms:${member.phone}`}
                      >
                        <FiMessageCircle />
                        Message
                      </a>
                    </>
                  )}

                  <Link
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-100 px-4 py-2 text-sm font-bold text-purple-700"
                    href={`/pastor/members/${member.memberId}`}
                  >
                    <FiUser />
                    View member
                  </Link>
                </div>

                {member.followUps[0] && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Latest follow-up
                    </p>

                    <p className="mt-2 text-sm font-bold">
                      {member.followUps[0].method.replaceAll("_", " ")}
                      {" · "}
                      {member.followUps[0].outcome.replaceAll("_", " ")}
                    </p>

                    {member.followUps[0].notes && (
                      <p className="mt-2 text-sm text-slate-500">
                        {member.followUps[0].notes}
                      </p>
                    )}
                  </div>
                )}

                <form
                  action={recordPastorFollowUp}
                  className="mt-5 grid gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4"
                >
                  <input
                    name="memberId"
                    type="hidden"
                    value={member.memberId}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="h-11 rounded-xl border border-purple-100 bg-white px-3"
                      defaultValue="CALL"
                      name="method"
                    >
                      <option value="CALL">Phone call</option>
                      <option value="MESSAGE">Message</option>
                      <option value="VISIT">Visit</option>
                      <option value="IN_PERSON">In person</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <select
                      className="h-11 rounded-xl border border-purple-100 bg-white px-3"
                      defaultValue="REACHED"
                      name="outcome"
                    >
                      <option value="REACHED">Reached</option>
                      <option value="NO_RESPONSE">No response</option>
                      <option value="NEEDS_PRAYER">Needs prayer</option>
                      <option value="NEEDS_VISIT">Needs visit</option>
                      <option value="SICK">Sick</option>
                      <option value="TRAVELLING">Travelling</option>
                      <option value="RETURNING_SOON">Returning soon</option>
                      <option value="CARE_COMPLETED">Care completed</option>
                    </select>
                  </div>

                  <textarea
                    className="min-h-24 rounded-xl border border-purple-100 bg-white p-3"
                    maxLength={2000}
                    name="notes"
                    placeholder="Private care note"
                  />

                  <input
                    className="h-11 rounded-xl border border-purple-100 bg-white px-3"
                    name="nextFollowUpOn"
                    type="date"
                  />

                  <button
                    className="h-11 rounded-xl bg-purple-600 font-bold text-white hover:bg-purple-700"
                    type="submit"
                  >
                    Save follow-up
                  </button>
                </form>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
