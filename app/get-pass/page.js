"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Printer,
  ArrowLeft,
  Phone,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function GetPassPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected Alumnus state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Verified Pass Data
  const [verifiedPass, setVerifiedPass] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const passRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Live search when typing name
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pass/search?name=${encodeURIComponent(searchTerm.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setHasSearched(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  // Generate QR Code when verified pass is set
  useEffect(() => {
    if (verifiedPass?.registrationId) {
      const qrPayload = verifiedPass.registrationId;
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0d1b2a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR gen error:", err));
    }
  }, [verifiedPass]);

  // Handle name selection from autocomplete
  const handleSelectName = (alumnus) => {
    setSelectedCandidate(alumnus);
    setVerifyError("");
    setMobileNumber("");
  };

  // Verify mobile number
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!mobileNumber.trim()) {
      setVerifyError("Please enter your registered mobile number.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/pass/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: selectedCandidate.registrationId,
          mobileNumber: mobileNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setVerifyError(data.error || "Verification failed. Please check the mobile number.");
      } else {
        setVerifiedPass(data.alumnus);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyError("Network error while verifying. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // Download pass as image
  const handleDownloadImage = async () => {
    if (!passRef.current) return;
    setIsDownloading(true);
    try {
      // Use toPng with options to ensure crisp render
      const dataUrl = await toPng(passRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `Pass_${verifiedPass.fullName.replace(/\s+/g, "_")}_${verifiedPass.registrationId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image:", err);
      alert("Could not generate image automatically. You can use the Print / Save PDF option.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!verifiedPass) return;
    const text = `🎉 Here is my LINKUP 2026 Pass!\n\n*${verifiedPass.fullName}*\nReg ID: *${verifiedPass.registrationId}*\nBatch: ${verifiedPass.batchYear || verifiedPass.joinedBatch}\nPlace: ${verifiedPass.place}\n\nDalailul Khairath Kakkidippuram - LINKUP 2026.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Print pass
  const handlePrint = () => {
    window.print();
  };

  // Reset to search again
  const handleReset = () => {
    setSelectedCandidate(null);
    setVerifiedPass(null);
    setMobileNumber("");
    setVerifyError("");
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ececea]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0d1b2a] via-[#101b2a] to-[#1b263b] text-white pt-7 pb-10 sm:pb-12 px-4 border-b border-[#415a77]/30">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#8ba1ca] hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registration</span>
          </Link>

          <div className="w-16 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 mb-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={170}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <p className="text-[#8ba1ca] text-xs font-semibold tracking-wide uppercase">
            Dalailul Khairath Kakkidippuram
          </p>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mt-0.5">
            LINKUP 2026 • Entry Pass Portal
          </h1>
          <p className="text-xs text-[#c8d1dc] mt-1 max-w-md">
            Retrieve your digital entry pass and personalized QR code for reporting at LINKUP 2026.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-4 sm:-mt-6 px-3 sm:px-6 mb-12 relative z-10">
        <div className="max-w-xl mx-auto">
          {/* STEP 1: Search Name */}
          {!selectedCandidate && !verifiedPass && (
            <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-black/[0.04]">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#f3f4f6] text-[#1b263b] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Search className="w-6 h-6 text-[#3875b6]" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#0d1b2a]">
                  Find Your Registration Pass
                </h2>
                <p className="text-xs text-[#415a77] mt-1">
                  Type your name below. The system searches registered alumni based on your typed spellings.
                </p>
              </div>

              {/* Name Input */}
              <div className="relative mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#415a77] mb-2">
                  Type Registered Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. Shaheer, Majid, Muhammed..."
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] text-sm sm:text-base font-medium focus:bg-white focus:border-[#3875b6] focus:ring-4 focus:ring-[#3875b6]/15 outline-none transition-all"
                    autoFocus
                  />
                  <Search className="w-5 h-5 text-[#778da9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 text-[#3875b6] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              {/* Search Autocomplete Suggestions */}
              {searchTerm.trim().length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#778da9] uppercase tracking-wider px-1">
                    <span>Matching Registered Alumni</span>
                    <span>{searchResults.length} found</span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-black/[0.05] max-h-80 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#f9f9f8]">
                      {searchResults.map((alumnus) => (
                        <button
                          key={alumnus.registrationId}
                          type="button"
                          onClick={() => handleSelectName(alumnus)}
                          className="w-full text-left p-3.5 hover:bg-white hover:shadow-sm transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#e3e8ee] text-[#1b263b] flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-[#1b263b] group-hover:text-white transition-colors">
                              {alumnus.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#0d1b2a] truncate group-hover:text-[#3875b6] transition-colors">
                                {alumnus.fullName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#778da9] mt-0.5">
                                <span className="font-semibold text-[#415a77]">
                                  {alumnus.batchYear} {alumnus.joinedSection ? `(${alumnus.joinedSection})` : ""}
                                </span>
                                {alumnus.place && (
                                  <>
                                    <span>•</span>
                                    <span>{alumnus.place}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-xs font-bold text-[#3875b6] bg-white border border-[#3875b6]/30 group-hover:bg-[#3875b6] group-hover:text-white px-3 py-1 rounded-xl transition-all">
                            Select ➔
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    hasSearched && (
                      <div className="text-center py-8 px-4 bg-[#f9f9f8] rounded-2xl border border-dashed border-[#c8d1dc]">
                        <p className="text-xs font-bold text-[#415a77]">
                          No registered alumni found matching &ldquo;{searchTerm}&rdquo;
                        </p>
                        <p className="text-[11px] text-[#778da9] mt-1">
                          Check your spelling or{" "}
                          <Link href="/" className="text-[#3875b6] font-semibold underline">
                            register as a new member
                          </Link>
                          .
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Help tip */}
              {!searchTerm && (
                <div className="mt-6 p-4 rounded-2xl bg-[#f3f4f6] text-xs text-[#415a77] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Tip: Start typing your first name or surname. Once your name appears in the list, click it and enter your mobile number to retrieve your pass with the QR code.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mobile Number Verification */}
          {selectedCandidate && !verifiedPass && (
            <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-black/[0.04]">
              {/* Selected Candidate Banner */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1b263b] text-white flex items-center justify-center font-extrabold text-base">
                    {selectedCandidate.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#778da9]">
                      Selected Alumnus
                    </span>
                    <h3 className="text-base font-black text-[#0d1b2a]">
                      {selectedCandidate.fullName}
                    </h3>
                    <p className="text-xs text-[#415a77]">
                      {selectedCandidate.batchYear} • {selectedCandidate.place}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-xs font-bold text-[#3875b6] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Phone Prompt */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#415a77] mb-1.5">
                    Enter Registered Mobile Number
                  </label>
                  <p className="text-xs text-[#778da9] mb-2.5">
                    For your privacy and security, enter the phone number you used during registration to view your pass.
                  </p>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        setVerifyError("");
                      }}
                      placeholder="e.g. 9633050025 or +91..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] text-sm sm:text-base font-mono font-medium focus:bg-white focus:border-[#3875b6] focus:ring-4 focus:ring-[#3875b6]/15 outline-none transition-all"
                      autoFocus
                    />
                    <Phone className="w-5 h-5 text-[#778da9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {verifyError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#1b263b] to-[#0d1b2a] hover:from-[#0d1b2a] hover:to-[#1b263b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifyLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Verify & Generate Pass</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="py-3.5 px-4 rounded-xl bg-[#f3f4f6] hover:bg-[#e3e8ee] text-[#415a77] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Official Pass Display */}
          {verifiedPass && (
            <div className="space-y-4">
              {/* Top Bar with actions */}
              <div className="flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3875b6] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Search Another Pass</span>
                </button>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Identity Verified
                </span>
              </div>

              {/* The Actual Pass Card to be downloaded / printed */}
              <div
                ref={passRef}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/[0.08]"
                id="alumni-pass-card"
              >
                {/* Header Ribbon */}
                <div className="bg-gradient-to-br from-[#0d1b2a] via-[#101b2a] to-[#1b263b] text-white p-6 relative text-center">
                  <div className="w-20 h-24 rounded-2xl bg-white mx-auto flex items-center justify-center p-2 shadow-xl mb-3">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <p className="text-[#8ba1ca] text-[11px] font-bold uppercase tracking-wider">
                    Dalailul Khairath Kakkidippuram
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mt-0.5">
                    LINKUP 2026
                  </h2>
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#e0e1dd]">
                    <span>Alumni Meet Official Pass</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">02 October 2026</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-5 bg-white">
                  {/* Name and Reg ID */}
                  <div className="text-center pb-4 border-b border-black/[0.06]">
                    <span className="text-[10px] font-black tracking-widest text-[#778da9] uppercase">
                      Alumnus Name
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#0d1b2a] uppercase tracking-tight mt-0.5">
                      {verifiedPass.fullName}
                    </h3>

                    <div className="mt-2.5 inline-flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-[#0d1b2a] text-amber-400 font-mono font-black text-sm tracking-wider shadow-sm">
                        {verifiedPass.registrationId}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-[#e3e8ee] text-[#1b263b] font-bold text-xs">
                        {verifiedPass.batchYear || verifiedPass.joinedBatch} {verifiedPass.joinedSection ? `(${verifiedPass.joinedSection})` : ""}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="bg-[#f9f9f8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-5 border border-black/[0.05]">
                    <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-md border border-black/[0.06] flex items-center justify-center shrink-0">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Entry Pass QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-[#778da9]">Generating QR...</div>
                      )}
                    </div>

                    <div className="text-center sm:text-left space-y-1.5">
                      <span className="text-[10px] font-extrabold text-[#778da9] uppercase tracking-wider">
                        Alumni Reporting QR Code
                      </span>
                      <h4 className="text-sm font-black text-[#0d1b2a]">
                        Scan at Meet Reception
                      </h4>
                      <p className="text-xs text-[#415a77] leading-relaxed max-w-xs">
                        Show this QR code at the registration reception on October 02, 2026, to mark your attendance instantly.
                      </p>

                      <div className="pt-1">
                        {verifiedPass.isReported ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reported Present ({verifiedPass.reportedAt || "Verified"})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                            <span>⏱️</span>
                            Pending Check-in at Event
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Meta Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#f3f4f6] p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold text-[#778da9] uppercase">Place</span>
                      <p className="font-bold text-[#0d1b2a]">{verifiedPass.place || "—"}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#778da9] uppercase">Hifz Status</span>
                      <p className="font-bold text-[#0d1b2a]">{verifiedPass.hifzStatus || "—"}</p>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-black/[0.05]">
                      <span className="text-[10px] font-bold text-[#778da9] uppercase">Current Status</span>
                      <p className="font-bold text-[#0d1b2a]">
                        {verifiedPass.currentStatus}: {verifiedPass.jobDesignation || verifiedPass.institutionName || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer of Pass */}
                <div className="bg-[#f9f9f8] px-6 py-3 border-t border-black/[0.05] text-center text-[10px] text-[#778da9] font-medium">
                  Official Entry Pass issued by Dalailul Khairath Kakkidippuram Alumni Committee
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {/* Download Pass as Image */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#1b263b] via-[#0d1b2a] to-[#1b263b] hover:from-[#0d1b2a] hover:to-[#0d1b2a] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="w-5 h-5 text-amber-400" />
                  <span>{isDownloading ? "Generating Image..." : "Download Pass as Image (PNG)"}</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-3 px-4 rounded-xl bg-[#e3e8ee] hover:bg-[#c8d1dc] text-[#0d1b2a] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
