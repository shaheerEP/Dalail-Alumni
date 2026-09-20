import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unmarkReporting } from "@/lib/alumniService";
import { isValidSession } from "@/app/api/admin/auth/route";

const ADMIN_COOKIE_NAME = "dkk_admin_session";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 });
    }

    const result = unmarkReporting(registrationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/admin/unreport:", error);
    return NextResponse.json({ error: "Failed to unmark attendance" }, { status: 500 });
  }
}
