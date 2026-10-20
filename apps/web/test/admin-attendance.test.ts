import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { saveAttendance } from "../src/app/admin/(protected)/events/[eventId]/attendance/actions";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  unstable_rethrow: jest.fn(),
}));
const eventId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";
const attendanceId = "33333333-3333-4333-8333-333333333333";
let fetchMock: jest.SpiedFunction<typeof fetch>;
const initial = { status: "idle" as const, message: "" };
function form(recordId = "") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    eventId,
    memberId,
    attendanceId: recordId,
    status: "ON_TIME",
    reason: " Present but phone unavailable ",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  jest
    .mocked(cookies)
    .mockResolvedValue({
      get: () => ({ value: "admin-session" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
  fetchMock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("{}", { status: 200 }));
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
it("records a missed check-in using the authenticated manual endpoint", async () => {
  expect((await saveAttendance(initial, form())).status).toBe("success");
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/attendance/manual"),
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer admin-session",
      }),
      body: JSON.stringify({
        eventId,
        memberId,
        status: "ON_TIME",
        reason: "Present but phone unavailable",
      }),
    }),
  );
  expect(revalidatePath).toHaveBeenCalledWith(
    `/admin/events/${eventId}/attendance`,
  );
});
it("corrects an existing absent record instead of creating a duplicate", async () => {
  expect((await saveAttendance(initial, form(attendanceId))).status).toBe(
    "success",
  );
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`/attendance/${attendanceId}`),
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        status: "ON_TIME",
        reviewNote: "Present but phone unavailable",
      }),
    }),
  );
});
it.each([
  ["memberId", "invalid"],
  ["reason", "   "],
  ["status", "ABSENT"],
])("rejects invalid manual %s", async (key, value) => {
  const data = form();
  data.set(key, value);
  expect((await saveAttendance(initial, data)).status).toBe("error");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("shows API conflicts without reporting success", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        message: "Attendance already exists for this member and event.",
      }),
      { status: 409 },
    ),
  );
  expect(await saveAttendance(initial, form())).toEqual({
    status: "error",
    message: "Attendance already exists for this member and event.",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});
