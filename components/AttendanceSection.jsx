import { CheckCircle2, XCircle } from "lucide-react";

export default function AttendanceSection({ willAttend, onSelectAttendance }) {
  const isYes = willAttend === "Yes, I will attend";
  const isNo = willAttend === "No, I will not attend";

  return (
    <div className="space-y-3 pt-4 border-t border-[#e0e1dd]">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          Will you attend? <span className="text-red-500">*</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Yes Card */}
        <div
          onClick={() => onSelectAttendance("Yes, I will attend")}
          className={`radio-card p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all select-none ${
            isYes
              ? "border-emerald-600 bg-emerald-50/70 shadow-xs"
              : "border-[#c8d1dc] bg-white hover:border-[#778da9] hover:bg-[#f2f3f1]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isYes ? "bg-emerald-100 text-emerald-700" : "bg-[#f2f3f1] text-[#778da9]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-[#0d1b2a]">
            Yes, I will attend
          </div>
        </div>

        {/* No Card */}
        <div
          onClick={() => onSelectAttendance("No, I will not attend")}
          className={`radio-card p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all select-none ${
            isNo
              ? "border-[#415a77] bg-[#e3e8ee] shadow-xs"
              : "border-[#c8d1dc] bg-white hover:border-[#778da9] hover:bg-[#f2f3f1]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isNo ? "bg-[#c8d1dc] text-[#1b263b]" : "bg-[#f2f3f1] text-[#778da9]"
            }`}
          >
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-[#0d1b2a]">
            No, I will not attend
          </div>
        </div>
      </div>
    </div>
  );
}
