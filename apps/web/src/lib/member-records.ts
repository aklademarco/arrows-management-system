import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "ARCHIVED",
] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "ARCHIVED"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MemberRecord = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  homeAddress: string | null;
  closestLandmark: string | null;
  profilePhotoUrl: string | null;
  accountStatus: string;
  membershipStatus: string;
  createdAt: string;
  departments: { id: string; name: string; isPrimary: boolean }[];
};

export type MemberRecordPage = {
  items: MemberRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MemberRecordFilters = {
  search?: string;
  membershipStatus?: MembershipStatus;
  accountStatus?: AccountStatus;
  departmentId?: string;
};

type RawFilterParameters = {
  search?: string | null;
  membershipStatus?: string | null;
  accountStatus?: string | null;
  departmentId?: string | null;
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;

const DEFAULT_PAGE_SIZE = 25;

export type MemberRecordPaging = { page: number; limit: number };

/** Validates page and rows-per-page from untrusted query parameters. */
export function parseMemberRecordPaging(parameters: {
  page?: string;
  limit?: string;
}): MemberRecordPaging {
  const page = Number(parameters.page ?? 1);
  const limit = Number(parameters.limit);
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    limit: PAGE_SIZES.find((size) => size === limit) ?? DEFAULT_PAGE_SIZE,
  };
}

/** Reads only the filters the API accepts from untrusted query parameters. */
export function parseMemberRecordFilters(
  parameters: RawFilterParameters,
): MemberRecordFilters {
  const search = parameters.search?.trim().slice(0, 100);
  const membershipStatus = MEMBERSHIP_STATUSES.find(
    (status) => status === parameters.membershipStatus,
  );
  const accountStatus = ACCOUNT_STATUSES.find(
    (status) => status === parameters.accountStatus,
  );
  const departmentId =
    parameters.departmentId && UUID_PATTERN.test(parameters.departmentId)
      ? parameters.departmentId
      : undefined;
  return {
    ...(search ? { search } : {}),
    ...(membershipStatus ? { membershipStatus } : {}),
    ...(accountStatus ? { accountStatus } : {}),
    ...(departmentId ? { departmentId } : {}),
  };
}

export function filtersToQuery(filters: MemberRecordFilters) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.membershipStatus)
    query.set("membershipStatus", filters.membershipStatus);
  if (filters.accountStatus) query.set("accountStatus", filters.accountStatus);
  if (filters.departmentId) query.set("departmentId", filters.departmentId);
  return query;
}

export function hasActiveFilters(filters: MemberRecordFilters) {
  return Object.keys(filters).length > 0;
}

/** API path for one page of the member records table. */
export function memberRecordsApiPath(
  filters: MemberRecordFilters,
  paging: MemberRecordPaging,
) {
  const query = filtersToQuery(filters);
  query.set("page", String(paging.page));
  query.set("limit", String(paging.limit));
  return `/members?${query}`;
}

/**
 * Streams the member spreadsheet from the API using the session cookie of
 * the calling portal. The API enforces who may see which members.
 */
export async function proxyMemberExport(
  request: NextRequest,
  sessionCookieName: string,
  loginPath = "/login",
) {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const searchParams = request.nextUrl.searchParams;
  const filters = parseMemberRecordFilters({
    search: searchParams.get("search"),
    membershipStatus: searchParams.get("membershipStatus"),
    accountStatus: searchParams.get("accountStatus"),
    departmentId: searchParams.get("departmentId"),
  });

  const response = await fetch(
    `${apiUrl}/members/export.xlsx?${filtersToQuery(filters)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    return NextResponse.json(
      { message: message ?? "The member export could not be generated." },
      { status: response.status },
    );
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        'attachment; filename="members.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
