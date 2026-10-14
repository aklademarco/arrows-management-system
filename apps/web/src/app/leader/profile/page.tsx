import {
  LeadershipProfilePage,
  type LeadershipProfile,
} from "@/components/leadership-profile-page";

import { getLeaderResource } from "../leader-api";

export default async function LeaderProfile({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    updated?: string;
  }>;
}) {
  const [profile, parameters] = await Promise.all([
    getLeaderResource<LeadershipProfile>("/members/me"),
    searchParams,
  ]);

  return (
    <LeadershipProfilePage
      edit={parameters.edit === "1"}
      profile={profile}
      updated={parameters.updated === "1"}
      workspace="leader"
    />
  );
}
