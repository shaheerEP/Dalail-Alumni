import { NextResponse } from "next/server";
import { verifyMobileAndGetPass } from "@/lib/alumniService";

export async function POST(request) {
  try {
    const body = await request.json();
    const { registrationId, mobileNumber } = body;

    if (!registrationId || !mobileNumber) {
      return NextResponse.json(
        { error: "Both Registration ID and Mobile Number are required." },
        { status: 400 }
      );
    }

    const result = await verifyMobileAndGetPass(registrationId, mobileNumber);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      alumnus: result.alumnus,
    });
  } catch (error) {
    console.error("Error in /api/pass/verify:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while verifying identity." },
      { status: 500 }
    );
  }
}
