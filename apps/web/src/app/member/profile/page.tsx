import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiPhone } from "react-icons/fi";
import { getMemberProfile } from "../member-api";
import type { MemberProfile } from "../member-types";
import { updateOwnProfile } from "../profile-actions";
import { CoverPhotoPicker } from "./cover-photo-picker";
import { ProfilePhotoPicker } from "./profile-photo-picker";

const fieldClass =
  "min-h-14 w-full border-0 border-b border-slate-200 bg-transparent px-0 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-[#8b3bc0] focus:ring-0";

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const [member, parameters] = await Promise.all([
    getMemberProfile<MemberProfile>(),
    searchParams,
  ]);
  const memberName = `${member.firstName} ${member.lastName}`;

  return (
    <main className="min-h-screen bg-[#fbf9fd] text-slate-950">
      <div className="mx-auto w-full max-w-3xl pb-24">
        <header className="sticky top-0 z-10 grid grid-cols-[48px_1fr_48px] items-center border-b border-purple-100 bg-[#fbf9fd]/95 px-4 py-4 backdrop-blur sm:px-6">
          <Link
            aria-label="Back to dashboard"
            className="grid size-11 place-items-center rounded-full border border-purple-100 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-purple-50 hover:text-[#6b21a8]"
            href="/member"
          >
            <FiArrowLeft aria-hidden="true" />
          </Link>
          <h1 className="text-center text-lg font-black">Edit profile</h1>
          <span />
        </header>

        {parameters.updated === "1" ? (
          <p
            className="mx-5 mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300 sm:mx-6"
            role="status"
          >
            <FiCheckCircle aria-hidden="true" /> Profile updated successfully.
          </p>
        ) : null}

        <div className="px-4 sm:px-6">
          <CoverPhotoPicker currentCover={member.coverPhotoUrl}>
            <ProfilePhotoPicker
              compact
              currentPhoto={member.profilePhotoUrl}
              name={memberName}
            />
            <div className="mt-4 text-center">
              <p className="text-lg font-black">{memberName}</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-400">
                {member.membershipStatus.toLowerCase()} member
              </p>
              <p className="mt-3 text-sm font-bold text-[#8b7cff]">
                Use the camera button to edit your picture
              </p>
            </div>
          </CoverPhotoPicker>
        </div>

        <form
          action={updateOwnProfile}
          className="mx-4 mt-7 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-[0_18px_45px_rgba(70,40,100,0.06)] sm:mx-6"
        >
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
              <p className="pb-4 text-xs text-slate-500">
                Email is managed by your church account.
              </p>
            </div>
          </ProfileField>
          <ProfileField label="Phone">
            <div>
              <input
                className={fieldClass}
                defaultValue={member.phone ?? ""}
                id="phone"
                name="phone"
                placeholder="+233240000000"
                type="tel"
              />
              <p className="flex items-center gap-2 pb-4 text-xs text-slate-500">
                <FiPhone aria-hidden="true" /> Use international format.
              </p>
            </div>
          </ProfileField>

          <div className="bg-purple-50/50 px-5 py-6 sm:px-7">
            <button
              className="member-primary-action mx-auto sm:ml-auto sm:mr-0"
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
    <label className="grid grid-cols-[110px_1fr] gap-5 px-5 text-base sm:grid-cols-[150px_1fr] sm:px-7">
      <span className="pt-[1.1rem] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
