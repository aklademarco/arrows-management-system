import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiEdit3 } from "react-icons/fi";

import {
  updateLeadershipProfile,
  type ProfileWorkspace,
} from "@/app/leadership-profile-actions";

import { LeadershipProfilePhotoPicker } from "@/components/leadership-profile-photo-picker";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ThemeSetting } from "@/components/theme-setting";

export type LeadershipProfile = {
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  homeAddress?: string | null;
  closestLandmark?: string | null;
  email: string;
  phone?: string | null;
  membershipStatus: string;
  profilePhotoUrl?: string | null;
  directoryBio?: string | null;
  directoryVisible: boolean;
  directoryPhoneVisible: boolean;
  skills: string[];
};

const fieldClass =
  "min-h-14 w-full border-0 bg-transparent px-0 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400";

export function LeadershipProfilePage({
  profile,
  workspace,
  edit,
  updated,
}: {
  profile: LeadershipProfile;
  workspace: ProfileWorkspace;
  edit: boolean;
  updated: boolean;
}) {
  const name = `${profile.firstName} ${profile.lastName}`;

  const dashboardHref = `/${workspace}`;

  const profileHref = `/${workspace}/profile`;

  if (!edit) {
    return (
      <main className="min-h-screen p-4 sm:p-6 xl:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between">
            <Link
              aria-label="Back to dashboard"
              className="grid size-11 place-items-center rounded-full hover:bg-purple-50"
              href={dashboardHref}
            >
              <FiArrowLeft />
            </Link>

            <h1 className="font-black">Your profile</h1>

            <div className="size-11" />
          </header>

          {updated ? (
            <p
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600"
              role="status"
            >
              <FiCheckCircle />
              Profile updated successfully.
            </p>
          ) : null}

          <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6">
              <ProfileAvatar
                imageUrl={profile.profilePhotoUrl}
                name={name}
                size="xl"
              />

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-black">{name}</h2>

                <p className="mt-1 text-sm text-slate-500">
                  {workspace === "pastor"
                    ? "Pastoral ministry"
                    : "Ministry leadership"}
                </p>
              </div>
            </div>

            {profile.directoryBio ? (
              <p className="mt-6 text-sm leading-6 text-slate-700">
                {profile.directoryBio}
              </p>
            ) : null}

            {profile.skills.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            <Link
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-bold text-white"
              href={`${profileHref}?edit=1`}
            >
              <FiEdit3 />
              Edit profile
            </Link>
          </section>

          <section className="mt-5 rounded-2xl bg-white py-3 shadow-sm">
            <ThemeSetting />
          </section>
        </div>
      </main>
    );
  }

  const updateAction = updateLeadershipProfile.bind(null, workspace);

  return (
    <main className="min-h-screen p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <Link
            aria-label="Back to profile"
            className="grid size-11 place-items-center rounded-full hover:bg-purple-50"
            href={profileHref}
          >
            <FiArrowLeft />
          </Link>

          <h1 className="font-black">Edit profile</h1>

          <div className="size-11" />
        </header>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <LeadershipProfilePhotoPicker
              currentPhoto={profile.profilePhotoUrl}
              name={name}
              workspace={workspace}
            />

            <h2 className="mt-4 text-2xl font-black">{name}</h2>
          </div>
        </section>

        <form
          action={updateAction}
          className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-sm"
        >
          <ProfileField label="First name">
            <input
              className={fieldClass}
              defaultValue={profile.firstName}
              name="firstName"
              required
            />
          </ProfileField>

          <ProfileField label="Last name">
            <input
              className={fieldClass}
              defaultValue={profile.lastName}
              name="lastName"
              required
            />
          </ProfileField>

          <ProfileField label="Other names">
            <input
              className={fieldClass}
              defaultValue={profile.otherNames ?? ""}
              name="otherNames"
            />
          </ProfileField>

          <ProfileField label="Date of birth">
            <input
              className={fieldClass}
              defaultValue={profile.dateOfBirth ?? ""}
              name="dateOfBirth"
              required
              type="date"
            />
          </ProfileField>

          <ProfileField label="Home address">
            <input
              className={fieldClass}
              defaultValue={profile.homeAddress ?? ""}
              maxLength={300}
              name="homeAddress"
            />
          </ProfileField>

          <ProfileField label="Closest landmark">
            <input
              className={fieldClass}
              defaultValue={profile.closestLandmark ?? ""}
              maxLength={200}
              name="closestLandmark"
            />
          </ProfileField>

          <ProfileField label="Email">
            <input
              className={`${fieldClass} text-slate-400`}
              defaultValue={profile.email}
              readOnly
            />
          </ProfileField>

          <ProfileField label="Phone">
            <input
              className={fieldClass}
              defaultValue={profile.phone ?? ""}
              name="phone"
              type="tel"
            />
          </ProfileField>

          <ProfileField label="Introduction">
            <textarea
              className="my-3 min-h-28 w-full resize-y rounded-2xl border border-slate-200 p-4"
              defaultValue={profile.directoryBio ?? ""}
              maxLength={300}
              name="directoryBio"
            />
          </ProfileField>

          <ProfileField label="Skills">
            <input
              className={fieldClass}
              defaultValue={profile.skills.join(", ")}
              name="skills"
              placeholder="Photography, singing, teaching"
            />
          </ProfileField>

          <div className="space-y-4 border-b border-slate-100 p-5">
            <label className="flex items-center gap-3">
              <input
                defaultChecked={profile.directoryVisible}
                name="directoryVisible"
                type="checkbox"
              />

              <span className="font-semibold">
                Show me in the church directory
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                defaultChecked={profile.directoryPhoneVisible}
                name="directoryPhoneVisible"
                type="checkbox"
              />

              <span className="font-semibold">Show my phone number</span>
            </label>
          </div>

          <div className="p-5">
            <button
              className="min-h-12 w-full rounded-xl bg-purple-700 px-5 font-bold text-white"
              type="submit"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </main>
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
    <label className="grid grid-cols-[120px_1fr] gap-5 border-b border-slate-100 px-5">
      <span className="pt-[1.1rem] font-semibold text-slate-600">{label}</span>

      {children}
    </label>
  );
}
