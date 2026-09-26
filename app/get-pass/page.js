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
  Pencil,
  X,
  Check,
} from "lucide-react";
import { BATCH_OPTIONS } from "@/data/options";
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

  // Edit Details Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [qualOptions, setQualOptions] = useState({ islamic: [], academic: [] });

  const passRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Generate composite pass image with QR and Registration ID on the template PNG
  const generateTicketPass = async (alumnus) => {
    if (!alumnus) return;
    setIsGeneratingPass(true);

    try {
      // Ultra High-Definition 4x scale for double clarity (4096 x 2312)
      const SCALE = 4;
      const baseW = 1024;
      const baseH = 578;

      const canvas = document.createElement("canvas");
      canvas.width = baseW * SCALE;
      canvas.height = baseH * SCALE;
      const ctx = canvas.getContext("2d");

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 1. Load base template image
      const template = new window.Image();
      template.crossOrigin = "anonymous";
      template.src = "/pass-template.png";
      await new Promise((resolve, reject) => {
        template.onload = resolve;
        template.onerror = reject;
      });
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      // 2. Generate ultra high-resolution QR code image (width: 1440px for razor-sharp modules)
      const qrData = await QRCode.toDataURL(alumnus.registrationId, {
        width: 1440,
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

      // Center of right side in scaled canvas: base is 778
      const centerX = 778 * SCALE;

      // 3. Draw Alumnus Name with crisp font rendering
      ctx.fillStyle = "#1e2c00";
      let baseFontSize = 23;
      let fontSize = baseFontSize * SCALE;
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let displayName = (alumnus.fullName || "").toUpperCase();
      const maxTextWidth = 340 * SCALE;
      while (ctx.measureText(displayName).width > maxTextWidth && fontSize > 13 * SCALE) {
        fontSize -= 1.5 * SCALE;
        ctx.font = `bold ${fontSize}px Georgia, serif`;
      }
      ctx.fillText(displayName, centerX, 106 * SCALE);

      // 4. Draw Batch Tag
      ctx.fillStyle = "#557300";
      ctx.font = `bold ${13.5 * SCALE}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const batchText = (alumnus.batchYear || alumnus.joinedBatch || "").trim();
      if (batchText) {
        ctx.fillText(batchText, centerX, 131 * SCALE);
      }

      // 5. Draw QR Code with subtle white rounded container
      const qrSize = 165 * SCALE;
      const qrX = centerX - qrSize / 2;
      const qrY = 154 * SCALE;
      const padding = 8 * SCALE;
      const cornerRadius = 14 * SCALE;

      // Background rounded card for QR
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 12 * SCALE;
      ctx.shadowOffsetY = 3 * SCALE;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2, cornerRadius);
      } else {
        ctx.rect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2);
      }
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Draw Registration ID Badge
      const regId = alumnus.registrationId;
      ctx.font = `bold ${15 * SCALE}px monospace`;
      const textWidth = ctx.measureText(regId).width;
      const badgeW = Math.max(textWidth + 28 * SCALE, 175 * SCALE);
      const badgeH = 33 * SCALE;
      const badgeX = centerX - badgeW / 2;
      const badgeY = qrY + qrSize + 16 * SCALE;

      // Badge pill background
      ctx.fillStyle = "#5c7c00";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8 * SCALE);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      // Badge text
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${15 * SCALE}px monospace`;
      ctx.fillText(regId, centerX, badgeY + badgeH / 2 + 1 * SCALE);

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

  // Auto-login if directed from registration success modal or via link params
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if sessionStorage has autoVerifiedPass
    try {
      const cached = sessionStorage.getItem("autoVerifiedPass");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.registrationId && parsed.fullName) {
          setVerifiedPass(parsed);
          if (parsed.mobileNumber) {
            setMobileNumber(parsed.mobileNumber);
          }
          return;
        }
      }
    } catch (e) {
      console.error("Session pass read error:", e);
    }

    // 2. Fallback: check URL parameters (?regId=...&mobile=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const regId = urlParams.get("regId");
      const mobile = urlParams.get("mobile");

      if (regId && mobile) {
        setVerifyLoading(true);
        fetch("/api/pass/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: regId, mobileNumber: mobile }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.alumnus) {
              setVerifiedPass(data.alumnus);
              setMobileNumber(mobile);
              try {
                sessionStorage.setItem("autoVerifiedPass", JSON.stringify(data.alumnus));
              } catch (e) {}
            }
          })
          .catch((err) => console.error("Auto verify error:", err))
          .finally(() => setVerifyLoading(false));
      }
    } catch (err) {
      console.error("URL params read error:", err);
    }
  }, []);

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
          quality: 1,
          pixelRatio: 4,
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
    setIsEditModalOpen(false);
    setEditSuccessMsg("");
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("autoVerifiedPass");
        window.history.replaceState({}, "", "/get-pass");
      } catch (e) {}
    }
  };

  // Load qualification options for edit modal suggestions
  useEffect(() => {
    async function loadQuals() {
      try {
        const res = await fetch("/api/qualifications");
        if (res.ok) {
          const data = await res.json();
          setQualOptions({
            islamic: data.islamic || [],
            academic: data.academic || [],
          });
        }
      } catch (e) {}
    }
    loadQuals();
  }, []);

  // Open Edit Modal with pre-filled details
  const handleOpenEditModal = () => {
    if (!verifiedPass) return;
    setEditFormData({
      fullName: verifiedPass.fullName || "",
      place: verifiedPass.place || "",
      mobileNumber: verifiedPass.mobileNumber || "",
      whatsappNumber: verifiedPass.whatsappNumber || verifiedPass.mobileNumber || "",
      batchYear: verifiedPass.batchYear || verifiedPass.joinedBatch || "Batch 1",
      joinedSection: verifiedPass.joinedSection || "HS",
      hifzStatus: verifiedPass.hifzStatus || "Not Hafiz",
      islamicQualification: verifiedPass.islamicQualification || "",
      academicQualification: verifiedPass.academicQualification || "",
      currentStatus: verifiedPass.currentStatus || "Job",
      jobDesignation: verifiedPass.jobDesignation || "",
      institutionName: verifiedPass.institutionName || "",
      workLocation: verifiedPass.workLocation || "",
      willAttend: verifiedPass.willAttend || "Yes, I will attend",
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  // Submit Updated Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.fullName?.trim()) {
      setEditErrors({ fullName: "Full name is required." });
      return;
    }
    if (!editFormData.place?.trim()) {
      setEditErrors({ place: "Place is required." });
      return;
    }

    setIsSavingEdit(true);
    setEditErrors({});

    try {
      const res = await fetch("/api/pass/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: verifiedPass.registrationId,
          originalMobile: mobileNumber,
          ...editFormData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedPass(data.alumnus);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("autoVerifiedPass", JSON.stringify(data.alumnus));
          } catch (e) {}
        }
        if (data.alumnus.mobileNumber) {
          setMobileNumber(data.alumnus.mobileNumber);
        }
        setIsEditModalOpen(false);
        // Re-generate pass canvas image with updated details
        generateTicketPass(data.alumnus);
        setEditSuccessMsg("Registration details updated successfully!");
        setTimeout(() => setEditSuccessMsg(""), 4500);
      } else {
        setEditErrors({ submit: data.error || "Failed to update details. Please try again." });
      }
    } catch (err) {
      console.error("Save edit error:", err);
      setEditErrors({ submit: "Connection error. Please try again." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7eb]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#141b00] via-[#202b00] to-[#2d3a00] text-white pt-8 pb-10 sm:pb-12 px-4 border-b border-[#719100]/30">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          <div className="w-16 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 mb-2 border border-[#719100]/20">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={170}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <p className="text-[#d8ec78] text-xs font-semibold tracking-wide uppercase">
            Dalailul Khairath Kakkidippuram
          </p>
          <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white uppercase mt-0.5">
            LINKUP 2026 • Entry Pass Portal
          </h1>
          <p className="text-xs text-[#d8ec78]/80 mt-1 max-w-md">
            Retrieve your digital entry pass and personalized QR code for reporting at LINKUP 2026.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${verifiedPass ? "mt-4 sm:mt-6" : "mt-4 sm:-mt-6"} px-3 sm:px-6 mb-12 relative z-10`}>
        <div className="max-w-xl mx-auto">
          {/* STEP 0: Loading pass automatically */}
          {!selectedCandidate && !verifiedPass && verifyLoading && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#719100]/15 text-center my-6">
              <RefreshCw className="w-8 h-8 text-[#719100] animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#192200]">Loading your entry pass...</p>
            </div>
          )}

          {/* STEP 1: Search Name */}
          {!selectedCandidate && !verifiedPass && !verifyLoading && (
            <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-[#719100]/15">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#eef2dc] text-[#719100] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Search className="w-6 h-6 text-[#719100]" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#192200]">
                  Find Your Registration Pass
                </h2>
                <p className="text-xs text-[#576b2d] mt-1">
                  Type your name below. The system searches registered alumni based on your typed spellings.
                </p>
              </div>

              {/* Name Input */}
              <div className="relative mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#576b2d] mb-2">
                  Type Registered Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. Shaheer, Majid, Muhammed..."
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#eef2dc] border border-[#719100]/15 text-[#192200] text-sm sm:text-base font-medium focus:bg-white focus:border-[#719100] focus:ring-4 focus:ring-[#719100]/15 outline-none transition-all"
                    autoFocus
                  />
                  <Search className="w-5 h-5 text-[#6e8242] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 text-[#719100] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Back to Registration at exact bottom of the name input field */}
                <div className="mt-2.5 flex items-center justify-between">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#719100] hover:text-[#4d6300] hover:underline transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Registration</span>
                  </Link>
                </div>
              </div>

              {/* Search Autocomplete Suggestions */}
              {searchTerm.trim().length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#6e8242] uppercase tracking-wider px-1">
                    <span>Matching Registered Alumni</span>
                    <span>{searchResults.length} found</span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-[#719100]/10 max-h-80 overflow-y-auto rounded-2xl border border-[#719100]/15 bg-[#f9fbf2]">
                      {searchResults.map((alumnus) => (
                        <button
                          key={alumnus.registrationId}
                          type="button"
                          onClick={() => handleSelectName(alumnus)}
                          className="w-full text-left p-3.5 hover:bg-[#eef2dc] hover:shadow-sm transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#719100] text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-[#2d3a00] transition-colors">
                              {alumnus.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-[#192200] truncate group-hover:text-[#719100] transition-colors">
                                {alumnus.fullName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#576b2d] mt-0.5">
                                <span className="font-semibold text-[#719100]">
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

                          <div className="shrink-0 text-xs font-bold text-[#719100] bg-white border border-[#719100]/30 group-hover:bg-[#719100] group-hover:text-white px-3 py-1 rounded-xl transition-all">
                            Select ➔
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    hasSearched && (
                      <div className="text-center py-8 px-4 bg-[#f9fbf2] rounded-2xl border border-dashed border-[#719100]/30">
                        <p className="text-xs font-bold text-[#576b2d]">
                          No registered alumni found matching &ldquo;{searchTerm}&rdquo;
                        </p>
                        <p className="text-[11px] text-[#6e8242] mt-1">
                          Check your spelling or{" "}
                          <Link href="/" className="text-[#719100] font-bold underline">
                            register as a new member
                          </Link>
                          .
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mobile Number Verification */}
          {selectedCandidate && !verifiedPass && (
            <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-[#719100]/15">
              {/* Selected Candidate Banner */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#719100]/15">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#2d3a00] text-white flex items-center justify-center font-extrabold text-base">
                    {selectedCandidate.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e8242]">
                      Selected Alumnus
                    </span>
                    <h3 className="text-base font-black text-[#192200]">
                      {selectedCandidate.fullName}
                    </h3>
                    <p className="text-xs text-[#576b2d]">
                      {selectedCandidate.batchYear} • {selectedCandidate.place}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-xs font-bold text-[#719100] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Phone Prompt */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#576b2d] mb-1.5">
                    Enter Registered Mobile Number
                  </label>
                  <p className="text-xs text-[#6e8242] mb-2.5">
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
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#eef2dc] border border-[#719100]/15 text-[#192200] text-sm sm:text-base font-mono font-medium focus:bg-white focus:border-[#719100] focus:ring-4 focus:ring-[#719100]/15 outline-none transition-all"
                      autoFocus
                    />
                    <Phone className="w-5 h-5 text-[#6e8242] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#719100] via-[#5d7700] to-[#719100] hover:from-[#5d7700] hover:to-[#4a6000] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifyLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#fff000]" />
                        <span>Verify & Generate Pass</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="py-3.5 px-4 rounded-xl bg-[#eef2dc] hover:bg-[#e4eacb] text-[#576b2d] font-bold text-xs transition-colors cursor-pointer"
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
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#576b2d] hover:text-[#192200] bg-white hover:bg-[#eef2dc] px-3.5 py-1.5 rounded-full border border-[#719100]/20 shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#719100]" />
                  <span>Search Another Pass</span>
                </button>

                <span className="text-[11px] font-bold text-[#192200] bg-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#719100]/30 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#719100]" />
                  <span>Identity Verified</span>
                </span>
              </div>

              {/* Success Notification */}
              {editSuccessMsg && (
                <div className="p-3 rounded-xl bg-[#eef2dc] border border-[#719100]/30 text-xs text-[#2d3a00] font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-[#719100] shrink-0" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

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
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#719100]/15 flex flex-col justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#6e8242] uppercase tracking-wider block mb-1">
                      Attendee
                    </span>
                    <h4 className="text-base font-black text-[#192200] uppercase truncate">
                      {verifiedPass.fullName}
                    </h4>
                    <p className="text-xs text-[#576b2d]">
                      {verifiedPass.batchYear || verifiedPass.joinedBatch}{verifiedPass.place ? ` • ${verifiedPass.place}` : ""}
                    </p>
                  </div>

                  <div>
                    {verifiedPass.isReported ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2d3a00] bg-[#719100]/20 px-3 py-1.5 rounded-xl border border-[#719100]/30">
                        <CheckCircle2 className="w-4 h-4 text-[#719100]" />
                        <span>Reported Present ({verifiedPass.reportedAt || "Verified"})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200">
                        <span>⏱️</span>
                        <span>Pending Check-in at Event</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Bottom Part: Edit Details Link */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#719100] hover:text-[#556e00] hover:underline transition-colors cursor-pointer"
                    title="Edit Added Details"
                  >
                    <Pencil className="w-3 h-3 text-[#719100]" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                {/* Download Pass as Image */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloading || isGeneratingPass}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#719100] via-[#5d7700] to-[#719100] hover:from-[#5d7700] hover:to-[#4a6000] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-[#fff000]" />
                  <span>{isDownloading ? "Preparing Image..." : "Download Official Pass (PNG)"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ----------------------------------------------------
          MODAL: Edit Added Details
      ---------------------------------------------------- */}
      {isEditModalOpen && verifiedPass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#719100]/25 animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#141b00] via-[#202b00] to-[#2d3a00] text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fff000]">
                  Alumnus Registration Record
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2 mt-0.5">
                  <Pencil className="w-4 h-4 text-[#fff000]" />
                  <span>Edit Registration Details</span>
                </h3>
                <span className="text-[11px] font-mono text-[#d8ec78] font-semibold">
                  {verifiedPass.registrationId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full text-[#d8ec78] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-4 sm:p-6 space-y-4 max-h-[68vh] overflow-y-auto text-xs">
                {editErrors.submit && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                    {editErrors.submit}
                  </div>
                )}

                {/* Full Name & Place */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.fullName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-bold text-[#192200] uppercase focus:bg-white focus:border-[#719100] outline-none"
                      required
                    />
                    {editErrors.fullName && (
                      <p className="text-[10px] text-red-600 mt-1">{editErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Place <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.place || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, place: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-bold text-[#192200] uppercase focus:bg-white focus:border-[#719100] outline-none"
                      required
                    />
                    {editErrors.place && (
                      <p className="text-[10px] text-red-600 mt-1">{editErrors.place}</p>
                    )}
                  </div>
                </div>

                {/* Batch & Section */}
                <div className={`grid gap-3 ${editFormData.batchYear === "Junior Sharia/Dars" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Joined with Batch
                    </label>
                    <select
                      value={editFormData.batchYear || ""}
                      onChange={(e) => {
                        const newBatch = e.target.value;
                        setEditFormData({
                          ...editFormData,
                          batchYear: newBatch,
                          ...(newBatch === "Junior Sharia/Dars" ? { joinedSection: "" } : {}),
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-bold text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    >
                      {BATCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editFormData.batchYear !== "Junior Sharia/Dars" && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                        Section (HS / BS)
                      </label>
                      <select
                        value={editFormData.joinedSection || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, joinedSection: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-bold text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                      >
                        <option value="HS">HS</option>
                        <option value="BS">BS</option>
                        <option value="Both (HS & BS)">Both (HS & BS)</option>
                        <option value="">None / Other</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Mobile & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.mobileNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-mono font-bold text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.whatsappNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-mono font-bold text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                  </div>
                </div>

                {/* Hifz Status */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1.5">
                    Hifz Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, hifzStatus: "Hafiz" })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        editFormData.hifzStatus === "Hafiz"
                          ? "bg-[#719100] text-white shadow-xs"
                          : "bg-[#eef2dc] text-[#576b2d] hover:bg-[#e4ebce]"
                      }`}
                    >
                      Hafiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, hifzStatus: "Not Hafiz" })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        editFormData.hifzStatus === "Not Hafiz"
                          ? "bg-[#2d3a00] text-white shadow-xs"
                          : "bg-[#eef2dc] text-[#576b2d] hover:bg-[#e4ebce]"
                      }`}
                    >
                      Not Hafiz
                    </button>
                  </div>
                </div>

                {/* Islamic & Academic Qualifications */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Islamic Qualification
                    </label>
                    <input
                      type="text"
                      list="edit-islamic-quals"
                      value={editFormData.islamicQualification || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, islamicQualification: e.target.value })}
                      placeholder="e.g. Moulavi Fazil, etc."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-medium text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                    <datalist id="edit-islamic-quals">
                      {qualOptions.islamic.map((q, i) => (
                        <option key={i} value={q} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      Academic Qualification
                    </label>
                    <input
                      type="text"
                      list="edit-academic-quals"
                      value={editFormData.academicQualification || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, academicQualification: e.target.value })}
                      placeholder="e.g. BA, B.Tech, MBA, etc."
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-medium text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                    <datalist id="edit-academic-quals">
                      {qualOptions.academic.map((q, i) => (
                        <option key={i} value={q} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1.5">
                    Current Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Job", "Study", "Business"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, currentStatus: st })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          editFormData.currentStatus === st
                            ? "bg-[#719100] text-white shadow-xs"
                            : "bg-[#eef2dc] text-[#576b2d] hover:bg-[#e4ebce]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Designation / Course & Institution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      {editFormData.currentStatus === "Study" ? "Course / Degree" : "Job / Designation"}
                    </label>
                    <input
                      type="text"
                      value={editFormData.jobDesignation || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, jobDesignation: e.target.value })}
                      placeholder={editFormData.currentStatus === "Study" ? "e.g. B.Sc Computer Science" : "e.g. Software Engineer / Teacher"}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-medium text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                      {editFormData.currentStatus === "Study" ? "College / University" : "Company / Institution Name"}
                    </label>
                    <input
                      type="text"
                      value={editFormData.institutionName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, institutionName: e.target.value })}
                      placeholder="e.g. Calicut University / ABC Corp"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-medium text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                    />
                  </div>
                </div>

                {/* Work Location */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1">
                    Work / Study Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.workLocation || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, workLocation: e.target.value })}
                    placeholder="e.g. Dubai / Calicut / Bangalore"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs font-medium text-[#192200] focus:bg-white focus:border-[#719100] outline-none"
                  />
                </div>

                {/* Attendance */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#2d3a00] mb-1.5">
                    Will you attend LINKUP 2026?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, willAttend: "Yes, I will attend" })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        (editFormData.willAttend || "").toLowerCase().includes("yes")
                          ? "bg-[#719100] text-white shadow-xs"
                          : "bg-[#eef2dc] text-[#576b2d] hover:bg-[#e4ebce]"
                      }`}
                    >
                      Yes, I will attend
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, willAttend: "Cannot attend" })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        !(editFormData.willAttend || "").toLowerCase().includes("yes")
                          ? "bg-[#2d3a00] text-white shadow-xs"
                          : "bg-[#eef2dc] text-[#576b2d] hover:bg-[#e4ebce]"
                      }`}
                    >
                      Cannot attend
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-[#fbfdf4] border-t border-[#719100]/15 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2.5 rounded-xl border border-[#719100]/20 text-[#576b2d] font-bold text-xs hover:bg-[#eef2dc] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#719100] to-[#556e00] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#fff000]" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
