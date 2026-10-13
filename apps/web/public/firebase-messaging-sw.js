/* global firebase, ACMS_FIREBASE_CONFIG */
// Register click handling before Firebase installs its default handler.
self.addEventListener("notificationclick", (event) => {
  if (!event.notification.data?.acms) return;
  event.stopImmediatePropagation();
  event.notification.close();
  const fallback = new URL("/notifications", self.location.origin);
  let target = fallback;
  try {
    const candidate = new URL(event.notification.data.link, self.location.origin);
    if (candidate.origin === self.location.origin && candidate.protocol === self.location.protocol) {
      target = candidate;
    }
  } catch { /* Invalid links open the inbox. */ }
  event.waitUntil(self.clients.openWindow(target.href));
});

importScripts("/firebase-config.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");
firebase.initializeApp(ACMS_FIREBASE_CONFIG);

firebase.messaging().onBackgroundMessage((payload) => {
  // FCM already displays notification payloads. Only render data-only messages.
  if (payload.notification || !payload.data?.title) return;
  return self.registration.showNotification(payload.data.title, {
    body: payload.data.body ?? "",
    tag: payload.data.notificationId ?? payload.messageId,
    data: { acms: true, link: payload.data.link ?? "/notifications" },
  });
});
