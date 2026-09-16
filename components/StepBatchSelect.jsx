import { BATCH_OPTIONS } from "@/data/options";

export default function StepBatchSelect({ selectedBatch, onSelectBatch, error }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="batchSelect"
        className="block text-sm sm:text-base font-bold text-[#0d1b2a]"
      >
        Batch <span className="text-red-500">*</span>
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
          <option value="">Select Batch</option>
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
  );
}
