import Link from "next/link";
import { FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";
import { reactivateUser, suspendUser } from "../../registrations/actions";
import { getAdminResource } from "../../registrations/admin-api";
import {
  addMemberToDepartment,
  archiveMember,
  endDepartmentMembership,
  setPrimaryDepartment,
  updateMember,
} from "../actions";

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
    departmentId: string;
    departmentName: string;
    joinedAt: string;
    leftAt: string | null;
    isActive: boolean;
    isPrimary: boolean;
  }>;
};
type Department = { id: string; name: string; isActive: boolean };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const [member, departments] = await Promise.all([
    getAdminResource<MemberProfile>(`/members/${memberId}`),
    getAdminResource<Department[]>("/departments"),
  ]);
  const name = [member.firstName, member.otherNames, member.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-violet-400"
          href="/admin/members"
        >
          <FiArrowLeft /> Back to members
        </Link>
        <header className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
                Member profile
              </p>
              <h1 className="mt-2 text-3xl font-bold">{name}</h1>
              <p className="mt-2 capitalize text-slate-400">
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

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <h2 className="text-xl font-bold">Department history</h2>
          {member.departmentMemberships.length === 0 ? (
            <p className="mt-4 text-slate-400">No department assignments.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {member.departmentMemberships.map((membership) => (
                <div
                  className="flex flex-wrap justify-between gap-3 rounded-xl border border-white/10 p-4"
                  key={membership.id}
                >
                  <div>
                    <p className="font-bold">
                      <Link
                        className="text-violet-400 hover:underline"
                        href={`/admin/members?departmentId=${membership.departmentId}`}
                      >
                        {membership.departmentName}
                      </Link>
                      {membership.isPrimary ? " · Primary" : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Joined {membership.joinedAt}
                      {membership.leftAt ? ` · Left ${membership.leftAt}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {membership.isActive ? "Active" : "Historical"}
                  </span>
                  {membership.isActive ? (
                    <details className="w-full border-t border-white/[0.07] pt-3">
                      <summary className="cursor-pointer text-sm font-bold text-red-700">
                        End membership
                      </summary>
                      <form
                        action={endDepartmentMembership}
                        className="mt-3 grid gap-3 md:grid-cols-2"
                      >
                        <input
                          name="memberId"
                          type="hidden"
                          value={member.id}
                        />
                        <input
                          name="departmentId"
                          type="hidden"
                          value={membership.departmentId}
                        />
                        <input
                          name="membershipId"
                          type="hidden"
                          value={membership.id}
                        />
                        <input
                          className="h-10 rounded-lg border border-white/15 px-3"
                          name="leftAt"
                          type="date"
                        />
                        <input
                          className="h-10 rounded-lg border border-white/15 px-3"
                          minLength={3}
                          name="reason"
                          placeholder="Reason"
                          required
                        />
                        {membership.isPrimary ? (
                          <select
                            className="h-10 rounded-lg border border-white/15 bg-[#111318] px-3"
                            name="replacementPrimaryMembershipId"
                          >
                            <option value="">No replacement primary</option>
                            {member.departmentMemberships
                              .filter(
                                (candidate) =>
                                  candidate.isActive &&
                                  candidate.id !== membership.id,
                              )
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.departmentName}
                                </option>
                              ))}
                          </select>
                        ) : null}
                        <button className="h-10 rounded-lg bg-red-700 px-4 font-bold text-white">
                          End membership
                        </button>
                      </form>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {member.departmentMemberships.some(
          (membership) => membership.isActive,
        ) ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
            <h2 className="text-xl font-bold">Primary department</h2>
            <form
              action={setPrimaryDepartment}
              className="mt-4 grid gap-3 md:grid-cols-2"
            >
              <input name="memberId" type="hidden" value={member.id} />
              <select
                className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3"
                defaultValue={
                  member.departmentMemberships.find(
                    (membership) => membership.isActive && membership.isPrimary,
                  )?.id ?? ""
                }
                name="departmentMembershipId"
              >
                <option value="">No primary department</option>
                {member.departmentMemberships
                  .filter((membership) => membership.isActive)
                  .map((membership) => (
                    <option key={membership.id} value={membership.id}>
                      {membership.departmentName}
                    </option>
                  ))}
              </select>
              <input
                className="h-11 rounded-lg border border-white/15 px-3"
                name="effectiveOn"
                type="date"
              />
              <input
                className="h-11 rounded-lg border border-white/15 px-3"
                minLength={3}
                name="reason"
                placeholder="Reason for change"
                required
              />
              <button className="h-11 rounded-lg bg-violet-600 px-5 font-bold text-white">
                Update primary department
              </button>
            </form>
          </section>
        ) : null}

        {member.accountStatus !== "ARCHIVED" ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
            <h2 className="text-xl font-bold">Add department membership</h2>
            <form
              action={addMemberToDepartment}
              className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem_auto_auto]"
            >
              <input name="memberId" type="hidden" value={member.id} />
              <select
                className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3"
                name="departmentId"
                required
              >
                <option value="">Select department</option>
                {departments
                  .filter((department) => department.isActive)
                  .map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
              <input
                className="h-11 rounded-lg border border-white/15 px-3"
                name="joinedAt"
                type="date"
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="makePrimary" type="checkbox" />
                Make primary
              </label>
              <button className="h-11 rounded-lg bg-violet-600 px-5 font-bold text-white md:col-start-4">
                Add membership
              </button>
            </form>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-sm">
          <h2 className="text-xl font-bold">Edit member</h2>
          <form
            action={updateMember}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <input name="memberId" type="hidden" value={member.id} />
            <label className="grid gap-2 text-sm font-semibold">
              First name
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={member.firstName}
                name="firstName"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Last name
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={member.lastName}
                name="lastName"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Other names
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={member.otherNames ?? ""}
                name="otherNames"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Phone
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={member.phone ?? ""}
                name="phone"
                placeholder="+233240000000"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Membership status
              <select
                className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3 font-normal"
                defaultValue={member.membershipStatus}
                name="membershipStatus"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <div className="flex items-end">
              <button className="h-11 rounded-lg bg-violet-600 px-5 font-bold text-white">
                Save changes
              </button>
            </div>
          </form>
        </section>

        {member.accountStatus === "ACTIVE" ? (
          <form
            action={suspendUser}
            className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-[#111318] p-6"
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
            className="mt-6 rounded-2xl border border-green-200 bg-[#111318] p-6"
          >
            <input name="userId" type="hidden" value={member.userId} />
            <input name="memberId" type="hidden" value={member.id} />
            <button className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white">
              Reactivate account
            </button>
          </form>
        ) : null}

        {member.accountStatus !== "ARCHIVED" ? (
          <section className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-6">
            <h2 className="text-xl font-bold text-red-900">Archive member</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Archiving removes account access and closes current department
              assignments. Historical records are preserved.
            </p>
            <form action={archiveMember} className="mt-4">
              <input name="memberId" type="hidden" value={member.id} />
              <button className="rounded-lg bg-red-800 px-5 py-3 font-bold text-white hover:bg-red-900">
                Archive member
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
