import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LeaderNavigation } from "../src/components/leader-navigation";
import { PastorNavigation } from "../src/components/pastor-navigation";
import { PortalNavigation } from "../src/components/portal-navigation";
import { FeedNavigationLink } from "../src/components/feed/feed-navigation-link";
import { AdminDashboardNavigation } from "../src/components/admin-dashboard-navigation";

jest.mock("next/navigation", () => ({ usePathname: () => "/leader" }));

describe("feed navigation", () => {
  it.each(["leader", "pastor", "admin"] as const)(
    "renders a dialog trigger rather than navigating for %s",
    (portal) => {
      const html = renderToStaticMarkup(
        createElement(
          FeedNavigationLink,
          {
            portal,
            href: `/${portal}/feed`,
          },
          "Feed",
        ),
      );
      expect(html).toContain('aria-haspopup="dialog"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-label="Feed actions"');
      expect(html).not.toContain(`href="/${portal}/feed"`);
    },
  );

  it("keeps member navigation and non-feed destinations as links", () => {
    for (const [portal, href] of [
      ["member", "/member/feed"],
      ["admin", "/admin/members"],
    ] as const) {
      const html = renderToStaticMarkup(
        createElement(FeedNavigationLink, { portal, href }, "Go"),
      );
      expect(html).toContain(`href="${href}"`);
      expect(html).not.toContain('aria-haspopup="dialog"');
    }
  });

  it("connects desktop and mobile leader navigation and desktop pastor/admin navigation", () => {
    const navigation = [
      createElement(LeaderNavigation),
      createElement(LeaderNavigation, { mobile: true }),
      createElement(PastorNavigation),
      createElement(PortalNavigation, { portal: "admin" }),
      createElement(AdminDashboardNavigation, { showAuditLogs: false }),
      createElement(AdminDashboardNavigation, {
        showAuditLogs: false,
        rail: true,
      }),
    ];
    for (const element of navigation) {
      expect(renderToStaticMarkup(element)).toContain('aria-haspopup="dialog"');
    }
  });
});
