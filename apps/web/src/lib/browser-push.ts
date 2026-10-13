import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase-messaging";
export const pushTokenStorageKey = "acms_push_token";

export async function browserPushToken(requestPermission: boolean) {
  if (typeof Notification === "undefined")
    throw new Error("Push notifications are not supported in this browser.");
  // Request directly from the click/submit gesture before doing async setup.
  const permission = requestPermission
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== "granted")
    throw new Error(
      "Allow notifications in your browser’s site settings to enable push.",
    );
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey)
    throw new Error("Push notifications have not been configured yet.");
  const messaging = await getFirebaseMessaging();
  if (!messaging) throw new Error("Push is unavailable in this browser.");
  await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    updateViaCache: "none",
  });
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("The browser did not return a device token.");
  localStorage.setItem(pushTokenStorageKey, token);
  return token;
}
