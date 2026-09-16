// data/options.js

// Batches: Batch 1 through Batch 12
export const BATCH_OPTIONS = Array.from({ length: 12 }, (_, i) => `Batch ${i + 1}`);
export const BATCH_YEARS = BATCH_OPTIONS;

// Sample alumni roster by batch
export const SAMPLE_ALUMNI_ROSTER = {
  "Batch 1": [
    { id: "B1-01", name: "MUHAMMED SHARIF KAKKIDIPPURAM", place: "KAKKIDIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "B1-02", name: "ABDUL SALAM T", place: "TIRUR", mobile: "", hifz: "Hafiz" },
    { id: "B1-03", name: "IBRAHIM KHALIL", place: "KUTTIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "B1-04", name: "ANAS MUSTHAFA", place: "EDAPPAL", mobile: "", hifz: "Hafiz" },
    { id: "B1-05", name: "HASANUL BANNA", place: "CHANGARAMKULAM", mobile: "", hifz: "Not Hafiz" },
  ],
  "Batch 2": [
    { id: "B2-01", name: "ABBAS EA", place: "ALUVA", mobile: "", hifz: "Hafiz" },
    { id: "B2-02", name: "MUHAMMED SHAFI K", place: "EDAPPAL", mobile: "", hifz: "Hafiz" },
    { id: "B2-03", name: "ABDUL BASITH M", place: "TIRUR", mobile: "", hifz: "Not Hafiz" },
    { id: "B2-04", name: "SHUHAIB KAKKIDIPPURAM", place: "KAKKIDIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "B2-05", name: "ANAS CHERUMUKKU", place: "CHERUMUKKU", mobile: "", hifz: "Not Hafiz" },
  ],
  "Batch 3": [
    { id: "B3-01", name: "JUNAID K", place: "PONNANI", mobile: "", hifz: "Hafiz" },
    { id: "B3-02", name: "SALMAN FARIS", place: "KUTTIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "B3-03", name: "RASHID V", place: "CHANGARAMKULAM", mobile: "", hifz: "Not Hafiz" },
  ],
  "Batch 4": [
    { id: "B4-01", name: "SHABEER AHMED", place: "VALANCHERY", mobile: "", hifz: "Hafiz" },
    { id: "B4-02", name: "MOHAMMED RAFI", place: "PERINTHALMANNA", mobile: "", hifz: "Hafiz" },
  ],
  "Batch 5": [
    { id: "B5-01", name: "FAWAS K", place: "MALAPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "B5-02", name: "HISHAMUDHEEN P", place: "THRISSUR", mobile: "", hifz: "Not Hafiz" },
  ],
};

// Hifz Status options: Hafiz and Not Hafiz
export const HIFZ_STATUS_OPTIONS = [
  "Hafiz",
  "Not Hafiz",
];

export const LEAVING_YEARS = Array.from({ length: 2026 - 1989 }, (_, i) => (2026 - i).toString());

// Standard initial options for Islamic Qualifications
export const ISLAMIC_QUALIFICATIONS = [
  "Hafiz",
  "Alim / Sanad",
  "Wafy / CIC",
  "Dawa Degree",
  "Board Higher Secondary",
  "Dars Education",
  "Preliminary Studies",
];

// Standard initial options for Academic Qualifications
export const ACADEMIC_QUALIFICATIONS = [
  "SSLC / 10th Standard",
  "+2 / Higher Secondary",
  "Graduation / Bachelor Degree",
  "Post Graduation / Master Degree",
  "Diploma / Technical Certification",
  "B.Ed / Teacher Training",
  "Doctorate / Ph.D",
];

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
