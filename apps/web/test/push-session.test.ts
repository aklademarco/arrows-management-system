import { cookies } from "next/headers";
import {
  pushCookie,
  revokeBrowserPush,
  revokePushOnLogout,
} from "../src/lib/push-session";
import { checkAccountStatus } from "../src/app/account-status/actions";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("../src/lib/client-api", () => ({
  getClientIpHeaders: jest.fn().mockResolvedValue({}),
}));
let values: Map<string, string>;
let fetchMock: jest.SpiedFunction<typeof fetch>;
const secret = "a".repeat(64);
beforeEach(() => {
  values = new Map();
  jest.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      values.has(name) ? { value: values.get(name) } : undefined,
    set: (name: string, value: string) => {
      values.set(name, value);
    },
    delete: (name: string) => {
      values.delete(name);
    },
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  fetchMock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 200 }));
});
afterEach(() => jest.restoreAllMocks());
it("revokes the browser even when its login cookie has expired", async () => {
  values.set(pushCookie, secret);
  await revokeBrowserPush();
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/push-devices/revoke"),
    expect.objectContaining({
      body: JSON.stringify({ secret }),
      method: "POST",
    }),
  );
  expect(values.has(pushCookie)).toBe(false);
});
it("retains cleanup credentials on failure, allows logout, and retries on the next login", async () => {
  values.set(pushCookie, secret);
  fetchMock.mockRejectedValue(new Error("offline"));
  await expect(revokePushOnLogout()).resolves.toBeUndefined();
  expect(values.get(pushCookie)).toBe(secret);
  await expect(revokeBrowserPush()).rejects.toThrow();
});
it("does not expose approval device cleanup credentials to the client", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        success: true,
        data: {
          accountStatus: "PENDING_APPROVAL",
          emailVerified: true,
          pushRegistered: true,
          revocationSecret: secret,
        },
      }),
    ),
  );
  const data = new FormData();
  data.set("email", "member@example.test");
  data.set("password", "valid-password");
  data.set("pushToken", "device:token");
  const result = await checkAccountStatus(
    { success: false, message: "" },
    data,
  );
  expect(result).toMatchObject({ success: true, pushRegistered: true });
  expect(result).not.toHaveProperty("revocationSecret");
  expect(values.get(pushCookie)).toBe(secret);
});
