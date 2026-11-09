import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import { MemberRecordsTable } from "@/components/members/member-records-table";
import {
  memberRecordsApiPath,
  parseMemberRecordFilters,
  parseMemberRecordPaging,
  type MemberRecordPage,
} from "@/lib/member-records";

import { getPastorResource } from "../../pastor-api";

export default async function PastorMemberRecordsPage({
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
  const records = await getPastorResource<MemberRecordPage>(
    memberRecordsApiPath(filters, parseMemberRecordPaging(parameters)),
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1400px]">
        <Link
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/pastor/members"
        >
          <FiArrowLeft aria-hidden />
          Members
        </Link>
        <MemberRecordsTable
          basePath="/pastor/members/records"
          description="Contact and location details for every member of the church."
          exportPath="/pastor/members/export"
          filters={filters}
          profileBasePath="/pastor/members"
          records={records}
          title="Member records"
        />
      </div>
    </main>
  );
}
