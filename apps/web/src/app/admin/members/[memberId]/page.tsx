import Link from "next/link";
import { FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";
import { reactivateUser, suspendUser } from "../../registrations/actions";
import { getAdminResource } from "../../registrations/admin-api";

type MemberProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  accountStatus: string;
  membershipStatus: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  departmentMemberships: Array<{
    id: string;
    departmentName: string;
    joinedAt: string;
    leftAt: string | null;
    isActive: boolean;
    isPrimary: boolean;
  }>;
};

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getAdminResource<MemberProfile>(`/members/${memberId}`);
  const name = [member.firstName, member.otherNames, member.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#6b21a8]"
          href="/admin/members"
        >
          <FiArrowLeft /> Back to members
        </Link>
        <header className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">
                Member profile
              </p>
              <h1 className="mt-2 text-3xl font-bold">{name}</h1>
              <p className="mt-2 capitalize text-slate-600">
                {member.accountStatus.toLowerCase()} account ·{" "}
                {member.membershipStatus.toLowerCase()} membership
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <FiMail /> {member.email}
              </p>
              <p className="flex items-center gap-2">
                <FiPhone /> {member.phone ?? "Not provided"}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Department history</h2>
          {member.departmentMemberships.length === 0 ? (
            <p className="mt-4 text-slate-600">No department assignments.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {member.departmentMemberships.map((membership) => (
                <div
                  className="flex flex-wrap justify-between gap-3 rounded-xl border border-slate-200 p-4"
                  key={membership.id}
                >
                  <div>
                    <p className="font-bold">
                      {membership.departmentName}
                      {membership.isPrimary ? " · Primary" : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Joined {membership.joinedAt}
                      {membership.leftAt ? ` · Left ${membership.leftAt}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {membership.isActive ? "Active" : "Historical"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {member.accountStatus === "ACTIVE" ? (
          <form
            action={suspendUser}
            className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-white p-6"
          >
            <input name="userId" type="hidden" value={member.userId} />
            <input name="memberId" type="hidden" value={member.id} />
            <input
              className="h-11 min-w-0 flex-1 rounded-lg border px-3"
              minLength={3}
              name="reason"
              placeholder="Suspension reason"
              required
            />
            <button className="rounded-lg bg-red-700 px-5 font-bold text-white">
              Suspend
            </button>
          </form>
        ) : null}
        {member.accountStatus === "SUSPENDED" ? (
          <form
            action={reactivateUser}
            className="mt-6 rounded-2xl border border-green-200 bg-white p-6"
          >
            <input name="userId" type="hidden" value={member.userId} />
            <input name="memberId" type="hidden" value={member.id} />
            <button className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white">
              Reactivate account
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
