"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  HIFZ_STATUS_OPTIONS,
  LEAVING_YEARS,
  ISLAMIC_QUALIFICATIONS,
  ACADEMIC_QUALIFICATIONS,
} from "@/data/options";

export default function AcademicSection({ formData, errors, onChange, setFormData, setErrors }) {
  const [islamicOptions, setIslamicOptions] = useState(ISLAMIC_QUALIFICATIONS);
  const [academicOptions, setAcademicOptions] = useState(ACADEMIC_QUALIFICATIONS);

  const handleHifzToggle = (status) => {
    setFormData((prev) => ({
      ...prev,
      hifzStatus: status,
    }));
    if (setErrors) {
      setErrors((prev) => ({ ...prev, hifzStatus: null }));
    }
  };

  const [isCustomIslamic, setIsCustomIslamic] = useState(false);
  const [customIslamicText, setCustomIslamicText] = useState("");

  const [isCustomAcademic, setIsCustomAcademic] = useState(false);
  const [customAcademicText, setCustomAcademicText] = useState("");

  const handleIslamicSelect = (e) => {
    const val = e.target.value;
    if (val === "__ADD_NEW__") {
      setIsCustomIslamic(true);
      setCustomIslamicText("");
      setFormData((prev) => ({ ...prev, islamicQualification: "" }));
    } else {
      setIsCustomIslamic(false);
      onChange(e);
    }
  };

  const handleCustomIslamicChange = (e) => {
    const val = e.target.value;
    setCustomIslamicText(val);
    setFormData((prev) => ({ ...prev, islamicQualification: val }));
  };

  const handleSaveCustomIslamic = () => {
    const trimmed = customIslamicText.trim();
    if (trimmed) {
      if (!islamicOptions.includes(trimmed)) {
        setIslamicOptions((prev) => [...prev, trimmed]);
      }
      setIsCustomIslamic(false);
      setFormData((prev) => ({ ...prev, islamicQualification: trimmed }));
    }
  };

  const handleCancelCustomIslamic = () => {
    setIsCustomIslamic(false);
    setCustomIslamicText("");
    setFormData((prev) => ({ ...prev, islamicQualification: "" }));
  };

  const handleAcademicSelect = (e) => {
    const val = e.target.value;
    if (val === "__ADD_NEW__") {
      setIsCustomAcademic(true);
      setCustomAcademicText("");
      setFormData((prev) => ({ ...prev, academicQualification: "" }));
    } else {
      setIsCustomAcademic(false);
      onChange(e);
    }
  };

  const handleCustomAcademicChange = (e) => {
    const val = e.target.value;
    setCustomAcademicText(val);
    setFormData((prev) => ({ ...prev, academicQualification: val }));
  };

  const handleSaveCustomAcademic = () => {
    const trimmed = customAcademicText.trim();
    if (trimmed) {
      if (!academicOptions.includes(trimmed)) {
        setAcademicOptions((prev) => [...prev, trimmed]);
      }
      setIsCustomAcademic(false);
      setFormData((prev) => ({ ...prev, academicQualification: trimmed }));
    }
  };

  const handleCancelCustomAcademic = () => {
    setIsCustomAcademic(false);
    setCustomAcademicText("");
    setFormData((prev) => ({ ...prev, academicQualification: "" }));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-black/[0.05]">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          Qualifications & Academic Record
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hifz Status: Hafiz or Not Checkbox Buttons */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1.5">
            Hifz Status <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Hafiz Button */}
            <button
              type="button"
              onClick={() => handleHifzToggle("Hafiz")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 font-medium text-xs sm:text-sm transition-all cursor-pointer select-none text-left ${
                formData.hifzStatus === "Hafiz"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs"
                  : "border-[#c8d1dc] bg-white text-[#415a77] hover:border-[#778da9] hover:bg-[#f9f9f8]"
              } ${errors.hifzStatus ? "border-red-400" : ""}`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  formData.hifzStatus === "Hafiz"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-[#778da9] bg-white"
                }`}
              >
                {formData.hifzStatus === "Hafiz" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Hafiz</span>
            </button>

            {/* Not Hafiz Button */}
            <button
              type="button"
              onClick={() => handleHifzToggle("Not Hafiz")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 font-medium text-xs sm:text-sm transition-all cursor-pointer select-none text-left ${
                formData.hifzStatus === "Not Hafiz"
                  ? "border-[#415a77] bg-[#e3e8ee] text-[#0d1b2a] font-bold shadow-xs"
                  : "border-[#c8d1dc] bg-white text-[#415a77] hover:border-[#778da9] hover:bg-[#f9f9f8]"
              } ${errors.hifzStatus ? "border-red-400" : ""}`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  formData.hifzStatus === "Not Hafiz"
                    ? "bg-[#415a77] border-[#415a77] text-white"
                    : "border-[#778da9] bg-white"
                }`}
              >
                {formData.hifzStatus === "Not Hafiz" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Not Hafiz</span>
            </button>
          </div>
          {errors.hifzStatus && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.hifzStatus}</p>
          )}
        </div>

        {/* Leaving Year */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Leaving Year <span className="text-red-500">*</span>
          </label>
          <select
            name="leavingYear"
            value={formData.leavingYear}
            onChange={onChange}
            className={`form-select ${errors.leavingYear ? "form-input-error" : ""}`}
          >
            <option value="">Select Leaving Year</option>
            {LEAVING_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.leavingYear && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.leavingYear}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Islamic Qualification */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Islamic Qualification <span className="text-red-500">*</span>
          </label>

          {!isCustomIslamic ? (
            <select
              name="islamicQualification"
              value={formData.islamicQualification}
              onChange={handleIslamicSelect}
              className={`form-select ${errors.islamicQualification ? "form-input-error" : ""}`}
            >
              <option value="">Select Islamic Qualification</option>
              {islamicOptions.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value="__ADD_NEW__" className="font-semibold text-[#3875b6]">
                + Other / Add Custom...
              </option>
            </select>
          ) : (
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter qualification..."
                value={customIslamicText}
                onChange={handleCustomIslamicChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomIslamic();
                  }
                }}
                className={`form-input pr-20 ${
                  errors.islamicQualification ? "form-input-error" : ""
                }`}
                autoFocus
              />
              <div className="absolute right-2 flex items-center gap-1">
                {customIslamicText.trim() && (
                  <button
                    type="button"
                    onClick={handleSaveCustomIslamic}
                    className="p-1 text-[#1b263b] hover:text-emerald-700 cursor-pointer"
                    title="Save qualification"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelCustomIslamic}
                  className="p-1 text-[#778da9] hover:text-[#0d1b2a] cursor-pointer"
                  title="Cancel & choose from list"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {errors.islamicQualification && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.islamicQualification}</p>
          )}
        </div>

        {/* Academic Qualification */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Academic Qualification <span className="text-red-500">*</span>
          </label>

          {!isCustomAcademic ? (
            <select
              name="academicQualification"
              value={formData.academicQualification}
              onChange={handleAcademicSelect}
              className={`form-select ${errors.academicQualification ? "form-input-error" : ""}`}
            >
              <option value="">Select Academic Qualification</option>
              {academicOptions.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value="__ADD_NEW__" className="font-semibold text-[#3875b6]">
                + Other / Add Custom...
              </option>
            </select>
          ) : (
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter qualification..."
                value={customAcademicText}
                onChange={handleCustomAcademicChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomAcademic();
                  }
                }}
                className={`form-input pr-20 ${
                  errors.academicQualification ? "form-input-error" : ""
                }`}
                autoFocus
              />
              <div className="absolute right-2 flex items-center gap-1">
                {customAcademicText.trim() && (
                  <button
                    type="button"
                    onClick={handleSaveCustomAcademic}
                    className="p-1 text-[#1b263b] hover:text-emerald-700 cursor-pointer"
                    title="Save qualification"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelCustomAcademic}
                  className="p-1 text-[#778da9] hover:text-[#0d1b2a] cursor-pointer"
                  title="Cancel & choose from list"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {errors.academicQualification && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.academicQualification}</p>
          )}
        </div>
      </div>
    </div>
  );
}
