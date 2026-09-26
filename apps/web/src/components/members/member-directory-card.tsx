import Image from "next/image";
import Link from "next/link";
import { FiUser } from "react-icons/fi";

export type DirectoryMember = {
  id: string;
  displayName: string;
  profilePhotoUrl?: string | null;
  subtitle?: string | null;
  href: string;
};

export function MemberDirectoryCard({ member }: { member: DirectoryMember }) {
  const initials = member.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("");

  return (
    <Link
      aria-label={`View ${member.displayName}`}
      className="group flex min-w-0 flex-col items-center text-center"
      href={member.href}
    >
      <div className="relative aspect-square w-full max-w-24 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md sm:max-w-28">
        {member.profilePhotoUrl ? (
          <Image
            alt={`${member.displayName} profile`}
            className="object-cover"
            fill
            sizes="112px"
            src={member.profilePhotoUrl}
            unoptimized
          />
        ) : (
          <div className="grid size-full place-items-center bg-purple-100 text-xl font-black text-purple-700">
            {initials || <FiUser />}
          </div>
        )}
      </div>

      <p className="mt-2 w-full truncate text-xs font-black text-slate-950 sm:text-sm">
        {member.displayName}
      </p>

      {member.subtitle && (
        <p className="mt-0.5 w-full truncate text-[11px] font-medium text-slate-400">
          {member.subtitle}
        </p>
      )}
    </Link>
  );
}
