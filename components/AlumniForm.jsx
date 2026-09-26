"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import StepBatchSelect from "./StepBatchSelect";
import StepNameSearch from "./StepNameSearch";
import PersonalInfoSection from "./PersonalInfoSection";
import AcademicSection from "./AcademicSection";
import StatusSection from "./StatusSection";
import AttendanceSection from "./AttendanceSection";
import RegistrationSlipModal from "./RegistrationSlipModal";

const INITIAL_FORM_STATE = {
  batchYear: "",
  joinedBatch: "",
  joinedSections: [],
  fullName: "",
  place: "",
  mobileCountryCode: "+91",
  mobileNumber: "",
  whatsappCountryCode: "+91",
  whatsappNumber: "",
  hifzStatus: "",
  leavingYear: "",
  islamicQualification: "",
  academicQualification: "",
  currentStatus: "Job",
  jobDesignation: "",
  institutionName: "",
  workLocation: "",
  willAttend: "Yes, I will attend",
};

export default function AlumniForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registeredData, setRegisteredData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Handle batch selection
  const handleBatchSelect = (batch) => {
    setFormData((prev) => ({
      ...prev,
      batchYear: batch,
      joinedSections: (batch === "Junior Sharia/Dars" || batch === "Hifz") ? [] : prev.joinedSections,
      // If batch changes, reset selected student
      fullName: "",
      place: "",
    }));
    setSelectedStudent(null);
    setIsManualEntry(false);
    if (errors.batchYear) {
      setErrors((prev) => ({ ...prev, batchYear: null }));
    }
  };

  // Handle HS / BS Section toggle
  const handleToggleSection = (section) => {
    setFormData((prev) => {
      const current = prev.joinedSections || [];
      const updated = current.includes(section)
        ? current.filter((s) => s !== section)
        : [...current, section];
      return {
        ...prev,
        joinedSections: updated,
      };
    });
  };

  // Handle student selection from roster autocomplete
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    if (student) {
      setFormData((prev) => ({
        ...prev,
        fullName: student.name || prev.fullName,
        place: student.place || prev.place,
        hifzStatus: student.hifz || prev.hifzStatus,
        mobileNumber: student.mobile || prev.mobileNumber,
        whatsappNumber: sameAsMobile ? (student.mobile || prev.mobileNumber) : prev.whatsappNumber,
      }));
      setErrors((prev) => ({
        ...prev,
        fullName: null,
        place: null,
      }));
    }
  };

  const handleToggleManualEntry = () => {
    setIsManualEntry((prev) => !prev);
    setSelectedStudent(null);
  };

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "mobileNumber" && sameAsMobile) {
        updated.whatsappNumber = value;
      }
      if (name === "mobileCountryCode" && sameAsMobile) {
        updated.whatsappCountryCode = value;
      }
      return updated;
    });

    // Clear error for field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Toggle "Same as Mobile"
  const handleToggleSameAsMobile = () => {
    setSameAsMobile((prev) => {
      const next = !prev;
      if (next) {
        setFormData((curr) => ({
          ...curr,
          whatsappCountryCode: curr.mobileCountryCode,
          whatsappNumber: curr.mobileNumber,
        }));
      }
      return next;
    });
  };

  // Status toggle (Job vs Study)
  const handleSelectStatus = (status) => {
    setFormData((prev) => ({ ...prev, currentStatus: status }));
  };

  // Attendance toggle
  const handleSelectAttendance = (attendance) => {
    setFormData((prev) => ({ ...prev, willAttend: attendance }));
  };

  // Validation
  const validate = () => {
    const errs = {};

    if (!formData.batchYear) {
      errs.batchYear = "Please select your Batch.";
    }
    if (!formData.fullName.trim()) {
      errs.fullName = "Please enter your Full Name.";
    }
    if (!formData.place.trim()) {
      errs.place = "Please enter your Place.";
    }

    const cleanMobile = (formData.mobileNumber || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 7 || cleanMobile.length > 15) {
      errs.mobileNumber = "Please enter a valid mobile number.";
    }

    if (!formData.hifzStatus) {
      errs.hifzStatus = "Please select whether you are a Hafiz or Not.";
    }

    if (!formData.islamicQualification) {
      errs.islamicQualification = "Please select Islamic Qualification.";
    }
    if (!formData.academicQualification) {
      errs.academicQualification = "Please select Academic Qualification.";
    }
    if (!formData.jobDesignation.trim()) {
      errs.jobDesignation = formData.currentStatus === "Study" ? "Please enter course details." : "Please enter your job/designation.";
    }
    if (!formData.institutionName.trim()) {
      errs.institutionName = "Please enter institution or company name.";
    }
    if (!formData.workLocation.trim()) {
      errs.workLocation = "Please enter work or study location.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector(".form-input-error");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanMobileDigits = (formData.mobileNumber || "").replace(/\D/g, "");
      const mobileCode = (formData.mobileCountryCode || "+91").trim();
      const cleanMobile = cleanMobileDigits ? `${mobileCode}${cleanMobileDigits}` : "";

      const rawWaDigits = sameAsMobile ? formData.mobileNumber : formData.whatsappNumber;
      const cleanWaDigits = (rawWaDigits || "").replace(/\D/g, "");
      const waCode = (sameAsMobile ? mobileCode : (formData.whatsappCountryCode || "+91")).trim();
      const cleanWhatsapp = cleanWaDigits ? `${waCode}${cleanWaDigits}` : cleanMobile;

      const hasNoSection = formData.batchYear === "Junior Sharia/Dars" || formData.batchYear === "Hifz";
      const sectionString = hasNoSection ? "" : (formData.joinedSections || []).join(", ");
      const finalSections = hasNoSection ? [] : (formData.joinedSections || []);

      const submissionData = {
        ...formData,
        joinedBatch: formData.batchYear,
        joinedSection: sectionString,
        joinedSections: finalSections,
        mobileNumber: cleanMobile,
        whatsappNumber: cleanWhatsapp,
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit registration.");
      }

      setRegisteredData(result.data);
      setShowModal(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setSelectedStudent(null);
    setIsManualEntry(false);
    setErrors({});
    setSubmitError("");
  };

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-[#719100]/15 p-6 sm:p-10 transition-all">
        {/* Card Header */}
        <div className="mb-6 pb-3 border-b border-[#719100]/15">
          <h2 className="text-xl sm:text-2xl font-black text-[#192200] tracking-tight">
            Registration Form
          </h2>
        </div>

        {/* Global Submit Error if any */}
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold">Registration could not be completed</p>
              <p className="text-xs mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Joined with Batch & Sections */}
          <StepBatchSelect
            selectedBatch={formData.batchYear}
            onSelectBatch={handleBatchSelect}
            selectedSections={formData.joinedSections}
            onToggleSection={handleToggleSection}
            error={errors.batchYear}
          />

          {/* Conditional rendering after batch is selected */}
          {formData.batchYear && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Step 2: Search & Select Name */}
              <StepNameSearch
                batch={formData.batchYear}
                selectedStudent={selectedStudent}
                onSelectStudent={handleStudentSelect}
                isManualEntry={isManualEntry}
                onToggleManualEntry={handleToggleManualEntry}
              />

              {/* Personal Information */}
              <PersonalInfoSection
                formData={formData}
                errors={errors}
                onChange={handleChange}
                sameAsMobile={sameAsMobile}
                onToggleSameAsMobile={handleToggleSameAsMobile}
              />

              {/* Academic & Hifz Record */}
              <AcademicSection
                formData={formData}
                errors={errors}
                onChange={handleChange}
                setFormData={setFormData}
                setErrors={setErrors}
              />

              {/* Step 4: Current Status */}
              <StatusSection
                formData={formData}
                errors={errors}
                onChange={handleChange}
                onSelectStatus={handleSelectStatus}
              />

              {/* Step 5: Attendance */}
              <AttendanceSection
                willAttend={formData.willAttend}
                onSelectAttendance={handleSelectAttendance}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#719100] via-[#5d7700] to-[#719100] hover:from-[#5d7700] hover:to-[#4a6000] text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-[#719100]/25 hover:shadow-xl transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.005] active:scale-[0.995]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 -rotate-12" />
                      <span>Submit Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Success Registration Slip Modal */}
      <RegistrationSlipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={registeredData}
        onResetForm={handleResetForm}
      />
    </>
  );
}
