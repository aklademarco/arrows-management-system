import Link from "next/link";
import {
  FiArrowRight,
  FiClock,
  FiGrid,
  FiLogOut,
  FiUsers,
} from "react-icons/fi";
import { adminLogout } from "../registrations/actions";
import { getAdminResource } from "../registrations/admin-api";

type CountPage = { total: number };
type Department = { id: string; name: string; isActive: boolean };

export default async function AdminDashboardPage() {
  const [members, registrations, departments] = await Promise.all([
    getAdminResource<CountPage>("/members?limit=1"),
    getAdminResource<CountPage>("/admin/registrations?limit=1"),
    getAdminResource<Department[]>("/departments"),
  ]);

  const cards = [
    {
      title: "Members",
      description:
        "Search member profiles, review departments, and manage account status.",
      href: "/admin/departments",
      count: members.total,
      countLabel: "approved members",
      icon: FiUsers,
    },
    {
      title: "Registration approvals",
      description:
        "Review verified registrations and assign roles and departments.",
      href: "/admin/registrations",
      count: registrations.total,
      countLabel: "awaiting review",
      icon: FiClock,
    },
    {
      title: "Departments",
      description:
        "View the departments currently available for member assignment.",
      href: "/admin/members",
      count: departments.filter((department) => department.isActive).length,
      countLabel: "departments",
      icon: FiGrid,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="font-bold text-[#240046]">ACMS</p>
            <p className="text-sm text-slate-500">Administration dashboard</p>
          </div>
          <form action={adminLogout}>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              type="submit"
            >
              <FiLogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Church administration
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose an area below to manage people and church operations.
        </p>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md"
                href={card.href}
                key={card.title}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-purple-50 text-2xl text-[#6b21a8]">
                    <Icon aria-hidden="true" />
                  </span>
                  <FiArrowRight
                    aria-hidden="true"
                    className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#6b21a8]"
                  />
                </div>
                <h2 className="mt-5 text-xl font-bold">{card.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
                <p className="mt-5 border-t border-slate-100 pt-4">
                  <span className="text-2xl font-bold text-[#240046]">
                    {card.count}
                  </span>{" "}
                  <span className="text-sm text-slate-500">
                    {card.countLabel}
                  </span>
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
