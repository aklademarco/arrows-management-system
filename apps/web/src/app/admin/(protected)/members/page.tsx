import Link from "next/link";
import { FiArrowUpRight, FiEdit2 } from "react-icons/fi";

import { AdminFeedback } from "@/components/admin-feedback";
import { MemberRecordsTable } from "@/components/members/member-records-table";
import {
  memberRecordsApiPath,
  parseMemberRecordFilters,
  parseMemberRecordPaging,
  type MemberRecordPage,
} from "@/lib/member-records";

import { getAdminResource } from "../registrations/admin-api";
import { ArchiveMemberButton } from "./archive-member-button";

type Department = { id: string; name: string };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    membershipStatus?: string;
    departmentId?: string;
    accountStatus?: string;
    page?: string;
    limit?: string;
    feedback?: string;
    message?: string;
  }>;
}) {
  const parameters = await searchParams;
  const filters = parseMemberRecordFilters(parameters);
  const [records, departments] = await Promise.all([
    getAdminResource<MemberRecordPage>(
      memberRecordsApiPath(filters, parseMemberRecordPaging(parameters)),
    ),
    getAdminResource<Department[]>("/admin/registrations/department-options"),
  ]);

  return (
    <main className="min-h-screen bg-[#e9edee] px-4 py-8 text-[#252b2d] sm:px-5 sm:py-10">
      <div className="mx-auto max-w-[1400px]">
        <nav className="mb-4 flex justify-end">
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dce3e4] bg-white/70 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#bcc9cc] hover:text-slate-950"
            href="/admin/registrations"
          >
            Registration approvals <FiArrowUpRight aria-hidden="true" />
          </Link>
        </nav>

        <MemberRecordsTable
          basePath="/admin/members"
          departments={departments}
          description="Manage church members, their contact and location details, and their access."
          exportPath="/admin/members/export"
          filters={filters}
          notice={
            (parameters.feedback === "success" ||
              parameters.feedback === "error") &&
            parameters.message ? (
              <AdminFeedback
                kind={parameters.feedback}
                message={parameters.message}
              />
            ) : null
          }
          profileBasePath="/admin/members"
          records={records}
          renderActions={(member) => {
            const name = `${member.firstName} ${member.lastName}`;
            return (
              <div className="inline-flex items-center gap-1.5">
                <Link
                  aria-label={`Edit ${name}`}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                  href={`/admin/members/${member.id}#edit-member`}
                >
                  <FiEdit2 aria-hidden />
                  Edit
                </Link>
                {member.accountStatus !== "ARCHIVED" ? (
                  <ArchiveMemberButton memberId={member.id} memberName={name} />
                ) : null}
              </div>
            );
          }}
          showAccountStatusFilter
          title="Member management"
        />
      </div>
    </main>
  );
}
