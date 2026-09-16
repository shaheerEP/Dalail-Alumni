import { CheckCircle2, XCircle } from "lucide-react";

export default function AttendanceSection({ willAttend, onSelectAttendance }) {
  const isYes = willAttend === "Yes, I will attend";
  const isNo = willAttend === "No, I will not attend";

  const eventTitle = process.env.NEXT_PUBLIC_EVENT_TITLE || "THE GRAND ALUMNI SUMMIT";

  return (
    <div className="space-y-3 pt-4 border-t border-[#e0e1dd]">
      <div>
        <label className="block text-sm sm:text-base font-bold text-[#0d1b2a]">
          STEP 5: WILL YOU ATTEND {eventTitle}? <span className="text-red-500">*</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Yes Card */}
        <div
          onClick={() => onSelectAttendance("Yes, I will attend")}
          className={`radio-card p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all select-none ${
            isYes
              ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
              : "border-[#c8d1dc] bg-white hover:border-[#778da9] hover:bg-[#f2f3f1]"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isYes ? "bg-emerald-100 text-emerald-700" : "bg-[#f2f3f1] text-[#778da9]"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-[#0d1b2a]">
              Yes, I will attend
            </div>
            <div className="text-xs text-[#415a77] mt-0.5">
              I will participate in the Summit
            </div>
          </div>
        </div>

        {/* No Card */}
        <div
          onClick={() => onSelectAttendance("No, I will not attend")}
          className={`radio-card p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all select-none ${
            isNo
              ? "border-[#415a77] bg-[#e3e8ee] shadow-sm"
              : "border-[#c8d1dc] bg-white hover:border-[#778da9] hover:bg-[#f2f3f1]"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isNo ? "bg-[#c8d1dc] text-[#1b263b]" : "bg-[#f2f3f1] text-[#778da9]"
            }`}
          >
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-[#0d1b2a]">
              No, I will not attend
            </div>
            <div className="text-xs text-[#415a77] mt-0.5">
              Unable to attend this event
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
