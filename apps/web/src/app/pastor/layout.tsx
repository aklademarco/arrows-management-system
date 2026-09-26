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
    <div className="min-h-screen bg-[#f8f7f4] text-slate-950">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#fffdfa]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link className="flex items-center gap-2" href="/pastor">
          <span className="church-logo-tile relative size-10 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
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
              Arrows
            </span>

            <span className="block text-[10px] font-semibold text-slate-500">
              Pastoral Ministry
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
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-slate-200 bg-[#fffdfa] px-4 py-5 lg:flex">
          <Link className="flex items-center gap-3 px-2" href="/pastor">
            <span className="church-logo-tile relative size-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <Image
                alt="Arrows church"
                className="scale-[1.35] object-contain"
                fill
                sizes="44px"
                src="/assets/arrows.PNG"
              />
            </span>

            <div className="min-w-0">
              <p className="truncate text-base font-black">Arrows</p>

              <p className="truncate text-xs font-semibold text-slate-400">
                Pastoral Ministry
              </p>
            </div>
          </Link>

          <div className="mt-8">
            <PastorNavigation />
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <ProfileAvatar
                imageUrl={profilePhotoUrl}
                name={name}
                size="sm"
                variant="admin"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{name}</p>

                <p className="text-xs text-slate-400">Pastor</p>
              </div>

              <form action={pastorLogout}>
                <button
                  aria-label="Sign out"
                  className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  title="Sign out"
                  type="submit"
                >
                  <FiLogOut aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-[#fffdfa]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <PastorNavigation mobile />
      </div>
    </div>
  );
}
