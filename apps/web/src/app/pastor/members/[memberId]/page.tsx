import Link from "next/link";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { getPastorResource } from "../../pastor-api";

type Member = {
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  accountStatus: string;
  membershipStatus: string;
  roles: string[];
  departmentMemberships: {
    id: string;
    departmentId: string;
    departmentName: string;
    isActive: boolean;
    isPrimary: boolean;
  }[];
};

export default async function PastorMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  const member = await getPastorResource<Member>(`/members/${memberId}`);

  const name = [member.firstName, member.otherNames, member.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-purple-700"
          href="/pastor/members"
        >
          <FiArrowLeft />
          Members
        </Link>

        <section className="mt-6 rounded-2xl border border-purple-100 bg-white p-6">
          <h1 className="text-3xl font-black">{name}</h1>

          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <p className="flex items-center gap-3">
              <FiMail />
              {member.email}
            </p>

            <p className="flex items-center gap-3">
              <FiPhone />
              {member.phone ?? "No phone number"}
            </p>

            <p className="flex items-center gap-3">
              <FiShield />
              {member.membershipStatus}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-purple-100 bg-white p-6">
          <h2 className="flex items-center gap-2 font-black">
            <FiUsers />
            Departments
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {member.departmentMemberships
              .filter((department) => department.isActive)
              .map((department) => (
                <span
                  className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700"
                  key={department.id}
                >
                  {department.departmentName}
                  {department.isPrimary ? " · Primary" : ""}
                </span>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
