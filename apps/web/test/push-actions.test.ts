import { cookies } from "next/headers";
import { updatePushDevice } from "../src/app/push-actions";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
let fetchMock: jest.SpiedFunction<typeof fetch>;
beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { revocationSecret: "a".repeat(64) } }), { status: 200 }));
  jest.mocked(cookies).mockResolvedValue({ get: (name: string) => name === "acms_member_session" ? { value: "session" } : undefined, set: jest.fn(), delete: jest.fn() } as unknown as Awaited<ReturnType<typeof cookies>>);
});
afterEach(() => jest.restoreAllMocks());

it("does not register unauthenticated browsers", async () => {
  jest.mocked(cookies).mockResolvedValue({ get: () => undefined } as unknown as Awaited<ReturnType<typeof cookies>>);
  expect((await updatePushDevice({ token: "device:token", enabled: true })).success).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("rejects malformed and oversized tokens before contacting the API", async () => {
  for (const token of ["", "bad token", "x".repeat(4097)]) {
    expect((await updatePushDevice({ token, enabled: true })).success).toBe(false);
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([true, false])("uses server credentials when enabled=%s", async (enabled) => {
  expect((await updatePushDevice({ token: "device:token", enabled })).success).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/notifications/push-device"), expect.objectContaining({
    method: enabled ? "PUT" : "DELETE",
    headers: { Authorization: "Bearer session", "Content-Type": "application/json" },
    body: JSON.stringify({ token: "device:token" }),
  }));
});
it("does not report successful registration on API failure", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
  expect((await updatePushDevice({ token: "device:token", enabled: true })).success).toBe(false);
  fetchMock.mockRejectedValue(new Error("offline"));
  expect((await updatePushDevice({ token: "device:token", enabled: true })).success).toBe(false);
});
