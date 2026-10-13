"use client";

import { useEffect, useState } from "react";
import { deleteToken, getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";
import { isFirebaseConfigured } from "@/lib/firebase";
import { updatePushDevice } from "@/app/push-actions";

const storageKey = "acms_push_token";
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function PushNotificationSettings() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Checking browser notification support…");
  const [incoming, setIncoming] = useState("");

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      if (!isFirebaseConfigured() || !vapidKey) {
        if (!disposed) setMessage("Push notifications have not been configured yet.");
        return;
      }
      const messaging = await getFirebaseMessaging();
      if (disposed) return;
      if (!messaging) {
        setMessage("Push is unavailable in this browser. On iPhone or iPad, add ACMS to your Home Screen and open it there.");
        return;
      }
      setAvailable(true);
      setMessage(Notification.permission === "denied"
        ? "Notifications are blocked. Allow them in your browser’s site settings, then try again."
        : "Register this browser to receive push notifications, or disable an existing registration.");
      unsubscribe = onMessage(messaging, (payload) => {
        setIncoming([payload.notification?.title ?? payload.data?.title,
          payload.notification?.body ?? payload.data?.body].filter(Boolean).join(": "));
      });
    }
    initialize().catch(() => {
      if (!disposed) setMessage("Unable to check notification support. Reload to try again.");
    });
    return () => { disposed = true; unsubscribe?.(); };
  }, []);

  async function update(enabled: boolean) {
    setBusy(true);
    try {
      // Permission must be requested directly from a user gesture, before async setup.
      if (enabled && await Notification.requestPermission() !== "granted") {
        setMessage("Notifications were not allowed. You can change this in your browser’s site settings.");
        return;
      }
      const messaging = await getFirebaseMessaging();
      if (!messaging) throw new Error("Push is unavailable in this browser.");
      let token = localStorage.getItem(storageKey);
      if (enabled) {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js", { updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        // Retain the token even if saving fails so disabling remains possible.
        if (token) localStorage.setItem(storageKey, token);
      }
      if (!token) {
        setMessage("No device registration was found in this browser.");
        return;
      }
      const result = await updatePushDevice({ token, enabled });
      if (!result.success) throw new Error(result.message);
      if (!enabled) {
        await deleteToken(messaging);
        localStorage.removeItem(storageKey);
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error && !error.message.includes("Firebase")
        ? error.message : "Could not update push notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Browser push notifications" className="mt-6 rounded-2xl border border-purple-200 bg-white p-5 text-slate-900">
      <h2 className="font-bold">Browser notifications</h2>
      <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>
      {available && <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => void update(true)} className="min-h-11 rounded-xl bg-purple-700 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Enable on this browser"}</button>
        <button type="button" disabled={busy} onClick={() => void update(false)} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50">Disable</button>
      </div>}
      {incoming && <p role="status" className="mt-4 rounded-xl bg-purple-50 p-3 text-sm">{incoming}</p>}
    </section>
  );
}
