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
  ArrowLeft,
  Phone,
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
  const [passCardImage, setPassCardImage] = useState("");
  const [isGeneratingPass, setIsGeneratingPass] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const passRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Generate composite pass image with QR and Registration ID on the template PNG
  const generateTicketPass = async (alumnus) => {
    if (!alumnus) return;
    setIsGeneratingPass(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 578;
      const ctx = canvas.getContext("2d");

      // 1. Load base template image
      const template = new window.Image();
      template.crossOrigin = "anonymous";
      template.src = "/pass-template.png";
      await new Promise((resolve, reject) => {
        template.onload = resolve;
        template.onerror = reject;
      });
      ctx.drawImage(template, 0, 0, 1024, 578);

      // 2. Generate QR code image
      const qrData = await QRCode.toDataURL(alumnus.registrationId, {
        width: 360,
        margin: 1,
        color: {
          dark: "#1c2b00",
          light: "#ffffff",
        },
      });
      const qrImg = new window.Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.src = qrData;
      });

      // Center of right side is x ≈ 778
      const centerX = 778;

      // 3. Draw Alumnus Name
      ctx.fillStyle = "#1e2c00";
      let fontSize = 23;
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let displayName = (alumnus.fullName || "").toUpperCase();
      while (ctx.measureText(displayName).width > 340 && fontSize > 13) {
        fontSize -= 1.5;
        ctx.font = `bold ${fontSize}px Georgia, serif`;
      }
      ctx.fillText(displayName, centerX, 106);

      // 4. Draw Batch Tag
      ctx.fillStyle = "#557300";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      const batchText = (alumnus.batchYear || alumnus.joinedBatch || "").trim();
      if (batchText) {
        ctx.fillText(batchText, centerX, 131);
      }

      // 5. Draw QR Code with subtle white rounded container
      const qrSize = 165;
      const qrX = centerX - qrSize / 2;
      const qrY = 154;

      // Background rounded card for QR
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 14);
      } else {
        ctx.rect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      }
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Draw Registration ID Badge
      const regId = alumnus.registrationId;
      ctx.font = "bold 15px monospace";
      const textWidth = ctx.measureText(regId).width;
      const badgeW = Math.max(textWidth + 28, 175);
      const badgeH = 32;
      const badgeX = centerX - badgeW / 2;
      const badgeY = qrY + qrSize + 16;

      // Badge pill background
      ctx.fillStyle = "#5c7c00";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      // Badge text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px monospace";
      ctx.fillText(regId, centerX, badgeY + badgeH / 2 + 1);

      const dataUrl = canvas.toDataURL("image/png");
      setPassCardImage(dataUrl);
      return dataUrl;
    } catch (e) {
      console.error("Error generating pass canvas:", e);
      return null;
    } finally {
      setIsGeneratingPass(false);
    }
  };

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

  // Generate composite pass when verified pass is set
  useEffect(() => {
    if (verifiedPass?.registrationId) {
      generateTicketPass(verifiedPass);

      const qrPayload = verifiedPass.registrationId;
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#1c2b00",
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
    if (!verifiedPass) return;
    setIsDownloading(true);
    try {
      let finalDataUrl = passCardImage;
      if (!finalDataUrl) {
        finalDataUrl = await generateTicketPass(verifiedPass);
      }

      if (finalDataUrl) {
        const link = document.createElement("a");
        link.download = `LINKUP_Pass_${verifiedPass.fullName.replace(/\s+/g, "_")}_${verifiedPass.registrationId}.png`;
        link.href = finalDataUrl;
        link.click();
      } else if (passRef.current) {
        const dataUrl = await toPng(passRef.current, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#f7faeb",
        });
        const link = document.createElement("a");
        link.download = `LINKUP_Pass_${verifiedPass.fullName.replace(/\s+/g, "_")}_${verifiedPass.registrationId}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to download image:", err);
      alert("Could not generate image automatically. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Reset to search again
  const handleReset = () => {
    setSelectedCandidate(null);
    setVerifiedPass(null);
    setPassCardImage("");
    setMobileNumber("");
    setVerifyError("");
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ececea]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0d1b2a] via-[#101b2a] to-[#1b263b] text-white pt-8 pb-10 sm:pb-12 px-4 border-b border-[#415a77]/30">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
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

                {/* Back to Registration at exact bottom of the name input field */}
                <div className="mt-2.5 flex items-center justify-between">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3875b6] hover:text-[#0d1b2a] hover:underline transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Registration</span>
                  </Link>
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
                                  {alumnus.batchYear}
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

              {/* The Official Ticket Pass Card using the PNG template */}
              <div
                ref={passRef}
                className="relative w-full aspect-[1024/578] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[#f7faeb] select-none border border-black/[0.08]"
                id="alumni-pass-card"
              >
                {passCardImage ? (
                  <img
                    src={passCardImage}
                    alt={`LINKUP 2026 Pass for ${verifiedPass.fullName}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  /* Dynamic CSS overlay while canvas renders */
                  <div className="relative w-full h-full">
                    <img
                      src="/pass-template.png"
                      alt="LINKUP Official Pass"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Right side dynamic overlay */}
                    <div
                      className="absolute top-0 right-0 h-full flex flex-col items-center justify-between"
                      style={{ width: "42%", padding: "7.5% 3% 16.5% 3%" }}
                    >
                      <div className="text-center">
                        <h3 className="font-serif font-black text-xs sm:text-base md:text-lg text-[#1e2c00] uppercase truncate max-w-[170px] sm:max-w-[260px]">
                          {verifiedPass.fullName}
                        </h3>
                        <p className="text-[9px] sm:text-xs font-bold text-[#557300]">
                          {verifiedPass.batchYear || verifiedPass.joinedBatch}
                        </p>
                      </div>

                      <div className="p-1 sm:p-2 bg-white rounded-xl shadow-md">
                        {qrDataUrl && (
                          <img
                            src={qrDataUrl}
                            alt="QR Code"
                            className="w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain"
                          />
                        )}
                      </div>

                      <div className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-md bg-[#5c7c00] text-white font-mono font-bold text-[9px] sm:text-xs shadow-sm">
                        {verifiedPass.registrationId}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendee Details & Event Reporting Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#778da9] uppercase tracking-wider">
                    Attendee
                  </span>
                  <h4 className="text-base font-black text-[#0d1b2a] uppercase">
                    {verifiedPass.fullName}
                  </h4>
                  <p className="text-xs text-[#415a77]">
                    {verifiedPass.batchYear || verifiedPass.joinedBatch}{verifiedPass.place ? ` • ${verifiedPass.place}` : ""}
                  </p>
                </div>

                <div>
                  {verifiedPass.isReported ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reported Present ({verifiedPass.reportedAt || "Verified"})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl">
                      <span>⏱️</span>
                      <span>Pending Check-in at Event</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                {/* Download Pass as Image */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloading || isGeneratingPass}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#5c7c00] via-[#486300] to-[#5c7c00] hover:from-[#486300] hover:to-[#384e00] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>{isDownloading ? "Preparing Image..." : "Download Official Pass (PNG)"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
