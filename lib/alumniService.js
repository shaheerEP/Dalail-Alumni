import fs from "fs";
import path from "path";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/export?format=csv";

const SUBMISSIONS_FILE = process.env.VERCEL
  ? path.join("/tmp", "submissions.json")
  : path.join(process.cwd(), "data", "submissions.json");

const CHECKINS_FILE = process.env.VERCEL
  ? path.join("/tmp", "checkins.json")
  : path.join(process.cwd(), "data", "checkins.json");

// In-memory cache for Google Sheet CSV
let cachedSheetAlumni = null;
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

// Clean phone string to pure digits for robust comparison
export function extractPhoneDigits(phone) {
  if (!phone) return "";
  return phone.toString().replace(/\D/g, "");
}

// Normalize phone check (handles country code like +91 vs 10-digit input)
export function phonesMatch(storedPhone, inputPhone) {
  const storedDigits = extractPhoneDigits(storedPhone);
  const inputDigits = extractPhoneDigits(inputPhone);
  if (!storedDigits || !inputDigits) return false;
  if (storedDigits === inputDigits) return true;
  if (storedDigits.length >= 10 && inputDigits.length >= 10) {
    return storedDigits.slice(-10) === inputDigits.slice(-10);
  }
  return storedDigits.endsWith(inputDigits) || inputDigits.endsWith(storedDigits);
}

// Ensure check-ins file exists
function ensureCheckinsFile() {
  try {
    const dir = path.dirname(CHECKINS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CHECKINS_FILE)) {
      fs.writeFileSync(CHECKINS_FILE, JSON.stringify({}, null, 2), "utf8");
    }
  } catch (e) {
    console.error("Failed to init checkins storage:", e);
  }
}

// Read check-ins map: { [registrationId]: { reportedAt, reportedBy } }
export function getCheckins() {
  try {
    ensureCheckinsFile();
    if (fs.existsSync(CHECKINS_FILE)) {
      const content = fs.readFileSync(CHECKINS_FILE, "utf8");
      return JSON.parse(content || "{}");
    }
  } catch (e) {
    console.error("Error reading checkins file:", e);
  }
  return {};
}

// Save check-ins map
export function saveCheckins(checkins) {
  try {
    ensureCheckinsFile();
    fs.writeFileSync(CHECKINS_FILE, JSON.stringify(checkins, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Error writing checkins file:", e);
    return false;
  }
}

// Fetch alumni from Google Sheet CSV
async function fetchGoogleSheetAlumni() {
  const now = Date.now();
  if (cachedSheetAlumni && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSheetAlumni;
  }

  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 15 },
      headers: {
        "User-Agent": "Dalailul-Khairath-Alumni-Portal",
      },
    });

    if (!response.ok) {
      return cachedSheetAlumni || [];
    }

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return cachedSheetAlumni || [];
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const regIdIdx = headers.findIndex((h) => h.includes("registration id"));
    const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("institution"));
    const placeIdx = headers.findIndex((h) => h.includes("place"));
    const mobileIdx = headers.findIndex((h) => h.includes("mobile"));
    const whatsappIdx = headers.findIndex((h) => h.includes("whatsapp"));
    const batchIdx = headers.findIndex((h) => h.includes("batch"));
    const sectionIdx = headers.findIndex((h) => h.includes("section") || h.includes("hs"));
    const hifzIdx = headers.findIndex((h) => h.includes("hifz"));
    const islamicIdx = headers.findIndex((h) => h.includes("islamic"));
    const academicIdx = headers.findIndex((h) => h.includes("academic"));
    const statusIdx = headers.findIndex((h) => h.includes("current status") || h.includes("status"));
    const jobIdx = headers.findIndex((h) => h.includes("job") || h.includes("designation"));
    const instIdx = headers.findIndex((h) => h.includes("institution") || h.includes("organization"));
    const locIdx = headers.findIndex((h) => h.includes("location"));
    const attendIdx = headers.findIndex((h) => h.includes("attend"));

    const list = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 3) continue;

      const regId = (regIdIdx !== -1 ? row[regIdIdx] : row[1]) || "";
      const name = (nameIdx !== -1 ? row[nameIdx] : row[2]) || "";
      if (!name || !regId || name.toLowerCase().includes("full name")) continue;

      const cleanPhone = (val) => (val || "").replace(/^'/, "").trim();

      list.push({
        registrationId: regId.trim(),
        fullName: name.trim(),
        place: (placeIdx !== -1 ? row[placeIdx] : "") || "",
        mobileNumber: cleanPhone(mobileIdx !== -1 ? row[mobileIdx] : ""),
        whatsappNumber: cleanPhone(whatsappIdx !== -1 ? row[whatsappIdx] : ""),
        batchYear: (batchIdx !== -1 ? row[batchIdx] : "") || "",
        joinedBatch: (batchIdx !== -1 ? row[batchIdx] : "") || "",
        joinedSection: (sectionIdx !== -1 ? row[sectionIdx] : "") || "",
        hifzStatus: (hifzIdx !== -1 ? row[hifzIdx] : "") || "",
        islamicQualification: (islamicIdx !== -1 ? row[islamicIdx] : "") || "",
        academicQualification: (academicIdx !== -1 ? row[academicIdx] : "") || "",
        currentStatus: (statusIdx !== -1 ? row[statusIdx] : "") || "Job",
        jobDesignation: (jobIdx !== -1 ? row[jobIdx] : "") || "",
        institutionName: (instIdx !== -1 ? row[instIdx] : "") || "",
        workLocation: (locIdx !== -1 ? row[locIdx] : "") || "",
        willAttend: (attendIdx !== -1 ? row[attendIdx] : "") || "Yes, I will attend",
        timestamp: row[0] || "",
        source: "google_sheet",
      });
    }

    cachedSheetAlumni = list;
    lastFetchTime = now;
    return list;
  } catch (err) {
    console.error("Error fetching sheet alumni:", err);
    return cachedSheetAlumni || [];
  }
}

// Fetch local submissions
function getLocalSubmissions() {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8") || "[]");
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error("Error reading local submissions:", e);
  }
  return [];
}

// Get all consolidated alumni with checkin statuses
export async function getAllAlumni() {
  const [sheetList, localList, checkins] = await Promise.all([
    fetchGoogleSheetAlumni(),
    Promise.resolve(getLocalSubmissions()),
    Promise.resolve(getCheckins()),
  ]);

  const map = new Map();

  // Add sheet entries
  for (const item of sheetList) {
    if (item.registrationId) {
      map.set(item.registrationId, item);
    }
  }

  // Overlay local entries (often newer or contains submissions if sheet sync failed)
  for (const item of localList) {
    if (item.registrationId) {
      const existing = map.get(item.registrationId);
      map.set(item.registrationId, {
        ...(existing || {}),
        ...item,
        batchYear: item.batchYear || item.joinedBatch || existing?.batchYear || "",
        joinedSection: item.joinedSection || existing?.joinedSection || "",
      });
    }
  }

  // Attach check-in details
  const results = [];
  for (const alumnus of map.values()) {
    const checkin = checkins[alumnus.registrationId];
    results.push({
      ...alumnus,
      isReported: Boolean(checkin),
      reportedAt: checkin?.reportedAt || null,
      reportedBy: checkin?.reportedBy || null,
    });
  }

  // Sort by name alphabetically
  results.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  return results;
}

// Public search by typed name spellings (returns minimal safe fields)
export async function searchAlumniByName(searchQuery) {
  if (!searchQuery || !searchQuery.trim()) return [];

  const query = searchQuery.trim().toLowerCase();
  const all = await getAllAlumni();

  // Split query words for flexible token matching
  const tokens = query.split(/\s+/).filter(Boolean);

  const matched = all.filter((alumnus) => {
    const name = (alumnus.fullName || "").toLowerCase();
    // Direct match or all tokens matched
    if (name.includes(query)) return true;
    return tokens.every((token) => name.includes(token));
  });

  // Return public safe projection only
  return matched.map((a) => ({
    registrationId: a.registrationId,
    fullName: a.fullName,
    batchYear: a.batchYear || a.joinedBatch || "",
    joinedSection: a.joinedSection || "",
    place: a.place || "",
    currentStatus: a.currentStatus || "",
  }));
}

// Verify mobile number and retrieve pass
export async function verifyMobileAndGetPass(registrationId, mobileNumber) {
  if (!registrationId || !mobileNumber) {
    return { success: false, error: "Registration ID and Mobile Number are required." };
  }

  const all = await getAllAlumni();
  const alumnus = all.find(
    (a) => (a.registrationId || "").toLowerCase() === registrationId.trim().toLowerCase()
  );

  if (!alumnus) {
    return { success: false, error: "Registration record not found. Please verify your details." };
  }

  const matchesMobile = phonesMatch(alumnus.mobileNumber, mobileNumber);
  const matchesWhatsapp = phonesMatch(alumnus.whatsappNumber, mobileNumber);

  if (!matchesMobile && !matchesWhatsapp) {
    return {
      success: false,
      error: "The mobile number entered does not match the registered record for this name.",
    };
  }

  return {
    success: true,
    alumnus,
  };
}

// Mark attendance / reporting
export async function markReporting(registrationId, adminName = "Admin") {
  if (!registrationId) return { success: false, error: "Registration ID is required." };

  const id = registrationId.trim();
  const checkins = getCheckins();

  // Strict check: if already reported, NEVER allow reporting again
  const existingKey = Object.keys(checkins).find(
    (k) => k.toLowerCase() === id.toLowerCase()
  );

  if (existingKey) {
    const existingCheckin = checkins[existingKey];
    const all = await getAllAlumni();
    const alumnus = all.find(
      (a) => (a.registrationId || "").toLowerCase() === id.toLowerCase()
    ) || { registrationId: existingKey };

    return {
      success: true,
      alreadyReported: true,
      alumnus: {
        ...alumnus,
        isReported: true,
        reportedAt: existingCheckin.reportedAt,
      },
      reportedAt: existingCheckin.reportedAt,
      message: `Already reported at ${existingCheckin.reportedAt}. Cannot report again.`,
    };
  }

  const all = await getAllAlumni();
  const alumnus = all.find(
    (a) => (a.registrationId || "").toLowerCase() === id.toLowerCase()
  );
  const canonicalId = alumnus?.registrationId || id;

  const nowFormatted = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  checkins[canonicalId] = {
    registrationId: canonicalId,
    reportedAt: nowFormatted,
    reportedBy: adminName,
  };

  saveCheckins(checkins);

  return {
    success: true,
    alreadyReported: false,
    alumnus: {
      ...(alumnus || { registrationId: canonicalId }),
      isReported: true,
      reportedAt: nowFormatted,
    },
    reportedAt: nowFormatted,
    message: "Attendance marked successfully!",
  };
}

// Unmark attendance / reporting
export function unmarkReporting(registrationId) {
  if (!registrationId) return { success: false, error: "Registration ID is required." };
  const id = registrationId.trim();
  const checkins = getCheckins();

  if (checkins[id]) {
    delete checkins[id];
    saveCheckins(checkins);
  }

  return { success: true, message: "Attendance report undone." };
}

// Overall summary statistics
export async function getAlumniStats() {
  const all = await getAllAlumni();
  const total = all.length;
  const willAttend = all.filter((a) => (a.willAttend || "").toLowerCase().includes("yes")).length;
  const reported = all.filter((a) => a.isReported).length;
  const pending = total - reported;

  return {
    total,
    willAttend,
    reported,
    pending,
  };
}

// Update existing alumnus record details
export async function updateAlumnusRecord(registrationId, updatePayload) {
  if (!registrationId || !registrationId.trim()) {
    return { success: false, error: "Registration ID is required." };
  }

  const all = await getAllAlumni();
  const idToFind = registrationId.trim().toLowerCase();
  const existing = all.find(
    (a) => (a.registrationId || "").toLowerCase() === idToFind
  );

  if (!existing) {
    return { success: false, error: "Alumnus record not found." };
  }

  const chosenBatch = updatePayload.batchYear || updatePayload.joinedBatch || existing.batchYear || existing.joinedBatch || "";
  const chosenSection = updatePayload.joinedSection !== undefined ? updatePayload.joinedSection : (existing.joinedSection || "");

  const updatedRecord = {
    ...existing,
    ...updatePayload,
    registrationId: existing.registrationId, // Lock canonical ID
    batchYear: chosenBatch,
    joinedBatch: chosenBatch,
    joinedSection: chosenSection,
    updatedAt: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };

  // 1. Save/update in SUBMISSIONS_FILE
  try {
    const dir = path.dirname(SUBMISSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let submissions = [];
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      try {
        submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8") || "[]");
      } catch (e) {
        submissions = [];
      }
    }

    const subIdx = submissions.findIndex(
      (s) => (s.registrationId || "").toLowerCase() === existing.registrationId.toLowerCase()
    );

    if (subIdx !== -1) {
      submissions[subIdx] = { ...submissions[subIdx], ...updatedRecord };
    } else {
      submissions.push(updatedRecord);
    }

    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf8");

    // Invalidate in-memory cache so next read is immediate
    cachedSheetAlumni = null;
    lastFetchTime = 0;
  } catch (err) {
    console.error("Error updating submission file:", err);
  }

  // 2. Push update to Google Sheet Webhook
  const ACTIVE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz6xuszwAbSMhY51EzUocjWZfCaCXWD0XDpegxkSR9KR_8jIQhxwEsDnJgUI23NUnK8/exec";
  if (ACTIVE_WEBHOOK_URL) {
    try {
      const formatPhone = (val) => {
        if (!val) return "";
        const cleaned = val.toString().replace(/\s+/g, "").trim();
        return cleaned.startsWith("'") ? cleaned : `'${cleaned}`;
      };

      const sheetPayload = {
        ...updatedRecord,
        "Registration ID": existing.registrationId,
        "Full Name": updatedRecord.fullName,
        "Place": updatedRecord.place,
        "Mobile Number": formatPhone(updatedRecord.mobileNumber),
        "WhatsApp Number": formatPhone(updatedRecord.whatsappNumber),
        "Joined with Batch": chosenBatch,
        "Section (HS / BS)": chosenSection,
        "Hifz Status": updatedRecord.hifzStatus,
        "Islamic Qualification": updatedRecord.islamicQualification,
        "Academic Qualification": updatedRecord.academicQualification,
        "Current Status": updatedRecord.currentStatus,
        "Job / Designation": updatedRecord.jobDesignation,
        "Institution / Organization Name": updatedRecord.institutionName,
        "Work Location": updatedRecord.workLocation,
        "Will Attend Meet?": updatedRecord.willAttend,
        action: "UPDATE",
      };

      fetch(ACTIVE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
      }).catch((e) => console.warn("Background sheet update notice:", e.message));
    } catch (e) {
      // Non-blocking
    }
  }

  return {
    success: true,
    alumnus: updatedRecord,
    message: "Details updated successfully!",
  };
}
