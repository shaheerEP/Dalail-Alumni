import { NextResponse } from "next/server";
import { getGoogleSheetData } from "@/lib/googleSheetData";

export async function GET() {
  try {
    const data = await getGoogleSheetData();
    return NextResponse.json({
      registered: data.registeredAlumni || [],
    });
  } catch (err) {
    console.error("Error in GET /api/registered-alumni:", err);
    return NextResponse.json({ registered: [] });
  }
}
