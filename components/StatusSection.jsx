import { Briefcase, BookOpen } from "lucide-react";

export default function StatusSection({ formData, errors, onChange, onSelectStatus }) {
  const isJob = formData.currentStatus === "Job";
  const isStudy = formData.currentStatus === "Study";

  return (
    <div className="space-y-4 pt-4 border-t border-black/[0.05]">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          Current Status
        </h3>
      </div>

      {/* Pill Toggle Buttons */}
      <div className="grid grid-cols-2 gap-3 max-w-xs">
        <button
          type="button"
          onClick={() => onSelectStatus("Job")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-0 font-bold text-sm transition-all cursor-pointer ${
            isJob
              ? "bg-[#1b263b] text-white shadow-sm"
              : "bg-[#f3f4f6] text-[#415a77] hover:bg-[#eaecee]"
          }`}
        >
          <Briefcase className={`w-4 h-4 ${isJob ? "text-white" : "text-[#778da9]"}`} />
          <span>Job</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectStatus("Study")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-0 font-bold text-sm transition-all cursor-pointer ${
            isStudy
              ? "bg-[#1b263b] text-white shadow-sm"
              : "bg-[#f3f4f6] text-[#415a77] hover:bg-[#eaecee]"
          }`}
        >
          <BookOpen className={`w-4 h-4 ${isStudy ? "text-white" : "text-[#778da9]"}`} />
          <span>Study</span>
        </button>
      </div>

      {/* 3 Detail inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        {/* Job / Designation or Course */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            {isStudy ? "Course / Field" : "Job / Designation"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobDesignation"
            placeholder={isStudy ? "Course name" : "Designation"}
            value={formData.jobDesignation}
            onChange={onChange}
            className={`form-input ${errors.jobDesignation ? "form-input-error" : ""}`}
          />
          {errors.jobDesignation && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.jobDesignation}</p>
          )}
        </div>

        {/* Institution / Company Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            {isStudy ? "Institution / University" : "Company / Organization"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="institutionName"
            placeholder={isStudy ? "Institution name" : "Company name"}
            value={formData.institutionName}
            onChange={onChange}
            className={`form-input ${errors.institutionName ? "form-input-error" : ""}`}
          />
          {errors.institutionName && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.institutionName}</p>
          )}
        </div>

        {/* Work / Study Location */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            {isStudy ? "Study Location" : "Work Location"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="workLocation"
            placeholder="City / Country"
            value={formData.workLocation}
            onChange={onChange}
            className={`form-input ${errors.workLocation ? "form-input-error" : ""}`}
          />
          {errors.workLocation && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.workLocation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
