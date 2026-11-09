import type { NextRequest } from "next/server";

import { proxyMemberExport } from "@/lib/member-records";

export function GET(request: NextRequest) {
  return proxyMemberExport(request, "acms_leader_session");
}
