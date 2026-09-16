import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getGoogleSheetData } from "@/lib/googleSheetData";

const FILE_PATH = path.join(process.cwd(), "data", "qualifications.json");

export function getStoredQualifications() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      const initial = { islamic: [], academic: [] };
      fs.writeFileSync(FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(content || '{"islamic":[],"academic":[]}');
  } catch (err) {
    console.error("Error reading qualifications.json:", err);
    return { islamic: [], academic: [] };
  }
}

export function saveQualification(type, value) {
  try {
    if (!value || !value.trim()) return;
    const trimmed = value.trim();
    const data = getStoredQualifications();
    const key = type.toLowerCase() === "islamic" ? "islamic" : "academic";
    if (!Array.isArray(data[key])) {
      data[key] = [];
    }

    const exists = data[key].some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      data[key].push(trimmed);
      const dir = path.dirname(FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Error saving qualification:", err);
  }
}

export async function GET() {
  try {
    const sheetData = await getGoogleSheetData();
    const localData = getStoredQualifications();

    const islamicSet = new Set([
      ...(sheetData.qualifications?.islamic || []),
      ...(localData.islamic || []),
    ]);

    const academicSet = new Set([
      ...(sheetData.qualifications?.academic || []),
      ...(localData.academic || []),
    ]);

    return NextResponse.json({
      islamic: Array.from(islamicSet).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      academic: Array.from(academicSet).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    });
  } catch (err) {
    console.error("Error in GET /api/qualifications:", err);
    return NextResponse.json(getStoredQualifications());
  }
}

export async function POST(request) {
  try {
    const { type, value } = await request.json();
    if (!type || !value || !value.trim()) {
      return NextResponse.json({ error: "Type and value are required." }, { status: 400 });
    }

    saveQualification(type, value);
    const data = getStoredQualifications();
    const key = type.toLowerCase() === "islamic" ? "islamic" : "academic";

    return NextResponse.json({
      success: true,
      qualifications: data[key],
      all: data,
    });
  } catch (err) {
    console.error("API error in /api/qualifications:", err);
    return NextResponse.json({ error: "Failed to save qualification." }, { status: 500 });
  }
}
