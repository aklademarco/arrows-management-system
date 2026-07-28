import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FiCheck,
  FiClock,
  FiLogOut,
  FiMail,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import {
  adminLogout,
  approveRegistration,
  rejectRegistration,
} from "./actions";

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

async function getRegistrations(): Promise<Registration[]> {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) {
    redirect("/admin/login");
  }
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/admin/registrations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    throw new Error("Pending registrations could not be loaded.");
  }
  const body = (await response.json()) as { data: Registration[] };
  return body.data;
}

export default async function RegistrationsPage() {
  const registrations = await getRegistrations();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="font-bold text-[#240046]">ACMS</p>
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
              {registrations.length} pending
            </span>
          </div>
        </div>

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
                        {registration.requestedDepartmentName ?? "None selected"}
                      </p>
                    </div>
                  </div>
                  <span className="h-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    Email verified
                  </span>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-2">
                  <form action={approveRegistration} className="flex gap-2">
                    <input
                      name="userId"
                      type="hidden"
                      value={registration.id}
                    />
                    {registration.requestedDepartmentId ? (
                      <input
                        name="primaryDepartmentId"
                        type="hidden"
                        value={registration.requestedDepartmentId}
                      />
                    ) : null}
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#240046]"
                      name="note"
                      placeholder="Approval note (optional)"
                    />
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#240046] px-4 font-bold text-white hover:bg-[#17002e] disabled:cursor-not-allowed disabled:bg-slate-300"
                      type="submit"
                      disabled={!registration.requestedDepartmentId}
                    >
                      <FiCheck aria-hidden="true" />
                      Approve
                    </button>
                  </form>
                  <form action={rejectRegistration} className="flex gap-2">
                    <input name="userId" type="hidden" value={registration.id} />
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
      </div>
    </main>
  );
}
