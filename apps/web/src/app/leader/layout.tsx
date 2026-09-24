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
  memberProfile: {
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string | null;
  } | null;
};

export default async function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getLeaderResource<Account>("/auth/me");
  if (
    !account.roles.some(
      (role) => role === "PASTOR" || role === "DEPARTMENT_LEADER",
    )
  )
    redirect("/member");
  const name = account.memberProfile
    ? `${account.memberProfile.firstName} ${account.memberProfile.lastName}`
    : "Church leader";
  const profilePhotoUrl = account.memberProfile?.profilePhotoUrl ?? null;

  return (
    <div className="leader-shell min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-purple-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <Link className="flex items-center gap-2" href="/leader">
          <span className="church-logo-tile relative size-10 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-purple-100">
            <Image
              alt="Arrows church"
              className="object-contain scale-[1.35]"
              fill
              sizes="40px"
              src="/assets/arrows.PNG"
            />
          </span>
          <span>
            <span className="block text-sm font-black leading-tight">
              Leadership
            </span>
            <span className="block text-[10px] font-semibold text-slate-500">
              Arrows workspace
            </span>
          </span>
        </Link>
        <Link
          aria-label="Open your profile"
          className="rounded-full transition active:scale-95"
          href="/leader/profile"
        >
          <ProfileAvatar
            imageUrl={profilePhotoUrl}
            name={name}
            size="sm"
            variant="admin"
          />
        </Link>
      </header>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 z-40 hidden h-screen w-[88px] shrink-0 flex-col items-center border-r border-white/15 bg-gradient-to-b from-[#8527d5] via-[#741db9] to-[#52127d] px-3 py-5 shadow-[10px_0_35px_rgba(76,22,119,0.12)] lg:flex">
          <Link
            aria-label="Leadership overview"
            className="church-logo-tile relative mb-9 block size-14 overflow-hidden rounded-[1.15rem] bg-white shadow-[0_10px_28px_rgba(36,0,70,0.24)] ring-2 ring-white/20 transition hover:-translate-y-0.5"
            href="/leader"
          >
            <Image
              alt="Arrows church"
              className="object-contain scale-[1.35]"
              fill
              sizes="56px"
              src="/assets/arrows.PNG"
            />
          </Link>
          <LeaderNavigation />
          <div className="mt-auto grid gap-2 border-t border-white/15 pt-4">
            <Link
              aria-label="Open your profile"
              className="grid size-12 place-items-center rounded-2xl transition hover:bg-white/15"
              href="/leader/profile"
              title="Profile"
            >
              <ProfileAvatar
                imageUrl={profilePhotoUrl}
                name={name}
                size="sm"
                variant="admin"
              />
            </Link>
            <form action={leaderLogout}>
              <button
                aria-label="Sign out"
                className="grid size-12 place-items-center rounded-2xl text-xl text-white transition hover:bg-white/15 focus-visible:bg-white/15"
                title="Sign out"
              >
                <FiLogOut aria-hidden="true" />
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <LeaderNavigation mobile />
      </div>
    </div>
  );
}
