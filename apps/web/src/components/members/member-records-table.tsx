import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiDownload,
  FiGift,
  FiLayers,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiSettings,
  FiShield,
  FiUser,
} from "react-icons/fi";

import {
  ACCOUNT_STATUSES,
  MEMBERSHIP_STATUSES,
  PAGE_SIZES,
  filtersToQuery,
  hasActiveFilters,
  type MemberRecord,
  type MemberRecordFilters,
  type MemberRecordPage,
} from "@/lib/member-records";

import { AutoSubmitSelect } from "./auto-submit-select";

type MemberRecordsTableProps = {
  title: string;
  description: string;
  records: MemberRecordPage;
  filters: MemberRecordFilters;
  /** Page that renders this table, used for filter and pagination links. */
  basePath: string;
  /** Route handler that returns the .xlsx download. */
  exportPath: string;
  /** Prefix for a member's profile page, e.g. "/pastor/members". */
  profileBasePath: string;
  /** Shown between the header and the toolbar, e.g. a success message. */
  notice?: ReactNode;
  /** When given, shows a department filter with these options. */
  departments?: { id: string; name: string }[];
  /** Shows the account status filter (administrators only). */
  showAccountStatusFilter?: boolean;
  /**
   * Row actions, e.g. edit and archive for administrators. The column is
   * only rendered when this is provided; the API still enforces permissions.
   */
  renderActions?: (member: MemberRecord) => ReactNode;
};

const FORM_ID = "member-record-filters";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ON_LEAVE: "bg-amber-500",
  INACTIVE: "bg-red-500",
  ARCHIVED: "bg-slate-400",
};

function humanize(value: string) {
  const words = value.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/** Page numbers to show, with null where a gap ("…") belongs. */
function pageWindow(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(null);
    result.push(page);
  });
  return result;
}

function Empty() {
  return <span className="text-slate-300">—</span>;
}

function HeaderCell({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <th
      className="border-b border-r border-slate-200 px-3 py-2.5 font-medium last:border-r-0"
      scope="col"
    >
      <span className="inline-flex items-center gap-1.5">
        <Icon aria-hidden className="text-slate-400" />
        {label}
      </span>
    </th>
  );
}

function FilterChip({
  icon: Icon,
  label,
  name,
  value,
  options,
  allLabel,
}: {
  icon: IconType;
  label: string;
  name: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label
      className={`relative inline-flex h-8 items-center gap-1.5 rounded-full border pl-3 pr-7 text-[13px] font-medium transition focus-within:ring-2 focus-within:ring-slate-200 ${
        value
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon aria-hidden className={value ? "text-white" : "text-slate-400"} />
      <span className="sr-only">{label}</span>
      <AutoSubmitSelect
        className="cursor-pointer appearance-none bg-transparent outline-none [&>option]:text-slate-900"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </AutoSubmitSelect>
      <FiChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 text-xs"
      />
    </label>
  );
}

function MemberAvatar({ member, name }: { member: MemberRecord; name: string }) {
  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`;
  return (
    <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-purple-100 text-[11px] font-bold uppercase text-purple-700">
      {member.profilePhotoUrl ? (
        <Image
          alt={`${name} profile picture`}
          className="object-cover"
          fill
          sizes="28px"
          src={member.profilePhotoUrl}
          unoptimized
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}

const pagerButton =
  "grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50";
const pagerDisabled =
  "grid size-8 place-items-center rounded-md border border-slate-100 text-slate-300";

export function MemberRecordsTable({
  title,
  description,
  records,
  filters,
  basePath,
  exportPath,
  profileBasePath,
  notice,
  departments,
  showAccountStatusFilter = false,
  renderActions,
}: MemberRecordsTableProps) {
  const filterQuery = filtersToQuery(filters);
  const exportHref = `${exportPath}?${filterQuery}`;
  const pageHref = (page: number) => {
    const query = new URLSearchParams(filterQuery);
    query.set("page", String(page));
    query.set("limit", String(records.limit));
    return `${basePath}?${query}`;
  };
  const firstRow = records.total === 0 ? 0 : (records.page - 1) * records.limit + 1;
  const lastRow = Math.min(records.page * records.limit, records.total);
  const lastPage = Math.max(records.totalPages, 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6">
      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {records.total}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>

      {notice}

      <form id={FORM_ID} method="get" role="search">
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <p className="text-sm text-slate-500">
            {hasActiveFilters(filters) ? (
              <>
                Filtered results ·{" "}
                <Link
                  className="font-medium text-slate-700 underline underline-offset-2"
                  href={basePath}
                >
                  Clear filters
                </Link>
              </>
            ) : (
              "All members"
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search by name, email or phone</span>
              <FiSearch
                aria-hidden
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-8 w-56 rounded-md border border-transparent bg-transparent pl-8 pr-2 text-sm outline-none transition placeholder:text-slate-500 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-100"
                defaultValue={filters.search}
                maxLength={100}
                name="search"
                placeholder="Search"
                type="search"
              />
            </label>
            {/* Plain anchor: a file download must not be prefetched by <Link>. */}
            <a
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              download
              href={exportHref}
            >
              <FiDownload aria-hidden />
              Export Excel
            </a>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip
            allLabel="Any status"
            icon={FiActivity}
            label="Membership status"
            name="membershipStatus"
            options={MEMBERSHIP_STATUSES.map((status) => ({
              value: status,
              label: humanize(status),
            }))}
            value={filters.membershipStatus}
          />
          {departments ? (
            <FilterChip
              allLabel="Any department"
              icon={FiLayers}
              label="Department"
              name="departmentId"
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              value={filters.departmentId}
            />
          ) : null}
          {showAccountStatusFilter ? (
            <FilterChip
              allLabel="Active & suspended"
              icon={FiShield}
              label="Account status"
              name="accountStatus"
              options={ACCOUNT_STATUSES.map((status) => ({
                value: status,
                label: humanize(status),
              }))}
              value={filters.accountStatus}
            />
          ) : null}
          {/* Lets Enter in the search box submit; chips submit on change. */}
          <button className="sr-only" type="submit">
            Apply filters
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-[13px]">
          <caption className="sr-only">
            {title}. The Excel export includes every matching member.
          </caption>
          <thead className="bg-slate-50/60 text-slate-500">
            <tr>
              <HeaderCell icon={FiUser} label="Full name" />
              <HeaderCell icon={FiMail} label="Email" />
              <HeaderCell icon={FiPhone} label="Phone" />
              <HeaderCell icon={FiMapPin} label="Location" />
              <HeaderCell icon={FiGift} label="Date of birth" />
              <HeaderCell icon={FiLayers} label="Departments" />
              <HeaderCell icon={FiActivity} label="Status" />
              <HeaderCell icon={FiCalendar} label="Joined" />
              {renderActions ? (
                <HeaderCell icon={FiSettings} label="Actions" />
              ) : null}
            </tr>
          </thead>
          <tbody>
            {records.items.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-slate-500"
                  colSpan={renderActions ? 9 : 8}
                >
                  No members found.
                </td>
              </tr>
            ) : (
              records.items.map((member) => {
                const name = [member.firstName, member.otherNames, member.lastName]
                  .filter(Boolean)
                  .join(" ");
                const cell =
                  "border-b border-r border-slate-100 px-3 py-2 align-middle last:border-r-0 group-last:border-b-0";
                return (
                  <tr className="group hover:bg-slate-50/70" key={member.id}>
                    <th className={`${cell} font-normal`} scope="row">
                      <Link
                        className="flex items-center gap-2.5 font-medium capitalize text-slate-900 hover:underline"
                        href={`${profileBasePath}/${member.id}`}
                      >
                        <MemberAvatar member={member} name={name} />
                        <span className="truncate">{name}</span>
                      </Link>
                    </th>
                    <td className={cell}>
                      <a
                        className="break-all text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-700"
                        href={`mailto:${member.email}`}
                      >
                        {member.email}
                      </a>
                    </td>
                    <td className={`${cell} whitespace-nowrap text-slate-700`}>
                      {member.phone ?? <Empty />}
                    </td>
                    <td className={`${cell} min-w-56 text-slate-700`}>
                      {member.homeAddress || member.closestLandmark ? (
                        <>
                          <div>{member.homeAddress ?? <Empty />}</div>
                          {member.closestLandmark ? (
                            <div className="text-xs text-slate-500">
                              Near {member.closestLandmark}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <Empty />
                      )}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-slate-700`}>
                      {formatDate(member.dateOfBirth) ?? <Empty />}
                    </td>
                    <td className={cell}>
                      {member.departments.length === 0 ? (
                        <Empty />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {member.departments.map((department) => (
                            <span
                              className={
                                department.isPrimary
                                  ? "rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900"
                                  : "rounded bg-slate-100 px-1.5 py-0.5 text-slate-700"
                              }
                              key={department.id}
                              title={
                                department.isPrimary
                                  ? "Primary department"
                                  : undefined
                              }
                            >
                              {department.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-1.5 py-0.5 text-slate-700">
                        <span
                          aria-hidden
                          className={`size-1.5 rounded-full ${statusStyles[member.membershipStatus] ?? "bg-slate-400"}`}
                        />
                        {humanize(member.membershipStatus)}
                      </span>
                      {member.accountStatus !== "ACTIVE" ? (
                        <span className="ml-1.5 text-xs text-slate-500">
                          Account {member.accountStatus.toLowerCase()}
                        </span>
                      ) : null}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-slate-700`}>
                      {formatDate(member.createdAt)}
                    </td>
                    {renderActions ? (
                      <td className={`${cell} whitespace-nowrap`}>
                        {renderActions(member)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2">
            Rows per page
            <span className="relative">
              <AutoSubmitSelect
                className="h-8 cursor-pointer appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-100"
                defaultValue={String(records.limit)}
                form={FORM_ID}
                name="limit"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </AutoSubmitSelect>
              <FiChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              />
            </span>
          </label>
          <span>
            {firstRow}–{lastRow} of {records.total} rows
          </span>
        </div>

        {records.totalPages > 1 ? (
          <nav aria-label="Member record pages" className="flex items-center gap-1">
            {records.page > 1 ? (
              <>
                <Link aria-label="First page" className={pagerButton} href={pageHref(1)}>
                  <FiChevronsLeft aria-hidden />
                </Link>
                <Link
                  aria-label="Previous page"
                  className={pagerButton}
                  href={pageHref(records.page - 1)}
                >
                  <FiChevronLeft aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <span aria-hidden className={pagerDisabled}>
                  <FiChevronsLeft />
                </span>
                <span aria-hidden className={pagerDisabled}>
                  <FiChevronLeft />
                </span>
              </>
            )}
            {pageWindow(records.page, lastPage).map((page, index) =>
              page === null ? (
                <span className="px-1.5 text-slate-400" key={`gap-${index}`}>
                  …
                </span>
              ) : (
                <Link
                  aria-current={page === records.page ? "page" : undefined}
                  className={`grid h-8 min-w-8 place-items-center rounded-md px-2 ${
                    page === records.page
                      ? "font-semibold text-slate-900"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                  href={pageHref(page)}
                  key={page}
                >
                  {page}
                </Link>
              ),
            )}
            {records.page < records.totalPages ? (
              <>
                <Link
                  aria-label="Next page"
                  className={pagerButton}
                  href={pageHref(records.page + 1)}
                >
                  <FiChevronRight aria-hidden />
                </Link>
                <Link
                  aria-label="Last page"
                  className={pagerButton}
                  href={pageHref(records.totalPages)}
                >
                  <FiChevronsRight aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <span aria-hidden className={pagerDisabled}>
                  <FiChevronRight />
                </span>
                <span aria-hidden className={pagerDisabled}>
                  <FiChevronsRight />
                </span>
              </>
            )}
          </nav>
        ) : null}
      </footer>
    </section>
  );
}
