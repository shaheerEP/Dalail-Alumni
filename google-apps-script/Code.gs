/**
 * Google Apps Script to collect Dalailul Khairath Kakkidippuram Alumni registrations
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Replace all existing code in the editor with this script
 * 4. Click Save (Ctrl+S)
 * 5. (Optional) Select 'setupHeaders' in the function dropdown at the top and click 'Run' to format headers immediately!
 * 6. Click Deploy > Manage deployments > Edit > New version > Deploy
 */

var HEADERS = [
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

// Run this function directly inside Apps Script to create or fix headers right now!
function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else if (sheet.getRange(1, 1).getValue() !== "Timestamp") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground("#0d1b2a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create or fix headers if missing
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground("#0d1b2a");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else if (sheet.getRange(1, 1).getValue() !== "Timestamp") {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground("#0d1b2a");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

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

    sheet.appendRow([
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
  return ContentService.createTextOutput("Dalailul Khairath Kakkidippuram Alumni Google Sheets Webhook is active!");
}
