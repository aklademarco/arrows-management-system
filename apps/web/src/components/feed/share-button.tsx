"use client";

import { useState } from "react";
import { FiCheck, FiShare } from "react-icons/fi";

/**
 * Opens the phone's share sheet, or copies the link on desktop. The link
 * uses /feed/:id, which sends each reader to their own portal.
 */
export function ShareButton({ postId, title }: { postId: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/feed/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The reader closed the share sheet or copying was blocked.
    }
  };

  return (
    <button
      aria-label={copied ? "Link copied" : `Share ${title}`}
      className="group/action flex min-h-11 items-center gap-1 text-slate-500 transition hover:text-black focus-visible:outline-none"
      onClick={share}
      type="button"
    >
      <span className="grid size-9 place-items-center rounded-full text-lg transition group-hover/action:bg-slate-100 group-focus-visible/action:ring-2 group-focus-visible/action:ring-black">
        {copied ? <FiCheck aria-hidden /> : <FiShare aria-hidden />}
      </span>
      <span aria-live="polite" className="text-[13px]">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
