"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { FiLoader } from "react-icons/fi";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function AdminActionButton({
  children,
  pendingLabel = "Saving…",
  className = "",
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-disabled={pending || disabled}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={pending || disabled}
      {...props}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <FiLoader className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
