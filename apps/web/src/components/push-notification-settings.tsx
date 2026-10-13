"use client";

import { useEffect, useState } from "react";
import { deleteToken } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";
import { isFirebaseConfigured } from "@/lib/firebase";
import { updatePushDevice } from "@/app/push-actions";

import {
  browserPushToken,
  pushTokenStorageKey as storageKey,
} from "@/lib/browser-push";
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function PushNotificationSettings() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Checking browser notification support…",
  );

  useEffect(() => {
    let disposed = false;
    async function initialize() {
      if (!isFirebaseConfigured() || !vapidKey) {
        if (!disposed)
          setMessage("Push notifications have not been configured yet.");
        return;
      }
      const messaging = await getFirebaseMessaging();
      if (disposed) return;
      if (!messaging) {
        setMessage(
          "Push is unavailable in this browser. On iPhone or iPad, add ACMS to your Home Screen and open it there.",
        );
        return;
      }
      setAvailable(true);
      setMessage(
        Notification.permission === "denied"
          ? "Notifications are blocked. Allow them in your browser’s site settings, then try again."
          : "Register this browser to receive push notifications, or disable an existing registration.",
      );
    }
    initialize().catch(() => {
      if (!disposed)
        setMessage(
          "Unable to check notification support. Reload to try again.",
        );
    });
    return () => {
      disposed = true;
    };
  }, []);

  async function update(enabled: boolean) {
    setBusy(true);
    try {
      const token = enabled
        ? await browserPushToken(true)
        : localStorage.getItem(storageKey);
      if (!token) {
        setMessage("No device registration was found in this browser.");
        return;
      }
      const result = await updatePushDevice({ token, enabled });
      if (!result.success) throw new Error(result.message);
      if (!enabled) {
        const messaging = await getFirebaseMessaging();
        if (messaging) await deleteToken(messaging);
        localStorage.removeItem(storageKey);
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error && !error.message.includes("Firebase")
          ? error.message
          : "Could not update push notifications. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Browser push notifications"
      className="mt-6 rounded-2xl border border-purple-200 bg-white p-5 text-slate-900"
    >
      <h2 className="font-bold">Browser notifications</h2>
      <p role="status" className="mt-2 text-sm text-slate-600">
        {message}
      </p>
      {available && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void update(true)}
            className="min-h-11 rounded-xl bg-purple-700 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Enable on this browser"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void update(false)}
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50"
          >
            Disable
          </button>
        </div>
      )}
    </section>
  );
}
