import {
  LeadershipProfilePage,
  type LeadershipProfile,
} from "@/components/leadership-profile-page";

import { getPastorResource } from "../pastor-api";

export default async function PastorProfile({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    updated?: string;
  }>;
}) {
  const [profile, parameters] = await Promise.all([
    getPastorResource<LeadershipProfile>("/members/me"),
    searchParams,
  ]);

  return (
    <LeadershipProfilePage
      edit={parameters.edit === "1"}
      profile={profile}
      updated={parameters.updated === "1"}
      workspace="pastor"
    />
  );
}
