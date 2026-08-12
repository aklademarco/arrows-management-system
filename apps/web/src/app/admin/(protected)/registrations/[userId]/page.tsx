import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMail, FiPhone } from "react-icons/fi";
import { reactivateUser, suspendUser } from "../actions";
import { getAdminResource } from "../admin-api";

type RegistrationDetail = {
  id: string;
  email: string;
  phone: string | null;
  accountStatus: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  membershipStatus: string;
  requestedDepartmentId: string | null;
  requestedDepartmentName: string | null;
};

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const registration = await getAdminResource<RegistrationDetail>(
    `/admin/registrations/${userId}`,
    { notFoundOn404: true },
  );
  const fullName = [
    registration.firstName,
    registration.otherNames,
    registration.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300"
          href="/admin/registrations"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to registrations
        </Link>

        <header className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
                Registration details
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {fullName}
              </h1>
              <p className="mt-2 capitalize text-slate-400">
                {formatStatus(registration.accountStatus)}
              </p>
            </div>
            {registration.emailVerifiedAt ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">
                <FiCheckCircle aria-hidden="true" />
                Email verified
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-300">
                Email not verified
              </span>
            )}
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <h2 className="text-xl font-bold">Member information</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-slate-400">Email</dt>
              <dd className="mt-1 flex items-center gap-2">
                <FiMail aria-hidden="true" className="text-slate-400" />
                {registration.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-400">Phone</dt>
              <dd className="mt-1 flex items-center gap-2">
                <FiPhone aria-hidden="true" className="text-slate-400" />
                {registration.phone ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-400">
                Requested department
              </dt>
              <dd className="mt-1">
                {registration.requestedDepartmentName ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-400">
                Membership status
              </dt>
              <dd className="mt-1 capitalize">
                {formatStatus(registration.membershipStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-400">
                Registered
              </dt>
              <dd className="mt-1">
                {new Intl.DateTimeFormat("en-GH", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(new Date(registration.createdAt))}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-400">
                Email verified
              </dt>
              <dd className="mt-1">
                {registration.emailVerifiedAt
                  ? new Intl.DateTimeFormat("en-GH", {
                      dateStyle: "long",
                      timeStyle: "short",
                    }).format(new Date(registration.emailVerifiedAt))
                  : "Not yet verified"}
              </dd>
            </div>
          </dl>
        </section>

        {registration.accountStatus === "ACTIVE" ? (
          <section className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-rose-300">Suspend account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Suspension immediately blocks protected access while preserving
              the member&apos;s history.
            </p>
            <form action={suspendUser} className="mt-4 flex gap-3">
              <input name="userId" type="hidden" value={registration.id} />
              <input
                className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 px-3 outline-none focus:border-red-700"
                minLength={3}
                name="reason"
                placeholder="Reason for suspension"
                required
              />
              <button
                className="rounded-lg bg-red-700 px-5 font-bold text-white hover:bg-red-800"
                type="submit"
              >
                Suspend
              </button>
            </form>
          </section>
        ) : null}

        {registration.accountStatus === "SUSPENDED" ? (
          <section className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-300">
              Reactivate account
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Reactivation restores access using the member&apos;s existing
              roles and assignments.
            </p>
            <form action={reactivateUser} className="mt-4">
              <input name="userId" type="hidden" value={registration.id} />
              <button
                className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
                type="submit"
              >
                Reactivate
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
