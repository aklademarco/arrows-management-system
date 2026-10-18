import Link from "next/link";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiImage,
  FiMusic,
} from "react-icons/fi";
import { AdminActionButton } from "@/components/admin-action-button";
import { getAdminResource } from "../registrations/admin-api";
import { advanceMinistryWork } from "./actions";

type Item = {
  id: string;
  type: string;
  title: string;
  instructions: string | null;
  status: string;
  deadlineAt: string | null;
  sentAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  senderEmail: string;
  targetDepartment: string;
  attachmentUrl: string | null;
};
const formatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function MinistryWorkPage() {
  const items = await getAdminResource<Item[]>("/admin/ministry-content");
  const newItems = items.filter((item) => item.status === "SENT");
  const active = items.filter((item) => item.status === "ACKNOWLEDGED");
  const completed = items.filter((item) => item.status === "COMPLETED");
  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-8 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#527193]">
            Ministry operations
          </p>
          <h1 className="mt-2 text-3xl font-bold">Shared work</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor Publicity, Choir, and Media handoffs and resolve stalled
            work.
          </p>
        </header>
        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={FiAlertCircle}
            label="Awaiting Media"
            value={newItems.length}
            tone="amber"
          />
          <Metric
            icon={FiClock}
            label="In progress"
            value={active.length}
            tone="violet"
          />
          <Metric
            icon={FiCheckCircle}
            label="Completed"
            value={completed.length}
            tone="green"
          />
        </section>
        <section className="mt-7 space-y-3">
          {items.length ? (
            items.map((item) => (
              <article
                className="rounded-[1.5rem] border border-[#dce3e4] bg-white/70 p-5"
                key={item.id}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e1eafa] text-xl text-[#426b9f]">
                    {item.type === "PUBLICITY_FLYER" ? (
                      <FiImage />
                    ) : (
                      <FiMusic />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-slate-900">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          From {item.senderEmail} → {item.targetDepartment}
                        </p>
                      </div>
                      <Status status={item.status} />
                    </div>
                    {item.instructions ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.instructions}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                      <span>
                        Sent{" "}
                        {formatter.format(
                          new Date(item.sentAt ?? item.createdAt),
                        )}
                      </span>
                      {item.deadlineAt ? (
                        <span
                          className={
                            new Date(item.deadlineAt) < new Date() &&
                            item.status !== "COMPLETED"
                              ? "text-red-700"
                              : ""
                          }
                        >
                          Due {formatter.format(new Date(item.deadlineAt))}
                        </span>
                      ) : null}
                      {item.attachmentUrl ? (
                        <Link
                          className="inline-flex items-center gap-1 text-[#426b9f]"
                          href={item.attachmentUrl}
                          target="_blank"
                        >
                          Open asset <FiArrowUpRight />
                        </Link>
                      ) : null}
                    </div>
                    {["SENT", "ACKNOWLEDGED"].includes(item.status) ? (
                      <form action={advanceMinistryWork} className="mt-4">
                        <input name="contentId" type="hidden" value={item.id} />
                        <input
                          name="action"
                          type="hidden"
                          value={
                            item.status === "SENT" ? "ACKNOWLEDGE" : "COMPLETE"
                          }
                        />
                        <AdminActionButton
                          className="rounded-lg bg-[#242929] text-white px-4 py-2 text-sm font-bold text-white"
                          pendingLabel="Updating…"
                        >
                          {item.status === "SENT"
                            ? "Acknowledge for Media"
                            : "Mark complete"}
                        </AdminActionButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d4dcdd] p-12 text-center text-slate-600">
              No ministry work has been shared yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Status({ status }: { status: string }) {
  const style =
    status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "ACKNOWLEDGED"
        ? "bg-[#e1eafa] text-[#426b9f]"
        : "bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${style}`}>
      {status === "SENT"
        ? "AWAITING MEDIA"
        : status === "ACKNOWLEDGED"
          ? "IN PROGRESS"
          : status}
    </span>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FiClock;
  label: string;
  value: number;
  tone: "amber" | "violet" | "green";
}) {
  const style =
    tone === "amber"
      ? "text-amber-800 bg-amber-50"
      : tone === "green"
        ? "text-emerald-700 bg-emerald-50"
        : "text-[#426b9f] bg-[#e1eafa]";
  return (
    <article className="rounded-[1.5rem] border border-[#dce3e4] bg-white/70 p-5">
      <div className={`grid size-10 place-items-center rounded-xl ${style}`}>
        <Icon />
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </article>
  );
}
