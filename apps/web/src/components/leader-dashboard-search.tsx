"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiSearch, FiUsers } from "react-icons/fi";

type SearchPerson = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
};

type SearchDepartment = { id: string; name: string };
type SearchEvent = { id: string; name: string; startsAt: string };

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  Icon: typeof FiUsers;
};

const eventDate = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

export function LeaderDashboardSearch({
  people,
  departments,
  events,
}: {
  people: SearchPerson[];
  departments: SearchDepartment[];
  events: SearchEvent[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return [];

    const matchingPeople: SearchResult[] = people
      .filter((person) =>
        `${person.firstName} ${person.otherNames ?? ""} ${person.lastName}`
          .toLocaleLowerCase()
          .includes(search),
      )
      .slice(0, 4)
      .map((person) => ({
        id: `person-${person.id}`,
        label: `${person.firstName} ${person.lastName}`,
        detail: "Person",
        href: `/leader/people/${person.id}`,
        Icon: FiUsers,
      }));

    const matchingDepartments: SearchResult[] = departments
      .filter((department) =>
        department.name.toLocaleLowerCase().includes(search),
      )
      .slice(0, 3)
      .map((department) => ({
        id: `department-${department.id}`,
        label: department.name,
        detail: "Ministry",
        href: "/leader/ministry",
        Icon: FiUsers,
      }));

    const matchingEvents: SearchResult[] = events
      .filter((event) => event.name.toLocaleLowerCase().includes(search))
      .slice(0, 3)
      .map((event) => ({
        id: `event-${event.id}`,
        label: event.name,
        detail: `Event · ${eventDate.format(new Date(event.startsAt))}`,
        href: `#event-${event.id}`,
        Icon: FiCalendar,
      }));

    return [...matchingPeople, ...matchingDepartments, ...matchingEvents];
  }, [departments, events, people, query]);

  useEffect(() => {
    function closeSearch(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, []);

  function openFirstResult() {
    const firstResult = results[0];
    if (!firstResult) return;
    setIsOpen(false);
    router.push(firstResult.href);
  }

  return (
    <div className="relative flex-1" ref={containerRef}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          openFirstResult();
        }}
        role="search"
      >
        <label className="relative block">
          <span className="sr-only">Search people, ministries, and events</span>
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-autocomplete="list"
            aria-controls="leader-dashboard-search-results"
            aria-expanded={isOpen && Boolean(query.trim())}
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-purple-100 bg-white pl-12 pr-14 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-500 focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder="Search people, ministries, and events"
            role="combobox"
            type="search"
            value={query}
          />
          <button
            aria-label="Search"
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-lg text-[#6b21a8] transition hover:bg-purple-50"
            type="submit"
          >
            <FiSearch aria-hidden="true" />
          </button>
        </label>
      </form>

      {isOpen && query.trim() ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-purple-100 bg-white p-2 shadow-[0_18px_45px_rgba(36,0,70,0.14)]"
          id="leader-dashboard-search-results"
        >
          {results.length ? (
            <ul aria-label="Search results" className="grid gap-1">
              {results.map(({ id, label, detail, href, Icon }) => (
                <li key={id}>
                  <Link
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-purple-50 focus-visible:bg-purple-50"
                    href={href}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-[#6b21a8]">
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold capitalize">
                        {label}
                      </span>
                      <span className="block text-xs font-medium text-slate-500">
                        {detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-center text-sm font-medium text-slate-500">
              No people, ministries, or events found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
