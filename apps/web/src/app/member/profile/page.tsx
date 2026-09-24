import Link from "next/link";
import {
  FiArrowLeft,
  FiBell,
  FiCheckCircle,
  FiChevronRight,
  FiEdit3,
  FiFileText,
  FiImage,
} from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getMemberProfile } from "../member-api";
import type { MemberProfile } from "../member-types";
import { updateOwnProfile } from "../profile-actions";
import { ProfilePhotoPicker } from "./profile-photo-picker";
import { ThemeSetting } from "@/components/theme-setting";

const fieldClass =
  "min-h-14 w-full border-0  bg-transparent px-0 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400";

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; updated?: string }>;
}) {
  const [member, parameters] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    searchParams,
  ]);

  const memberName = `${member.firstName} ${member.lastName}`;

  if (parameters.edit !== "1") {
    return (
      <main className="min-h-screen bg-[#fbf9fd] text-slate-950">
        <div className="mx-auto w-full max-w-3xl pb-24">
          <header className="sticky top-0 z-10 grid grid-cols-[48px_1fr_48px] items-center bg-[#fbf9fd]/95 px-4 py-4 backdrop-blur sm:px-6">
            <Link
              aria-label="Back to dashboard"
              className="grid size-11 place-items-center rounded-full text-xl text-slate-800 transition hover:bg-purple-50"
              href="/member"
            >
              <FiArrowLeft aria-hidden="true" />
            </Link>
            <h1 className="text-center text-base font-black">Profile</h1>
            <span />
          </header>

          {parameters.updated === "1" ? (
            <p
              className="mx-5 mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600 sm:mx-6"
              role="status"
            >
              <FiCheckCircle aria-hidden="true" /> Profile updated successfully.
            </p>
          ) : null}

          <section className="px-5 pb-6 pt-5 sm:px-7">
            <div className="flex items-center gap-6 sm:gap-10">
              <ProfileAvatar
                imageUrl={member.profilePhotoUrl}
                name={memberName}
                size="xl"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold sm:text-2xl">
                  {memberName}
                </h2>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center sm:max-w-md">
                  <ProfileStat
                    label="Status"
                    value={member.membershipStatus.toLowerCase()}
                  />
                  <ProfileStat
                    label="Skills"
                    value={String(member.skills.length)}
                  />
                  <ProfileStat
                    label="Directory"
                    value={member.directoryVisible ? "Visible" : "Private"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              {member.otherNames ? (
                <p className="text-sm font-semibold capitalize">
                  {member.otherNames}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-700">
                {member.directoryBio ||
                  "Add an introduction so your church family can know you better."}
              </p>
              {member.skills.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <span
                      className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#6b21a8]"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <Link
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-300"
              href="/member/profile?edit=1"
            >
              <FiEdit3 aria-hidden="true" /> Edit profile
            </Link>
          </section>

          <ThemeSetting />

          <nav
            aria-label="More member pages"
            className="mx-4 mt-5 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm sm:mx-6 lg:hidden"
          >
            <ProfileLink
              href="/member/absences"
              icon={<FiFileText />}
              label="Absences"
            />
            <ProfileLink
              href="/member/media-hub"
              icon={<FiImage />}
              label="Media hub"
            />
            <ProfileLink
              href="/member/notifications"
              icon={<FiBell />}
              label="Notifications"
            />
          </nav>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf9fd] text-slate-950">
      <div className="mx-auto w-full max-w-3xl pb-24">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-[#fbf9fd]/95 px-4 py-4 backdrop-blur sm:px-6">
          <Link
            aria-label="Back to profile"
            href="/member/profile"
            className="grid size-11 place-items-center rounded-full text-xl text-slate-800 transition hover:bg-purple-50"
          >
            <FiArrowLeft />
          </Link>

          <h1 className="text-base font-black">Edit profile</h1>

          <div className="size-11" />
        </header>

        {parameters.updated === "1" && (
          <p
            className="mx-4 mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600 sm:mx-6"
            role="status"
          >
            <FiCheckCircle />
            Profile updated successfully.
          </p>
        )}

        <section className="px-5 pb-7 pt-3 sm:px-7">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1 pt-2">
              <h2 className="truncate text-2xl font-black tracking-tight">
                {memberName}
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-400">
                @{member.firstName.toLowerCase()}
              </p>

              <div className="mt-5 flex items-center gap-6">
                <div>
                  <p className="text-lg font-black capitalize">
                    {member.membershipStatus.toLowerCase()}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    Membership
                  </p>
                </div>

                <div>
                  <p className="text-lg font-black">{member.skills.length}</p>
                  <p className="text-xs font-medium text-slate-400">Skills</p>
                </div>
              </div>
            </div>

            {/* PROFILE PHOTO */}
            <div className="shrink-0">
              <ProfilePhotoPicker
                compact
                currentPhoto={member.profilePhotoUrl}
                name={memberName}
              />
            </div>
          </div>

          {member.directoryBio && (
            <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-slate-700">
              {member.directoryBio}
            </p>
          )}
        </section>

        <div className="mx-4 overflow-hidden border-purple-100 bg-white shadow-[0_18px_45px_rgba(70,40,100,0.06)] sm:mx-6">
          <div>
            <nav
              aria-label="More member pages"
              className="mx-4 mb-5 overflow-hidden  bg-white sm:mx-6 lg:hidden"
            >
              <ProfileLink
                href="/member/absences"
                icon={<FiFileText />}
                label="Absences"
              />
              <ProfileLink
                href="/member/media-hub"
                icon={<FiImage />}
                label="Media hub"
              />
              <ProfileLink
                href="/member/notifications"
                icon={<FiBell />}
                label="Notifications"
              />
            </nav>
          </div>
          {/* PROFILE FORM */}
          <form action={updateOwnProfile}>
            <ProfileField label="First name">
              <input
                className={fieldClass}
                defaultValue={member.firstName}
                id="firstName"
                name="firstName"
                required
              />
            </ProfileField>

            <ProfileField label="Last name">
              <input
                className={fieldClass}
                defaultValue={member.lastName}
                id="lastName"
                name="lastName"
                required
              />
            </ProfileField>

            <ProfileField label="Other names">
              <input
                className={fieldClass}
                defaultValue={member.otherNames ?? ""}
                id="otherNames"
                name="otherNames"
                placeholder="Add other names"
              />
            </ProfileField>

            <ProfileField label="Email">
              <div>
                <input
                  className={`${fieldClass} text-slate-500`}
                  defaultValue={member.email}
                  id="email"
                  readOnly
                />
              </div>
            </ProfileField>

            <ProfileField label="Phone">
              <div>
                <input
                  className={fieldClass}
                  defaultValue={member.phone ?? ""}
                  id="phone"
                  name="phone"
                  placeholder="024 123 4567"
                  type="tel"
                />
              </div>
            </ProfileField>

            <ProfileField label="Introduction">
              <div className="py-3">
                <textarea
                  className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-[#fbf9fd] p-4 text-sm font-medium leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-[#8b3bc0] focus:ring-4 focus:ring-purple-100"
                  defaultValue={member.directoryBio ?? ""}
                  id="directoryBio"
                  maxLength={300}
                  name="directoryBio"
                  placeholder="Share a little about yourself with your church family. Maximum 300 characters"
                />
              </div>
            </ProfileField>

            <ProfileField label="Skills">
              <div className="py-3">
                <input
                  className={fieldClass}
                  defaultValue={member.skills.join(", ")}
                  id="skills"
                  name="skills"
                  placeholder="Photography, singing, teaching"
                />
              </div>
            </ProfileField>

            {/* DIRECTORY SETTINGS */}
            <div className="mx-5 my-5 rounded-2xl bg-purple-50 p-4 sm:mx-7">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  className="mt-1 size-5 rounded border-purple-300 text-[#6b21a8] focus:ring-purple-300"
                  defaultChecked={member.directoryVisible}
                  name="directoryVisible"
                  type="checkbox"
                />
                <span className="block text-sm font-black text-slate-900">
                  Show me in the church directory
                </span>
              </label>

              <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-purple-100 pt-4">
                <input
                  className="mt-1 size-5 rounded border-purple-300 text-[#6b21a8] focus:ring-purple-300"
                  defaultChecked={member.directoryPhoneVisible}
                  name="directoryPhoneVisible"
                  type="checkbox"
                />
                <span className="block text-sm font-black text-slate-900">
                  Show my phone number
                </span>
              </label>
            </div>

            {/* SAVE BUTTON */}
            <div className="border-t border-purple-100 bg-purple-50/50 px-5 py-6 sm:px-7">
              <button
                className="member-primary-action mx-auto sm:ml-auto sm:mr-0"
                type="submit"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function ProfileLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 border-b border-purple-50 px-4 text-sm font-semibold last:border-b-0 hover:bg-purple-50/70"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-purple-50 text-lg text-[#6b21a8]">
        {icon}
      </span>

      <span className="flex-1">{label}</span>

      <FiChevronRight className="text-slate-300" />
    </Link>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold capitalize sm:text-base">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-slate-400 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function ProfileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid grid-cols-[110px_1fr] gap-5 border-b border-slate-100 px-5 text-base last:border-b-0 sm:grid-cols-[150px_1fr] sm:px-7">
      <span className="pt-[1.1rem] font-semibold text-slate-600">{label}</span>

      {children}
    </label>
  );
}
