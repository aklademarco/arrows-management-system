import Link from "next/link";
import {
  FiCheck,
  FiClock,
  FiMail,
  FiSearch,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import {
  approveRegistration,
  rejectRegistration,
} from "./actions";
import { getAdminResource } from "./admin-api";

type Registration = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  requestedDepartmentId: string | null;
  requestedDepartmentName: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

type RegistrationsPageData = {
  items: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    requestedDepartmentId?: string;
    page?: string;
  }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams();
  if (parameters.search) {
    query.set("search", parameters.search);
  }
  if (parameters.requestedDepartmentId) {
    query.set("requestedDepartmentId", parameters.requestedDepartmentId);
  }
  query.set("page", parameters.page ?? "1");

  const [registrationPage, departmentOptions] = await Promise.all([
    getAdminResource<RegistrationsPageData>(
      `/admin/registrations?${query.toString()}`,
    ),
    getAdminResource<DepartmentOption[]>(
      "/admin/registrations/department-options",
    ),
  ]);
  const registrations = registrationPage.items;
  const pageHref = (page: number) => {
    const nextQuery = new URLSearchParams(query);
    nextQuery.set("page", String(page));
    return `/admin/registrations?${nextQuery.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
              People
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Registration approvals
            </h1>
            <p className="mt-2 text-slate-400">
              Review registrations and track email verification before granting member access.
            </p>
          </div>
          <div className="ml-auto inline-flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-amber-200">
            <FiClock className="text-amber-300" aria-hidden="true" />
            <span className="text-sm font-semibold">{registrationPage.total} pending</span>
          </div>
          <Link
            className="font-bold text-violet-400 hover:text-violet-300"
            href="/admin/members"
          >
            Member directory
          </Link>
        </div>

        <form
          className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#111318] p-4 shadow-sm md:grid-cols-[1fr_18rem_auto]"
          method="get"
        >
          <label className="relative">
            <span className="sr-only">Search registrations</span>
            <FiSearch
              aria-hidden="true"
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="h-11 w-full rounded-lg border border-white/15 pl-10 pr-3 outline-none focus:border-violet-400"
              defaultValue={parameters.search}
              name="search"
              placeholder="Search name, email, or phone"
            />
          </label>
          <label>
            <span className="sr-only">Filter by requested department</span>
            <select
              className="h-11 w-full rounded-lg border border-white/15 bg-[#111318] px-3 outline-none focus:border-violet-400"
              defaultValue={parameters.requestedDepartmentId ?? ""}
              name="requestedDepartmentId"
            >
              <option value="">All requested departments</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-11 rounded-lg bg-slate-100 px-5 font-bold text-slate-950 transition hover:bg-white"
            type="submit"
          >
            Apply filters
          </button>
        </form>

        {registrations.length === 0 ? (
          <section className="mt-8 grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-[#111318] p-8 text-center">
            <div>
              <FiUserCheck
                className="mx-auto text-5xl text-violet-400"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-xl font-bold">All caught up</h2>
              <p className="mt-2 text-slate-400">
                There are no registrations awaiting review.
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-5">
            {registrations.map((registration) => (
              <article
                className="rounded-xl border border-white/10 bg-[#111318] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.16)] transition hover:border-white/15"
                key={registration.id}
              >
                <div className="flex flex-wrap justify-between gap-5">
                  <div className="flex gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-violet-500/15 font-bold text-violet-300">
                      {registration.firstName[0]}
                      {registration.lastName[0]}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold">
                        {registration.firstName} {registration.otherNames}{" "}
                        {registration.lastName}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <FiMail aria-hidden="true" />
                        {registration.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Registered{" "}
                        {new Intl.DateTimeFormat("en-GH", {
                          dateStyle: "medium",
                        }).format(new Date(registration.createdAt))}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Requested department:{" "}
                        {registration.requestedDepartmentName ??
                          "None selected"}
                      </p>
                    </div>
                  </div>
                  <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${registration.emailVerifiedAt ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                    {registration.emailVerifiedAt ? "Email verified" : "Awaiting email verification"}
                  </span>
                </div>
                <Link
                  className="mt-4 inline-flex text-sm font-bold text-violet-400 hover:text-violet-300"
                  href={`/admin/registrations/${registration.id}`}
                >
                  View registration details
                </Link>

                {!registration.emailVerifiedAt ? (
                  <p className="mt-5 rounded-lg border border-amber-400/15 bg-amber-400/[0.08] p-3 text-sm text-amber-200">
                    Review controls will become available after the member verifies their email address.
                  </p>
                ) : null}
                <div className={`mt-5 grid gap-4 border-t border-white/[0.07] pt-5 lg:grid-cols-2 ${registration.emailVerifiedAt ? "" : "pointer-events-none opacity-50"}`} aria-disabled={!registration.emailVerifiedAt}>
                  <form action={approveRegistration} className="grid gap-3">
                    <input
                      name="userId"
                      type="hidden"
                      value={registration.id}
                    />
                    <label className="grid gap-2 text-sm font-semibold text-slate-300">
                      Primary department
                      <select
                        className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3 font-normal outline-none focus:border-violet-400"
                        defaultValue={registration.requestedDepartmentId ?? ""}
                        name="primaryDepartmentId"
                        required
                      >
                        <option disabled value="">
                          Select a department
                        </option>
                        {departmentOptions.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {departmentOptions.length > 1 ? (
                      <fieldset>
                        <legend className="text-sm font-semibold text-slate-300">
                          Additional departments
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {departmentOptions.map((department) => (
                            <label
                              className="inline-flex items-center gap-2 text-sm text-slate-400"
                              key={department.id}
                            >
                              <input
                                className="size-4 accent-violet-500"
                                name="additionalDepartmentIds"
                                type="checkbox"
                                value={department.id}
                              />
                              {department.name}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ) : null}
                    <div className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-white/15 px-3 text-sm outline-none focus:border-violet-400"
                        name="note"
                        placeholder="Approval note (optional)"
                      />
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-4 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        type="submit"
                        disabled={departmentOptions.length === 0 || !registration.emailVerifiedAt}
                      >
                        <FiCheck aria-hidden="true" />
                        Approve
                      </button>
                    </div>
                  </form>
                  <form action={rejectRegistration} className="flex gap-2">
                    <input
                      name="userId"
                      type="hidden"
                      value={registration.id}
                    />
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-white/15 px-3 text-sm outline-none focus:border-red-700"
                      name="reason"
                      placeholder="Reason for rejection"
                      required
                      minLength={3}
                    />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-4 font-bold text-rose-300 transition hover:bg-rose-400/10"
                      type="submit"
                      disabled={!registration.emailVerifiedAt}
                    >
                      <FiX aria-hidden="true" />
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}

        {registrationPage.totalPages > 1 ? (
          <nav
            aria-label="Registration pages"
            className="mt-8 flex items-center justify-between"
          >
            {registrationPage.page > 1 ? (
              <Link
                className="rounded-lg border border-white/15 bg-[#111318] px-4 py-2 text-sm font-semibold hover:bg-[#090a0d]"
                href={pageHref(registrationPage.page - 1)}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-slate-400">
              Page {registrationPage.page} of {registrationPage.totalPages}
            </span>
            {registrationPage.page < registrationPage.totalPages ? (
              <Link
                className="rounded-lg border border-white/15 bg-[#111318] px-4 py-2 text-sm font-semibold hover:bg-[#090a0d]"
                href={pageHref(registrationPage.page + 1)}
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
