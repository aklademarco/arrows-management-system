import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token)
    return NextResponse.redirect(new URL("/admin/login", request.url));
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/reports/attendance.csv?${request.nextUrl.searchParams}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok)
    return NextResponse.json(
      { message: "The attendance export could not be generated." },
      { status: response.status },
    );
  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        'attachment; filename="attendance.csv"',
    },
  });
}
