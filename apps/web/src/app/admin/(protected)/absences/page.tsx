import {
  FiCheck,
  FiClock,
  FiFileText,
  FiHelpCircle,
  FiX,
} from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import { reviewAbsence } from "./actions";

type AbsenceRequest = {
  id: string;
  memberFirstName: string;
  memberLastName: string;
  eventName: string | null;
  startsOn: string | null;
  endsOn: string | null;
  reason: string;
  details: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

function statusStyle(status: string) {
  if (status === "APPROVED")
    return "border-emerald-400/20 bg-emerald-50 text-emerald-700";
  if (status === "REJECTED")
    return "border-rose-400/20 bg-rose-50 text-rose-700";
  if (status === "NEEDS_CLARIFICATION")
    return "border-amber-400/20 bg-amber-50 text-amber-800";
  return "border-violet-400/20 bg-[#e1eafa] text-[#426b9f]";
}

export default async function AdminAbsencesPage() {
  const requests = await getAdminResource<AbsenceRequest[]>(
    "/absence-requests/reviewable",
  );
  const openCount = requests.filter((request) =>
    ["PENDING", "NEEDS_CLARIFICATION"].includes(request.status),
  ).length;

  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-10 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[#dce3e4] pb-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#527193]">
              Attendance
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Absence requests
            </h1>
            <p className="mt-2 text-slate-600">
              Review requests without losing the member&apos;s attendance
              history.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
            <FiClock aria-hidden="true" /> {openCount} need attention
          </div>
        </header>

        {requests.length === 0 ? (
          <section className="mt-8 grid min-h-72 place-items-center rounded-xl border border-dashed border-[#d4dcdd] bg-white/70 text-center">
            <div>
              <FiFileText className="mx-auto text-5xl text-[#527193]" />
              <h2 className="mt-4 text-xl font-bold">No absence requests</h2>
              <p className="mt-2 text-sm text-slate-600">
                Submitted requests will appear here.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {requests.map((request) => {
              const open = ["PENDING", "NEEDS_CLARIFICATION"].includes(
                request.status,
              );
              return (
                <article
                  className="rounded-[1.5rem] border border-[#dce3e4] bg-white/70 p-5"
                  key={request.id}
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-[#e1eafa] text-sm font-bold text-[#426b9f]">
                          {request.memberFirstName[0]}
                          {request.memberLastName[0]}
                        </span>
                        <div>
                          <h2 className="font-semibold">
                            {request.memberFirstName} {request.memberLastName}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {request.eventName ??
                              `${request.startsOn} to ${request.endsOn}`}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-800">
                        {request.reason}
                      </p>
                      {request.details ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {request.details}
                        </p>
                      ) : null}
                      {request.reviewNote ? (
                        <p className="mt-3 rounded-lg bg-white/[0.04] p-3 text-sm text-slate-600">
                          Review note: {request.reviewNote}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(request.status)}`}
                    >
                      {request.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  {open ? (
                    <form
                      action={reviewAbsence}
                      className="mt-5 grid gap-3 border-t border-[#e1e7e8] pt-5 lg:grid-cols-[1fr_auto_auto_auto]"
                    >
                      <input
                        name="requestId"
                        type="hidden"
                        value={request.id}
                      />
                      <input
                        className="h-11 rounded-lg border border-[#d4dcdd] px-3 text-sm"
                        minLength={3}
                        name="reviewNote"
                        placeholder="Required review note"
                        required
                      />
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 font-bold text-slate-950"
                        name="status"
                        value="APPROVED"
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 font-bold text-amber-800"
                        name="status"
                        value="NEEDS_CLARIFICATION"
                      >
                        <FiHelpCircle /> Clarify
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-400/25 bg-rose-50 px-4 font-bold text-rose-700"
                        name="status"
                        value="REJECTED"
                      >
                        <FiX /> Reject
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
