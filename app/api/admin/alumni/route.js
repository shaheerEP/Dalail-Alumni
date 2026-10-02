import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllAlumni, getAlumniStats, getRecentCheckins } from "@/lib/alumniService";
import { isValidSession } from "@/app/api/admin/auth/route";

const ADMIN_COOKIE_NAME = "dkk_admin_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const [alumni, stats, recentCheckins] = await Promise.all([
      getAllAlumni(),
      getAlumniStats(),
      getRecentCheckins(30),
    ]);

    return NextResponse.json(
      {
        success: true,
        alumni,
        stats,
        recentCheckins,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching admin alumni list:", error);
    return NextResponse.json({ error: "Failed to fetch alumni roster" }, { status: 500 });
  }
}
