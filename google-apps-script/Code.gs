/**
 * Google Apps Script for Dalailul Khairath Kakkidippuram Alumni Portal (LINKUP 2026)
 * Handles:
 * 1. Registrations (Sheet: "Registrations" / default sheet)
 * 2. Check-ins / Attendance (Sheet: "Checkins")
 * 3. Fees (Sheet: "Fees")
 * 
 * Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/18kiHRVuWO2kEKvSFIa2XVjmN2GkpVgqnAEXCZogdkJ4/edit
 * 2. Click Extensions > Apps Script
 * 3. Replace all existing code in the editor with this script
 * 4. Click Save (Ctrl+S)
 * 5. Click Deploy > Manage deployments > Click the pencil icon (Edit) > Select "New version" > Click Deploy
 */

var REG_HEADERS = [
  "Timestamp",
  "Registration ID",
  "Full Name",
  "Place",
  "Mobile Number",
  "WhatsApp Number",
  "Joined with Batch",
  "Section (HS / BS)",
  "Hifz Status",
  "Islamic Qualification",
  "Academic Qualification",
  "Current Status",
  "Job / Designation",
  "Institution / Organization Name",
  "Work Location",
  "Will Attend Meet?"
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
    var data = JSON.parse(e.postData.contents);
    var action = (data.action || "").toUpperCase();

    // ----------------------------------------------------
    // ACTION: CHECKIN (Mark Attendance)
    // ----------------------------------------------------
    if (action === "CHECKIN") {
      var checkinSheet = getOrCreateSheet(ss, "Checkins", CHECKIN_HEADERS);
      var regId = (data.registrationId || "").trim();
      var nowFormatted = data.reportedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      var epoch = data.timestamp || Date.now();

      // Find if already present
      var rows = checkinSheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        if (rows[r][1] && rows[r][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
          foundRow = r + 1;
          break;
        }
      }

      var rowData = [
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        regId,
        data.fullName || "",
        data.batchYear || "",
        data.place || "",
        nowFormatted,
        data.adminName || "Admin",
        epoch
      ];

      if (foundRow > 0) {
        checkinSheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        checkinSheet.appendRow(rowData);
      }

      // If fee was also paid during check-in, record in Fees sheet
      if (data.markFeePaid) {
        var feeSheet = getOrCreateSheet(ss, "Fees", FEE_HEADERS);
        var feeRows = feeSheet.getDataRange().getValues();
        var foundFeeRow = -1;
        for (var f = 1; f < feeRows.length; f++) {
          if (feeRows[f][1] && feeRows[f][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
            foundFeeRow = f + 1;
            break;
          }
        }
        var feeRowData = [
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          regId,
          "TRUE",
          data.feeAmount || 200,
          nowFormatted,
          data.adminName || "Admin",
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
        registrationId: regId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ----------------------------------------------------
    // ACTION: FEE (Toggle Fee Status)
    // ----------------------------------------------------
    if (action === "FEE") {
      var feeSheet = getOrCreateSheet(ss, "Fees", FEE_HEADERS);
      var regId = (data.registrationId || "").trim();
      var paid = Boolean(data.paid);
      var amount = data.amount || 200;
      var paidAt = data.paidAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      var epoch = Date.now();

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
          data.adminName || "Admin",
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
      var checkinSheet = ss.getSheetByName("Checkins");
      var regId = (data.registrationId || "").trim();
      if (checkinSheet) {
        var rows = checkinSheet.getDataRange().getValues();
        for (var r = rows.length - 1; r >= 1; r--) {
          if (rows[r][1] && rows[r][1].toString().trim().toLowerCase() === regId.toLowerCase()) {
            checkinSheet.deleteRow(r + 1);
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
    // DEFAULT ACTION: REGISTRATION (16 Columns)
    // ----------------------------------------------------
    var mainSheet = ss.getSheetByName("Registrations") || ss.getSheets()[0];
    
    // Auto-create or fix headers if missing
    if (mainSheet.getLastRow() === 0) {
      mainSheet.appendRow(REG_HEADERS);
      var headerRange = mainSheet.getRange(1, 1, 1, REG_HEADERS.length);
      headerRange.setBackground("#0d1b2a");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      mainSheet.setFrozenRows(1);
    }

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
      willAttend
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registration recorded successfully",
      registrationId: regId,
      fullName: name,
      columnsWritten: 16
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

  // If requesting check-ins and fees data
  if (action === "checkins" || action === "fees" || action === "all") {
    var checkinsMap = {};
    var checkinSheet = ss.getSheetByName("Checkins");
    if (checkinSheet && checkinSheet.getLastRow() > 1) {
      var cRows = checkinSheet.getDataRange().getValues();
      for (var i = 1; i < cRows.length; i++) {
        var rId = (cRows[i][1] || "").toString().trim();
        if (rId) {
          checkinsMap[rId] = {
            registrationId: rId,
            fullName: cRows[i][2] || "",
            batchYear: cRows[i][3] || "",
            place: cRows[i][4] || "",
            reportedAt: cRows[i][5] || "",
            reportedBy: cRows[i][6] || "Admin",
            timestamp: Number(cRows[i][7]) || 0
          };
        }
      }
    }

    var feesMap = { settings: { defaultFee: 200, currency: "₹" }, records: {} };
    var feeSheet = ss.getSheetByName("Fees");
    if (feeSheet && feeSheet.getLastRow() > 1) {
      var fRows = feeSheet.getDataRange().getValues();
      for (var j = 1; j < fRows.length; j++) {
        var fId = (fRows[j][1] || "").toString().trim();
        if (fId) {
          feesMap.records[fId] = {
            paid: true,
            amount: Number(fRows[j][3]) || 200,
            paidAt: fRows[j][4] || "",
            recordedBy: fRows[j][5] || "Admin"
          };
        }
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
    message: "Dalailul Khairath Alumni Webhook v2 is active with persistent check-in and fee support.",
    endpoints: ["POST (register/checkin/fee)", "GET ?action=checkins"]
  })).setMimeType(ContentService.MimeType.JSON);
}
