import Link from "next/link";
import { FiArrowLeft, FiMessageCircle, FiPhone, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getMemberResource } from "../../member-api";
import { sayHello } from "./actions";

type DirectoryProfile = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  directoryBio: string | null;
  phone: string | null;
  skills: string[];
  departments: { id: string; name: string }[];
};

export default async function DirectoryProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ hello?: string }>;
}) {
  const [{ memberId }, query] = await Promise.all([params, searchParams]);
  const member = await getMemberResource<DirectoryProfile>(
    `/members/directory/${memberId}`,
  );
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <main className="min-h-screen bg-[#fbf9fd] pb-20">
      <div className="mx-auto max-w-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-purple-100 bg-[#fbf9fd]/95 px-4 py-4 backdrop-blur sm:px-6">
          <Link aria-label="Back to people" className="grid size-11 place-items-center rounded-full border border-purple-100 bg-white text-xl text-slate-700 shadow-sm" href="/member/directory"><FiArrowLeft /></Link>
          <p className="font-black">Member profile</p>
          <span className="size-11" />
        </header>

        <section className="overflow-hidden bg-white sm:mx-6 sm:mt-6 sm:rounded-[2rem] sm:border sm:border-purple-100 sm:shadow-sm">
          <div className="h-52 bg-gradient-to-br from-[#4c0d72] via-[#6b21a8] to-[#9d4edd] bg-cover bg-center sm:h-64" style={member.coverPhotoUrl ? { backgroundImage: `linear-gradient(rgba(76,13,114,.25), rgba(76,13,114,.25)), url(${member.coverPhotoUrl})` } : undefined} />
          <div className="px-5 pb-7 sm:px-8">
            <div className="-mt-14 flex items-end justify-between gap-4">
              <ProfileAvatar imageUrl={member.profilePhotoUrl} name={name} size="xl" />
              {member.phone ? <div className="flex gap-2 pb-1"><a aria-label={`Call ${name}`} className="grid size-11 place-items-center rounded-full bg-[#6b21a8] text-lg text-white shadow-sm" href={`tel:${member.phone}`}><FiPhone /></a><a aria-label={`Message ${name}`} className="grid size-11 place-items-center rounded-full bg-purple-100 text-lg text-[#6b21a8]" href={`sms:${member.phone}`}><FiMessageCircle /></a></div> : null}
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight">{name}</h1>
            {member.otherNames ? <p className="mt-1 text-sm font-semibold text-slate-400">Also known as {member.otherNames}</p> : null}
            {member.directoryBio ? <p className="mt-5 whitespace-pre-line text-[15px] font-medium leading-7 text-slate-700">{member.directoryBio}</p> : <p className="mt-5 text-sm font-medium text-slate-400">{member.firstName} has not added an introduction yet.</p>}
            {query.hello === "1" ? <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700">Your hello was sent to {member.firstName}.</p> : null}
            <form action={sayHello} className="mt-5">
              <input name="memberId" type="hidden" value={member.id} />
              <button className="member-primary-action h-11 w-full sm:w-auto" type="submit"><FiMessageCircle /> Say hello</button>
            </form>
          </div>
        </section>

        <section className="mx-4 mt-4 grid gap-4 sm:mx-6 sm:grid-cols-2">
          <article className="rounded-[1.75rem] border border-purple-100 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-black text-[#6b21a8]"><FiUsers /> Serves with</p>
            <div className="mt-4 flex flex-wrap gap-2">{member.departments.length ? member.departments.map((department) => <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-extrabold text-[#6b21a8]" key={department.id}>{department.name}</span>) : <span className="text-sm font-medium text-slate-400">Church family</span>}</div>
          </article>
          <article className="rounded-[1.75rem] border border-purple-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-[#6b21a8]">Skills and gifts</p>
            <div className="mt-4 flex flex-wrap gap-2">{member.skills.length ? member.skills.map((skill) => <span className="rounded-full bg-lime-100 px-3 py-1.5 text-xs font-extrabold text-lime-800" key={skill}>{skill}</span>) : <span className="text-sm font-medium text-slate-400">No skills shared yet.</span>}</div>
          </article>
        </section>

        {member.phone ? <section className="mx-4 mt-4 rounded-[1.75rem] border border-purple-100 bg-white p-5 shadow-sm sm:mx-6"><p className="text-sm font-black">Connect with {member.firstName}</p><p className="mt-1 text-sm font-medium text-slate-500">This member chose to share their number with the church directory.</p><div className="mt-4 grid grid-cols-2 gap-3"><a className="member-primary-action h-11" href={`tel:${member.phone}`}><FiPhone /> Call</a><a className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-purple-100 font-extrabold text-[#6b21a8]" href={`sms:${member.phone}`}><FiMessageCircle /> Message</a></div></section> : null}
      </div>
    </main>
  );
}
