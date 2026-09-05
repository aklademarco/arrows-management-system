import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendPublicityFlyer } from "../src/app/member/media-hub/actions";
import { generateEventLiturgy } from "../src/app/admin/(protected)/events/[eventId]/liturgy-actions";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const apiUrl = "https://acms.test/api/v1";
const eventId = "8e5b8f5e-dedc-44e8-a7e0-bd2d726d0d88";
const mediaDepartmentId = "bfebf317-92e5-4468-9205-cdc668a670d5";
const imageData = "data:image/png;base64,aW1hZ2U=";
const flyerInput = {
  title: "Sunday service",
  imageData,
  fileName: "flyer.png",
  mimeType: "image/png" as const,
};
const flyerAccess = {
  success: true,
  data: { canSubmitFlyer: true, mediaDepartment: { id: mediaDepartmentId } },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let sessionCookies: Map<string, string>;
let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  sessionCookies = new Map();
  jest.mocked(cookies).mockResolvedValue({
    get: (name: string) => {
      const value = sessionCookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
  } as Awaited<ReturnType<typeof cookies>>);
  jest.mocked(redirect).mockImplementation((destination) => {
    throw new Error(`Redirect: ${destination}`);
  });
  // No test may make a real API or Cloudinary request.
  fetchMock = jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("Unexpected fetch"));
  jest.replaceProperty(process, "env", {
    ...process.env,
    API_URL: apiUrl,
    CLOUDINARY_CLOUD_NAME: "acms-test",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const uploadCases = [
  {
    name: "publicity flyer using a leader session",
    cookie: "acms_leader_session",
    login: "/login",
    authorizationPath: "/ministry-content",
    authorizationBody: flyerAccess,
    submitPath: "/ministry-content/publicity-flyers",
    run: () => sendPublicityFlyer(flyerInput),
  },
  {
    name: "publicity flyer using a member session",
    cookie: "acms_member_session",
    login: "/login",
    authorizationPath: "/ministry-content",
    authorizationBody: flyerAccess,
    submitPath: "/ministry-content/publicity-flyers",
    run: () => sendPublicityFlyer(flyerInput),
  },
  {
    name: "preacher image",
    cookie: "acms_admin_session",
    login: "/admin/login",
    authorizationPath: `/events/${eventId}`,
    authorizationBody: { success: true, data: { id: eventId } },
    submitPath: `/liturgies/events/${eventId}/generate`,
    run: () => generateEventLiturgy({ eventId, imageData }),
  },
];

describe.each(uploadCases)("$name", (upload) => {
  it("rejects a missing session before making any requests", async () => {
    await expect(upload.run()).rejects.toThrow(`Redirect: ${upload.login}`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 500])(
    "does not upload when API authorization returns HTTP %s",
    async (status) => {
      sessionCookies.set(upload.cookie, "untrusted-cookie");
      fetchMock.mockResolvedValueOnce(jsonResponse({}, status));

      await expect(upload.run()).rejects.toThrow();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}${upload.authorizationPath}`,
        expect.objectContaining({
          headers: { Authorization: "Bearer untrusted-cookie" },
          cache: "no-store",
        }),
      );
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("does not upload when the authorization API is unreachable", async () => {
    sessionCookies.set(upload.cookie, "session-token");
    fetchMock.mockRejectedValueOnce(new Error("API unavailable"));

    await expect(upload.run()).rejects.toThrow("API unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, {}, { success: true, data: null }, { success: false }])(
    "fails closed for an invalid successful API response: %j",
    async (body) => {
      sessionCookies.set(upload.cookie, "session-token");
      fetchMock.mockResolvedValueOnce(jsonResponse(body));

      await expect(upload.run()).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("does not upload when the API returns invalid JSON", async () => {
    sessionCookies.set(upload.cookie, "session-token");
    fetchMock.mockResolvedValueOnce(new Response("not json"));

    await expect(upload.run()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("authorizes before uploading, then submits with the same session", async () => {
    sessionCookies.set(upload.cookie, "session-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse(upload.authorizationBody))
      .mockResolvedValueOnce(
        jsonResponse({
          secure_url:
            "https://res.cloudinary.com/acms-test/image/upload/image.png",
          public_id: "acms/image",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    await upload.run();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${apiUrl}${upload.authorizationPath}`,
      expect.objectContaining({
        headers: { Authorization: "Bearer session-token" },
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.cloudinary.com/v1_1/acms-test/image/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${apiUrl}${upload.submitPath}`,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer session-token",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }),
    );
    expect(revalidatePath).toHaveBeenCalled();
  });
});

it.each([
  { canSubmitFlyer: false, mediaDepartment: { id: mediaDepartmentId } },
  { canSubmitFlyer: "true", mediaDepartment: { id: mediaDepartmentId } },
  { canSubmitFlyer: true },
  { canSubmitFlyer: true, mediaDepartment: null },
])(
  "rejects flyers without explicit publicity access and a Media department: %j",
  async (data) => {
    sessionCookies.set("acms_leader_session", "session-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));

    await expect(sendPublicityFlyer(flyerInput)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

it("rejects preacher uploads if the API does not confirm the selected event", async () => {
  sessionCookies.set("acms_admin_session", "session-token");
  fetchMock.mockResolvedValueOnce(
    jsonResponse({
      success: true,
      data: { id: mediaDepartmentId },
    }),
  );

  await expect(generateEventLiturgy({ eventId, imageData })).rejects.toThrow();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("preserves API authorization when generating a liturgy without an image", async () => {
  sessionCookies.set("acms_admin_session", "session-token");
  fetchMock.mockResolvedValueOnce(jsonResponse({}, 403));

  await expect(generateEventLiturgy({ eventId })).rejects.toThrow(
    "Redirect: /admin/login",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    `${apiUrl}/liturgies/events/${eventId}/generate`,
    expect.objectContaining({ method: "POST" }),
  );
});
