// data/options.js

// Generate batches from 2026 down to 1990
export const BATCH_YEARS = Array.from({ length: 2026 - 1989 }, (_, i) => (2026 - i).toString());

// Sample alumni roster by batch
export const SAMPLE_ALUMNI_ROSTER = {
  "2012": [
    { id: "12-01", name: "MUHAMMED SHARIF KAKKIDIPPURAM", place: "KAKKIDIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "12-02", name: "ABDUL SALAM T", place: "TIRUR", mobile: "", hifz: "Hafiz" },
    { id: "12-03", name: "IBRAHIM KHALIL", place: "KUTTIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "12-04", name: "ANAS MUSTHAFA", place: "EDAPPAL", mobile: "", hifz: "Hafiz" },
    { id: "12-05", name: "HASANUL BANNA", place: "CHANGARAMKULAM", mobile: "", hifz: "Not Hafiz" },
  ],
  "2015": [
    { id: "15-01", name: "ABBAS EA", place: "ALUVA", mobile: "", hifz: "Hafiz" },
    { id: "15-02", name: "MUHAMMED SHAFI K", place: "EDAPPAL", mobile: "", hifz: "Hafiz" },
    { id: "15-03", name: "ABDUL BASITH M", place: "TIRUR", mobile: "", hifz: "Not Hafiz" },
    { id: "15-04", name: "SHUHAIB KAKKIDIPPURAM", place: "KAKKIDIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "15-05", name: "ANAS CHERUMUKKU", place: "CHERUMUKKU", mobile: "", hifz: "Not Hafiz" },
  ],
  "2016": [
    { id: "16-01", name: "JUNAID K", place: "PONNANI", mobile: "", hifz: "Hafiz" },
    { id: "16-02", name: "SALMAN FARIS", place: "KUTTIPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "16-03", name: "RASHID V", place: "CHANGARAMKULAM", mobile: "", hifz: "Not Hafiz" },
  ],
  "2018": [
    { id: "18-01", name: "SHABEER AHMED", place: "VALANCHERY", mobile: "", hifz: "Hafiz" },
    { id: "18-02", name: "MOHAMMED RAFI", place: "PERINTHALMANNA", mobile: "", hifz: "Hafiz" },
  ],
  "2020": [
    { id: "20-01", name: "FAWAS K", place: "MALAPPURAM", mobile: "", hifz: "Hafiz" },
    { id: "20-02", name: "HISHAMUDHEEN P", place: "THRISSUR", mobile: "", hifz: "Not Hafiz" },
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
