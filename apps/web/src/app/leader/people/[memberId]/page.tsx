import Link from "next/link";
import { FiArrowLeft, FiMessageCircle, FiPhone, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getLeaderResource } from "../../leader-api";

type Person = { firstName: string; lastName: string; otherNames: string | null; profilePhotoUrl: string | null; directoryBio: string | null; phone: string | null; skills: string[]; departments: { id: string; name: string }[] };

export default async function LeaderPersonPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const person = await getLeaderResource<Person>(`/members/directory/${memberId}`);
  const name = `${person.firstName} ${person.lastName}`;
  return <main className="min-h-screen p-4 sm:p-6 xl:p-8"><div className="mx-auto max-w-3xl">
    <Link aria-label="Back to people" className="inline-flex size-11 items-center justify-center rounded-full border border-purple-100 bg-white text-[#6b21a8] shadow-sm" href="/leader/people"><FiArrowLeft /></Link>
    <section className="mt-5 rounded-[2rem] border border-purple-100 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center gap-5"><ProfileAvatar imageUrl={person.profilePhotoUrl} name={name} size="xl" /><div className="min-w-0 flex-1"><h1 className="text-2xl font-medium capitalize">{name}</h1>{person.otherNames ? <p className="mt-1 capitalize text-sm text-slate-400">{person.otherNames}</p> : null}</div>{person.phone ? <div className="flex gap-2"><a aria-label={`Call ${name}`} className="grid size-11 place-items-center rounded-full bg-[#6b21a8] text-white" href={`tel:${person.phone}`}><FiPhone /></a><a aria-label={`Message ${name}`} className="grid size-11 place-items-center rounded-full bg-purple-100 text-[#6b21a8]" href={`sms:${person.phone}`}><FiMessageCircle /></a></div> : null}</div>{person.directoryBio ? <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">{person.directoryBio}</p> : null}</section>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><section className="rounded-[1.75rem] border border-purple-100 bg-white p-5"><h2 className="flex items-center gap-2 font-black text-[#6b21a8]"><FiUsers /> Serves with</h2><div className="mt-4 flex flex-wrap gap-2">{person.departments.length ? person.departments.map((department) => <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#6b21a8]" key={department.id}>{department.name}</span>) : <span className="text-sm text-slate-400">Church family</span>}</div></section><section className="rounded-[1.75rem] border border-purple-100 bg-white p-5"><h2 className="font-black text-[#6b21a8]">Skills and gifts</h2><div className="mt-4 flex flex-wrap gap-2">{person.skills.length ? person.skills.map((skill) => <span className="rounded-full bg-lime-100 px-3 py-1.5 text-xs font-bold text-lime-800" key={skill}>{skill}</span>) : <span className="text-sm text-slate-400">No skills shared yet.</span>}</div></section></div>
  </div></main>;
}
