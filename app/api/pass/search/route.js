import { NextResponse } from "next/server";
import { searchAlumniByName } from "@/lib/alumniService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("name") || "";

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchAlumniByName(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in /api/pass/search:", error);
    return NextResponse.json({ error: "Failed to search registered names" }, { status: 500 });
  }
}
