"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase-messaging";
import { browserPushToken } from "@/lib/browser-push";
import { canRefreshPushDevice, updatePushDevice } from "@/app/push-actions";

export function PushNotificationListener() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      const messaging = await getFirebaseMessaging();
      if (!messaging || disposed) return;
      unsubscribe = onMessage(messaging, (payload) => {
        setMessage(
          payload.notification?.title ??
            payload.data?.title ??
            "New church update",
        );
        router.refresh();
      });
      // Refresh only an existing opt-in, never request permission automatically.
      if (
        Notification.permission === "granted" &&
        (await canRefreshPushDevice()) &&
        !disposed
      ) {
        const token = await browserPushToken(false);
        if (!disposed) await updatePushDevice({ token, enabled: true });
      }
    }
    void initialize().catch(() => {
      /* Inbox and explicit opt-in controls remain available. */
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [router]);
  if (!message) return null;
  return (
    <aside
      role="status"
      className="fixed bottom-24 right-4 z-50 max-w-sm rounded-2xl border border-purple-200 bg-white p-4 text-slate-950 shadow-xl"
    >
      <p className="font-bold">{message}</p>
      <div className="mt-3 flex items-center gap-4">
        <Link
          href="/notifications"
          className="text-sm font-bold text-purple-700"
          onClick={() => setMessage("")}
        >
          Open inbox
        </Link>
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-slate-600"
          onClick={() => setMessage("")}
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
