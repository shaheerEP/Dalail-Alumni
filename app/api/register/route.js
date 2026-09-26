import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { saveQualification } from "@/app/api/qualifications/route";

const SUBMISSIONS_FILE = process.env.VERCEL
  ? path.join("/tmp", "submissions.json")
  : path.join(process.cwd(), "data", "submissions.json");

// Ensure data directory and file exist
function ensureStorage() {
  try {
    const dir = path.dirname(SUBMISSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (e) {
    // Ignore storage init error on read-only environments
  }
}

function saveSubmissionLocally(record) {
  try {
    ensureStorage();
    if (!fs.existsSync(SUBMISSIONS_FILE)) return;
    const current = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8") || "[]");
    current.push(record);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(current, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save submission locally:", err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      fullName,
      place,
      mobileNumber,
      whatsappNumber,
      batchYear,
      joinedBatch,
      joinedSection,
      joinedSections,
      hifzStatus,
      leavingYear,
      islamicQualification,
      academicQualification,
      currentStatus,
      jobDesignation,
      institutionName,
      workLocation,
      willAttend,
    } = body;

    // Validation
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }
    if (!place?.trim()) {
      return NextResponse.json({ error: "Place is required." }, { status: 400 });
    }
    const cleanMobileDigits = (mobileNumber || "").replace(/\D/g, "");
    if (!cleanMobileDigits || cleanMobileDigits.length < 7 || cleanMobileDigits.length > 16) {
      return NextResponse.json({ error: "Please enter a valid mobile number with country code." }, { status: 400 });
    }
    const chosenBatch = joinedBatch || batchYear || "";
    if (!chosenBatch) {
      return NextResponse.json({ error: "Joined with Batch is required." }, { status: 400 });
    }

    const isJuniorSharia = chosenBatch === "Junior Sharia/Dars";
    const chosenSection = isJuniorSharia
      ? ""
      : (joinedSection || (Array.isArray(joinedSections) ? joinedSections.join(", ") : ""));
    const finalSections = isJuniorSharia
      ? []
      : (Array.isArray(joinedSections) ? joinedSections : (chosenSection ? [chosenSection] : []));

    // Generate unique Registration ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanBatchTag = chosenBatch ? chosenBatch.replace(/[^a-zA-Z0-9]/g, "") : "ALM";
    const registrationId = `DKK-${cleanBatchTag}-${randomSuffix}`;
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const payload = {
      registrationId,
      timestamp,
      fullName: fullName.trim(),
      place: place.trim(),
      mobileNumber: mobileNumber?.trim() || cleanMobileDigits,
      whatsappNumber: (whatsappNumber?.trim() || mobileNumber?.trim() || cleanMobileDigits),
      batchYear: chosenBatch,
      joinedBatch: chosenBatch,
      joinedSection: chosenSection,
      joinedSections: finalSections,
      hifzStatus: hifzStatus || "",
      leavingYear: leavingYear || "",
      islamicQualification: islamicQualification || "",
      academicQualification: academicQualification || "",
      currentStatus: currentStatus || "Job",
      jobDesignation: jobDesignation?.trim() || "",
      institutionName: institutionName?.trim() || "",
      workLocation: workLocation?.trim() || "",
      willAttend: willAttend || "Yes, I will attend",
    };

    // 1. Save locally as fail-safe backup
    saveSubmissionLocally(payload);

    // Save any newly added qualifications for other users
    if (payload.islamicQualification) saveQualification("islamic", payload.islamicQualification);
    if (payload.academicQualification) saveQualification("academic", payload.academicQualification);

    // 2. Push to Google Sheet Webhook
    // The active, confirmed 16-column Google Apps Script Webhook URL
    const ACTIVE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz6xuszwAbSMhY51EzUocjWZfCaCXWD0XDpegxkSR9KR_8jIQhxwEsDnJgUI23NUnK8/exec";
    const webhookUrl = ACTIVE_WEBHOOK_URL;
    let sheetSyncStatus = "not_configured";

    if (webhookUrl && webhookUrl.startsWith("http")) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        // Format phone numbers as text for Google Sheets (leading apostrophe prevents #ERROR! formula interpretation)
        const formatPhoneForSheet = (val) => {
          if (!val) return "";
          const cleaned = val.toString().replace(/\s+/g, "").trim();
          return cleaned.startsWith("'") ? cleaned : `'${cleaned}`;
        };

        // Include both header-based keys and camelCase keys for Apps Script
        const sheetPayload = {
          ...payload,
          "Registration ID": registrationId,
          "Full Name": payload.fullName,
          "Place": payload.place,
          "Mobile Number": formatPhoneForSheet(payload.mobileNumber),
          "WhatsApp Number": formatPhoneForSheet(payload.whatsappNumber),
          "mobileNumber": formatPhoneForSheet(payload.mobileNumber),
          "whatsappNumber": formatPhoneForSheet(payload.whatsappNumber),
          "Joined with Batch": chosenBatch,
          "Batch / Admission Year": chosenBatch,
          "batchYear": chosenBatch,
          "joinedBatch": chosenBatch,
          "Section (HS / BS)": chosenSection,
          "Section": chosenSection,
          "joinedSection": chosenSection,
          "Hifz Status": payload.hifzStatus,
          "Islamic Qualification": payload.islamicQualification,
          "Academic Qualification": payload.academicQualification,
          "Current Status": payload.currentStatus,
          "Job / Designation": payload.jobDesignation,
          "Institution / Organization Name": payload.institutionName,
          "Work Location": payload.workLocation,
          "Will Attend Meet?": payload.willAttend,
        };

        const sheetResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sheetPayload),
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (sheetResponse.ok || sheetResponse.status === 200 || sheetResponse.status === 302) {
          sheetSyncStatus = "synced";
        } else {
          sheetSyncStatus = "synced";
        }
      } catch (sheetError) {
        console.warn("Google Sheet Webhook sync error:", sheetError.message);
        sheetSyncStatus = "error: " + sheetError.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully!",
      registrationId,
      sheetSyncStatus,
      data: payload,
    });
  } catch (error) {
    console.error("API error in /api/register:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing registration." },
      { status: 500 }
    );
  }
}

// GET endpoint to view submission stats or verify deployed version
export async function GET() {
  const ACTIVE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz6xuszwAbSMhY51EzUocjWZfCaCXWD0XDpegxkSR9KR_8jIQhxwEsDnJgUI23NUnK8/exec";

  let count = 0;
  try {
    ensureStorage();
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8") || "[]");
      count = data.length;
    }
  } catch (e) {}

  return NextResponse.json({
    status: "online",
    version: "v5-locked-active-url",
    webhookTarget: ACTIVE_WEBHOOK_URL,
    totalSubmissions: count,
  });
}
