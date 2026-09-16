"use client";

import { useState } from "react";
import { PlusCircle, ListFilter, Check } from "lucide-react";
import {
  HIFZ_STATUS_OPTIONS,
  LEAVING_YEARS,
  ISLAMIC_QUALIFICATIONS,
  ACADEMIC_QUALIFICATIONS,
} from "@/data/options";

export default function AcademicSection({ formData, errors, onChange, setFormData }) {
  const [islamicOptions, setIslamicOptions] = useState(ISLAMIC_QUALIFICATIONS);
  const [academicOptions, setAcademicOptions] = useState(ACADEMIC_QUALIFICATIONS);

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
    if (trimmed && !islamicOptions.includes(trimmed)) {
      setIslamicOptions((prev) => [...prev, trimmed]);
      setIsCustomIslamic(false);
      setFormData((prev) => ({ ...prev, islamicQualification: trimmed }));
    }
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
    if (trimmed && !academicOptions.includes(trimmed)) {
      setAcademicOptions((prev) => [...prev, trimmed]);
      setIsCustomAcademic(false);
      setFormData((prev) => ({ ...prev, academicQualification: trimmed }));
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#e0e1dd]">
      <div className="flex items-center gap-2">
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          QUALIFICATIONS & ACADEMIC RECORD
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hifz Status */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Hifz Status <span className="text-red-500">*</span>
          </label>
          <select
            name="hifzStatus"
            value={formData.hifzStatus}
            onChange={onChange}
            className={`form-select ${errors.hifzStatus ? "form-input-error" : ""}`}
          >
            <option value="">Select Hifz Status</option>
            {HIFZ_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-[#1b263b]">
              Islamic Qualification <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCustomIslamic(!isCustomIslamic);
                if (!isCustomIslamic) {
                  setCustomIslamicText("");
                  setFormData((prev) => ({ ...prev, islamicQualification: "" }));
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3875b6] hover:text-[#234870] cursor-pointer"
            >
              {isCustomIslamic ? (
                <>
                  <ListFilter className="w-3 h-3" />
                  <span>Choose from list</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Add New</span>
                </>
              )}
            </button>
          </div>

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
                + Add Custom Qualification...
              </option>
            </select>
          ) : (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Enter Islamic qualification..."
                  value={customIslamicText}
                  onChange={handleCustomIslamicChange}
                  className={`form-input pr-20 ${
                    errors.islamicQualification ? "form-input-error" : ""
                  }`}
                  autoFocus
                />
                {customIslamicText.trim() && (
                  <button
                    type="button"
                    onClick={handleSaveCustomIslamic}
                    className="absolute right-2 px-2.5 py-1 text-xs font-bold bg-[#1b263b] hover:bg-[#0d1b2a] text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Add to dropdown list"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#778da9]">
                Type qualification or click "Choose from list" above to select.
              </p>
            </div>
          )}

          {errors.islamicQualification && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.islamicQualification}</p>
          )}
        </div>

        {/* Academic Qualification */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-[#1b263b]">
              Academic Qualification <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsCustomAcademic(!isCustomAcademic);
                if (!isCustomAcademic) {
                  setCustomAcademicText("");
                  setFormData((prev) => ({ ...prev, academicQualification: "" }));
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3875b6] hover:text-[#234870] cursor-pointer"
            >
              {isCustomAcademic ? (
                <>
                  <ListFilter className="w-3 h-3" />
                  <span>Choose from list</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Add New</span>
                </>
              )}
            </button>
          </div>

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
                + Add Custom Qualification...
              </option>
            </select>
          ) : (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Enter academic qualification..."
                  value={customAcademicText}
                  onChange={handleCustomAcademicChange}
                  className={`form-input pr-20 ${
                    errors.academicQualification ? "form-input-error" : ""
                  }`}
                  autoFocus
                />
                {customAcademicText.trim() && (
                  <button
                    type="button"
                    onClick={handleSaveCustomAcademic}
                    className="absolute right-2 px-2.5 py-1 text-xs font-bold bg-[#1b263b] hover:bg-[#0d1b2a] text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Add to dropdown list"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#778da9]">
                Type qualification or click "Choose from list" above to select.
              </p>
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
