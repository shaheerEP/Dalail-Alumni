"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  LogOut,
  Lock,
  User,
  ShieldCheck,
  Phone,
  MessageSquare,
  Building,
  GraduationCap,
  MapPin,
  Calendar,
  Eye,
  X,
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { BATCH_OPTIONS } from "@/data/options";

// Audio confirmation sound generator using Web Audio API
function playScanSound(success = true) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (success) {
      // Pleasant double chime for success
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.1);
      osc2.start(audioCtx.currentTime + 0.1);
      osc2.stop(audioCtx.currentTime + 0.35);
    } else {
      // Warning sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {
    // AudioContext may be restricted by browser until user gesture
  }
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState("");

  // Dashboard Data
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState({ total: 0, willAttend: 0, reported: 0, pending: 0 });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "roster"

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResultModal, setScanResultModal] = useState(null); // { alumnus, alreadyReported, reportedAt }
  const [manualIdInput, setManualIdInput] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const scannerRef = useRef(null);

  // Roster Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterReporting, setFilterReporting] = useState("all"); // "all" | "reported" | "pending"
  const [filterAttendance, setFilterAttendance] = useState("all"); // "all" | "yes" | "no"
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "Job" | "Study"
  const [filterHifz, setFilterHifz] = useState("all"); // "all" | "Hafiz" | "Not Hafiz"

  // Modal for Viewing Single Alumnus Full Details
  const [selectedAlumnusDetail, setSelectedAlumnusDetail] = useState(null);

  // 1. Check Session Auth on Mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.username || "Admin");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch Alumni Data when Authenticated
  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch("/api/admin/alumni");
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni || []);
        setStats(data.stats || { total: 0, willAttend: 0, reported: 0, pending: 0 });
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUser(data.username);
      } else {
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch (err) {}
    setIsAuthenticated(false);
    setAdminUser("");
    setAlumni([]);
  };

  // Handle Reporting a Registration ID
  const processReportCheckin = async (registrationId) => {
    if (!registrationId || !registrationId.trim()) return;

    try {
      const res = await fetch("/api/admin/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: registrationId.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playScanSound(!data.alreadyReported);
        setScanResultModal({
          alumnus: data.alumnus,
          alreadyReported: data.alreadyReported,
          reportedAt: data.reportedAt,
        });

        // Add to recent check-ins list if new
        if (!data.alreadyReported && data.alumnus) {
          setRecentCheckins((prev) => [
            {
              registrationId: data.alumnus.registrationId,
              fullName: data.alumnus.fullName,
              batchYear: data.alumnus.batchYear,
              reportedAt: data.reportedAt,
            },
            ...prev.slice(0, 9),
          ]);
        }

        // Refresh data
        fetchDashboardData();
        return true;
      } else {
        playScanSound(false);
        alert(data.error || "Check-in failed. Please verify registration ID.");
        return false;
      }
    } catch (err) {
      console.error("Check-in error:", err);
      alert("Network error processing check-in.");
      return false;
    }
  };

  // Manual Check-in Submission
  const handleManualCheckin = async (e) => {
    e.preventDefault();
    if (!manualIdInput.trim()) return;
    setManualLoading(true);
    await processReportCheckin(manualIdInput.trim());
    setManualIdInput("");
    setManualLoading(false);
  };

  // Undo Check-in
  const handleUndoReporting = async (registrationId) => {
    if (!confirm(`Are you sure you want to unmark attendance for ${registrationId}?`)) return;

    try {
      const res = await fetch("/api/admin/unreport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      if (res.ok) {
        fetchDashboardData();
        setRecentCheckins((prev) => prev.filter((item) => item.registrationId !== registrationId));
      }
    } catch (err) {
      console.error("Undo error:", err);
    }
  };

  // QR Scanner Lifecycle management
  useEffect(() => {
    let html5QrCode = null;

    if (isAuthenticated && activeTab === "scanner" && scannerActive) {
      // Dynamic import to avoid SSR errors
      import("html5-qrcode")
        .then(({ Html5Qrcode }) => {
          const qrCodeId = "admin-qr-reader";
          const qrRegion = document.getElementById(qrCodeId);
          if (!qrRegion) return;

          html5QrCode = new Html5Qrcode(qrCodeId);
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode: "environment" }, // Prefer back camera on mobile
              config,
              (decodedText) => {
                // Extracted QR payload
                let cleanId = decodedText.trim();
                // If the QR contains prefix or URL, extract ID
                if (cleanId.includes("DKK-")) {
                  const match = cleanId.match(/DKK-[A-Za-z0-9-]+/);
                  if (match) cleanId = match[0];
                }
                processReportCheckin(cleanId);
              },
              (errorMessage) => {
                // Minor scanning errors while reading frames (expected)
              }
            )
            .catch((err) => {
              console.error("Failed to start camera scanner:", err);
              setScannerActive(false);
              alert(
                "Unable to access camera. Please allow camera permissions in your browser or use Manual Check-in."
              );
            });
        })
        .catch((e) => console.error("Html5Qrcode load error", e));
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current.clear())
            .catch(() => {});
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [isAuthenticated, activeTab, scannerActive]);

  // Filtered Alumni for Roster Hub
  const filteredAlumni = useMemo(() => {
    return alumni.filter((item) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (item.fullName || "").toLowerCase().includes(q);
        const matchesId = (item.registrationId || "").toLowerCase().includes(q);
        const matchesPlace = (item.place || "").toLowerCase().includes(q);
        const matchesMobile = (item.mobileNumber || "").toLowerCase().includes(q);
        const matchesJob = (item.jobDesignation || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPlace && !matchesMobile && !matchesJob) {
          return false;
        }
      }

      // 2. Batch Filter
      if (filterBatch !== "all") {
        const b = item.batchYear || item.joinedBatch || "";
        if (b !== filterBatch) return false;
      }

      // 3. Reporting Filter
      if (filterReporting === "reported" && !item.isReported) return false;
      if (filterReporting === "pending" && item.isReported) return false;

      // 4. Attendance Filter
      if (filterAttendance === "yes") {
        if (!(item.willAttend || "").toLowerCase().includes("yes")) return false;
      } else if (filterAttendance === "no") {
        if ((item.willAttend || "").toLowerCase().includes("yes")) return false;
      }

      // 5. Current Status Filter
      if (filterStatus !== "all" && item.currentStatus !== filterStatus) {
        return false;
      }

      // 6. Hifz Status Filter
      if (filterHifz !== "all" && item.hifzStatus !== filterHifz) {
        return false;
      }

      return true;
    });
  }, [alumni, searchTerm, filterBatch, filterReporting, filterAttendance, filterStatus, filterHifz]);

  // Export filtered roster to CSV
  const handleExportCSV = () => {
    if (!filteredAlumni.length) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Registration ID",
      "Full Name",
      "Batch",
      "Section",
      "Place",
      "Mobile Number",
      "WhatsApp Number",
      "Will Attend?",
      "Reporting Status",
      "Reported Timestamp",
      "Hifz Status",
      "Current Status",
      "Job / Designation",
      "Organization",
      "Work Location",
      "Islamic Qualification",
      "Academic Qualification",
      "Registration Timestamp",
    ];

    const rows = filteredAlumni.map((a) => [
      `"${a.registrationId || ""}"`,
      `"${(a.fullName || "").replace(/"/g, '""')}"`,
      `"${a.batchYear || a.joinedBatch || ""}"`,
      `"${a.joinedSection || ""}"`,
      `"${(a.place || "").replace(/"/g, '""')}"`,
      `"${a.mobileNumber || ""}"`,
      `"${a.whatsappNumber || ""}"`,
      `"${a.willAttend || ""}"`,
      `"${a.isReported ? "REPORTED (PRESENT)" : "PENDING"}"`,
      `"${a.reportedAt || ""}"`,
      `"${a.hifzStatus || ""}"`,
      `"${a.currentStatus || ""}"`,
      `"${(a.jobDesignation || "").replace(/"/g, '""')}"`,
      `"${(a.institutionName || "").replace(/"/g, '""')}"`,
      `"${(a.workLocation || "").replace(/"/g, '""')}"`,
      `"${(a.islamicQualification || "").replace(/"/g, '""')}"`,
      `"${(a.academicQualification || "").replace(/"/g, '""')}"`,
      `"${a.timestamp || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Dalailul_Alumni_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // RENDER: Loading or Login Screen
  // ----------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a] text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-[#8ba1ca]">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#ececea] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-8 border border-black/[0.06]">
          <div className="text-center mb-6">
            <div className="w-16 h-20 rounded-2xl bg-white mx-auto shadow-md p-2 flex items-center justify-center mb-3 border border-black/[0.06]">
              <Image src="/logo.png" alt="Logo" width={140} height={170} className="object-contain" priority />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3875b6]">
              Dalailul Khairath Kakkidippuram
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0d1b2a] mt-0.5">
              Admin Portal Login
            </h1>
            <p className="text-xs text-[#778da9] mt-1">
              LINKUP 2026 Reporting & Management Console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#415a77] mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-sm text-[#0d1b2a] font-medium focus:bg-white focus:border-[#3875b6] outline-none"
                  required
                  autoFocus
                />
                <User className="w-4 h-4 text-[#778da9] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#415a77] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-sm text-[#0d1b2a] font-medium focus:bg-white focus:border-[#3875b6] outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-[#778da9] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-[#0d1b2a] hover:bg-[#1b263b] text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Admin Panel</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black/[0.06] text-center">
            <Link href="/" className="text-xs text-[#3875b6] hover:underline font-semibold">
              ← Return to Alumni Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Authenticated Admin Dashboard
  // ----------------------------------------------------
  const reportRate = stats.total > 0 ? Math.round((stats.reported / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#ececea]">
      {/* Top Navbar */}
      <nav className="bg-[#0d1b2a] text-white border-b border-[#415a77]/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-11 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                LINKUP 2026 • Admin Console
              </h1>
              <p className="text-[10px] sm:text-xs text-[#8ba1ca]">
                Dalailul Khairath Kakkidippuram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b263b] text-[11px] font-bold text-[#e0e1dd] border border-[#778da9]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{adminUser}</span>
            </span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-xs font-bold text-[#c8d1dc] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/[0.04]">
            <div className="flex items-center justify-between text-[#778da9] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered</span>
              <Users className="w-4 h-4 text-[#3875b6]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0d1b2a]">{stats.total}</div>
            <p className="text-[11px] text-[#778da9] mt-0.5">Alumni enrolled</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/[0.04]">
            <div className="flex items-center justify-between text-[#778da9] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Will Attend</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.willAttend}</div>
            <p className="text-[11px] text-[#778da9] mt-0.5">Confirmed arrival</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/[0.04]">
            <div className="flex items-center justify-between text-[#778da9] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Reported Present</span>
              <span className="text-xs font-black text-amber-500">{reportRate}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0d1b2a]">{stats.reported}</div>
            <div className="w-full bg-[#e3e8ee] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${reportRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/[0.04]">
            <div className="flex items-center justify-between text-[#778da9] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Arrival</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#415a77]">{stats.pending}</div>
            <p className="text-[11px] text-[#778da9] mt-0.5">Yet to report</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-[#0d1b2a] text-white shadow-md"
                : "bg-white text-[#415a77] hover:bg-[#e3e8ee]"
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>QR Scanner & Reporting</span>
          </button>

          <button
            onClick={() => setActiveTab("roster")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "roster"
                ? "bg-[#0d1b2a] text-white shadow-md"
                : "bg-white text-[#415a77] hover:bg-[#e3e8ee]"
            }`}
          >
            <Users className="w-4 h-4 text-[#8ba1ca]" />
            <span>Registered Alumni Roster</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1b263b] text-white font-mono">
              {alumni.length}
            </span>
          </button>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="ml-auto p-2.5 rounded-xl bg-white hover:bg-[#e3e8ee] text-[#415a77] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin text-[#3875b6]" : ""}`} />
          </button>
        </div>

        {/* TAB 1: QR SCANNER & REPORTING */}
        {activeTab === "scanner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Camera & Manual Scanner */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-black/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0d1b2a] flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#3875b6]" />
                      <span>Live Pass QR Scanner</span>
                    </h2>
                    <p className="text-xs text-[#778da9]">
                      Point attendee&apos;s pass QR code at the camera to report attendance instantly.
                    </p>
                  </div>

                  <button
                    onClick={() => setScannerActive(!scannerActive)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      scannerActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        : "bg-[#0d1b2a] text-amber-400 hover:bg-[#1b263b] shadow-md"
                    }`}
                  >
                    {scannerActive ? (
                      <>
                        <CameraOff className="w-4 h-4" />
                        <span>Stop Camera</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Start Camera</span>
                      </>
                    )}
                  </button>
                </div>

                {/* QR Scanner Viewport */}
                {scannerActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto shadow-inner">
                    <div id="admin-qr-reader" className="w-full h-full" />
                    <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/75 text-[11px] text-white font-medium backdrop-blur-sm">
                        Align QR code inside box
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setScannerActive(true)}
                    className="border-2 border-dashed border-[#c8d1dc] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f9f9f8] transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] text-[#3875b6] flex items-center justify-center mb-3">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0d1b2a]">Camera Scanner is Inactive</h3>
                    <p className="text-xs text-[#778da9] mt-1 max-w-xs">
                      Click &ldquo;Start Camera&rdquo; to use your device&apos;s camera to scan student passes automatically.
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-xl bg-[#0d1b2a] text-white text-xs font-bold"
                    >
                      Enable Camera Now
                    </button>
                  </div>
                )}

                {/* Fallback Manual Check-in */}
                <div className="mt-6 pt-5 border-t border-black/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#415a77] mb-2">
                    Or Quick Manual Check-in
                  </h3>
                  <form onSubmit={handleManualCheckin} className="flex gap-2">
                    <input
                      type="text"
                      value={manualIdInput}
                      onChange={(e) => setManualIdInput(e.target.value)}
                      placeholder="Enter Registration ID (e.g. DKK-Batch5-1279)"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-xs sm:text-sm font-mono font-medium focus:bg-white focus:border-[#3875b6] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={manualLoading || !manualIdInput.trim()}
                      className="px-5 py-3 rounded-xl bg-[#0d1b2a] hover:bg-[#1b263b] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {manualLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <span>Check In</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Col: Recent Check-in Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-black/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0d1b2a] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Recent Check-ins Today</span>
                  </h3>
                  <span className="text-xs font-bold text-[#778da9]">
                    {recentCheckins.length} recorded
                  </span>
                </div>

                {recentCheckins.length > 0 ? (
                  <div className="divide-y divide-black/[0.05] max-h-[460px] overflow-y-auto">
                    {recentCheckins.map((item, idx) => (
                      <div
                        key={`${item.registrationId}-${idx}`}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#0d1b2a] truncate">{item.fullName}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#778da9] mt-0.5">
                            <span className="font-mono text-[#3875b6] font-semibold">
                              {item.registrationId}
                            </span>
                            <span>•</span>
                            <span>{item.batchYear}</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            Reported: {item.reportedAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUndoReporting(item.registrationId)}
                          className="text-[11px] text-[#778da9] hover:text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#778da9]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#c8d1dc]" />
                    <p className="text-xs font-semibold">No check-ins in this session yet.</p>
                    <p className="text-[11px] mt-1">
                      Scanned or manually reported attendees will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED ALUMNI ROSTER & FILTER HUB */}
        {activeTab === "roster" && (
          <div className="space-y-4">
            {/* Filter Hub Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.04] space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#778da9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Name, Reg ID, Mobile, Place, Job..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-xs sm:text-sm font-medium focus:bg-white focus:border-[#3875b6] outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#778da9] hover:text-black cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* CSV Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to CSV ({filteredAlumni.length})</span>
                </button>
              </div>

              {/* Filter Dropdowns Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
                {/* Batch Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#778da9] mb-1">
                    Batch
                  </label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] font-medium outline-none"
                  >
                    <option value="all">All Batches</option>
                    {BATCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reporting Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#778da9] mb-1">
                    Reporting
                  </label>
                  <select
                    value={filterReporting}
                    onChange={(e) => setFilterReporting(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] font-medium outline-none"
                  >
                    <option value="all">All Reporting</option>
                    <option value="reported">Reported Present</option>
                    <option value="pending">Pending Check-in</option>
                  </select>
                </div>

                {/* Will Attend Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#778da9] mb-1">
                    Will Attend
                  </label>
                  <select
                    value={filterAttendance}
                    onChange={(e) => setFilterAttendance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] font-medium outline-none"
                  >
                    <option value="all">All Intentions</option>
                    <option value="yes">Yes, Will Attend</option>
                    <option value="no">Cannot Attend</option>
                  </select>
                </div>

                {/* Current Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#778da9] mb-1">
                    Occupation
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] font-medium outline-none"
                  >
                    <option value="all">All Occupations</option>
                    <option value="Job">Job</option>
                    <option value="Study">Study</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                {/* Hifz Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#778da9] mb-1">
                    Hifz Status
                  </label>
                  <select
                    value={filterHifz}
                    onChange={(e) => setFilterHifz(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f3f4f6] border border-black/[0.05] text-[#0d1b2a] font-medium outline-none"
                  >
                    <option value="all">All Hifz</option>
                    <option value="Hafiz">Hafiz</option>
                    <option value="Not Hafiz">Not Hafiz</option>
                  </select>
                </div>
              </div>

              {/* Filter feedback & clear */}
              <div className="flex items-center justify-between text-xs text-[#778da9] pt-1">
                <span>
                  Showing <strong className="text-[#0d1b2a]">{filteredAlumni.length}</strong> of{" "}
                  <strong>{alumni.length}</strong> alumni
                </span>
                {(filterBatch !== "all" ||
                  filterReporting !== "all" ||
                  filterAttendance !== "all" ||
                  filterStatus !== "all" ||
                  filterHifz !== "all" ||
                  searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterBatch("all");
                      setFilterReporting("all");
                      setFilterAttendance("all");
                      setFilterStatus("all");
                      setFilterHifz("all");
                      setSearchTerm("");
                    }}
                    className="text-[#3875b6] hover:underline font-semibold cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>

            {/* Roster Table / Card View */}
            <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1b2a] text-[#8ba1ca] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Reg ID</th>
                      <th className="py-3.5 px-4">Alumnus Name & Place</th>
                      <th className="py-3.5 px-4">Batch / Section</th>
                      <th className="py-3.5 px-4">Phone & WhatsApp</th>
                      <th className="py-3.5 px-4">Hifz & Status</th>
                      <th className="py-3.5 px-4">Will Attend?</th>
                      <th className="py-3.5 px-4">Meet Reporting</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05] text-[#415a77]">
                    {filteredAlumni.map((alumnus) => {
                      const isAttending = (alumnus.willAttend || "").toLowerCase().includes("yes");
                      return (
                        <tr
                          key={alumnus.registrationId}
                          className="hover:bg-[#f9f9f8] transition-colors"
                        >
                          {/* Reg ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0d1b2a] whitespace-nowrap">
                            {alumnus.registrationId}
                          </td>

                          {/* Name & Place */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0d1b2a] uppercase">
                              {alumnus.fullName}
                            </div>
                            <div className="text-[11px] text-[#778da9]">{alumnus.place || "—"}</div>
                          </td>

                          {/* Batch / Section */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-[#1b263b]">
                              {alumnus.batchYear || alumnus.joinedBatch}
                            </span>
                            {alumnus.joinedSection && (
                              <span className="ml-1 text-[11px] text-[#778da9]">
                                ({alumnus.joinedSection})
                              </span>
                            )}
                          </td>

                          {/* Phone & WhatsApp links */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#0d1b2a]">
                                {alumnus.mobileNumber || "—"}
                              </span>
                              {alumnus.whatsappNumber && (
                                <a
                                  href={`https://wa.me/${alumnus.whatsappNumber.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open WhatsApp"
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Hifz & Status */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#0d1b2a]">
                              {alumnus.hifzStatus || "—"}
                            </div>
                            <div className="text-[11px] text-[#778da9] truncate max-w-[140px]">
                              {alumnus.currentStatus}: {alumnus.jobDesignation || alumnus.institutionName || ""}
                            </div>
                          </td>

                          {/* Will Attend? */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isAttending
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isAttending ? "Yes" : "Cannot Attend"}
                            </span>
                          </td>

                          {/* Reporting Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {alumnus.isReported ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Reported</span>
                                </span>
                                <div className="text-[10px] text-[#778da9] mt-0.5">
                                  {alumnus.reportedAt}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => processReportCheckin(alumnus.registrationId)}
                                className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#0d1b2a] font-bold text-[11px] shadow-sm transition-all cursor-pointer"
                              >
                                Mark Present
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedAlumnusDetail(alumnus)}
                                className="p-1.5 rounded-lg text-[#3875b6] hover:bg-[#e3e8ee] transition-colors cursor-pointer"
                                title="View Full Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {alumnus.isReported && (
                                <button
                                  type="button"
                                  onClick={() => handleUndoReporting(alumnus.registrationId)}
                                  className="p-1.5 rounded-lg text-[#778da9] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Undo Check-in"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAlumni.length === 0 && (
                <div className="text-center py-12 text-[#778da9]">
                  <p className="text-sm font-bold">No alumni records match your filters.</p>
                  <p className="text-xs mt-1">Try relaxing your search terms or filter selections.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ----------------------------------------------------
          MODAL: Scan / Reporting Result Card
      ---------------------------------------------------- */}
      {scanResultModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`p-6 text-white text-center ${
                scanResultModal.alreadyReported
                  ? "bg-gradient-to-br from-amber-600 to-amber-700"
                  : "bg-gradient-to-br from-emerald-600 to-emerald-700"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
                {scanResultModal.alreadyReported ? (
                  <AlertTriangle className="w-8 h-8 text-white" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                )}
              </div>

              <span className="text-xs font-black uppercase tracking-wider">
                {scanResultModal.alreadyReported
                  ? "Already Reported"
                  : "Check-in Successful!"}
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase mt-1">
                {scanResultModal.alumnus?.fullName || "Registered Attendee"}
              </h3>
              <p className="text-xs text-white/80 mt-1">
                {scanResultModal.alreadyReported
                  ? `Previously marked present at ${scanResultModal.reportedAt}`
                  : `Checked in just now (${scanResultModal.reportedAt})`}
              </p>
            </div>

            <div className="p-6 space-y-3 text-xs bg-white">
              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#778da9]">Registration ID:</span>
                <span className="font-mono font-black text-[#0d1b2a]">
                  {scanResultModal.alumnus?.registrationId}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#778da9]">Batch & Section:</span>
                <span className="font-bold text-[#3875b6]">
                  {scanResultModal.alumnus?.batchYear || scanResultModal.alumnus?.joinedBatch}{" "}
                  {scanResultModal.alumnus?.joinedSection
                    ? `(${scanResultModal.alumnus.joinedSection})`
                    : ""}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#778da9]">Place:</span>
                <span className="font-medium text-[#0d1b2a]">
                  {scanResultModal.alumnus?.place || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#778da9]">Mobile Number:</span>
                <span className="font-mono font-medium text-[#0d1b2a]">
                  {scanResultModal.alumnus?.mobileNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#778da9]">Hifz Status:</span>
                <span className="font-medium text-[#0d1b2a]">
                  {scanResultModal.alumnus?.hifzStatus || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="font-bold text-[#778da9]">Current Status:</span>
                <span className="font-medium text-[#0d1b2a]">
                  {scanResultModal.alumnus?.currentStatus}:{" "}
                  {scanResultModal.alumnus?.jobDesignation ||
                    scanResultModal.alumnus?.institutionName ||
                    "—"}
                </span>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setScanResultModal(null)}
                  className="w-full py-3 rounded-xl bg-[#0d1b2a] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#1b263b] cursor-pointer"
                >
                  Close & Ready Next Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: Full Alumnus Details Modal
      ---------------------------------------------------- */}
      {selectedAlumnusDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#0d1b2a] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba1ca]">
                  Alumnus Profile Record
                </span>
                <h3 className="text-lg font-black uppercase text-white">
                  {selectedAlumnusDetail.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlumnusDetail(null)}
                className="p-1 rounded-full text-[#8ba1ca] hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f9f9f8] p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-[#778da9] uppercase">
                    Registration ID
                  </span>
                  <p className="font-mono font-bold text-sm text-[#0d1b2a]">
                    {selectedAlumnusDetail.registrationId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#778da9] uppercase">
                    Reporting Status
                  </span>
                  <p className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.isReported ? (
                      <span className="text-emerald-700">
                        Reported ({selectedAlumnusDetail.reportedAt})
                      </span>
                    ) : (
                      <span className="text-amber-700">Pending Check-in</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Batch:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.batchYear || selectedAlumnusDetail.joinedBatch}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Section (HS / BS):</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.joinedSection || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Place:</span>
                  <span className="font-bold text-[#0d1b2a]">{selectedAlumnusDetail.place || "—"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Mobile:</span>
                  <span className="font-mono font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.mobileNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">WhatsApp:</span>
                  <span className="font-mono font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.whatsappNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Hifz Status:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.hifzStatus || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Islamic Qualification:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.islamicQualification || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Academic Qualification:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.academicQualification || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Current Status:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.currentStatus || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Designation / Job:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.jobDesignation || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Institution / Org:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.institutionName || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Work Location:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.workLocation || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#415a77]">Will Attend Meet?:</span>
                  <span className="font-bold text-[#0d1b2a]">
                    {selectedAlumnusDetail.willAttend || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-[#415a77]">Registered At:</span>
                  <span className="text-[#778da9]">{selectedAlumnusDetail.timestamp || "—"}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedAlumnusDetail(null)}
                  className="w-full py-3 rounded-xl bg-[#f3f4f6] hover:bg-[#e3e8ee] text-[#0d1b2a] font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
