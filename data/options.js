// data/options.js

// Batches: Junior Sharia/Dars, followed by Batch 1 through Batch 12
export const BATCH_OPTIONS = [
  "Junior Sharia/Dars",
  ...Array.from({ length: 12 }, (_, i) => `Batch ${i + 1}`),
];
export const BATCH_YEARS = BATCH_OPTIONS;

// Alumni roster by batch (empty by default; add official student records here when available)
export const SAMPLE_ALUMNI_ROSTER = {};

// Hifz Status options: Hafiz and Not Hafiz
export const HIFZ_STATUS_OPTIONS = [
  "Hafiz",
  "Not Hafiz",
];

export const LEAVING_YEARS = Array.from({ length: 2026 - 1989 }, (_, i) => (2026 - i).toString());

// Islamic Qualifications (populated dynamically from user submissions)
export const ISLAMIC_QUALIFICATIONS = [];

// Academic Qualifications (populated dynamically from user submissions)
export const ACADEMIC_QUALIFICATIONS = [];

// Country Calling Codes for Alumni Registration
export const COUNTRY_CODES = [
  { code: "+91", label: "+91 (India)" },
  { code: "+971", label: "+971 (UAE)" },
  { code: "+966", label: "+966 (Saudi Arabia)" },
  { code: "+974", label: "+974 (Qatar)" },
  { code: "+968", label: "+968 (Oman)" },
  { code: "+965", label: "+965 (Kuwait)" },
  { code: "+973", label: "+973 (Bahrain)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+1", label: "+1 (USA / Canada)" },
  { code: "+60", label: "+60 (Malaysia)" },
  { code: "+65", label: "+65 (Singapore)" },
  { code: "+20", label: "+20 (Egypt)" },
  { code: "+90", label: "+90 (Turkey)" },
];
