import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

import { PastorNavigation } from "@/components/pastor-navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { pastorLogout } from "./actions";
import { getPastorResource } from "./pastor-api";

type Account = {
  roles: string[];
  memberProfile: {
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string | null;
  } | null;
};

export default async function PastorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getPastorResource<Account>("/auth/me");

  if (!account.roles.includes("PASTOR")) {
    redirect("/member");
  }

  const name = account.memberProfile
    ? `${account.memberProfile.firstName} ${account.memberProfile.lastName}`
    : "Pastor";

  const profilePhotoUrl = account.memberProfile?.profilePhotoUrl ?? null;

  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-purple-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <Link className="flex items-center gap-2" href="/pastor">
          <span className="church-logo-tile relative size-10 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-purple-100">
            <Image
              alt="Arrows church"
              className="scale-[1.35] object-contain"
              fill
              sizes="40px"
              src="/assets/arrows.PNG"
            />
          </span>

          <span>
            <span className="block text-sm font-black leading-tight">
              Pastoral Ministry
            </span>

            <span className="block text-[10px] font-semibold text-slate-500">
              Church oversight
            </span>
          </span>
        </Link>

        <ProfileAvatar
          imageUrl={profilePhotoUrl}
          name={name}
          size="sm"
          variant="admin"
        />
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col items-center border-r border-white/15 bg-gradient-to-b from-[#8527d5] via-[#741db9] to-[#52127d] px-3 py-5 lg:flex">
          <Link
            aria-label="Pastoral overview"
            className="church-logo-tile relative mb-9 block size-14 overflow-hidden rounded-[1.15rem] bg-white shadow-lg ring-2 ring-white/20"
            href="/pastor"
          >
            <Image
              alt="Arrows church"
              className="scale-[1.35] object-contain"
              fill
              sizes="56px"
              src="/assets/arrows.PNG"
            />
          </Link>

          <PastorNavigation />

          <div className="mt-auto border-t border-white/15 pt-4">
            <form action={pastorLogout}>
              <button
                aria-label="Sign out"
                className="grid size-12 place-items-center rounded-2xl text-xl text-white transition hover:bg-white/15"
                title="Sign out"
                type="submit"
              >
                <FiLogOut aria-hidden="true" />
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-100 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <PastorNavigation mobile />
      </div>
    </div>
  );
}
