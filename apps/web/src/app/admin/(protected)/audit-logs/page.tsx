import { FiFilter, FiShield } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  previousData: unknown;
  newData: unknown;
  metadata: unknown;
  requestedIp: string | null;
  createdAt: string;
};
type AuditPage = {
  items: AuditItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams({
    page: parameters.page ?? "1",
    limit: "25",
  });
  for (const key of ["action", "entityType", "from", "to"] as const)
    if (parameters[key]) query.set(key, parameters[key]);
  const result = await getAdminResource<AuditPage>(`/audit-logs?${query}`);
  return (
    <main className="admin-grid-background min-h-[calc(100vh-3.5rem)] bg-[#e9edee] px-4 py-7 text-[#252b2d] sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Arrows ACMS</span>
            <span>/</span>
            <span>Security</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Audit logs
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            An immutable timeline of important administrative and security
            actions.
          </p>
        </header>
        <form className="mt-7 grid gap-3 rounded-[1.5rem] border border-[#dce3e4] bg-white/70 p-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
          <input
            className="h-10 rounded-lg border border-[#dce3e4] bg-[#e9edee] px-3 text-sm"
            defaultValue={parameters.action}
            name="action"
            placeholder="Action contains…"
          />
          <input
            className="h-10 rounded-lg border border-[#dce3e4] bg-[#e9edee] px-3 text-sm"
            defaultValue={parameters.entityType}
            name="entityType"
            placeholder="Entity type…"
          />
          <input
            aria-label="From date"
            className="h-10 rounded-lg border border-[#dce3e4] bg-[#e9edee] px-3 text-sm [color-scheme:dark]"
            defaultValue={parameters.from}
            name="from"
            type="date"
          />
          <input
            aria-label="To date"
            className="h-10 rounded-lg border border-[#dce3e4] bg-[#e9edee] px-3 text-sm [color-scheme:dark]"
            defaultValue={parameters.to}
            name="to"
            type="date"
          />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#242929] text-white px-5 text-sm font-semibold">
            <FiFilter /> Filter
          </button>
        </form>
        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dce3e4] bg-white/70">
          <div className="flex flex-wrap items-center justify-between border-b border-[#dce3e4] px-5 py-4">
            <div>
              <h2 className="font-semibold">Security timeline</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {result.total} recorded actions
              </p>
            </div>
            <FiShield className="text-[#426b9f]" />
          </div>
          {result.items.length === 0 ? (
            <div className="grid min-h-52 place-items-center text-sm text-slate-600">
              No audit actions match these filters.
            </div>
          ) : (
            <div className="divide-y divide-[#e1e7e8]">
              {result.items.map((item) => (
                <article
                  className="grid gap-4 px-5 py-4 lg:grid-cols-[12rem_1fr_13rem]"
                  key={item.id}
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                        timeZone: "Africa/Accra",
                      }).format(new Date(item.createdAt))}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.actorEmail ?? "System"}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#e1eafa] px-2 py-1 text-xs font-semibold text-[#426b9f]">
                        {item.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {item.entityType}
                      </span>
                    </div>
                    {item.entityId ? (
                      <p className="mt-2 font-mono text-[11px] text-slate-500">
                        {item.entityId}
                      </p>
                    ) : null}
                    <AuditDetails item={item} />
                  </div>
                  <p className="text-xs text-slate-500 lg:text-right">
                    {item.requestedIp ?? "IP unavailable"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
        {result.totalPages > 1 ? (
          <nav className="mt-5 flex flex-wrap items-center justify-between text-sm">
            <PageLink
              disabled={result.page <= 1}
              label="← Previous"
              page={result.page - 1}
              parameters={parameters}
            />
            <span className="text-slate-600">
              Page {result.page} of {result.totalPages}
            </span>
            <PageLink
              disabled={result.page >= result.totalPages}
              label="Next →"
              page={result.page + 1}
              parameters={parameters}
            />
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function AuditDetails({ item }: { item: AuditItem }) {
  if (!item.previousData && !item.newData && !item.metadata) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">
        View recorded changes
      </summary>
      <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-[#e9edee] p-3 text-[11px] leading-5 text-slate-600">
        {JSON.stringify(
          {
            previous: item.previousData,
            next: item.newData,
            metadata: item.metadata,
          },
          null,
          2,
        )}
      </pre>
    </details>
  );
}

function PageLink({
  disabled,
  label,
  page,
  parameters,
}: {
  disabled: boolean;
  label: string;
  page: number;
  parameters: Record<string, string | undefined>;
}) {
  if (disabled) return <span className="text-slate-600">{label}</span>;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters))
    if (value) query.set(key, value);
  query.set("page", String(page));
  return (
    <a
      className="font-semibold text-[#426b9f] hover:text-[#426b9f]"
      href={`?${query}`}
    >
      {label}
    </a>
  );
}
