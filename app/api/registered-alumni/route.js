import { NextResponse } from "next/server";
import { getAllAlumni } from "@/lib/alumniService";

export async function GET() {
  try {
    const all = await getAllAlumni();
    const registered = all.map((a) => ({
      regId: a.registrationId,
      name: a.fullName,
      place: a.place || "",
      batch: a.batchYear || a.joinedBatch || "",
      section: a.joinedSection || "",
    }));
    return NextResponse.json({ registered });
  } catch (err) {
    console.error("Error in GET /api/registered-alumni:", err);
    return NextResponse.json({ registered: [] });
  }
}
