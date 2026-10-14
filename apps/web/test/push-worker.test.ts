import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

function worker() {
  const showNotification = jest.fn().mockResolvedValue(undefined);
  const openWindow = jest.fn().mockResolvedValue(undefined);
  const listeners: Record<string, (event: unknown) => void> = {};
  let background: (payload: unknown) => Promise<void> | undefined = () => undefined;
  runInNewContext(readFileSync(resolve("public/firebase-messaging-sw.js"), "utf8"), {
    URL, importScripts: jest.fn(), ACMS_FIREBASE_CONFIG: {},
    firebase: { initializeApp: jest.fn(), messaging: () => ({ onBackgroundMessage: (handler: typeof background) => { background = handler; } }) },
    self: { location: { origin: "https://acms.test", protocol: "https:" }, registration: { showNotification }, clients: { openWindow },
      addEventListener: (type: string, handler: (event: unknown) => void) => { listeners[type] = handler; } },
  });
  return { showNotification, openWindow, listeners, background: (payload: unknown) => background(payload) };
}
it("displays data-only notifications and avoids duplicating FCM notifications", async () => {
  const w = worker();
  await w.background({ notification: { title: "Automatic" }, data: { title: "Duplicate" } });
  expect(w.showNotification).not.toHaveBeenCalled();
  await w.background({ data: { title: "Service reminder", body: "Join us" }, messageId: "message" });
  expect(w.showNotification).toHaveBeenCalledWith("Service reminder", expect.objectContaining({ body: "Join us", tag: "message" }));
});
it.each(["https://evil.test/phishing", "javascript:alert(1)", "//evil.test", "http://acms.test/insecure"])("rejects unsafe notification link %s", async (link) => {
  const w = worker();
  w.listeners.notificationclick({ notification: { data: { acms: true, link }, close: jest.fn() }, stopImmediatePropagation: jest.fn(), waitUntil: jest.fn() });
  expect(w.openWindow).toHaveBeenCalledWith("https://acms.test/notifications");
});
it("opens same-origin notification links", () => {
  const w = worker();
  w.listeners.notificationclick({ notification: { data: { acms: true, link: "/leader/inbox" }, close: jest.fn() }, stopImmediatePropagation: jest.fn(), waitUntil: jest.fn() });
  expect(w.openWindow).toHaveBeenCalledWith("https://acms.test/leader/inbox");
});
