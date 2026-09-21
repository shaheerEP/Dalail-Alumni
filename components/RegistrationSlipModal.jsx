"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Copy, Check, X, QrCode } from "lucide-react";

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141b00]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#719100]/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-b from-[#141b00] via-[#202b00] to-[#2d3a00] text-white p-6 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#d8ec78] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-24 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3 p-2 shadow-lg border border-[#719100]/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#fff000]">
            <CheckCircle2 className="w-4 h-4 text-[#fff000]" />
            Registration Successful!
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-wider text-white mt-1">
            LINKUP 2026
          </h3>
          <p className="text-xs text-[#d8ec78]">Dalailul Khairath Kakkidippuram • Alumni Meet Pass</p>
        </div>

        {/* Pass Details Body */}
        <div className="p-6 space-y-5">
          {/* Reg ID Banner */}
          <div className="bg-[#eef2dc] rounded-2xl p-4 flex items-center justify-between border border-[#719100]/15">
            <div>
              <span className="text-[11px] font-bold text-[#576b2d] uppercase tracking-wider">
                Registration Number
              </span>
              <div className="text-xl font-black text-[#192200] font-mono tracking-wide">
                {data.registrationId}
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border-0 ${
                isAttending
                  ? "bg-[#719100] text-white shadow-sm"
                  : "bg-[#e2ecc6] text-[#2d3a00]"
              }`}
            >
              {isAttending ? "Confirmed Attendee" : "Registered"}
            </div>
          </div>

          {/* Student Info Card */}
          <div className="space-y-2.5 text-xs text-[#455523] bg-[#eef2dc] rounded-2xl p-4 border border-[#719100]/15">
            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Full Name:</span>
              <span className="font-bold text-[#192200] uppercase">{data.fullName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Joined with Batch:</span>
              <span className="font-bold text-[#719100]">
                {data.batchYear} {data.joinedSection ? `(${data.joinedSection})` : ""}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Place:</span>
              <span className="font-semibold text-[#192200]">{data.place}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Mobile Number:</span>
              <span className="font-mono text-[#192200]">{data.mobileNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Hifz Status:</span>
              <span className="font-medium text-[#192200]">{data.hifzStatus}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#719100]/10">
              <span className="font-semibold text-[#576b2d]">Current Status:</span>
              <span className="font-medium text-[#192200]">{data.currentStatus}: {data.jobDesignation}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="font-semibold text-[#576b2d]">Timestamp:</span>
              <span className="text-[#6e8242]">{data.timestamp}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Get Pass Button */}
            <Link
              href="/get-pass"
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#fff000] to-[#fed700] hover:from-[#fff542] hover:to-[#ffe033] text-[#192200] font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01]"
            >
              <QrCode className="w-4 h-4 text-[#192200]" />
              <span>Get Pass & QR Code</span>
            </Link>

            {/* Copy Registration Link */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-5 rounded-xl bg-[#719100] hover:bg-[#5d7700] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
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
              className="text-xs font-bold text-[#719100] hover:underline cursor-pointer"
            >
              + Register Another Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
