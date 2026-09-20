"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Copy, Check, X } from "lucide-react";

export default function RegistrationSlipModal({ isOpen, onClose, data, onResetForm }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error("Confetti trigger error", e);
      }
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handleCopyLink = () => {
    const formUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAttending = data.willAttend?.toLowerCase().includes("yes");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0d1b2a]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-b from-[#0d1b2a] to-[#1b263b] text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#778da9] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-24 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3 p-2 shadow-lg border-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#8ba1ca]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Registration Successful!
          </div>

          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-1">
            LINKUP 2026
          </h3>
          <p className="text-xs text-[#c8d1dc]">Dalailul Khairath Kakkidippuram • Alumni Meet Pass</p>
        </div>

        {/* Pass Details Body */}
        <div className="p-6 space-y-5">
          {/* Reg ID Banner */}
          <div className="bg-[#f3f4f6] rounded-2xl p-4 flex items-center justify-between border-0">
            <div>
              <span className="text-[11px] font-bold text-[#415a77] uppercase tracking-wider">
                Registration Number
              </span>
              <div className="text-xl font-black text-[#0d1b2a] font-mono tracking-wide">
                {data.registrationId}
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase border-0 ${
                isAttending
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-[#e3e8ee] text-[#1b263b]"
              }`}
            >
              {isAttending ? "Confirmed Attendee" : "Registered"}
            </div>
          </div>

          {/* Student Info Card */}
          <div className="space-y-2.5 text-xs text-[#415a77] bg-[#f3f4f6] rounded-2xl p-4 border-0">
            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Full Name:</span>
              <span className="font-bold text-[#0d1b2a] uppercase">{data.fullName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Joined with Batch:</span>
              <span className="font-bold text-[#3875b6]">
                {data.batchYear} {data.joinedSection ? `(${data.joinedSection})` : ""}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Place:</span>
              <span className="font-semibold text-[#0d1b2a]">{data.place}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Mobile Number:</span>
              <span className="font-mono text-[#0d1b2a]">{data.mobileNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Hifz Status:</span>
              <span className="font-medium text-[#0d1b2a]">{data.hifzStatus}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-black/[0.05]">
              <span className="font-semibold text-[#415a77]">Current Status:</span>
              <span className="font-medium text-[#0d1b2a]">{data.currentStatus}: {data.jobDesignation}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="font-semibold text-[#415a77]">Timestamp:</span>
              <span className="text-[#778da9]">{data.timestamp}</span>
            </div>
          </div>

          {/* Action Button: Copy Registration Link */}
          <div className="pt-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1b263b] hover:bg-[#0d1b2a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Registration Link</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={() => {
                onClose();
                onResetForm();
              }}
              className="text-xs font-semibold text-[#3875b6] hover:underline cursor-pointer"
            >
              + Register Another Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
