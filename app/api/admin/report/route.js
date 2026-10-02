import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markReporting } from "@/lib/alumniService";
import { isValidSession } from "@/app/api/admin/auth/route";

const ADMIN_COOKIE_NAME = "dkk_admin_session";

function getSessionUser(token) {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    return parsed.u || "Admin";
  } catch (e) {
    return "Admin";
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const adminName = getSessionUser(token);
    const body = await request.json();
    const { registrationId, markFeePaid, feeAmount } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 });
    }

    const result = await markReporting(
      registrationId,
      adminName,
      Boolean(markFeePaid),
      feeAmount
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to mark attendance in database",
          details: result.details || null,
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in /api/admin/report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark attendance",
        details: error.stack || null,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
