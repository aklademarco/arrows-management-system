import { FiChevronDown, FiFilter } from "react-icons/fi";

type Department = { id: string; name: string; isActive: boolean };

export function LeaderboardFilters({
  period,
  date,
  departmentId,
  departments = [],
  showDepartments = false,
}: {
  period: string;
  date?: string;
  departmentId?: string;
  departments?: Department[];
  showDepartments?: boolean;
}) {
  const periodLabel = period.charAt(0) + period.slice(1).toLowerCase();
  const departmentLabel =
    departments.find((item) => item.id === departmentId)?.name ??
    "All departments";
  return (
    <>
      <details className="group mt-5 rounded-3xl border border-purple-100 bg-white shadow-sm lg:hidden">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 font-extrabold text-slate-950 [&::-webkit-details-marker]:hidden">
          <span className="grid size-10 place-items-center rounded-2xl bg-purple-50 text-[#6b21a8]">
            <FiFilter aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block">Period &amp; filters</span>
            <span className="block truncate text-xs font-bold text-slate-400">
              {periodLabel}
              {showDepartments ? ` · ${departmentLabel}` : ""}
            </span>
          </span>
          <FiChevronDown
            aria-hidden="true"
            className="text-slate-400 transition group-open:rotate-180"
          />
        </summary>
        <FilterForm
          className="grid gap-3 border-t border-purple-50 p-4"
          date={date}
          departmentId={departmentId}
          departments={departments}
          period={period}
          showDepartments={showDepartments}
        />
      </details>
      <FilterForm
        className={`mt-5 hidden gap-3 rounded-3xl border border-purple-100 bg-white p-4 shadow-sm lg:grid ${showDepartments ? "lg:grid-cols-[1fr_1fr_1fr_auto]" : "lg:grid-cols-[1fr_1fr_auto]"}`}
        date={date}
        departmentId={departmentId}
        departments={departments}
        period={period}
        showDepartments={showDepartments}
      />
    </>
  );
}

function FilterForm({
  className,
  period,
  date,
  departmentId,
  departments,
  showDepartments,
}: {
  className: string;
  period: string;
  date?: string;
  departmentId?: string;
  departments: Department[];
  showDepartments: boolean;
}) {
  return (
    <form className={className}>
      <select
        aria-label="Ranking period"
        className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-bold"
        defaultValue={period}
        name="period"
      >
        <option value="WEEKLY">Weekly</option>
        <option value="MONTHLY">Monthly</option>
        <option value="QUARTERLY">Quarterly</option>
        <option value="YEARLY">Yearly</option>
      </select>
      <input
        aria-label="Date within ranking period"
        className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
        defaultValue={date}
        name="date"
        type="date"
      />
      {showDepartments ? (
        <select
          aria-label="Department"
          className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-bold"
          defaultValue={departmentId ?? ""}
          name="departmentId"
        >
          <option value="">All departments</option>
          {departments
            .filter((department) => department.isActive)
            .map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
        </select>
      ) : null}
      <button className="member-primary-action mx-auto lg:mx-0">
        <FiFilter aria-hidden="true" /> View period
      </button>
    </form>
  );
}
