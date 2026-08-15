import Link from "next/link";
import { FiBell, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getLeaderResource } from "../leader-api";
import {
  markAllLeaderNotificationsRead,
  markLeaderNotificationRead,
} from "./actions";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationPage = {
  items: Notification[];
  totalPages: number;
};

const formatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function LeaderInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number((await searchParams).page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [notifications, unread] = await Promise.all([
    getLeaderResource<NotificationPage>(`/notifications?page=${page}&limit=20`),
    getLeaderResource<{ count: number }>("/notifications/unread-count"),
  ]);

  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Communication</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Inbox</h1>
            <p className="mt-2 text-sm text-slate-400">Church notices and leadership updates in one place.</p>
          </div>
          {unread.count > 0 ? (
            <form action={markAllLeaderNotificationsRead}>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-black transition hover:bg-purple-500" type="submit">
                <FiCheck aria-hidden="true" /> Mark all read
              </button>
            </form>
          ) : null}
        </header>

        <section aria-label="Leadership inbox" className="mt-7 space-y-3">
          {notifications.items.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-white/15 bg-[#24202e] p-6 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-purple-500/15 text-2xl text-purple-300"><FiBell /></span>
                <h2 className="mt-4 text-xl font-black">Your inbox is clear</h2>
                <p className="mt-2 text-sm text-slate-400">New church and ministry updates will appear here.</p>
              </div>
            </div>
          ) : notifications.items.map((item) => (
            <article className={`rounded-[1.5rem] border p-5 sm:p-6 ${item.readAt ? "border-white/10 bg-[#24202e]" : "border-purple-200 bg-purple-50"}`} key={item.id}>
              <div className="flex gap-4">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.readAt ? "bg-slate-600" : "bg-lime-300 shadow-[0_0_0_5px_rgba(190,242,100,0.12)]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="font-black">{item.title}</h2>
                    <time className="text-xs font-bold text-slate-500" dateTime={item.createdAt}>{formatter.format(new Date(item.createdAt))}</time>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                  {!item.readAt ? (
                    <form action={markLeaderNotificationRead} className="mt-4">
                      <input name="notificationId" type="hidden" value={item.id} />
                      <button className="text-sm font-black text-purple-300 hover:text-purple-200" type="submit">Mark as read</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>

        {notifications.totalPages > 1 ? (
          <nav aria-label="Inbox pages" className="mt-6 flex items-center justify-between text-sm font-bold">
            {page > 1 ? <Link className="inline-flex items-center gap-2 text-purple-300" href={`/leader/inbox?page=${page - 1}`}><FiChevronLeft /> Newer</Link> : <span />}
            <span className="text-xs text-slate-500">Page {page} of {notifications.totalPages}</span>
            {page < notifications.totalPages ? <Link className="inline-flex items-center gap-2 text-purple-300" href={`/leader/inbox?page=${page + 1}`}>Older <FiChevronRight /></Link> : <span />}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
