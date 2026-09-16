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
  fullName: "",
  place: "",
  mobileNumber: "",
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
        setFormData((curr) => ({ ...curr, whatsappNumber: curr.mobileNumber }));
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
      errs.batchYear = "Please select your Batch / Admission Year.";
    }
    if (!formData.fullName.trim()) {
      errs.fullName = "Please enter your Full Name.";
    }
    if (!formData.place.trim()) {
      errs.place = "Please enter your Place.";
    }

    const cleanMobile = (formData.mobileNumber || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      errs.mobileNumber = "Please provide a valid 10-digit mobile number.";
    }

    if (!formData.hifzStatus) {
      errs.hifzStatus = "Please select Hifz status.";
    }
    if (!formData.leavingYear) {
      errs.leavingYear = "Please select Leaving Year.";
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
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <div className="bg-white rounded-3xl shadow-xl border border-[#c8d1dc] p-6 sm:p-10 transition-all">
        {/* Card Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#0d1b2a] tracking-tight">
            ALUMNI MEET 2026 - DALAILUL KHAIRATH KAKKIDIPPURAM
          </h2>
          <h3 className="text-lg sm:text-xl font-bold text-[#3875b6] mt-0.5">
            Registration Form
          </h3>
          <p className="text-xs sm:text-sm text-[#415a77] mt-1">
            Please select your batch and confirm your details for the summit.
          </p>
        </div>

        {/* Global Submit Error if any */}
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold">Registration could not be completed</p>
              <p className="text-xs mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Batch / Admission Year */}
          <StepBatchSelect
            selectedBatch={formData.batchYear}
            onSelectBatch={handleBatchSelect}
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
                  className="w-full py-4 px-6 rounded-2xl bg-[#1b263b] hover:bg-[#0d1b2a] text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-[#1b263b]/25 hover:shadow-xl transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 -rotate-12" />
                      <span>Complete Registration</span>
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
