"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function leaderLogout() {
  const store = await cookies();
  store.delete("acms_leader_session");
  store.delete("acms_member_session");
  redirect("/login");
}
