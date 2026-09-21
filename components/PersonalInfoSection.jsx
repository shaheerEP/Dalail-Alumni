"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { COUNTRY_CODES } from "@/data/options";

export default function PersonalInfoSection({
  formData,
  errors,
  onChange,
  sameAsMobile,
  onToggleSameAsMobile,
}) {
  const [registeredList, setRegisteredList] = useState([]);
  const [isLoadingRegistered, setIsLoadingRegistered] = useState(false);

  useEffect(() => {
    async function loadRegistered() {
      try {
        setIsLoadingRegistered(true);
        const res = await fetch("/api/registered-alumni");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.registered)) {
            setRegisteredList(json.registered);
          }
        }
      } catch (err) {
        console.warn("Could not load registered alumni list:", err);
      } finally {
        setIsLoadingRegistered(false);
      }
    }
    loadRegistered();
  }, []);

  // Compute matched alumni as user types
  const inputName = (formData.fullName || "").trim();
  const normalizedInput = inputName.toLowerCase().replace(/\s+/g, " ");

  const matchingRegistered =
    normalizedInput.length >= 2
      ? registeredList.filter((alum) => {
          const alumNameNorm = (alum.name || "").toLowerCase().replace(/\s+/g, " ");
          return alumNameNorm.includes(normalizedInput) || normalizedInput.includes(alumNameNorm);
        })
      : [];

  const isExactMatch = matchingRegistered.some(
    (alum) => (alum.name || "").trim().toLowerCase() === normalizedInput
  );

  return (
    <div className="space-y-4 pt-4 border-t border-[#719100]/15">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#192200] uppercase">
          Personal Information
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#192200] mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter full name"
            value={formData.fullName}
            onChange={onChange}
            className={`form-input uppercase ${errors.fullName ? "form-input-error" : ""}`}
          />
          {errors.fullName && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.fullName}</p>
          )}

          {/* Already Registered Notification */}
          {matchingRegistered.length > 0 && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isExactMatch ? "Name Already Registered:" : "Similar Name Already Registered:"}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                {matchingRegistered.map((alum, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-white border border-amber-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#192200] uppercase">{alum.name}</span>
                      {alum.batch && <span className="text-amber-700 font-medium">({alum.batch})</span>}
                      {alum.place && <span className="text-gray-500">· {alum.place}</span>}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-[10px] font-mono font-bold text-amber-900 shrink-0">
                      {alum.regId}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-amber-700 leading-tight">
                ℹ️ If this is your registration, you don&apos;t need to register again. If you share this name with someone else, you can proceed.
              </p>
            </div>
          )}
        </div>

        {/* Place */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#192200] mb-1">
            Place <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="place"
            placeholder="City / Town / Place"
            value={formData.place}
            onChange={onChange}
            className={`form-input uppercase ${errors.place ? "form-input-error" : ""}`}
          />
          {errors.place && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.place}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mobile Number - Compact Country Code, No Large Gap */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#192200] mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center rounded-xl bg-[#eef2dc] border border-[#719100]/15 transition-all focus-within:bg-white focus-within:border-[#719100] focus-within:ring-3 focus-within:ring-[#719100]/20 ${
              errors.mobileNumber ? "border-red-400 bg-red-50/50 ring-2 ring-red-400/20" : ""
            }`}
          >
            <select
              name="mobileCountryCode"
              value={formData.mobileCountryCode || "+91"}
              onChange={onChange}
              className="w-[74px] sm:w-[78px] bg-transparent py-3 pl-2.5 pr-0 text-xs sm:text-sm font-bold text-[#192200] outline-none cursor-pointer border-r border-[#719100]/20 shrink-0"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} ({item.label.split("(")[1]?.replace(")", "") || item.code})
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="mobileNumber"
              placeholder="Mobile number"
              value={formData.mobileNumber}
              onChange={onChange}
              className="w-full bg-transparent py-3 px-2.5 text-xs sm:text-sm text-[#192200] outline-none tracking-wider font-medium placeholder:text-[#6e8242]"
            />
          </div>
          {errors.mobileNumber && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.mobileNumber}</p>
          )}
        </div>

        {/* WhatsApp Number - Compact Country Code */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-[#192200]">
              WhatsApp Number
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#719100] hover:text-[#556d00] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameAsMobile}
                onChange={onToggleSameAsMobile}
                className="w-4 h-4 rounded text-[#719100] focus:ring-[#719100] border-0 bg-[#eef2dc]"
              />
              <span>Same as Mobile</span>
            </label>
          </div>

          <div
            className={`flex items-center rounded-xl bg-[#eef2dc] border border-[#719100]/15 transition-all ${
              sameAsMobile
                ? "opacity-50 cursor-not-allowed"
                : "focus-within:bg-white focus-within:border-[#719100] focus-within:ring-3 focus-within:ring-[#719100]/20"
            }`}
          >
            <select
              name="whatsappCountryCode"
              value={formData.whatsappCountryCode || formData.mobileCountryCode || "+91"}
              onChange={onChange}
              disabled={sameAsMobile}
              className="w-[74px] sm:w-[78px] bg-transparent py-3 pl-2.5 pr-0 text-xs sm:text-sm font-bold text-[#192200] outline-none cursor-pointer border-r border-[#719100]/20 shrink-0 disabled:cursor-not-allowed"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} ({item.label.split("(")[1]?.replace(")", "") || item.code})
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="whatsappNumber"
              placeholder="WhatsApp number"
              value={formData.whatsappNumber}
              onChange={onChange}
              disabled={sameAsMobile}
              className="w-full bg-transparent py-3 px-2.5 text-xs sm:text-sm text-[#192200] outline-none tracking-wider font-medium placeholder:text-[#6e8242] disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
