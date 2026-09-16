const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/export?format=csv";

// In-memory cache with 15-second TTL
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000;

function parseCSVLine(line) {
  const row = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  return row;
}

export async function getGoogleSheetData() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 15 },
      headers: {
        "User-Agent": "Dalailul-Khairath-Alumni-Portal",
      },
    });

    if (!response.ok) {
      if (cachedData) return cachedData;
      return { registeredAlumni: [], qualifications: { islamic: [], academic: [] } };
    }

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const registeredAlumni = [];
    const islamicSet = new Set();
    const academicSet = new Set();

    // Row 0 is the header row
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const regIdIdx = headers.findIndex((h) => h.includes("registration id"));
    const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("institution"));
    const placeIdx = headers.findIndex((h) => h.includes("place"));
    const batchIdx = headers.findIndex((h) => h.includes("batch"));
    const islamicIdx = headers.findIndex((h) => h.includes("islamic"));
    const academicIdx = headers.findIndex((h) => h.includes("academic"));

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 3) continue;

      const timestamp = row[0] || "";
      const regId = (regIdIdx !== -1 ? row[regIdIdx] : row[1]) || "";
      const name = (nameIdx !== -1 ? row[nameIdx] : row[2]) || "";
      const place = (placeIdx !== -1 ? row[placeIdx] : row[3]) || "";
      const batch = (batchIdx !== -1 ? row[batchIdx] : row[6]) || "";
      const islamicQual = (islamicIdx !== -1 ? row[islamicIdx] : row[8]) || "";
      const academicQual = (academicIdx !== -1 ? row[academicIdx] : row[9]) || "";

      // Valid registered entry has a name and registration ID
      if (name && regId && !name.toLowerCase().includes("full name") && !regId.toLowerCase().includes("registration id")) {
        registeredAlumni.push({
          regId,
          name,
          place,
          batch,
          timestamp,
        });
      }

      // Collect unique Islamic Qualifications
      if (
        islamicQual &&
        !islamicQual.toLowerCase().includes("qualification") &&
        islamicQual.trim().length > 1
      ) {
        islamicSet.add(islamicQual.trim());
      }

      // Collect unique Academic Qualifications
      if (
        academicQual &&
        !academicQual.toLowerCase().includes("qualification") &&
        academicQual.trim().length > 1
      ) {
        academicSet.add(academicQual.trim());
      }
    }

    cachedData = {
      registeredAlumni,
      qualifications: {
        islamic: Array.from(islamicSet).sort((a, b) => a.localeCompare(b)),
        academic: Array.from(academicSet).sort((a, b) => a.localeCompare(b)),
      },
    };
    lastFetchTime = now;
    return cachedData;
  } catch (err) {
    console.error("Error fetching Google Sheet CSV data:", err);
    if (cachedData) return cachedData;
    return { registeredAlumni: [], qualifications: { islamic: [], academic: [] } };
  }
}
