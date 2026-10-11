import { FiCheckCircle, FiClock, FiHeart, FiMessageCircle } from "react-icons/fi";
import { getMemberResource } from "../member-api";
import { CareRequestForm } from "./care-request-form";

type CareRequest = {
  id: string;
  type: "MESSAGE" | "PRAYER_REQUEST";
  subject: string;
  body: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
  handledAt: string | null;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

function statusDetails(status: CareRequest["status"]) {
  if (status === "RESOLVED") {
    return {
      label: "Completed",
      icon: FiCheckCircle,
      style: "bg-emerald-100 text-emerald-800",
    };
  }
  if (status === "IN_REVIEW") {
    return {
      label: "Pastor reviewing",
      icon: FiClock,
      style: "bg-amber-100 text-amber-800",
    };
  }
  return {
    label: "Sent",
    icon: FiCheckCircle,
    style: "bg-purple-100 text-purple-800",
  };
}

export default async function MemberCarePage() {
  const requests = await getMemberResource<CareRequest[]>(
    "/pastoral-care/requests/me",
  );

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">
            Pastoral care
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            You don&apos;t have to carry it alone.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Send a private message or prayer request to the pastoral team.
          </p>
        </header>

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <CareRequestForm />

          <div className="rounded-4xl border border-purple-100 bg-white p-5 shadow-[0_18px_45px_rgba(70,40,100,0.05)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6b21a8]">
                  Your requests
                </p>
                <h2 className="mt-1 text-xl font-black">Recent messages</h2>
              </div>
              <span className="grid size-11 place-items-center rounded-2xl bg-purple-50 text-xl text-[#6b21a8]">
                <FiMessageCircle aria-hidden="true" />
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-purple-200 px-5 py-10 text-center">
                <FiHeart className="mx-auto text-3xl text-purple-300" />
                <p className="mt-3 font-extrabold">No requests sent yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Requests you send will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {requests.map((request) => {
                  const status = statusDetails(request.status);
                  const StatusIcon = status.icon;
                  return (
                    <article className="py-5 first:pt-0" key={request.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-purple-600">
                            {request.type === "PRAYER_REQUEST"
                              ? "Prayer request"
                              : "Message"}
                          </p>
                          <h3 className="mt-1 font-extrabold">
                            {request.subject}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${status.style}`}
                        >
                          <StatusIcon aria-hidden="true" /> {status.label}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                        {request.body}
                      </p>
                      <time
                        className="mt-2 block text-xs font-semibold text-slate-400"
                        dateTime={request.createdAt}
                      >
                        Sent {dateFormatter.format(new Date(request.createdAt))}
                      </time>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
