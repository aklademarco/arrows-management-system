"use client";

import { startTransition, useEffect, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";
import { isFirebaseConfigured } from "@/lib/firebase";
import { browserPushToken } from "@/lib/browser-push";
import {
  canRefreshPushDevice,
  dismissPushPrompt,
  shouldShowPushPrompt,
  updatePushDevice,
} from "@/app/push-actions";

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let disposed = false;
    startTransition(async () => {
      try {
        if (
          !isFirebaseConfigured() ||
          !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        )
          return;
        if (!(await getFirebaseMessaging()) || disposed) return;
        // A saved browser token alone does not prove registration for this account.
        // Refresh the server registration only when this browser has an existing opt-in.
        if (
          Notification.permission === "granted" &&
          (await canRefreshPushDevice())
        ) {
          const token = await browserPushToken(false);
          if (disposed) return;
          const result = await updatePushDevice({ token, enabled: true });
          if (result.success) return;
        }
        const show = await shouldShowPushPrompt();
        if (!disposed && show) {
          setMessage(
            Notification.permission === "denied"
              ? "Notifications are blocked. Allow them in your browser’s site settings, then select Enable notifications."
              : "Get church messages, event reminders and service updates, even when you’re away from this page.",
          );
          setVisible(true);
        }
      } catch {
        // A temporary network failure must not produce an incorrect registration prompt.
      }
    });
    return () => {
      disposed = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const token = await browserPushToken(true);
      const result = await updatePushDevice({ token, enabled: true });
      if (!result.success) throw new Error(result.message);
      setVisible(false);
    } catch (error) {
      setMessage(
        error instanceof Error && !error.message.includes("Firebase")
          ? error.message
          : "Could not enable notifications. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function dismiss() {
    setBusy(true);
    try {
      await dismissPushPrompt();
      setVisible(false);
    } catch {
      setMessage("Could not save your preference. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;
  return (
    <aside
      aria-labelledby="push-prompt-title"
      className="fixed bottom-24 right-4 left-4 z-40 rounded-2xl border border-purple-200 bg-white p-5 text-slate-950 shadow-xl sm:left-auto sm:w-96"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-purple-100 p-3 text-purple-700">
          <FiBell aria-hidden="true" />
        </span>
        <h2 id="push-prompt-title" className="flex-1 font-bold">
          Stay connected
        </h2>
        <button
          type="button"
          aria-label="Dismiss notification invitation"
          disabled={busy}
          onClick={() => startTransition(dismiss)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-50"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
      <p role="status" className="mt-3 text-sm leading-6 text-slate-600">
        {message}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => startTransition(enable)}
          className="min-h-11 rounded-xl bg-purple-700 px-4 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50"
        >
          {busy ? "Please wait…" : "Enable notifications"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startTransition(dismiss)}
          className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
