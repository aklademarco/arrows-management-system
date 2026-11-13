import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import { ReportQueue } from "@/components/feed/report-queue";
import { feedBasePath } from "@/lib/feed";
import { loadReportedComments } from "@/lib/feed-data";

export default async function AdminFeedReportsPage() {
  const reports = await loadReportedComments("admin");
  const feedPath = feedBasePath("admin");
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto grid max-w-3xl gap-4 text-slate-900">
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          href={feedPath}
        >
          <FiArrowLeft aria-hidden />
          Back to the feed
        </Link>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Reported comments</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Hide comments that break the guidelines, or keep them and dismiss
            the reports. Every decision is recorded in the audit log.
          </p>
        </header>
        <ReportQueue feedPath={feedPath} portal="admin" reports={reports} />
      </div>
    </main>
  );
}
