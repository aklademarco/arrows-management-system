import Link from "next/link";
import {
  FiCheck,
  FiClock,
  FiLogOut,
  FiMail,
  FiSearch,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import {
  adminLogout,
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
  emailVerifiedAt: string;
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <Link className="font-bold text-[#240046]" href="/admin/dashboard">
              ACMS
            </Link>
            <p className="text-sm text-slate-500">Administration</p>
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
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">
              People
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Registration approvals
            </h1>
            <p className="mt-2 text-slate-600">
              Review verified accounts before granting member access.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <FiClock className="text-[#6b21a8]" aria-hidden="true" />
            <span className="text-sm font-semibold">
              {registrationPage.total} pending
            </span>
          </div>
          <Link
            className="font-bold text-[#6b21a8] hover:text-[#240046]"
            href="/admin/members"
          >
            Member directory
          </Link>
        </div>

        <form
          className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_18rem_auto]"
          method="get"
        >
          <label className="relative">
            <span className="sr-only">Search registrations</span>
            <FiSearch
              aria-hidden="true"
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 outline-none focus:border-[#240046]"
              defaultValue={parameters.search}
              name="search"
              placeholder="Search name, email, or phone"
            />
          </label>
          <label>
            <span className="sr-only">Filter by requested department</span>
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-[#240046]"
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
            className="h-11 rounded-lg bg-[#240046] px-5 font-bold text-white hover:bg-[#17002e]"
            type="submit"
          >
            Apply filters
          </button>
        </form>

        {registrations.length === 0 ? (
          <section className="mt-8 grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div>
              <FiUserCheck
                className="mx-auto text-5xl text-[#6b21a8]"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-xl font-bold">All caught up</h2>
              <p className="mt-2 text-slate-600">
                There are no verified registrations awaiting review.
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-5">
            {registrations.map((registration) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={registration.id}
              >
                <div className="flex flex-wrap justify-between gap-5">
                  <div className="flex gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f3e8ff] font-bold text-[#240046]">
                      {registration.firstName[0]}
                      {registration.lastName[0]}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold">
                        {registration.firstName} {registration.otherNames}{" "}
                        {registration.lastName}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                        <FiMail aria-hidden="true" />
                        {registration.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Registered{" "}
                        {new Intl.DateTimeFormat("en-GH", {
                          dateStyle: "medium",
                        }).format(new Date(registration.createdAt))}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Requested department:{" "}
                        {registration.requestedDepartmentName ??
                          "None selected"}
                      </p>
                    </div>
                  </div>
                  <span className="h-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    Email verified
                  </span>
                </div>
                <Link
                  className="mt-4 inline-flex text-sm font-bold text-[#6b21a8] hover:text-[#240046]"
                  href={`/admin/registrations/${registration.id}`}
                >
                  View registration details
                </Link>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
                  <form action={approveRegistration} className="grid gap-3">
                    <input
                      name="userId"
                      type="hidden"
                      value={registration.id}
                    />
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Primary department
                      <select
                        className="h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#240046]"
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
                        <legend className="text-sm font-semibold text-slate-700">
                          Additional departments
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {departmentOptions.map((department) => (
                            <label
                              className="inline-flex items-center gap-2 text-sm text-slate-600"
                              key={department.id}
                            >
                              <input
                                className="size-4 accent-[#240046]"
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
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#240046]"
                        name="note"
                        placeholder="Approval note (optional)"
                      />
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#240046] px-4 font-bold text-white hover:bg-[#17002e] disabled:cursor-not-allowed disabled:bg-slate-300"
                        type="submit"
                        disabled={departmentOptions.length === 0}
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
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-red-700"
                      name="reason"
                      placeholder="Reason for rejection"
                      required
                      minLength={3}
                    />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-4 font-bold text-red-700 hover:bg-red-50"
                      type="submit"
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                href={pageHref(registrationPage.page - 1)}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-slate-600">
              Page {registrationPage.page} of {registrationPage.totalPages}
            </span>
            {registrationPage.page < registrationPage.totalPages ? (
              <Link
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
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
