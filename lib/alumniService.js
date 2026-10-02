import fs from "fs";
import path from "path";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/export?format=csv";

const SUBMISSIONS_FILE = process.env.VERCEL
  ? path.join("/tmp", "submissions.json")
  : path.join(process.cwd(), "data", "submissions.json");

const CHECKINS_FILE = process.env.VERCEL
  ? path.join("/tmp", "checkins.json")
  : path.join(process.cwd(), "data", "checkins.json");

const FEES_FILE = process.env.VERCEL
  ? path.join("/tmp", "fees.json")
  : path.join(process.cwd(), "data", "fees.json");

const DEFAULT_FEE_AMOUNT = 200;

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

// Ensure fees file exists
function ensureFeesFile() {
  try {
    const dir = path.dirname(FEES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(FEES_FILE)) {
      fs.writeFileSync(
        FEES_FILE,
        JSON.stringify(
          {
            settings: {
              defaultFee: DEFAULT_FEE_AMOUNT,
              currency: "₹",
            },
            records: {},
          },
          null,
          2
        ),
        "utf8"
      );
    }
  } catch (e) {
    console.error("Failed to init fees storage:", e);
  }
}

// Read fees: { settings: { defaultFee, currency }, records: { [registrationId]: { paid, amount, paidAt, recordedBy } } }
export function getFees() {
  try {
    ensureFeesFile();
    if (fs.existsSync(FEES_FILE)) {
      const content = fs.readFileSync(FEES_FILE, "utf8");
      const data = JSON.parse(content || "{}");
      return {
        settings: {
          defaultFee: data.settings?.defaultFee !== undefined ? Number(data.settings.defaultFee) : DEFAULT_FEE_AMOUNT,
          currency: data.settings?.currency ?? "₹",
        },
        records: data.records || {},
      };
    }
  } catch (e) {
    console.error("Error reading fees file:", e);
  }
  return {
    settings: { defaultFee: DEFAULT_FEE_AMOUNT, currency: "₹" },
    records: {},
  };
}

// Save fees
export function saveFees(fees) {
  try {
    ensureFeesFile();
    fs.writeFileSync(FEES_FILE, JSON.stringify(fees, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Error writing fees file:", e);
    return false;
  }
}

// Update global fee settings
export function updateFeeSettings({ defaultFee }) {
  const fees = getFees();
  const parsed = Number(defaultFee);
  if (!isNaN(parsed) && parsed >= 0) {
    fees.settings.defaultFee = parsed;
    saveFees(fees);
    return { success: true, settings: fees.settings };
  }
  return { success: false, error: "Invalid fee amount." };
}

// Mark or unmark fee as paid for an alumnus
export async function setAlumnusFeeStatus(registrationId, { paid = true, amount, adminName = "Admin" }) {
  if (!registrationId) return { success: false, error: "Registration ID is required." };
  const id = registrationId.trim();
  const fees = getFees();

  const nowFormatted = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const all = await getAllAlumni();
  const alumnus = all.find(
    (a) => (a.registrationId || "").toLowerCase() === id.toLowerCase()
  );
  const canonicalId = alumnus?.registrationId || id;

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;
  const parsedAmount = amount !== undefined && !isNaN(Number(amount)) && Number(amount) >= 0
    ? Number(amount)
    : defaultFee;

  if (paid) {
    fees.records[canonicalId] = {
      paid: true,
      amount: parsedAmount,
      paidAt: nowFormatted,
      recordedBy: adminName,
    };
  } else {
    delete fees.records[canonicalId];
    for (const key of Object.keys(fees.records)) {
      if (key.toLowerCase() === id.toLowerCase()) {
        delete fees.records[key];
      }
    }
  }

  saveFees(fees);

  return {
    success: true,
    paid: Boolean(paid),
    amount: parsedAmount,
    paidAt: paid ? nowFormatted : null,
    registrationId: canonicalId,
  };
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

// Get all consolidated alumni with checkin and fee statuses
export async function getAllAlumni() {
  const [sheetList, localList, checkins, fees] = await Promise.all([
    fetchGoogleSheetAlumni(),
    Promise.resolve(getLocalSubmissions()),
    Promise.resolve(getCheckins()),
    Promise.resolve(getFees()),
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

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;

  // Attach check-in & fee details
  const results = [];
  for (const alumnus of map.values()) {
    const regId = alumnus.registrationId || "";
    const regLower = regId.toLowerCase();

    // Checkin lookup (case-insensitive fallback)
    const checkin = checkins[regId] || Object.entries(checkins).find(([k]) => k.toLowerCase() === regLower)?.[1];

    // Fee lookup (case-insensitive fallback)
    const feeRecord = fees.records[regId] || Object.entries(fees.records).find(([k]) => k.toLowerCase() === regLower)?.[1];

    results.push({
      ...alumnus,
      isReported: Boolean(checkin),
      reportedAt: checkin?.reportedAt || null,
      reportedBy: checkin?.reportedBy || null,
      feePaid: Boolean(feeRecord?.paid),
      feeAmount: feeRecord?.paid ? (feeRecord?.amount ?? defaultFee) : defaultFee,
      feePaidAt: feeRecord?.paidAt || null,
      feeRecordedBy: feeRecord?.recordedBy || null,
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

// Mark attendance / reporting with optional fee marking
export async function markReporting(registrationId, adminName = "Admin", markFeePaid = false, customFeeAmount = null) {
  if (!registrationId) return { success: false, error: "Registration ID is required." };

  const id = registrationId.trim();
  const checkins = getCheckins();
  const fees = getFees();

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

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;
  const parsedFeeAmount = customFeeAmount !== null && !isNaN(Number(customFeeAmount)) && Number(customFeeAmount) >= 0
    ? Number(customFeeAmount)
    : defaultFee;

  if (markFeePaid) {
    fees.records[canonicalId] = {
      paid: true,
      amount: parsedFeeAmount,
      paidAt: nowFormatted,
      recordedBy: adminName,
    };
    saveFees(fees);
  }

  const currentFee = fees.records[canonicalId] || Object.entries(fees.records).find(([k]) => k.toLowerCase() === id.toLowerCase())?.[1];

  // Strict check: if already reported, NEVER allow reporting again
  const existingKey = Object.keys(checkins).find(
    (k) => k.toLowerCase() === id.toLowerCase()
  );

  if (existingKey) {
    const existingCheckin = checkins[existingKey];
    return {
      success: true,
      alreadyReported: true,
      alumnus: {
        ...alumnus,
        isReported: true,
        reportedAt: existingCheckin.reportedAt,
        feePaid: Boolean(currentFee?.paid),
        feeAmount: currentFee?.paid ? (currentFee?.amount ?? defaultFee) : defaultFee,
        feePaidAt: currentFee?.paidAt || null,
      },
      reportedAt: existingCheckin.reportedAt,
      feePaid: Boolean(currentFee?.paid),
      feeAmount: currentFee?.paid ? (currentFee?.amount ?? defaultFee) : defaultFee,
      feePaidAt: currentFee?.paidAt || null,
      message: `Already reported at ${existingCheckin.reportedAt}. Cannot report again.`,
    };
  }

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
      feePaid: Boolean(currentFee?.paid),
      feeAmount: currentFee?.paid ? (currentFee?.amount ?? defaultFee) : defaultFee,
      feePaidAt: currentFee?.paidAt || null,
    },
    reportedAt: nowFormatted,
    feePaid: Boolean(currentFee?.paid),
    feeAmount: currentFee?.paid ? (currentFee?.amount ?? defaultFee) : defaultFee,
    feePaidAt: currentFee?.paidAt || null,
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

// Overall summary statistics with fee reporting
export async function getAlumniStats() {
  const [all, fees] = await Promise.all([
    getAllAlumni(),
    Promise.resolve(getFees()),
  ]);

  const total = all.length;
  const willAttend = all.filter((a) => (a.willAttend || "").toLowerCase().includes("yes")).length;
  const reported = all.filter((a) => a.isReported).length;
  const pending = total - reported;

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;
  let totalFeeCollected = 0;
  let feePaidCount = 0;

  for (const a of all) {
    if (a.feePaid) {
      feePaidCount++;
      totalFeeCollected += Number(a.feeAmount) || defaultFee;
    }
  }

  const feePendingCount = total - feePaidCount;

  return {
    total,
    willAttend,
    reported,
    pending,
    feeStats: {
      defaultFee,
      currency: fees.settings?.currency ?? "₹",
      totalCollected: totalFeeCollected,
      paidCount: feePaidCount,
      pendingCount: feePendingCount,
      collectionRate: total > 0 ? Math.round((feePaidCount / total) * 100) : 0,
    },
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
  const hasNoSection = chosenBatch === "Junior Sharia/Dars" || chosenBatch === "Hifz";
  const chosenSection = hasNoSection
    ? ""
    : (updatePayload.joinedSection !== undefined ? updatePayload.joinedSection : (existing.joinedSection || ""));

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
