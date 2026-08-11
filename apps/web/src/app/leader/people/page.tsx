import { FiSearch, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getLeaderResource } from "../leader-api";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  directoryBio: string | null;
  phone: string | null;
  skills: string[];
  departments: { id: string; name: string }[];
};
type Directory = { items: Person[]; total: number };
type Department = { id: string; name: string; isActive: boolean };

export default async function LeaderPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; departmentId?: string }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams({ limit: "50" });
  if (parameters.search?.trim()) query.set("search", parameters.search.trim());
  if (parameters.departmentId)
    query.set("departmentId", parameters.departmentId);
  const [directory, departments] = await Promise.all([
    getLeaderResource<Directory>(`/members/directory?${query}`),
    getLeaderResource<Department[]>("/departments"),
  ]);
  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Church family</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">People</h1>
          <p className="mt-2 text-sm text-slate-400">Know the people you serve and the gifts within the church.</p>
        </header>
        <form className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-[#24202e] p-4 md:grid-cols-[1fr_16rem_auto]">
          <label className="relative"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input className="h-12 w-full rounded-xl border border-white/10 bg-[#17131f] pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500" defaultValue={parameters.search} name="search" placeholder="Search people" /></label>
          <select className="h-12 rounded-xl border border-white/10 bg-[#17131f] px-4 text-sm text-white" defaultValue={parameters.departmentId ?? ""} name="departmentId"><option value="">All ministries</option>{departments.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <button className="h-12 rounded-xl bg-purple-600 px-6 font-bold hover:bg-purple-500">Find people</button>
        </form>
        <p className="mt-5 text-sm font-bold text-slate-500">{directory.total} people</p>
        {directory.items.length ? (
          <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {directory.items.map((person) => {
              const name = `${person.firstName} ${person.lastName}`;
              return <article className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5" key={person.id}><div className="flex items-start gap-4"><ProfileAvatar imageUrl={person.profilePhotoUrl} name={name} size="lg" variant="admin" /><div><h2 className="font-black">{name}</h2><p className="mt-1 text-xs font-semibold text-purple-300">{person.departments.map((item) => item.name).join(" · ") || "Church family"}</p></div></div>{person.directoryBio ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{person.directoryBio}</p> : null}{person.skills.length ? <div className="mt-4 flex flex-wrap gap-1.5">{person.skills.map((skill) => <span className="rounded-full bg-lime-300/10 px-2.5 py-1 text-[11px] font-bold text-lime-300" key={skill}>{skill}</span>)}</div> : null}{person.phone ? <div className="mt-4 flex gap-2 border-t border-white/10 pt-4"><a className="flex-1 rounded-xl bg-purple-600 px-3 py-2 text-center text-sm font-bold" href={`tel:${person.phone}`}>Call</a><a className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-sm font-bold" href={`sms:${person.phone}`}>Message</a></div> : null}</article>;
            })}
          </section>
        ) : (
          <section className="mt-5 grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-white/15 bg-[#24202e]"><div className="text-center"><FiUsers className="mx-auto text-5xl text-purple-400" /><h2 className="mt-4 font-black">No people found</h2></div></section>
        )}
      </div>
    </main>
  );
}
