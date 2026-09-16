import { NextResponse } from "next/server";
import { SAMPLE_ALUMNI_ROSTER } from "@/data/options";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const batch = searchParams.get("batch");

  if (!batch) {
    return NextResponse.json({ roster: [] });
  }

  const list = SAMPLE_ALUMNI_ROSTER[batch] || [];
  return NextResponse.json({ roster: list });
}
