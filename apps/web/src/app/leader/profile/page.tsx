import { FiMail, FiPhone, FiShield, FiUsers } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getLeaderResource } from "../leader-api";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  directoryBio: string | null;
  skills: string[];
};

type Account = {
  roles: string[];
  memberProfile: {
    primaryDepartment: { id: string; name: string } | null;
  } | null;
};

export default async function LeaderProfilePage() {
  const [profile, account] = await Promise.all([
    getLeaderResource<Profile>("/members/me"),
    getLeaderResource<Account>("/auth/me"),
  ]);
  const name = `${profile.firstName} ${profile.lastName}`;
  const role = account.roles.includes("PASTOR") ? "Pastor" : "Ministry leader";

  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Leadership account</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Your profile</h1>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#24202e]">
          <div className="px-5 py-7 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <ProfileAvatar imageUrl={profile.profilePhotoUrl} name={name} size="xl" variant="admin" />
              <span className="mb-1 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-2 text-xs font-black text-purple-200"><FiShield /> {role}</span>
            </div>
            <h2 className="mt-4 text-2xl font-black">{name}</h2>
            {profile.directoryBio ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{profile.directoryBio}</p> : null}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5">
            <h2 className="font-black">Contact details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-3"><FiMail className="text-purple-300" /> {profile.email}</p>
              <p className="flex items-center gap-3"><FiPhone className="text-purple-300" /> {profile.phone ?? "No phone number added"}</p>
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5">
            <h2 className="flex items-center gap-2 font-black"><FiUsers className="text-purple-300" /> Ministry responsibility</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {account.memberProfile?.primaryDepartment ? <span className="rounded-full bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-200">{account.memberProfile.primaryDepartment.name}</span> : <p className="text-sm text-slate-400">Church-wide leadership</p>}
            </div>
          </section>
        </div>

        {profile.skills.length ? (
          <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5">
            <h2 className="font-black">Skills and gifts</h2>
            <div className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <span className="rounded-full bg-lime-300/10 px-3 py-1.5 text-xs font-bold text-lime-300" key={skill}>{skill}</span>)}</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
