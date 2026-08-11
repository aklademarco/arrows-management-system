import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { LeaderNavigation } from "@/components/leader-navigation";
import { leaderLogout } from "./actions";
import { getLeaderResource } from "./leader-api";

type Account = {
  roles: string[];
  memberProfile: { firstName: string; lastName: string } | null;
};

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const account = await getLeaderResource<Account>("/auth/me");
  if (!account.roles.some((role) => role === "PASTOR" || role === "DEPARTMENT_LEADER")) redirect("/member");
  const name = account.memberProfile ? `${account.memberProfile.firstName} ${account.memberProfile.lastName}` : "Church leader";
  return <div className="min-h-screen bg-[#17131f] text-white">
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#17131f]/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link className="flex items-center gap-2" href="/leader"><span className="relative size-10 overflow-hidden rounded-xl bg-white"><Image alt="Arrows church" className="object-contain scale-[1.35]" fill sizes="40px" src="/assets/arrows.PNG" /></span><span className="text-sm font-black">Leadership</span></Link>
      <ProfileAvatar name={name} size="sm" variant="admin" />
    </header>
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col items-center bg-gradient-to-b from-[#7e22ce] to-[#5b148d] px-3 py-5 lg:flex">
        <Link className="relative mb-10 block size-12 overflow-hidden rounded-2xl bg-white shadow-lg" href="/leader"><Image alt="Arrows church" className="object-contain scale-[1.35]" fill sizes="48px" src="/assets/arrows.PNG" /></Link>
        <LeaderNavigation />
        <form action={leaderLogout} className="mt-auto"><button aria-label="Sign out" className="grid size-11 place-items-center rounded-xl text-lg text-purple-200 hover:bg-white/10 hover:text-white"><FiLogOut /></button></form>
      </aside>
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#5b148d]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"><LeaderNavigation mobile /></div>
  </div>;
}
