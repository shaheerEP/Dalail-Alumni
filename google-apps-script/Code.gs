/**
 * Google Apps Script to collect Dalailul Khairath Kakkidippuram Alumni registrations
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Replace all existing code in the editor with this script
 * 4. Click Deploy > New deployment
 * 5. Select type: "Web app"
 * 6. Set Description: "Alumni Registration Webhook"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click Deploy, authorize permissions, and copy the Web App URL!
 * 10. Paste the URL into .env.local as GOOGLE_SHEET_WEBHOOK_URL="your-url-here"
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if the sheet is newly created
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Registration ID",
        "Full Name",
        "Place",
        "Mobile Number",
        "WhatsApp Number",
        "Batch / Admission Year",
        "Hifz Status",
        "Leaving Year",
        "Islamic Qualification",
        "Academic Qualification",
        "Current Status",
        "Job / Designation",
        "Institution / Organization Name",
        "Work Location",
        "Will Attend Meet?"
      ]);
      
      // Style header row
      var headerRange = sheet.getRange(1, 1, 1, 16);
      headerRange.setBackground("#0e172e");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.registrationId || "",
      data.fullName || "",
      data.place || "",
      data.mobileNumber || "",
      data.whatsappNumber || "",
      data.batchYear || "",
      data.hifzStatus || "",
      data.leavingYear || "",
      data.islamicQualification || "",
      data.academicQualification || "",
      data.currentStatus || "",
      data.jobDesignation || "",
      data.institutionName || "",
      data.workLocation || "",
      data.willAttend || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registration recorded successfully",
      registrationId: data.registrationId
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
