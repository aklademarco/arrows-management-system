import {
  feedBasePath,
  feedComposePath,
  feedListPath,
  feedMenuOptions,
  formatAge,
  isUuid,
  positivePage,
} from "../src/lib/feed";

describe("feed helpers", () => {
  it.each(["leader", "pastor", "admin"] as const)(
    "provides working feed actions for %s",
    (portal) => {
      const options = feedMenuOptions(portal, {
        canPublish: true,
        canModerate: true,
      });
      expect(options.map((option) => option.href)).toEqual([
        `/${portal}/feed/browse`,
        `/${portal}/feed/new`,
        `/${portal}/announcements`,
        ...(portal === "leader" ? [] : [`/${portal}/feed/reports`]),
      ]);
    },
  );

  it("omits publishing and moderation actions when capabilities are absent", () => {
    const options = feedMenuOptions("pastor", {
      canPublish: false,
      canModerate: false,
    });
    expect(options.map((option) => option.title)).toEqual([
      "View feed",
      "Church events",
    ]);
  });

  it("places the feed beside each portal's events board", () => {
    expect(feedBasePath("admin")).toBe("/admin/feed");
    expect(feedBasePath("pastor")).toBe("/pastor/feed");
    expect(feedBasePath("leader")).toBe("/leader/feed");
    expect(feedBasePath("member")).toBe("/member/feed");
  });

  it("opens a menu for publishers and the posts directly for members", () => {
    expect(feedListPath("member")).toBe("/member/feed");
    expect(feedListPath("pastor")).toBe("/pastor/feed/browse");
    expect(feedListPath("admin")).toBe("/admin/feed/browse");
    expect(feedComposePath("leader")).toBe("/leader/feed/new");
    expect(
      feedComposePath("pastor", "3f2b8c4e-1d2a-4c3b-9e8f-0a1b2c3d4e5f"),
    ).toBe("/pastor/feed/new?edit=3f2b8c4e-1d2a-4c3b-9e8f-0a1b2c3d4e5f");
  });

  it("shows short ages, then a date after a week", () => {
    const now = Date.parse("2026-11-12T12:00:00Z");
    expect(formatAge("2026-11-12T11:59:30Z", now)).toBe("just now");
    expect(formatAge("2026-11-12T11:55:00Z", now)).toBe("5m ago");
    expect(formatAge("2026-11-12T09:00:00Z", now)).toBe("3h ago");
    expect(formatAge("2026-11-10T12:00:00Z", now)).toBe("2d ago");
    expect(formatAge("2026-10-01T12:00:00Z", now)).toBe("1 Oct 2026");
    // Clock skew never shows a future age.
    expect(formatAge("2026-11-12T12:05:00Z", now)).toBe("just now");
  });

  it("accepts only UUIDs as post IDs", () => {
    expect(isUuid("3f2b8c4e-1d2a-4c3b-9e8f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("reports")).toBe(false);
    expect(isUuid("../admin")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it("falls back to page 1 for bad page numbers", () => {
    expect(positivePage("3")).toBe(3);
    expect(positivePage(undefined)).toBe(1);
    expect(positivePage("0")).toBe(1);
    expect(positivePage("-2")).toBe(1);
    expect(positivePage("1.5")).toBe(1);
    expect(positivePage("abc")).toBe(1);
  });
});
