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

const ACTIVE_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbz6xuszwAbSMhY51EzUocjWZfCaCXWD0XDpegxkSR9KR_8jIQhxwEsDnJgUI23NUnK8/exec";

// Upstash Redis / Vercel KV REST API support (zero dependencies, works out-of-the-box if configured)
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisGet(key) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.result) return null;
      return typeof data.result === "string" ? JSON.parse(data.result) : data.result;
    }
  } catch (e) {
    console.error("Redis get error:", e);
  }
  return null;
}

async function redisSet(key, value) {
  if (!REDIS_URL || !REDIS_TOKEN) return false;
  try {
    const res = await fetch(`${REDIS_URL}/set/${key}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(typeof value === "string" ? value : JSON.stringify(value)),
    });
    return res.ok;
  } catch (e) {
    console.error("Redis set error:", e);
    return false;
  }
}

// Sync to Google Sheet Webhook (returns Promise, timeout handled)
export async function syncToGoogleSheetWebhook(payload) {
  if (!ACTIVE_WEBHOOK_URL || !ACTIVE_WEBHOOK_URL.startsWith("http")) return { success: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(ACTIVE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    return { success: res.ok };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Remote sync helper to restore check-ins on Vercel cold starts
let isGoogleSheetV2Active = false;
let lastRemoteSyncTime = 0;
let inFlightSyncPromise = null;
const REMOTE_SYNC_INTERVAL_MS = 8000;

export async function syncStorageFromRemoteIfNeeded() {
  const now = Date.now();
  if (now - lastRemoteSyncTime < REMOTE_SYNC_INTERVAL_MS) {
    return;
  }
  if (inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  inFlightSyncPromise = (async () => {
    try {
      // 1. Try Upstash Redis / Vercel KV first if configured
      if (REDIS_URL && REDIS_TOKEN) {
        try {
          const [remoteCheckins, remoteFees] = await Promise.all([
            redisGet("linkup:checkins"),
            redisGet("linkup:fees"),
          ]);
          if (remoteCheckins && typeof remoteCheckins === "object") {
            saveCheckins(remoteCheckins);
          }
          if (remoteFees && typeof remoteFees === "object") {
            saveFees(remoteFees);
          }
          return;
        } catch (e) {
          console.error("Error syncing from Redis:", e);
        }
      }

      // 2. Try Google Sheet Webhook if available
      if (ACTIVE_WEBHOOK_URL && ACTIVE_WEBHOOK_URL.startsWith("http")) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(`${ACTIVE_WEBHOOK_URL}?action=checkins&_t=${now}`, {
            cache: "no-store",
            headers: { "User-Agent": "Dalail-Alumni-Portal" },
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeout);

          if (res.ok) {
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              if (data && (data.version === "v2-persistent-checkins" || (data.status === "success" && data.checkins))) {
                isGoogleSheetV2Active = true;
                if (data.checkins && Object.keys(data.checkins).length > 0) {
                  const localCheckins = getCheckins();
                  const mergedCheckins = { ...data.checkins, ...localCheckins };
                  saveCheckins(mergedCheckins);
                }

                if (data.fees?.records && Object.keys(data.fees.records).length > 0) {
                  const localFees = getFees();
                  const mergedFees = {
                    settings: data.fees.settings || localFees.settings,
                    records: { ...(data.fees.records || {}), ...(localFees.records || {}) },
                  };
                  saveFees(mergedFees);
                }
              } else {
                isGoogleSheetV2Active = false;
              }
            } catch (jsonErr) {
              isGoogleSheetV2Active = false;
            }
          }
        } catch (sheetErr) {
          console.error("Remote sheet checkin fetch error:", sheetErr);
        }
      }
    } finally {
      lastRemoteSyncTime = Date.now();
      inFlightSyncPromise = null;
    }
  })();

  return inFlightSyncPromise;
}

// Get live storage status for admin portal
export function getStorageStatus() {
  const hasRedis = Boolean(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  );
  const isVercel = Boolean(process.env.VERCEL);
  const isPersistent = hasRedis || isGoogleSheetV2Active || !isVercel;

  let storageType = "local_disk";
  let label = "Local Disk (Permanent)";
  let message = "Running locally with permanent disk storage.";

  if (hasRedis) {
    storageType = "redis";
    label = "Cloud KV (Permanent)";
    message = "Data is permanently synchronized with Upstash Redis / Vercel KV.";
  } else if (isGoogleSheetV2Active) {
    storageType = "google_sheet";
    label = "Google Sheets (Permanent)";
    message = "Check-ins and fees are permanently saved in your Google Sheet (Checkins & Fees tabs).";
  } else if (isVercel) {
    storageType = "ephemeral_vercel";
    label = "Temporary Serverless Memory";
    message = "Running on Vercel Serverless. To ensure reported members and fees are never cleared when the server goes idle, deploy the updated Google Apps Script to your Google Sheet.";
  }

  return {
    type: storageType,
    isPersistent,
    isGoogleSheetV2Active,
    hasRedis,
    isVercel,
    label,
    message,
    sheetUrl: "https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/edit",
  };
}

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

// Helper for atomic write with disk sync and read-back verification
function atomicWriteAndVerify(filePath, dataObj, verifyCallback) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonStr = JSON.stringify(dataObj, null, 2);
    const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;

    // 1. Write to temp file
    fs.writeFileSync(tempFile, jsonStr, "utf8");

    // 2. Rename or overwrite target file
    try {
      fs.renameSync(tempFile, filePath);
    } catch (renameErr) {
      // Fallback for Windows locks or cross-filesystem mount
      fs.writeFileSync(filePath, jsonStr, "utf8");
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (cleanErr) {}
    }

    // 3. Read back from disk to verify persistence
    const readBack = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(readBack);

    // 4. Custom validation callback
    if (typeof verifyCallback === "function") {
      const verifyError = verifyCallback(parsed);
      if (verifyError) {
        return { success: false, error: verifyError };
      }
    }

    return { success: true };
  } catch (err) {
    console.error(`Storage persistence failed for ${filePath}:`, err);
    return {
      success: false,
      error: err.message || "Failed to write to database storage.",
      code: err.code || "STORAGE_WRITE_ERROR",
    };
  }
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

// Read check-ins map: { [registrationId]: { reportedAt, reportedBy, timestamp } }
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

// Save check-ins map with atomic persistence and key verification
export function saveCheckins(checkins, verifyRegistrationId = null) {
  return atomicWriteAndVerify(CHECKINS_FILE, checkins, (readBack) => {
    if (verifyRegistrationId) {
      const vKey = verifyRegistrationId.trim().toLowerCase();
      const found = Object.keys(readBack).some((k) => k.trim().toLowerCase() === vKey);
      if (!found) {
        return `Verification failed: Check-in record for ID "${verifyRegistrationId}" was not found in storage after write.`;
      }
    }
    return null;
  });
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

// Save fees with atomic persistence and key verification
export function saveFees(fees, verifyRegistrationId = null, expectPaid = null) {
  return atomicWriteAndVerify(FEES_FILE, fees, (readBack) => {
    if (verifyRegistrationId) {
      const vKey = verifyRegistrationId.trim().toLowerCase();
      const match = Object.entries(readBack.records || {}).find(([k]) => k.trim().toLowerCase() === vKey);
      if (expectPaid !== null) {
        if (expectPaid && !match?.[1]?.paid) {
          return `Verification failed: Fee record for "${verifyRegistrationId}" was not found as paid in storage after write.`;
        }
      }
    }
    return null;
  });
}

// Update global fee settings
export async function updateFeeSettings({ defaultFee }) {
  const fees = getFees();
  const parsed = Number(defaultFee);
  if (!isNaN(parsed) && parsed >= 0) {
    fees.settings.defaultFee = parsed;
    const saveResult = saveFees(fees);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    // Sync to Redis and Google Sheets
    const redisPromise = redisSet("linkup:fees", fees);
    const sheetPromise = syncToGoogleSheetWebhook({
      action: "FEE_SETTINGS",
      defaultFee: parsed,
    });
    await Promise.allSettled([redisPromise, sheetPromise]);
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
    (a) => (a.registrationId || "").trim().toLowerCase() === id.toLowerCase()
  );
  const canonicalId = (alumnus?.registrationId || id).trim();

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
      if (key.trim().toLowerCase() === id.toLowerCase()) {
        delete fees.records[key];
      }
    }
  }

  const saveResult = saveFees(fees, canonicalId, Boolean(paid));
  if (!saveResult.success) {
    return {
      success: false,
      error: `Database persistence failed: ${saveResult.error}`,
      details: "Fee status could not be confirmed in database storage.",
    };
  }

  // Sync to Redis and Google Sheets
  const redisPromise = redisSet("linkup:fees", fees);
  const sheetPromise = syncToGoogleSheetWebhook({
    action: "FEE",
    registrationId: canonicalId,
    paid: Boolean(paid),
    amount: parsedAmount,
    paidAt: paid ? nowFormatted : null,
    adminName: adminName,
    timestamp: Date.now(),
  });
  await Promise.allSettled([redisPromise, sheetPromise]);

  // Clear in-memory sheet cache so next read is fresh
  cachedSheetAlumni = null;
  lastFetchTime = 0;

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
    const attendIdx = headers.findIndex((h) => h.includes("attend") && !h.includes("status"));

    // Attendance & Fee columns directly from Google Sheet (Columns Q to U)
    const reportedIdx = headers.findIndex((h) => h.includes("attendance status") || h.includes("reported status") || h === "attendance" || h === "reported");
    const reportedAtIdx = headers.findIndex((h) => h.includes("reported at") || h.includes("checkin time"));
    const feeStatusIdx = headers.findIndex((h) => h.includes("fee status") || h.includes("fee paid") || h === "fee");
    const feeAmountIdx = headers.findIndex((h) => h.includes("fee amount"));
    const reportedByIdx = headers.findIndex((h) => h.includes("reported by"));

    const list = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 3) continue;

      const regId = (regIdIdx !== -1 ? row[regIdIdx] : row[1]) || "";
      const name = (nameIdx !== -1 ? row[nameIdx] : row[2]) || "";
      if (!name || !regId || name.toLowerCase().includes("full name")) continue;

      const cleanPhone = (val) => (val || "").replace(/^'/, "").trim();

      const isReportedFromSheet = reportedIdx !== -1 && (row[reportedIdx] || "").trim().toLowerCase().includes("reported");
      const reportedAtFromSheet = (reportedAtIdx !== -1 && row[reportedAtIdx]) ? row[reportedAtIdx].trim() : null;
      const feePaidFromSheet = feeStatusIdx !== -1 && (row[feeStatusIdx] || "").trim().toLowerCase().includes("paid");
      const feeAmountFromSheet = feeAmountIdx !== -1 && !isNaN(Number(row[feeAmountIdx])) && Number(row[feeAmountIdx]) > 0 ? Number(row[feeAmountIdx]) : null;
      const reportedByFromSheet = (reportedByIdx !== -1 && row[reportedByIdx]) ? row[reportedByIdx].trim() : null;

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
        isReportedFromSheet,
        reportedAtFromSheet,
        feePaidFromSheet,
        feeAmountFromSheet,
        reportedByFromSheet,
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
  await syncStorageFromRemoteIfNeeded();

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

  // Ensure any checkins without a matching sheet entry yet are preserved in map
  for (const [chId, chData] of Object.entries(checkins)) {
    const trimmedId = chId.trim();
    const existing = [...map.keys()].find(k => k.trim().toLowerCase() === trimmedId.toLowerCase());
    if (!existing) {
      map.set(trimmedId, {
        registrationId: trimmedId,
        fullName: chData.fullName || `Attendee (${trimmedId})`,
        place: chData.place || "",
        batchYear: chData.batchYear || "",
        mobileNumber: chData.mobileNumber || "",
        whatsappNumber: chData.whatsappNumber || "",
        willAttend: "Yes, I will attend",
        source: "checkin_record",
      });
    }
  }

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;

  // Attach check-in & fee details
  const results = [];
  for (const alumnus of map.values()) {
    const regId = (alumnus.registrationId || "").trim();
    const regLower = regId.toLowerCase();

    // Checkin lookup (case-insensitive & trimmed fallback)
    const checkin = checkins[regId] || Object.entries(checkins).find(([k]) => k.trim().toLowerCase() === regLower)?.[1];

    // Fee lookup (case-insensitive & trimmed fallback)
    const feeRecord = fees.records[regId] || Object.entries(fees.records).find(([k]) => k.trim().toLowerCase() === regLower)?.[1];

    const isReported = Boolean(checkin || alumnus.isReportedFromSheet);
    const reportedAt = checkin?.reportedAt || alumnus.reportedAtFromSheet || null;
    const reportedBy = checkin?.reportedBy || alumnus.reportedByFromSheet || null;

    const isFeePaid = Boolean(feeRecord?.paid || alumnus.feePaidFromSheet);
    const feeAmount = isFeePaid ? (feeRecord?.amount ?? alumnus.feeAmountFromSheet ?? defaultFee) : defaultFee;
    const feePaidAt = feeRecord?.paidAt || (alumnus.feePaidFromSheet ? (alumnus.reportedAtFromSheet || null) : null);
    const feeRecordedBy = feeRecord?.recordedBy || alumnus.reportedByFromSheet || null;

    results.push({
      ...alumnus,
      registrationId: regId,
      isReported,
      reportedAt,
      reportedBy,
      feePaid: isFeePaid,
      feeAmount,
      feePaidAt,
      feeRecordedBy,
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
    (a) => (a.registrationId || "").trim().toLowerCase() === id.toLowerCase()
  );
  const canonicalId = (alumnus?.registrationId || id).trim();

  const nowFormatted = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const defaultFee = fees.settings?.defaultFee ?? DEFAULT_FEE_AMOUNT;
  const parsedFeeAmount = customFeeAmount !== null && !isNaN(Number(customFeeAmount)) && Number(customFeeAmount) >= 0
    ? Number(customFeeAmount)
    : defaultFee;

  const currentFee = fees.records[canonicalId] || Object.entries(fees.records).find(([k]) => k.trim().toLowerCase() === canonicalId.toLowerCase())?.[1];

  // Strict check: if already reported, NEVER allow reporting again
  const existingKey = Object.keys(checkins).find(
    (k) => k.trim().toLowerCase() === canonicalId.toLowerCase()
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

  // If markFeePaid is requested, persist fee with verification first
  if (markFeePaid) {
    fees.records[canonicalId] = {
      paid: true,
      amount: parsedFeeAmount,
      paidAt: nowFormatted,
      recordedBy: adminName,
    };
    const feeSave = saveFees(fees, canonicalId, true);
    if (!feeSave.success) {
      return {
        success: false,
        error: `Database persistence failed: ${feeSave.error}`,
        details: "Fee payment could not be confirmed in database storage.",
      };
    }
  }

  const finalFeeRecord = fees.records[canonicalId] || Object.entries(fees.records).find(([k]) => k.trim().toLowerCase() === canonicalId.toLowerCase())?.[1];

  // Save Check-in with read-back verification
  checkins[canonicalId] = {
    registrationId: canonicalId,
    fullName: alumnus?.fullName || "",
    batchYear: alumnus?.batchYear || alumnus?.joinedBatch || "",
    joinedSection: alumnus?.joinedSection || "",
    place: alumnus?.place || "",
    mobileNumber: alumnus?.mobileNumber || "",
    whatsappNumber: alumnus?.whatsappNumber || "",
    reportedAt: nowFormatted,
    reportedBy: adminName,
    timestamp: Date.now(),
  };

  const saveResult = saveCheckins(checkins, canonicalId);
  if (!saveResult.success) {
    return {
      success: false,
      error: `Database persistence failed: ${saveResult.error}`,
      details: "Attendance check-in could not be confirmed in database storage.",
    };
  }

  // Sync to Redis and Google Sheets
  const redisPromise = redisSet("linkup:checkins", checkins);
  const sheetPromise = syncToGoogleSheetWebhook({
    action: "CHECKIN",
    registrationId: canonicalId,
    fullName: alumnus?.fullName || "",
    batchYear: alumnus?.batchYear || alumnus?.joinedBatch || "",
    joinedSection: alumnus?.joinedSection || "",
    place: alumnus?.place || "",
    mobileNumber: alumnus?.mobileNumber || "",
    reportedAt: nowFormatted,
    adminName: adminName,
    markFeePaid: Boolean(markFeePaid),
    feeAmount: parsedFeeAmount,
    timestamp: Date.now(),
  });
  await Promise.allSettled([redisPromise, sheetPromise]);

  // Invalidate in-memory sheet cache so next read is immediate
  cachedSheetAlumni = null;
  lastFetchTime = 0;

  return {
    success: true,
    alreadyReported: false,
    alumnus: {
      ...(alumnus || { registrationId: canonicalId }),
      isReported: true,
      reportedAt: nowFormatted,
      feePaid: Boolean(finalFeeRecord?.paid),
      feeAmount: finalFeeRecord?.paid ? (finalFeeRecord?.amount ?? defaultFee) : defaultFee,
      feePaidAt: finalFeeRecord?.paidAt || null,
    },
    reportedAt: nowFormatted,
    feePaid: Boolean(finalFeeRecord?.paid),
    feeAmount: finalFeeRecord?.paid ? (finalFeeRecord?.amount ?? defaultFee) : defaultFee,
    feePaidAt: finalFeeRecord?.paidAt || null,
    message: "Attendance marked successfully!",
  };
}

// Unmark attendance / reporting
export async function unmarkReporting(registrationId) {
  if (!registrationId) return { success: false, error: "Registration ID is required." };
  const id = registrationId.trim().toLowerCase();
  const checkins = getCheckins();

  let modified = false;
  for (const k of Object.keys(checkins)) {
    if (k.trim().toLowerCase() === id) {
      delete checkins[k];
      modified = true;
    }
  }

  if (modified) {
    const saveResult = saveCheckins(checkins);
    if (!saveResult.success) {
      return { success: false, error: `Database persistence failed: ${saveResult.error}` };
    }
    // Sync to Redis and Google Sheets
    const redisPromise = redisSet("linkup:checkins", checkins);
    const sheetPromise = syncToGoogleSheetWebhook({
      action: "UNCHECKIN",
      registrationId: id,
    });
    await Promise.allSettled([redisPromise, sheetPromise]);

    // Clear cache
    cachedSheetAlumni = null;
    lastFetchTime = 0;
  }

  return { success: true, message: "Attendance report undone." };
}

// Get recent check-ins sorted by check-in time descending
export async function getRecentCheckins(limit = 30) {
  const [all, checkins] = await Promise.all([
    getAllAlumni(),
    Promise.resolve(getCheckins()),
  ]);

  const reported = all.filter((a) => a.isReported);

  reported.sort((a, b) => {
    const regA = (a.registrationId || "").trim();
    const regB = (b.registrationId || "").trim();
    const cA = checkins[regA] || Object.entries(checkins).find(([k]) => k.trim().toLowerCase() === regA.toLowerCase())?.[1];
    const cB = checkins[regB] || Object.entries(checkins).find(([k]) => k.trim().toLowerCase() === regB.toLowerCase())?.[1];

    const timeA = cA?.timestamp || (cA?.reportedAt ? Date.parse(cA.reportedAt) : 0) || 0;
    const timeB = cB?.timestamp || (cB?.reportedAt ? Date.parse(cB.reportedAt) : 0) || 0;

    if (timeA && timeB && timeA !== timeB) {
      return timeB - timeA;
    }
    return (b.reportedAt || "").localeCompare(a.reportedAt || "");
  });

  return reported.slice(0, limit).map((a) => ({
    registrationId: a.registrationId,
    fullName: a.fullName,
    batchYear: a.batchYear || a.joinedBatch || "",
    joinedSection: a.joinedSection || "",
    place: a.place || "",
    reportedAt: a.reportedAt,
    reportedBy: a.reportedBy,
    feePaid: Boolean(a.feePaid),
    feeAmount: a.feeAmount,
    feePaidAt: a.feePaidAt,
  }));
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
