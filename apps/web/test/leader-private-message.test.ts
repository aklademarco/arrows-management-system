import { cookies } from "next/headers";
import { sendLeadershipMessage } from "../src/app/leader/messages/actions";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
const memberId = "11111111-1111-4111-8111-111111111111";
let fetchMock: jest.SpiedFunction<typeof fetch>;
beforeEach(() => {
  jest
    .mocked(cookies)
    .mockResolvedValue({
      get: () => ({ value: "leader-session" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
  fetchMock = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify({ data: { recipientCount: 1 } }), {
        status: 200,
      }),
    );
});
afterEach(() => jest.restoreAllMocks());
function message() {
  const form = new FormData();
  form.set("audience", "MEMBER");
  form.set("recipientMemberId", memberId);
  form.set("title", "Hello");
  form.set("body", "Private follow-up");
  return form;
}
it("submits one private recipient with no SMS or department broadcast", async () => {
  const result = await sendLeadershipMessage(
    { status: "idle", message: "" },
    message(),
  );
  expect(result.status).toBe("success");
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/leadership-messages"),
    expect.objectContaining({
      body: JSON.stringify({
        audience: "MEMBER",
        title: "Hello",
        body: "Private follow-up",
        departmentIds: [],
        smsRequested: false,
        recipientMemberId: memberId,
      }),
    }),
  );
});
it("reports revoked access without claiming delivery", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
  expect(
    (await sendLeadershipMessage({ status: "idle", message: "" }, message()))
      .status,
  ).toBe("error");
});
it("rejects malformed recipient IDs before sending", async () => {
  const form = message();
  form.set("recipientMemberId", "invalid");
  expect(
    (await sendLeadershipMessage({ status: "idle", message: "" }, form)).status,
  ).toBe("error");
  expect(fetchMock).not.toHaveBeenCalled();
});
