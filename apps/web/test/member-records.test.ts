import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  memberRecordsApiPath,
  parseMemberRecordFilters,
  parseMemberRecordPaging,
  proxyMemberExport,
} from "../src/lib/member-records";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));

describe("member records filters", () => {
  it("keeps only known filters and trims the search", () => {
    expect(
      parseMemberRecordFilters({
        search: "  Ama  ",
        membershipStatus: "ON_LEAVE",
      }),
    ).toEqual({ search: "Ama", membershipStatus: "ON_LEAVE" });
  });

  it("drops an unknown membership status", () => {
    expect(
      parseMemberRecordFilters({ membershipStatus: "DROP TABLE" }),
    ).toEqual({});
  });

  it("accepts admin filters only when they are valid", () => {
    expect(
      parseMemberRecordFilters({
        accountStatus: "ARCHIVED",
        departmentId: "6f4c7333-098b-4a0f-9a48-cc6c5c345be9",
      }),
    ).toEqual({
      accountStatus: "ARCHIVED",
      departmentId: "6f4c7333-098b-4a0f-9a48-cc6c5c345be9",
    });
    expect(
      parseMemberRecordFilters({
        accountStatus: "PENDING_APPROVAL",
        departmentId: "not-a-uuid",
      }),
    ).toEqual({});
  });

  it("falls back to safe paging for invalid values", () => {
    expect(parseMemberRecordPaging({ page: "-3", limit: "5000" })).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it("builds the API path with the chosen rows per page", () => {
    expect(
      memberRecordsApiPath(
        { search: "Ama" },
        parseMemberRecordPaging({ page: "2", limit: "50" }),
      ),
    ).toBe("/members?search=Ama&page=2&limit=50");
  });
});

describe("proxyMemberExport", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.API_URL = "https://acms.test/api/v1";
    fetchMock = jest.spyOn(global, "fetch");
  });

  afterEach(() => fetchMock.mockRestore());

  it("forwards only the allowed filters with the portal session", async () => {
    jest.mocked(cookies).mockResolvedValue({
      get: () => ({ value: "pastor-token" }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([0x50, 0x4b]), {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="members-2026-11-09.xlsx"',
        },
      }),
    );

    const response = await proxyMemberExport(
      new NextRequest(
        "https://web.test/pastor/members/export?search=Ama&page=4&evil=1",
      ),
      "acms_pastor_session",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://acms.test/api/v1/members/export.xlsx?search=Ama",
      expect.objectContaining({
        headers: { Authorization: "Bearer pastor-token" },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "members-2026-11-09.xlsx",
    );
  });

  it("redirects to login without a session", async () => {
    jest.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const response = await proxyMemberExport(
      new NextRequest("https://web.test/leader/members/export"),
      "acms_leader_session",
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://web.test/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends administrators to the admin login page", async () => {
    jest.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const response = await proxyMemberExport(
      new NextRequest("https://web.test/admin/members/export"),
      "acms_admin_session",
      "/admin/login",
    );

    expect(response.headers.get("location")).toBe(
      "https://web.test/admin/login",
    );
  });
});
