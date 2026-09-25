"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function pastorLogout() {
  const store = await cookies();

  store.delete("acms_pastor_session");
  store.delete("acms_member_session");

  redirect("/login")
}
