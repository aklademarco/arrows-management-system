import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  archiveAnnouncement,
  saveAnnouncement,
  type SaveAnnouncementInput,
} from "../src/app/announcement-actions";
import { parseAnnouncementView } from "../src/lib/announcements";
import {
  churchWallTimeToIso,
  isoToChurchWallTime,
} from "../src/lib/church-time";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const apiUrl = "https://acms.test/api/v1";
const announcementId = "8e5b8f5e-dedc-44e8-a7e0-bd2d726d0d88";
const imageData = "data:image/webp;base64,aW1hZ2U=";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function input(
  overrides: Partial<SaveAnnouncementInput> = {},
): SaveAnnouncementInput {
  return {
    portal: "pastor",
    kind: "EVENT",
    title: "  Youth Night ",
    theme: "",
    description: "Worship and fellowship.",
    locationName: "",
    startsAt: "2026-12-05T18:00",
    endsAt: "",
    flyer: { action: "keep" },
    ...overrides,
  };
}

/** Body of the fetch call made to `url`, parsed as JSON. */
function bodySentTo(fetchMock: jest.SpiedFunction<typeof fetch>, url: string) {
  // Skip the permission check (a GET without a body) to the same URL.
  const call = fetchMock.mock.calls.find(
    ([target, init]) => target === url && init?.body !== undefined,
  );
  return JSON.parse(String(call?.[1]?.body)) as Record<string, unknown>;
}

let sessionCookies: Map<string, string>;
let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  sessionCookies = new Map([["acms_pastor_session", "pastor-token"]]);
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
  fetchMock.mockRestore();
  jest.restoreAllMocks();
});

describe("church time", () => {
  it("treats form times as Accra time regardless of the server clock", () => {
    expect(churchWallTimeToIso("2026-12-05T18:00")).toBe(
      "2026-12-05T18:00:00.000Z",
    );
    expect(churchWallTimeToIso("2026-07-01T09:30", "America/New_York")).toBe(
      "2026-07-01T13:30:00.000Z",
    );
  });

  it("round-trips a stored time back into the form", () => {
    expect(isoToChurchWallTime("2026-12-05T18:00:00.000Z")).toBe(
      "2026-12-05T18:00",
    );
    expect(isoToChurchWallTime(null)).toBe("");
  });

  it("rejects malformed values", () => {
    expect(churchWallTimeToIso("next friday")).toBeNull();
  });
});

describe("parseAnnouncementView", () => {
  it("falls back to safe defaults", () => {
    expect(
      parseAnnouncementView({ scope: "everything", kind: "PARTY", page: "-1" }),
    ).toEqual({ scope: "upcoming", kind: undefined, page: 1 });
  });
});

describe("saveAnnouncement", () => {
  it("publishes with Accra times and cleared blanks", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }, 201));

    await expect(saveAnnouncement(input())).rejects.toThrow(
      "Redirect: /pastor/announcements?feedback=success",
    );

    expect(bodySentTo(fetchMock, `${apiUrl}/announcements`)).toEqual({
      kind: "EVENT",
      title: "Youth Night",
      theme: null,
      description: "Worship and fellowship.",
      locationName: null,
      startsAt: "2026-12-05T18:00:00.000Z",
      endsAt: null,
    });
  });

  it("checks permission before uploading a flyer", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { canPublish: false } }),
    );

    const result = await saveAnnouncement(
      input({ flyer: { action: "replace", dataUrl: imageData } }),
    );

    expect(result).toEqual({
      error: "You do not have permission to save this post.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("cloudinary.com"),
      ),
    ).toBe(false);
  });

  it("uploads the flyer into the announcement folder, then saves it", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { canManage: true } }),
      )
      .mockImplementationOnce(async (_url, init) => {
        const publicId = (init?.body as FormData).get("public_id");
        return jsonResponse({
          secure_url: `https://res.cloudinary.com/acms-test/image/upload/v1/${String(publicId)}.webp`,
          public_id: publicId,
        });
      })
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    await expect(
      saveAnnouncement(
        input({
          id: announcementId,
          flyer: { action: "replace", dataUrl: imageData },
        }),
      ),
    ).rejects.toThrow("Redirect: /pastor/announcements?feedback=success");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${apiUrl}/announcements/${announcementId}`,
    );
    const sent = bodySentTo(fetchMock, `${apiUrl}/announcements/${announcementId}`);
    expect(sent.flyerPublicId).toMatch(/^acms\/announcement-flyers\/flyer-/);
    expect(sent.flyerUrl).toContain(String(sent.flyerPublicId));
  });

  it("rejects a non-image flyer before contacting anyone", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { canPublish: true } }),
    );

    const result = await saveAnnouncement(
      input({
        flyer: { action: "replace", dataUrl: "data:text/html;base64,PGI+" },
      }),
    );

    expect(result).toEqual({
      error: "Choose a JPEG, PNG, or WebP image under 5 MB.",
    });
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("cloudinary.com"),
      ),
    ).toBe(false);
  });

  it("returns the API's validation message", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Events need a start date and time." }, 400),
    );

    await expect(saveAnnouncement(input())).resolves.toEqual({
      error: "Events need a start date and time.",
    });
  });

  it("sends removed flyers as null", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));

    await expect(
      saveAnnouncement(
        input({ id: announcementId, flyer: { action: "remove" } }),
      ),
    ).rejects.toThrow("Redirect:");

    expect(
      bodySentTo(fetchMock, `${apiUrl}/announcements/${announcementId}`),
    ).toMatchObject({ flyerUrl: null, flyerPublicId: null });
  });

  it("refuses the member portal", async () => {
    const result = await saveAnnouncement(
      input({ portal: "member" as SaveAnnouncementInput["portal"] }),
    );
    expect(result.error).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends people without a session to log in", async () => {
    sessionCookies.clear();
    await expect(saveAnnouncement(input())).rejects.toThrow("Redirect: /login");
  });
});

describe("archiveAnnouncement", () => {
  it("archives with the admin session and returns to the admin board", async () => {
    sessionCookies.set("acms_admin_session", "admin-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
    const form = new FormData();
    form.set("portal", "admin");
    form.set("id", announcementId);

    await expect(archiveAnnouncement(form)).rejects.toThrow(
      "Redirect: /admin/announcements?feedback=success",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/announcements/${announcementId}/archive`,
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer admin-token" },
      }),
    );
  });
});
