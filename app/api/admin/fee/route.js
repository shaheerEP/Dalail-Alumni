import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getFees,
  updateFeeSettings,
  setAlumnusFeeStatus,
  getAlumniStats,
} from "@/lib/alumniService";
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const fees = getFees();
    const stats = await getAlumniStats();

    return NextResponse.json({
      success: true,
      settings: fees.settings,
      feeStats: stats.feeStats,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/fee:", error);
    return NextResponse.json({ error: "Failed to fetch fee data" }, { status: 500 });
  }
}

// POST: Mark / unmark alumnus fee status
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const adminName = getSessionUser(token);
    const body = await request.json();
    const { registrationId, paid, amount } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 });
    }

    const result = await setAlumnusFeeStatus(registrationId, {
      paid: paid !== false,
      amount,
      adminName,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to update fee record in database",
          details: result.details || null,
        },
        {
          status: 500,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/fee:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update fee record",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }
}

// PUT: Update default fee settings
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!isValidSession(token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { defaultFee } = body;

    const result = await updateFeeSettings({ defaultFee });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/admin/fee:", error);
    return NextResponse.json({ error: "Failed to update fee settings" }, { status: 500 });
  }
}
