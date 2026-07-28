import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMail, FiPhone } from "react-icons/fi";
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
  );
  const fullName = [
    registration.firstName,
    registration.otherNames,
    registration.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6b21a8] hover:text-[#240046]"
          href="/admin/registrations"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to registrations
        </Link>

        <header className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">
                Registration details
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {fullName}
              </h1>
              <p className="mt-2 capitalize text-slate-600">
                {formatStatus(registration.accountStatus)}
              </p>
            </div>
            {registration.emailVerifiedAt ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-800">
                <FiCheckCircle aria-hidden="true" />
                Email verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">
                Email not verified
              </span>
            )}
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Member information</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Email</dt>
              <dd className="mt-1 flex items-center gap-2">
                <FiMail aria-hidden="true" className="text-slate-400" />
                {registration.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Phone</dt>
              <dd className="mt-1 flex items-center gap-2">
                <FiPhone aria-hidden="true" className="text-slate-400" />
                {registration.phone ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Requested department
              </dt>
              <dd className="mt-1">
                {registration.requestedDepartmentName ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
                Membership status
              </dt>
              <dd className="mt-1 capitalize">
                {formatStatus(registration.membershipStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">
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
              <dt className="text-sm font-semibold text-slate-500">
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
      </div>
    </main>
  );
}
