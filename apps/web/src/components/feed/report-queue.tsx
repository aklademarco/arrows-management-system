"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FiCheck, FiEyeOff, FiFlag } from "react-icons/fi";

import { dismissCommentReports, hideComment } from "@/app/feed-actions";
import { formatPostedAt, IDLE_FEED_STATE, type ReportedComment } from "@/lib/feed";

import { ActionMessage } from "./action-message";
import { ReasonForm } from "./reason-form";

function ReportRow({
  portal,
  feedPath,
  report,
}: {
  portal: "admin" | "pastor";
  feedPath: string;
  report: ReportedComment;
}) {
  const [hiding, setHiding] = useState(false);
  const [dismissState, dismissAction, dismissing] = useActionState(
    dismissCommentReports,
    IDLE_FEED_STATE,
  );
  const count = Number(report.reportCount);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">
          <FiFlag aria-hidden />
          {count} {count === 1 ? "report" : "reports"}
        </span>
        <span>on</span>
        <Link
          className="font-semibold text-slate-700 hover:underline"
          href={`${feedPath}/${report.postId}#comments`}
        >
          {report.postTitle}
        </Link>
        <span aria-hidden>•</span>
        <span>first reported {formatPostedAt(report.firstReportedAt)}</span>
      </p>
      <blockquote className="mt-3 border-l-2 border-slate-200 pl-3">
        <p className="text-xs font-semibold text-slate-900">
          {report.authorName ?? "Church member"}
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
          {report.body}
        </p>
      </blockquote>
      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-500">Reasons given</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
          {report.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>
      {hiding ? (
        <ReasonForm
          action={hideComment}
          fields={{ portal, commentId: report.commentId }}
          label="Reason for hiding (kept in the audit log)"
          onCancel={() => setHiding(false)}
          pendingLabel="Hiding…"
          placeholder="For example: abusive language"
          submitLabel="Hide comment"
          tone="danger"
        />
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
            onClick={() => setHiding(true)}
            type="button"
          >
            <FiEyeOff aria-hidden />
            Hide comment
          </button>
          <form action={dismissAction}>
            <input name="portal" type="hidden" value={portal} />
            <input name="commentId" type="hidden" value={report.commentId} />
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              disabled={dismissing}
              type="submit"
            >
              <FiCheck aria-hidden />
              {dismissing ? "Dismissing…" : "Keep and dismiss"}
            </button>
          </form>
          <ActionMessage state={dismissState} />
        </div>
      )}
    </li>
  );
}

export function ReportQueue({
  portal,
  feedPath,
  reports,
}: {
  portal: "admin" | "pastor";
  feedPath: string;
  reports: ReportedComment[];
}) {
  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        Nothing to review. Reported comments will appear here.
      </p>
    );
  }
  return (
    <ol className="grid gap-3">
      {reports.map((report) => (
        <ReportRow
          feedPath={feedPath}
          key={report.commentId}
          portal={portal}
          report={report}
        />
      ))}
    </ol>
  );
}
