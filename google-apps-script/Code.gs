/**
 * Google Apps Script for Dalailul Khairath Kakkidippuram Alumni Portal (LINKUP 2026)
 * 
 * Features:
 * 1. Saves registrations to Main Sheet ("Registrations" / gid=0).
 * 2. Saves Attendance and Fee Status DIRECTLY into Columns Q, R, S, T, U of the Main Sheet (gid=0):
 *    - Column Q: Attendance Status ("Reported" / "Pending")
 *    - Column R: Reported At (Date & Time)
 *    - Column S: Fee Status ("Paid" / "Pending")
 *    - Column T: Fee Amount (₹200)
 *    - Column U: Reported By (Admin Name)
 * 3. Also maintains dedicated "Checkins" and "Fees" logging tabs.
 * 4. Provides doGet(?action=checkins) for instant live synchronization with /admin.
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/edit
 * 2. Click Extensions > Apps Script
 * 3. Replace all existing code in the editor with this script
 * 4. Click Save (Ctrl+S)
 * 5. Click Deploy > Manage deployments > Click the pencil icon (Edit) > Select "New version" > Click Deploy
 */

var REG_HEADERS = [
  "Timestamp",                        // Col 1 (A)
  "Registration ID",                  // Col 2 (B)
  "Full Name",                        // Col 3 (C)
  "Place",                            // Col 4 (D)
  "Mobile Number",                    // Col 5 (E)
  "WhatsApp Number",                  // Col 6 (F)
  "Joined with Batch",                // Col 7 (G)
  "Section (HS / BS)",                // Col 8 (H)
  "Hifz Status",                      // Col 9 (I)
  "Islamic Qualification",            // Col 10 (J)
  "Academic Qualification",          // Col 11 (K)
  "Current Status",                   // Col 12 (L)
  "Job / Designation",                // Col 13 (M)
  "Institution / Organization Name",  // Col 14 (N)
  "Work Location",                    // Col 15 (O)
  "Will Attend Meet?",                // Col 16 (P)
  "Attendance Status",                // Col 17 (Q)
  "Reported At",                      // Col 18 (R)
  "Fee Status",                       // Col 19 (S)
  "Fee Amount",                       // Col 20 (T)
  "Reported By"                       // Col 21 (U)
];

var CHECKIN_HEADERS = [
  "Timestamp",
  "Registration ID",
  "Full Name",
  "Batch",
  "Place",
  "Reported At",
  "Reported By",
  "Epoch Timestamp"
];

var FEE_HEADERS = [
  "Timestamp",
  "Registration ID",
  "Paid",
  "Amount",
  "Paid At",
  "Recorded By",
  "Epoch Timestamp"
];

// Helper to ensure main registration sheet has all 21 columns (including Columns Q to U)
function ensureMainSheetHeaders(mainSheet) {
  var lastCol = mainSheet.getLastColumn();
  if (lastCol === 0) {
    mainSheet.appendRow(REG_HEADERS);
    var hRange = mainSheet.getRange(1, 1, 1, REG_HEADERS.length);
    hRange.setBackground("#192200");
    hRange.setFontColor("#ffffff");
    hRange.setFontWeight("bold");
    mainSheet.setFrozenRows(1);
    return;
  }

  // Check if header row has Attendance Status column
  var headers = mainSheet.getRange(1, 1, 1, Math.max(lastCol, REG_HEADERS.length)).getValues()[0];
  for (var c = 0; c < REG_HEADERS.length; c++) {
    if (!headers[c] || headers[c].toString().trim() === "") {
      var cell = mainSheet.getRange(1, c + 1);
      cell.setValue(REG_HEADERS[c]);
      cell.setBackground("#192200");
      cell.setFontColor("#ffffff");
      cell.setFontWeight("bold");
    }
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground("#192200");
    hRange.setFontColor("#ffffff");
    hRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatPhoneText(val) {
  if (!val) return "";
  var str = val.toString().replace(/\s+/g, "").trim();
  if (str.charAt(0) === "+") {
    return "'" + str;
  }
  return str;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var mainSheet = ss.getSheetByName("Registrations") || ss.getSheets()[0];
    ensureMainSheetHeaders(mainSheet);

    var data = JSON.parse(e.postData.contents);
    var action = (data.action || "").toUpperCase();

    // ----------------------------------------------------
    // ACTION: CHECKIN (Mark Attendance)
    // ----------------------------------------------------
    if (action === "CHECKIN") {
      var regId = (data.registrationId || "").trim();
      var nowFormatted = data.reportedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      var epoch = data.timestamp || Date.now();
      var feePaid = Boolean(data.markFeePaid);
      var feeAmount = data.feeAmount || 200;
      var adminName = data.adminName || "Admin";

      // 1. Update row directly in main sheet (gid=0)
      var rows = mainSheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][1] && rows[r][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        // Col Q (17): Attendance Status
        mainSheet.getRange(foundRow, 17).setValue("Reported");
        // Col R (18): Reported At
        mainSheet.getRange(foundRow, 18).setValue(nowFormatted);
        if (feePaid) {
          // Col S (19): Fee Status
          mainSheet.getRange(foundRow, 19).setValue("Paid");
          // Col T (20): Fee Amount
          mainSheet.getRange(foundRow, 20).setValue(feeAmount);
        }
        // Col U (21): Reported By
        mainSheet.getRange(foundRow, 21).setValue(adminName);
      } else {
        // Member not found in main sheet, append new row
        mainSheet.appendRow([
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          regId,
          data.fullName || "",
          data.place || "",
          formatPhoneText(data.mobileNumber || ""),
          formatPhoneText(data.whatsappNumber || ""),
          data.batchYear || "",
          data.joinedSection || "",
          "", "", "", "Job", "", "", "", "Yes, I will attend",
          "Reported",
          nowFormatted,
          feePaid ? "Paid" : "Pending",
          feePaid ? feeAmount : 0,
          adminName
        ]);
      }

      // 2. Also log in "Checkins" tab
      var checkinSheet = getOrCreateSheet(ss, "Checkins", CHECKIN_HEADERS);
      var cRows = checkinSheet.getDataRange().getValues();
      var foundCheckinRow = -1;
      for (var cr = 1; cr < cRows.length; cr++) {
        if (cRows[cr][1] && cRows[cr][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          foundCheckinRow = cr + 1;
          break;
        }
      }
      var cRowData = [
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        regId,
        data.fullName || "",
        data.batchYear || "",
        data.place || "",
        nowFormatted,
        adminName,
        epoch
      ];
      if (foundCheckinRow > 0) {
        checkinSheet.getRange(foundCheckinRow, 1, 1, cRowData.length).setValues([cRowData]);
      } else {
        checkinSheet.appendRow(cRowData);
      }

      // 3. If fee paid, also log in "Fees" tab
      if (feePaid) {
        var feeSheet = getOrCreateSheet(ss, "Fees", FEE_HEADERS);
        var fRows = feeSheet.getDataRange().getValues();
        var foundFeeRow = -1;
        for (var f = 1; f < fRows.length; f++) {
          if (fRows[f][1] && fRows[f][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
            foundFeeRow = f + 1;
            break;
          }
        }
        var feeRowData = [
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          regId,
          "TRUE",
          feeAmount,
          nowFormatted,
          adminName,
          epoch
        ];
        if (foundFeeRow > 0) {
          feeSheet.getRange(foundFeeRow, 1, 1, feeRowData.length).setValues([feeRowData]);
        } else {
          feeSheet.appendRow(feeRowData);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "CHECKIN",
        registrationId: regId,
        columnsUpdated: ["Attendance Status (Col Q)", "Reported At (Col R)", "Fee Status (Col S)", "Reported By (Col U)"]
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // ACTION: FEE (Toggle Fee Status)
    // ----------------------------------------------------
    if (action === "FEE") {
      var regId = (data.registrationId || "").trim();
      var paid = Boolean(data.paid);
      var amount = data.amount || 200;
      var paidAt = data.paidAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      var epoch = Date.now();
      var adminName = data.adminName || "Admin";

      // 1. Update row in main sheet (gid=0)
      var rows = mainSheet.getDataRange().getValues();
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][1] && rows[r][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          var foundRow = r + 1;
          mainSheet.getRange(foundRow, 19).setValue(paid ? "Paid" : "Pending"); // Col S: Fee Status
          mainSheet.getRange(foundRow, 20).setValue(paid ? amount : 0); // Col T: Fee Amount
          break;
        }
      }

      // 2. Also log in "Fees" tab
      var feeSheet = getOrCreateSheet(ss, "Fees", FEE_HEADERS);
      var feeRows = feeSheet.getDataRange().getValues();
      var foundFeeRow = -1;
      for (var f = 1; f < feeRows.length; f++) {
        if (feeRows[f][1] && feeRows[f][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          foundFeeRow = f + 1;
          break;
        }
      }

      if (paid) {
        var feeRowData = [
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          regId,
          "TRUE",
          amount,
          paidAt,
          adminName,
          epoch
        ];
        if (foundFeeRow > 0) {
          feeSheet.getRange(foundFeeRow, 1, 1, feeRowData.length).setValues([feeRowData]);
        } else {
          feeSheet.appendRow(feeRowData);
        }
      } else {
        if (foundFeeRow > 0) {
          feeSheet.deleteRow(foundFeeRow);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "FEE",
        registrationId: regId,
        paid: paid
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // ACTION: UNCHECKIN (Undo Attendance)
    // ----------------------------------------------------
    if (action === "UNCHECKIN" || action === "UNREPORT") {
      var regId = (data.registrationId || "").trim();

      // 1. Reset row in main sheet (gid=0)
      var rows = mainSheet.getDataRange().getValues();
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][1] && rows[r][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          var foundRow = r + 1;
          mainSheet.getRange(foundRow, 17).setValue("Pending"); // Col Q: Attendance Status
          mainSheet.getRange(foundRow, 18).setValue(""); // Col R: Reported At
          break;
        }
      }

      // 2. Remove from "Checkins" tab
      var checkinSheet = ss.getSheetByName("Checkins");
      if (checkinSheet) {
        var cRows = checkinSheet.getDataRange().getValues();
        for (var cr = cRows.length - 1; cr >= 1; cr--) {
          if (cRows[cr][1] && cRows[cr][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
            checkinSheet.deleteRow(cr + 1);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "UNCHECKIN",
        registrationId: regId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // DEFAULT ACTION: REGISTRATION
    // ----------------------------------------------------
    var regId = data.registrationId || data["Registration ID"] || data.regId || "";
    var name = data.fullName || data["Full Name"] || data.name || "";
    var place = data.place || data["Place"] || "";
    var mobile = formatPhoneText(data.mobileNumber || data["Mobile Number"] || data.mobile || "");
    var whatsapp = formatPhoneText(data.whatsappNumber || data["WhatsApp Number"] || data.whatsapp || "");
    var batch = data["Joined with Batch"] || data.joinedBatch || data.batchYear || data["Batch / Admission Year"] || data.batch || "";
    var section = data["Section (HS / BS)"] || data.joinedSection || data.section || (Array.isArray(data.joinedSections) ? data.joinedSections.join(", ") : "") || "";
    var hifz = data.hifzStatus || data["Hifz Status"] || data.hifz || "";
    var islamicQual = data.islamicQualification || data["Islamic Qualification"] || data.islamic || "";
    var academicQual = data.academicQualification || data["Academic Qualification"] || data.academic || "";
    var status = data.currentStatus || data["Current Status"] || data.status || "";
    var job = data.jobDesignation || data["Job / Designation"] || data.job || "";
    var institution = data.institutionName || data["Institution / Organization Name"] || data.institution || "";
    var location = data.workLocation || data["Work Location"] || data.location || "";
    var willAttend = data.willAttend || data["Will Attend Meet?"] || "";
    var timestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    mainSheet.appendRow([
      timestamp,
      regId,
      name,
      place,
      mobile,
      whatsapp,
      batch,
      section,
      hifz,
      islamicQual,
      academicQual,
      status,
      job,
      institution,
      location,
      willAttend,
      "Pending", // Col Q: Attendance Status
      "",        // Col R: Reported At
      "Pending", // Col S: Fee Status
      0,         // Col T: Fee Amount
      ""         // Col U: Reported By
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registration recorded successfully",
      registrationId: regId,
      fullName: name,
      columnsWritten: 21
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var param = (e && e.parameter) || {};
  var action = (param.action || param.type || "").toLowerCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mainSheet = ss.getSheetByName("Registrations") || ss.getSheets()[0];
  ensureMainSheetHeaders(mainSheet);

  // If requesting check-ins and fees data
  if (action === "checkins" || action === "fees" || action === "all") {
    var checkinsMap = {};
    var feesMap = { settings: { defaultFee: 200, currency: "₹" }, records: {} };

    var rows = mainSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var rId = (rows[i][1] || "").toString().trim();
      if (!rId) continue;

      var attStatus = (rows[i][16] || "").toString().trim().toLowerCase(); // Col Q
      var reportedAt = rows[i][17] || ""; // Col R
      var feeStatus = (rows[i][18] || "").toString().trim().toLowerCase(); // Col S
      var feeAmt = Number(rows[i][19]) || 200; // Col T
      var adminName = rows[i][20] || "Admin"; // Col U

      if (attStatus === "reported") {
        checkinsMap[rId] = {
          registrationId: rId,
          fullName: rows[i][2] || "",
          batchYear: rows[i][6] || "",
          place: rows[i][3] || "",
          reportedAt: reportedAt,
          reportedBy: adminName,
          timestamp: Date.now()
        };
      }

      if (feeStatus === "paid") {
        feesMap.records[rId] = {
          paid: true,
          amount: feeAmt,
          paidAt: reportedAt,
          recordedBy: adminName
        };
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      checkins: checkinsMap,
      fees: feesMap,
      version: "v2-persistent-checkins"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Dalailul Khairath Alumni Webhook v2 is active with direct main-sheet columns (Q to U).",
    columns: [
      "Attendance Status (Col Q)",
      "Reported At (Col R)",
      "Fee Status (Col S)",
      "Fee Amount (Col T)",
      "Reported By (Col U)"
    ]
  })).setMimeType(ContentService.MimeType.JSON);
}
