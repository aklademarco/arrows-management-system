"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

export function AdminFeedback({
  kind,
  message,
}: {
  kind: "success" | "error";
  message: string;
}) {
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  if (!visible) return null;
  const success = kind === "success";
  return (
    <div
      aria-live="polite"
      className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${success ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200"}`}
      role={success ? "status" : "alert"}
    >
      {success ? <FiCheckCircle className="mt-0.5 shrink-0" /> : <FiAlertCircle className="mt-0.5 shrink-0" />}
      <span className="flex-1">{message}</span>
      <button aria-label="Dismiss message" className="grid size-6 place-items-center rounded-md hover:bg-white/10" onClick={() => { setVisible(false); router.replace(pathname, { scroll: false }); }} type="button"><FiX /></button>
    </div>
  );
}
