"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * An Instagram-style options sheet: slides up from the bottom on phones and
 * sits centred on larger screens. Built on <dialog>, so focus is trapped and
 * Escape closes it.
 */
export function Sheet({
  id,
  open,
  onClose,
  label,
  children,
}: {
  id?: string;
  open: boolean;
  onClose: () => void;
  /** Read by screen readers when the sheet opens. */
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      id={id}
      aria-label={label}
      className="m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/60 sm:m-auto sm:w-[400px] sm:rounded-2xl"
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      onClose={onClose}
      ref={ref}
    >
      {open ? children : null}
    </dialog>
  );
}

const optionBase =
  "flex min-h-12 w-full items-center justify-center border-t border-slate-200 px-4 text-sm transition first:border-t-0 hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none disabled:opacity-50";

/** One row in a sheet. `tone="danger"` is for destructive choices. */
export function sheetOption(tone: "default" | "danger" | "strong" = "default") {
  return `${optionBase} ${
    tone === "danger"
      ? "font-bold text-red-600"
      : tone === "strong"
        ? "font-bold text-black"
        : "text-slate-900"
  }`;
}

/** Title block at the top of a sheet. */
export function SheetHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="border-b border-slate-200 px-6 pb-4 pt-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {detail ? (
        <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}
