import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import { MemberRecordsTable } from "@/components/members/member-records-table";
import {
  memberRecordsApiPath,
  parseMemberRecordFilters,
  parseMemberRecordPaging,
  type MemberRecordPage,
} from "@/lib/member-records";

import { getLeaderResource } from "../leader-api";

export default async function LeaderMemberRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    membershipStatus?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const parameters = await searchParams;
  const filters = parseMemberRecordFilters(parameters);
  const records = await getLeaderResource<MemberRecordPage>(
    memberRecordsApiPath(filters, parseMemberRecordPaging(parameters)),
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-[1400px]">
        <Link
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/leader/people"
        >
          <FiArrowLeft aria-hidden />
          People you lead
        </Link>
        <MemberRecordsTable
          basePath="/leader/members"
          description="Contact and location details for members of the departments you lead."
          exportPath="/leader/members/export"
          filters={filters}
          profileBasePath="/leader/people"
          records={records}
          title="Member records"
        />
      </div>
    </main>
  );
}
