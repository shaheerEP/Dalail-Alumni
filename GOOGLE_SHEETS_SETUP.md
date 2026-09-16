# Google Sheet Connection Setup Guide

Follow these simple steps to connect your Next.js Alumni Portal to your Google Sheet:

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Title it: **Dalailul Khairath Kakkidippuram Alumni Registrations** (or any name you prefer).

### Step 2: Add the Apps Script Code
1. In the Google Sheet top menu, click **Extensions** > **Apps Script**.
2. Delete whatever is currently in the script editor window.
3. Open the file `google-apps-script/Code.gs` in this project, copy all its code, and paste it into the Google Apps Script editor.
4. Click the **Save** icon (disk icon) or press `Ctrl + S`.

### Step 3: Deploy as Web App
1. Click the blue **Deploy** button at the top right > **New deployment**.
2. Next to "Select type", click the **Gear icon (⚙)** and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `Alumni Registration Webhook`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial: this allows your Next.js server to submit entries)*
4. Click **Deploy**.
5. If prompted, click **Authorize access**, choose your Google account, click **Advanced**, and click **Go to Untitled project (unsafe)** to grant write permissions to your sheet.
6. Copy the **Web App URL** generated (it looks like: `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Add the URL to `.env.local`
1. In your project root (`dalailul-khairath-alumni`), open `.env.local`.
2. Add your URL:
   ```env
   GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
   ```
3. Restart your dev server (`pnpm dev` or `npm run dev`).

Every registration will now be appended directly into your Google Sheet!
*(Even without configuring this yet, submissions are safely backed up locally to `data/submissions.json`).*
