import { FiCalendar, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";
import { getMemberResource } from "../member-api";
import type { UpcomingEvent } from "../member-types";
import {
  cancelAbsence,
  submitDateRangeAbsence,
  submitEventAbsence,
} from "./actions";

type AbsenceRequest = {
  id: string;
  eventName: string | null;
  eventStartsAt: string | null;
  startsOn: string | null;
  endsOn: string | null;
  reason: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

const date = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeZone: "Africa/Accra",
});

function statusStyle(status: string) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "bg-rose-100 text-rose-800";
  if (status === "NEEDS_CLARIFICATION") return "bg-amber-100 text-amber-800";
  return "bg-purple-100 text-purple-800";
}

export default async function MemberAbsencesPage() {
  const [requests, events] = await Promise.all([
    getMemberResource<AbsenceRequest[]>("/absence-requests/me"),
    getMemberResource<UpcomingEvent[]>("/events/upcoming"),
  ]);

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">Time away</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Request an excused absence.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Tell your leaders when an event or date range cannot be attended.
          </p>
        </header>

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <form
            action={submitEventAbsence}
            className="grid content-start gap-4 rounded-[2rem] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(70,40,100,0.07)]"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-purple-100 text-[#6b21a8]">
              <FiCalendar aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black">Specific event</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose an upcoming eligible event.
              </p>
            </div>
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
              name="eventId"
              required
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} · {date.format(new Date(event.startsAt))}
                </option>
              ))}
            </select>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
              maxLength={150}
              minLength={2}
              name="reason"
              placeholder="Reason"
              required
            />
            <textarea
              className="min-h-28 rounded-2xl border border-slate-200 bg-[#fbfafc] p-4"
              maxLength={2000}
              name="details"
              placeholder="Additional details (optional)"
            />
            <button className="member-primary-action mx-auto sm:mx-0">
              Submit event request
            </button>
          </form>

          <form
            action={submitDateRangeAbsence}
            className="grid content-start gap-4 rounded-[2rem] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(70,40,100,0.07)]"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-[#efffce] text-[#497016]">
              <FiClock aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black">Date range</h2>
              <p className="mt-1 text-sm text-slate-500">
                Cover several days with one request.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                From
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
                  name="startsOn"
                  type="date"
                  required
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                To
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
                  name="endsOn"
                  type="date"
                  required
                />
              </label>
            </div>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
              maxLength={150}
              minLength={2}
              name="reason"
              placeholder="Reason"
              required
            />
            <textarea
              className="min-h-28 rounded-2xl border border-slate-200 bg-[#fbfafc] p-4"
              maxLength={2000}
              name="details"
              placeholder="Additional details (optional)"
            />
            <button className="member-primary-action mx-auto sm:mx-0">
              Submit date request
            </button>
          </form>
        </section>

        <section className="mt-7 rounded-[2rem] border border-purple-100 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <FiFileText className="text-[#6b21a8]" aria-hidden="true" />
            <h2 className="text-2xl font-black">Your requests</h2>
          </div>
          {requests.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-purple-50 p-6 text-sm text-slate-500">
              You have not submitted an absence request.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {requests.map((request) => (
                <article
                  className="grid gap-3 py-5 first:pt-0 sm:grid-cols-[1fr_auto]"
                  key={request.id}
                >
                  <div>
                    <h3 className="font-extrabold">
                      {request.eventName ??
                        `${request.startsOn} to ${request.endsOn}`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.reason}
                    </p>
                    {request.reviewNote ? (
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Leader note: {request.reviewNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${statusStyle(request.status)}`}
                    >
                      {request.status.replaceAll("_", " ")}
                    </span>
                    {request.status === "APPROVED" ? (
                      <FiCheckCircle
                        className="ml-auto mt-2 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    {request.status === "PENDING" ? (
                      <form action={cancelAbsence} className="mt-3">
                        <input
                          name="requestId"
                          type="hidden"
                          value={request.id}
                        />
                        <button
                          className="text-xs font-extrabold text-rose-600 hover:text-rose-800"
                          type="submit"
                        >
                          Cancel request
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
