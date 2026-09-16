# Dalail-Alumni

Official Alumni Meet Registration Portal for **Dalailul Khairath Kakkidippuram**.

Built with **Next.js (App Router)**, **Tailwind CSS**, and **Google Sheets integration**.

---

## Features

- **Custom Architectural Color Palette**: Modern palette featuring ink black, prussian blue, dusk blue, dusty denim, and alabaster grey.
- **Batch Selection**: Full batch history with instant roster search.
- **Name Autocomplete & "Name Not in List?"**: Quick lookup from existing roster or manual entry.
- **Qualifications**:
  - Hifz Status: Completed & Partially Completed.
  - Islamic & Academic Qualifications: Select from existing options or dynamically add custom entries.
- **Current Status & Attendance**: Interactive toggle cards for Job / Study and attendance confirmation.
- **Digital Registration Pass**: Displays unique Registration ID with WhatsApp share and print/PDF options.
- **Google Sheets Synchronization**: Automatically appends new registrations directly to your Google Sheet via Google Apps Script.

---

## Quick Start

### 1. Install dependencies
```bash
pnpm install
# or: npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Add your Google Apps Script Web App URL to `GOOGLE_SHEET_WEBHOOK_URL` (see [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)).

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Google Sheets Setup

Follow the step-by-step instructions in [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) and use the script in [google-apps-script/Code.gs](google-apps-script/Code.gs) to connect your Google Sheet.
