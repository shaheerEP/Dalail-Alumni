import { BATCH_OPTIONS } from "@/data/options";
import { Check } from "lucide-react";

export default function StepBatchSelect({
  selectedBatch,
  onSelectBatch,
  selectedSections = [],
  onToggleSection,
  error,
}) {
  const isHS = Array.isArray(selectedSections) && selectedSections.includes("HS");
  const isBS = Array.isArray(selectedSections) && selectedSections.includes("BS");

  return (
    <div className="space-y-4">
      {/* Joined with Batch */}
      <div>
        <label
          htmlFor="batchSelect"
          className="block text-sm sm:text-base font-bold text-[#0d1b2a] mb-1.5"
        >
          Joined with Batch <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <select
            id="batchSelect"
            value={selectedBatch}
            onChange={(e) => onSelectBatch(e.target.value)}
            className={`form-select font-medium text-[#1b263b] ${
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
      <div>
        <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1.5">
          Section (HS / BS)
        </label>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* HS Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSection && onToggleSection("HS")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all cursor-pointer select-none ${
              isHS
                ? "bg-[#1b263b] text-white border-[#1b263b] shadow-sm"
                : "bg-[#f3f4f6] text-[#415a77] border-black/[0.06] hover:bg-[#eaecee]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                isHS
                  ? "bg-white text-[#1b263b]"
                  : "bg-white border border-[#c8d1dc]"
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
                ? "bg-[#1b263b] text-white border-[#1b263b] shadow-sm"
                : "bg-[#f3f4f6] text-[#415a77] border-black/[0.06] hover:bg-[#eaecee]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                isBS
                  ? "bg-white text-[#1b263b]"
                  : "bg-white border border-[#c8d1dc]"
              }`}
            >
              {isBS && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>BS</span>
          </button>

          {(isHS || isBS) && (
            <span className="text-xs text-[#3875b6] font-semibold bg-[#3875b6]/10 px-2.5 py-1 rounded-lg">
              Selected: {[isHS ? "HS" : null, isBS ? "BS" : null].filter(Boolean).join(" & ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
