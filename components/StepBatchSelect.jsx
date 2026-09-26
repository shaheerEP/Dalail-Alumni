import { BATCH_OPTIONS } from "@/data/options";
import { Check } from "lucide-react";

export default function StepBatchSelect({
  selectedBatch,
  onSelectBatch,
  selectedSections = [],
  onToggleSection,
  error,
}) {
  const hasNoSection = selectedBatch === "Junior Sharia/Dars" || selectedBatch === "Hifz";
  const isHS = Array.isArray(selectedSections) && selectedSections.includes("HS");
  const isBS = Array.isArray(selectedSections) && selectedSections.includes("BS");

  return (
    <div className="space-y-4">
      {/* Joined with Batch */}
      <div>
        <label
          htmlFor="batchSelect"
          className="block text-sm sm:text-base font-bold text-[#192200] mb-1.5"
        >
          Joined with Batch <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <select
            id="batchSelect"
            value={selectedBatch}
            onChange={(e) => onSelectBatch(e.target.value)}
            className={`form-select font-medium text-[#192200] ${
              error ? "form-input-error" : ""
            }`}
          >
            <option value="">Select Joined Batch</option>
            {BATCH_OPTIONS.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-xs font-medium text-red-500 mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Section Checkboxes: HS and BS */}
      {!hasNoSection && (
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#192200] mb-1.5">
            Section (HS / BS)
          </label>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* HS Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSection && onToggleSection("HS")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer select-none ${
              isHS
                ? "bg-[#719100] text-white border-[#719100] shadow-sm"
                : "bg-[#eef2dc] text-[#576b2d] border-[#719100]/20 hover:bg-[#e4eacb]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                isHS
                  ? "bg-white text-[#719100]"
                  : "bg-white border border-[#cbd8a7]"
              }`}
            >
              {isHS && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>HS</span>
          </button>

          {/* BS Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSection && onToggleSection("BS")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer select-none ${
              isBS
                ? "bg-[#719100] text-white border-[#719100] shadow-sm"
                : "bg-[#eef2dc] text-[#576b2d] border-[#719100]/20 hover:bg-[#e4eacb]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                isBS
                  ? "bg-white text-[#719100]"
                  : "bg-white border border-[#cbd8a7]"
              }`}
            >
              {isBS && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>BS</span>
          </button>

          {(isHS || isBS) && (
            <span className="text-xs text-[#556d00] font-bold bg-[#719100]/15 px-2.5 py-1 rounded-lg">
              Selected: {[isHS ? "HS" : null, isBS ? "BS" : null].filter(Boolean).join(" & ")}
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
