import { redirect } from "next/navigation";
import { getMemberResource } from "../member/member-api";

export default async function NotificationDestination() {
  const account = await getMemberResource<{ roles: string[] }>("/auth/me");
  redirect(
    account.roles.includes("PASTOR")
      ? "/pastor/notifications"
      : account.roles.includes("DEPARTMENT_LEADER")
        ? "/leader/inbox"
        : "/member/notifications",
  );
}
