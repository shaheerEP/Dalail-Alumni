import { NextResponse } from "next/server";
import { updateAlumnusRecord, verifyMobileAndGetPass } from "@/lib/alumniService";
import { saveQualification } from "@/app/api/qualifications/route";

export async function POST(request) {
  try {
    const body = await request.json();
    const { registrationId, originalMobile, ...fieldsToUpdate } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });
    }

    // Verify authorized user with original mobile or registered mobile
    if (originalMobile) {
      const verifyRes = await verifyMobileAndGetPass(registrationId, originalMobile);
      if (!verifyRes.success) {
        return NextResponse.json(
          { error: "Verification failed. Unauthorized to update this registration." },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    if (fieldsToUpdate.fullName !== undefined && !fieldsToUpdate.fullName.trim()) {
      return NextResponse.json({ error: "Full Name cannot be empty." }, { status: 400 });
    }
    if (fieldsToUpdate.place !== undefined && !fieldsToUpdate.place.trim()) {
      return NextResponse.json({ error: "Place cannot be empty." }, { status: 400 });
    }

    const result = await updateAlumnusRecord(registrationId, fieldsToUpdate);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Save newly added qualifications for autocomplete
    if (fieldsToUpdate.islamicQualification) {
      saveQualification("islamic", fieldsToUpdate.islamicQualification);
    }
    if (fieldsToUpdate.academicQualification) {
      saveQualification("academic", fieldsToUpdate.academicQualification);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /api/pass/update:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating details." },
      { status: 500 }
    );
  }
}
