import { getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../src/lib/firebase-messaging";
import { browserPushToken } from "../src/lib/browser-push";

jest.mock("firebase/messaging", () => ({ getToken: jest.fn() }));
jest.mock("../src/lib/firebase-messaging", () => ({
  getFirebaseMessaging: jest.fn(),
}));
const originals = new Map(
  ["Notification", "navigator", "localStorage"].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]),
);
let requestPermission: jest.Mock;
let register: jest.Mock;
beforeEach(() => {
  jest.replaceProperty(process, "env", {
    ...process.env,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: "public-vapid-key",
  });
  requestPermission = jest.fn().mockResolvedValue("granted");
  register = jest.fn().mockResolvedValue({});
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: { permission: "granted", requestPermission },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { serviceWorker: { register, ready: Promise.resolve({}) } },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { setItem: jest.fn() },
  });
  jest
    .mocked(getFirebaseMessaging)
    .mockResolvedValue(
      {} as NonNullable<Awaited<ReturnType<typeof getFirebaseMessaging>>>,
    );
  jest.mocked(getToken).mockResolvedValue("device:token");
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});
it("requests permission before async setup and passes the VAPID key and worker", async () => {
  expect(await browserPushToken(true)).toBe("device:token");
  expect(requestPermission.mock.invocationCallOrder[0]).toBeLessThan(
    register.mock.invocationCallOrder[0],
  );
  expect(getToken).toHaveBeenCalledWith(
    {},
    { vapidKey: "public-vapid-key", serviceWorkerRegistration: {} },
  );
});
it("refreshes an existing token without prompting", async () => {
  await browserPushToken(false);
  expect(requestPermission).not.toHaveBeenCalled();
});
it("does not register a worker when permission is denied", async () => {
  requestPermission.mockResolvedValue("denied");
  await expect(browserPushToken(true)).rejects.toThrow("Allow notifications");
  expect(register).not.toHaveBeenCalled();
});
