import { feedBasePath, formatAge, isUuid, positivePage } from "../src/lib/feed";

describe("feed helpers", () => {
  it("places the feed beside each portal's events board", () => {
    expect(feedBasePath("admin")).toBe("/admin/feed");
    expect(feedBasePath("pastor")).toBe("/pastor/feed");
    expect(feedBasePath("leader")).toBe("/leader/feed");
    expect(feedBasePath("member")).toBe("/member/feed");
  });

  it("shows Reddit-style ages, then a date after a week", () => {
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
