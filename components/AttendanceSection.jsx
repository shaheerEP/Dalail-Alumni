import { CheckCircle2, XCircle } from "lucide-react";

export default function AttendanceSection({ willAttend, onSelectAttendance }) {
  const isYes = willAttend === "Yes, I will attend";
  const isNo = willAttend === "No, I will not attend";

  return (
    <div className="space-y-3 pt-4 border-t border-black/[0.05]">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          Will you attend? <span className="text-red-500">*</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Yes Card */}
        <div
          onClick={() => onSelectAttendance("Yes, I will attend")}
          className={`radio-card p-3.5 rounded-2xl border-0 flex items-center gap-3 transition-all select-none ${
            isYes
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-[#f3f4f6] text-[#415a77] hover:bg-[#eaecee]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isYes ? "bg-white/20 text-white" : "bg-white text-[#778da9]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className={`text-sm font-bold ${isYes ? "text-white" : "text-[#0d1b2a]"}`}>
            Yes, I will attend
          </div>
        </div>

        {/* No Card */}
        <div
          onClick={() => onSelectAttendance("No, I will not attend")}
          className={`radio-card p-3.5 rounded-2xl border-0 flex items-center gap-3 transition-all select-none ${
            isNo
              ? "bg-[#1b263b] text-white shadow-md shadow-[#1b263b]/20"
              : "bg-[#f3f4f6] text-[#415a77] hover:bg-[#eaecee]"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isNo ? "bg-white/20 text-white" : "bg-white text-[#778da9]"
            }`}
          >
            <XCircle className="w-4 h-4" />
          </div>
          <div className={`text-sm font-bold ${isNo ? "text-white" : "text-[#0d1b2a]"}`}>
            No, I will not attend
          </div>
        </div>
      </div>
    </div>
  );
}
