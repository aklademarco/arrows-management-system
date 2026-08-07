import Link from "next/link";
import { FiBell, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getMemberResource } from "../member-api";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationPage = {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const formatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requestedPage = Number((await searchParams).page ?? 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [notifications, unread] = await Promise.all([
    getMemberResource<NotificationPage>(`/notifications?page=${page}&limit=20`),
    getMemberResource<{ count: number }>("/notifications/unread-count"),
  ]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-[#6b21a8]">Stay connected</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Notifications</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Announcements and updates from your church teams.</p>
          </div>
          {unread.count > 0 && (
            <form action={markAllNotificationsRead}>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-purple-100 px-4 text-sm font-extrabold text-[#6b21a8] hover:bg-purple-200" type="submit">
                <FiCheck aria-hidden="true" /> Mark all read
              </button>
            </form>
          )}
        </header>

        <section className="mt-7 space-y-3" aria-label="Notification inbox">
          {notifications.items.length === 0 ? (
            <div className="rounded-[2rem] border border-purple-100 bg-white px-6 py-14 text-center shadow-sm">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-purple-50 text-2xl text-[#6b21a8]"><FiBell aria-hidden="true" /></span>
              <h2 className="mt-4 text-xl font-black">You are all caught up</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">New announcements and ministry updates will appear here.</p>
            </div>
          ) : notifications.items.map((item) => (
            <article className={`rounded-[1.75rem] border p-5 shadow-sm sm:p-6 ${item.readAt ? "border-slate-200 bg-white" : "border-purple-200 bg-gradient-to-r from-purple-50 to-white"}`} key={item.id}>
              <div className="flex gap-4">
                <span className={`mt-1 size-3 shrink-0 rounded-full ${item.readAt ? "bg-slate-200" : "bg-lime-400 shadow-[0_0_0_5px_rgba(163,230,53,0.18)]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-black text-slate-950">{item.title}</h2>
                    <time className="text-xs font-bold text-slate-400" dateTime={item.createdAt}>{formatter.format(new Date(item.createdAt))}</time>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {item.link && <Link className="text-sm font-extrabold text-[#6b21a8] hover:underline" href={item.link}>Open update →</Link>}
                    {!item.readAt && (
                      <form action={markNotificationRead}>
                        <input name="notificationId" type="hidden" value={item.id} />
                        <button className="text-sm font-bold text-slate-500 hover:text-slate-950" type="submit">Mark as read</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {notifications.totalPages > 1 && (
          <nav aria-label="Notification pages" className="mt-6 flex items-center justify-between">
            {page > 1 ? <Link className="inline-flex items-center gap-2 font-bold text-[#6b21a8]" href={`/member/notifications?page=${page - 1}`}><FiChevronLeft /> Newer</Link> : <span />}
            <span className="text-xs font-bold text-slate-400">Page {page} of {notifications.totalPages}</span>
            {page < notifications.totalPages ? <Link className="inline-flex items-center gap-2 font-bold text-[#6b21a8]" href={`/member/notifications?page=${page + 1}`}>Older <FiChevronRight /></Link> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}
