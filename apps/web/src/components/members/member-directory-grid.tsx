import { FiUsers } from "react-icons/fi";

import {
  MemberDirectoryCard,
  type DirectoryMember,
} from "./member-directory-card";

export function MemberDirectoryGrid({
  members,
}: {
  members: DirectoryMember[];
}) {
  if (members.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-purple-50 text-2xl text-purple-600">
            <FiUsers />
          </span>

          <p className="mt-4 font-black">No members found</p>

          <p className="mt-1 text-sm text-slate-500">Try another search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {members.map((member) => (
        <MemberDirectoryCard key={member.id} member={member} />
      ))}
    </div>
  );
}
