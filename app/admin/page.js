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
  const lastScanMapRef = useRef(new Map()); // Map<registrationId, timestamp>
  const isProcessingScanRef = useRef(false);

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

    const normalizedId = registrationId.trim().toUpperCase();
    isProcessingScanRef.current = true;
    lastScanMapRef.current.set(normalizedId, Date.now());

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

        // Add to recent check-ins list ONLY if it was newly reported
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
    } finally {
      isProcessingScanRef.current = false;
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
        lastScanMapRef.current.delete(registrationId.toUpperCase());
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
                  const match = cleanId.match(/DKK-[A-Za-z0-9-]+/i);
                  if (match) cleanId = match[0];
                }

                const normalizedId = cleanId.toUpperCase();
                const now = Date.now();
                const lastScanTime = lastScanMapRef.current.get(normalizedId) || 0;

                // 5-second suppression for the SAME QR:
                // If the same QR was scanned less than 5 seconds ago, ignore completely
                if (now - lastScanTime < 5000) {
                  return;
                }

                // If a scan request is currently in-flight, avoid concurrent race conditions
                if (isProcessingScanRef.current) {
                  return;
                }

                // Update cooldown timestamp immediately to debounce rapid camera frames
                lastScanMapRef.current.set(normalizedId, now);

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

  // ----------------------------------------------------
  // RENDER: Loading or Login Screen
  // ----------------------------------------------------
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#192200] text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#fff000]" />
          <p className="text-sm font-medium text-[#e8edd7]">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#f5f7eb] px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 sm:p-8 border border-[#719100]/15">
          <div className="text-center mb-6">
            <div className="w-16 h-20 rounded-2xl bg-[#eef2dc]/60 mx-auto shadow-sm p-2 flex items-center justify-center mb-3 border border-[#719100]/15">
              <Image src="/logo.png" alt="Logo" width={140} height={170} className="object-contain" priority />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#719100]">
              Dalailul Khairath Kakkidippuram
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#192200] mt-0.5">
              Admin Portal Login
            </h1>
            <p className="text-xs text-[#576b2d] mt-1">
              LINKUP 2026 Reporting & Management Console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2d3a00] mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-sm text-[#192200] font-medium focus:bg-[#fbfdf4] focus:border-[#719100] outline-none transition-all"
                  required
                  autoFocus
                />
                <User className="w-4 h-4 text-[#6e8242] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2d3a00] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-sm text-[#192200] font-medium focus:bg-[#fbfdf4] focus:border-[#719100] outline-none transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-[#6e8242] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#719100] to-[#556e00] hover:opacity-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#fff000]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Admin Panel</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black/[0.06] text-center">
            <Link href="/" className="text-xs text-[#719100] hover:underline font-semibold">
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
    <div className="min-h-screen flex flex-col bg-[#f5f7eb]">
      {/* Top Navbar */}
      <nav className="bg-gradient-to-r from-[#141b00] via-[#202b00] to-[#2d3a00] text-white border-b border-[#719100]/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-11 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                LINKUP 2026 • Admin Console
              </h1>
              <p className="text-[10px] sm:text-xs text-[#fff000] font-medium">
                Dalailul Khairath Kakkidippuram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#e8edd7] border border-[#719100]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#fff000]" />
              <span>{adminUser}</span>
            </span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 hover:text-red-200 text-xs font-bold text-[#e8edd7] transition-colors flex items-center gap-1.5 cursor-pointer"
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
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#719100]/15">
            <div className="flex items-center justify-between text-[#576b2d] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered</span>
              <Users className="w-4 h-4 text-[#719100]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#192200]">{stats.total}</div>
            <p className="text-[11px] text-[#576b2d] mt-0.5">Alumni enrolled</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#719100]/15">
            <div className="flex items-center justify-between text-[#576b2d] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Will Attend</span>
              <CheckCircle2 className="w-4 h-4 text-[#719100]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2d3a00]">{stats.willAttend}</div>
            <p className="text-[11px] text-[#576b2d] mt-0.5">Confirmed arrival</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#719100]/15">
            <div className="flex items-center justify-between text-[#576b2d] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Reported Present</span>
              <span className="text-xs font-black text-[#719100]">{reportRate}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#192200]">{stats.reported}</div>
            <div className="w-full bg-[#eef2dc] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#719100] h-full rounded-full transition-all duration-500"
                style={{ width: `${reportRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#719100]/15">
            <div className="flex items-center justify-between text-[#576b2d] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Arrival</span>
              <Clock className="w-4 h-4 text-[#8e7b16]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2d3a00]">{stats.pending}</div>
            <p className="text-[11px] text-[#576b2d] mt-0.5">Yet to report</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#719100]/20 pb-1">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-[#192200] text-white shadow-md"
                : "bg-white text-[#576b2d] hover:bg-[#eef2dc]"
            }`}
          >
            <QrCode className={`w-4 h-4 ${activeTab === "scanner" ? "text-[#fff000]" : "text-[#719100]"}`} />
            <span>QR Scanner & Reporting</span>
          </button>

          <button
            onClick={() => setActiveTab("roster")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "roster"
                ? "bg-[#192200] text-white shadow-md"
                : "bg-white text-[#576b2d] hover:bg-[#eef2dc]"
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === "roster" ? "text-[#fff000]" : "text-[#719100]"}`} />
            <span>Registered Alumni Roster</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === "roster" ? "bg-[#719100] text-white" : "bg-[#eef2dc] text-[#192200]"
            }`}>
              {alumni.length}
            </span>
          </button>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="ml-auto p-2.5 rounded-xl bg-white hover:bg-[#eef2dc] text-[#576b2d] border border-[#719100]/15 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin text-[#719100]" : ""}`} />
          </button>
        </div>

        {/* TAB 1: QR SCANNER & REPORTING */}
        {activeTab === "scanner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Camera & Manual Scanner */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-[#719100]/15">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#192200] flex items-center gap-2">
                      <Camera className="w-5 h-5 text-[#719100]" />
                      <span>Live Pass QR Scanner</span>
                    </h2>
                    <p className="text-xs text-[#576b2d]">
                      Point attendee&apos;s pass QR code at the camera to report attendance instantly.
                    </p>
                  </div>

                  <button
                    onClick={() => setScannerActive(!scannerActive)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      scannerActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        : "bg-gradient-to-r from-[#719100] to-[#556e00] text-white hover:opacity-95 shadow-md"
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
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto shadow-inner border border-[#719100]/30">
                    <div id="admin-qr-reader" className="w-full h-full" />
                    <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-black/75 text-[11px] text-[#fff000] font-medium backdrop-blur-sm">
                        Align QR code inside box
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setScannerActive(true)}
                    className="border-2 border-dashed border-[#719100]/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#fbfdf4] transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#eef2dc] text-[#719100] flex items-center justify-center mb-3">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-[#192200]">Camera Scanner is Inactive</h3>
                    <p className="text-xs text-[#576b2d] mt-1 max-w-xs">
                      Click &ldquo;Start Camera&rdquo; to use your device&apos;s camera to scan student passes automatically.
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-xl bg-[#192200] hover:bg-[#2d3a00] text-white text-xs font-bold transition-colors"
                    >
                      Enable Camera Now
                    </button>
                  </div>
                )}

                {/* Fallback Manual Check-in */}
                <div className="mt-6 pt-5 border-t border-black/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2d3a00] mb-2">
                    Or Quick Manual Check-in
                  </h3>
                  <form onSubmit={handleManualCheckin} className="flex gap-2">
                    <input
                      type="text"
                      value={manualIdInput}
                      onChange={(e) => setManualIdInput(e.target.value)}
                      placeholder="Enter Registration ID (e.g. DKK-Batch5-1279)"
                      className="flex-1 px-4 py-3 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs sm:text-sm font-mono font-medium text-[#192200] focus:bg-[#fbfdf4] focus:border-[#719100] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={manualLoading || !manualIdInput.trim()}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#719100] to-[#556e00] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {manualLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#fff000]" />
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
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#719100]/15">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#192200] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#719100]" />
                    <span>Recent Check-ins Today</span>
                  </h3>
                  <span className="text-xs font-bold text-[#576b2d]">
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
                          <h4 className="font-bold text-[#192200] truncate">{item.fullName}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#576b2d] mt-0.5">
                            <span className="font-mono text-[#719100] font-bold">
                              {item.registrationId}
                            </span>
                            <span>•</span>
                            <span>{item.batchYear}</span>
                          </div>
                          <span className="text-[10px] text-[#719100] font-semibold">
                            Reported: {item.reportedAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUndoReporting(item.registrationId)}
                          className="text-[11px] text-[#6e8242] hover:text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#6e8242]">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#6e8242]/50" />
                    <p className="text-xs font-semibold">No check-ins in this session yet.</p>
                    <p className="text-[11px] mt-1 text-[#576b2d]">
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
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#719100]/15 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#6e8242] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Name, Reg ID, Mobile, Place, Job..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-xs sm:text-sm text-[#192200] font-medium focus:bg-[#fbfdf4] focus:border-[#719100] outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6e8242] hover:text-[#192200] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Dropdowns Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
                {/* Batch Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#576b2d] mb-1">
                    Batch
                  </label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-[#192200] font-medium outline-none focus:border-[#719100]"
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#576b2d] mb-1">
                    Reporting
                  </label>
                  <select
                    value={filterReporting}
                    onChange={(e) => setFilterReporting(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-[#192200] font-medium outline-none focus:border-[#719100]"
                  >
                    <option value="all">All Reporting</option>
                    <option value="reported">Reported Present</option>
                    <option value="pending">Pending Check-in</option>
                  </select>
                </div>

                {/* Will Attend Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#576b2d] mb-1">
                    Will Attend
                  </label>
                  <select
                    value={filterAttendance}
                    onChange={(e) => setFilterAttendance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-[#192200] font-medium outline-none focus:border-[#719100]"
                  >
                    <option value="all">All Intentions</option>
                    <option value="yes">Yes, Will Attend</option>
                    <option value="no">Cannot Attend</option>
                  </select>
                </div>

                {/* Current Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#576b2d] mb-1">
                    Occupation
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-[#192200] font-medium outline-none focus:border-[#719100]"
                  >
                    <option value="all">All Occupations</option>
                    <option value="Job">Job</option>
                    <option value="Study">Study</option>
                    <option value="Business">Business</option>
                  </select>
                </div>

                {/* Hifz Status Filter */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#576b2d] mb-1">
                    Hifz Status
                  </label>
                  <select
                    value={filterHifz}
                    onChange={(e) => setFilterHifz(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#eef2dc] border border-[#719100]/20 text-[#192200] font-medium outline-none focus:border-[#719100]"
                  >
                    <option value="all">All Hifz</option>
                    <option value="Hafiz">Hafiz</option>
                    <option value="Not Hafiz">Not Hafiz</option>
                  </select>
                </div>
              </div>

              {/* Filter feedback & clear */}
              <div className="flex items-center justify-between text-xs text-[#576b2d] pt-1">
                <span>
                  Showing <strong className="text-[#192200]">{filteredAlumni.length}</strong> of{" "}
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
                    className="text-[#719100] hover:underline font-bold cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>

            {/* Roster Table / Card View */}
            <div className="bg-white rounded-3xl shadow-sm border border-[#719100]/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#192200] text-[#e8edd7] font-bold uppercase tracking-wider text-[10px]">
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
                  <tbody className="divide-y divide-black/[0.05] text-[#2d3a00]">
                    {filteredAlumni.map((alumnus) => {
                      const isAttending = (alumnus.willAttend || "").toLowerCase().includes("yes");
                      return (
                        <tr
                          key={alumnus.registrationId}
                          className="hover:bg-[#fbfdf4] transition-colors"
                        >
                          {/* Reg ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#192200] whitespace-nowrap">
                            {alumnus.registrationId}
                          </td>

                          {/* Name & Place */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#192200] uppercase">
                              {alumnus.fullName}
                            </div>
                            <div className="text-[11px] text-[#576b2d]">{alumnus.place || "—"}</div>
                          </td>

                          {/* Batch / Section */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-[#2d3a00]">
                              {alumnus.batchYear || alumnus.joinedBatch}
                            </span>
                            {alumnus.joinedSection && (
                              <span className="ml-1 text-[11px] text-[#576b2d]">
                                ({alumnus.joinedSection})
                              </span>
                            )}
                          </td>

                          {/* Phone & WhatsApp links */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#192200]">
                                {alumnus.mobileNumber || "—"}
                              </span>
                              {alumnus.whatsappNumber && (
                                <a
                                  href={`https://wa.me/${alumnus.whatsappNumber.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open WhatsApp"
                                  className="text-[#719100] hover:text-[#5c7700]"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Hifz & Status */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#192200]">
                              {alumnus.hifzStatus || "—"}
                            </div>
                            <div className="text-[11px] text-[#576b2d] truncate max-w-[140px]">
                              {alumnus.currentStatus}: {alumnus.jobDesignation || alumnus.institutionName || ""}
                            </div>
                          </td>

                          {/* Will Attend? */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isAttending
                                  ? "bg-[#eef2dc] text-[#2d3a00] border border-[#719100]/30"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {isAttending ? "Yes" : "Cannot Attend"}
                            </span>
                          </td>

                          {/* Reporting Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {alumnus.isReported ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#eef2dc] text-[#2d3a00] border border-[#719100]/30">
                                  <CheckCircle2 className="w-3 h-3 text-[#719100]" />
                                  <span>Reported</span>
                                </span>
                                <div className="text-[10px] text-[#576b2d] mt-0.5">
                                  {alumnus.reportedAt}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => processReportCheckin(alumnus.registrationId)}
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#719100] to-[#556e00] hover:opacity-95 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
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
                                className="p-1.5 rounded-lg text-[#719100] hover:bg-[#eef2dc] transition-colors cursor-pointer"
                                title="View Full Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {alumnus.isReported && (
                                <button
                                  type="button"
                                  onClick={() => handleUndoReporting(alumnus.registrationId)}
                                  className="p-1.5 rounded-lg text-[#6e8242] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                <div className="text-center py-12 text-[#576b2d]">
                  <p className="text-sm font-bold text-[#192200]">No alumni records match your filters.</p>
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
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[#719100]/20">
            <div
              className={`p-6 text-white text-center ${
                scanResultModal.alreadyReported
                  ? "bg-gradient-to-br from-amber-600 to-amber-700"
                  : "bg-gradient-to-br from-[#141b00] via-[#202b00] to-[#2d3a00]"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center mb-3">
                {scanResultModal.alreadyReported ? (
                  <AlertTriangle className="w-8 h-8 text-[#fff000]" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-[#fff000]" />
                )}
              </div>

              <span className="text-xs font-black uppercase tracking-wider text-[#fff000]">
                {scanResultModal.alreadyReported
                  ? "⚠️ Already Reported"
                  : "Check-in Successful!"}
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase mt-1 text-white">
                {scanResultModal.alumnus?.fullName || "Registered Attendee"}
              </h3>
              <p className="text-xs text-[#e8edd7] mt-1">
                {scanResultModal.alreadyReported
                  ? `Previously marked present at ${scanResultModal.reportedAt}. Cannot report again.`
                  : `Checked in just now (${scanResultModal.reportedAt})`}
              </p>
            </div>

            <div className="p-6 space-y-3 text-xs bg-white">
              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#576b2d]">Registration ID:</span>
                <span className="font-mono font-black text-[#192200]">
                  {scanResultModal.alumnus?.registrationId}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#576b2d]">Batch & Section:</span>
                <span className="font-bold text-[#719100]">
                  {scanResultModal.alumnus?.batchYear || scanResultModal.alumnus?.joinedBatch}{" "}
                  {scanResultModal.alumnus?.joinedSection
                    ? `(${scanResultModal.alumnus.joinedSection})`
                    : ""}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#576b2d]">Place:</span>
                <span className="font-medium text-[#192200]">
                  {scanResultModal.alumnus?.place || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#576b2d]">Mobile Number:</span>
                <span className="font-mono font-medium text-[#192200]">
                  {scanResultModal.alumnus?.mobileNumber || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                <span className="font-bold text-[#576b2d]">Hifz Status:</span>
                <span className="font-medium text-[#192200]">
                  {scanResultModal.alumnus?.hifzStatus || "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="font-bold text-[#576b2d]">Current Status:</span>
                <span className="font-medium text-[#192200]">
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#719100] to-[#556e00] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
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
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[#719100]/20">
            <div className="bg-gradient-to-r from-[#141b00] via-[#202b00] to-[#2d3a00] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fff000]">
                  Alumnus Profile Record
                </span>
                <h3 className="text-lg font-black uppercase text-white">
                  {selectedAlumnusDetail.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlumnusDetail(null)}
                className="p-1 rounded-full text-[#e8edd7] hover:text-[#fff000] hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#eef2dc]/60 p-4 rounded-2xl border border-[#719100]/15">
                <div>
                  <span className="text-[10px] font-bold text-[#576b2d] uppercase">
                    Registration ID
                  </span>
                  <p className="font-mono font-bold text-sm text-[#192200]">
                    {selectedAlumnusDetail.registrationId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#576b2d] uppercase">
                    Reporting Status
                  </span>
                  <p className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.isReported ? (
                      <span className="text-[#719100] font-black">
                        Reported ({selectedAlumnusDetail.reportedAt})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">Pending Check-in</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Batch:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.batchYear || selectedAlumnusDetail.joinedBatch}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Section (HS / BS):</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.joinedSection || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Place:</span>
                  <span className="font-bold text-[#192200]">{selectedAlumnusDetail.place || "—"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Mobile:</span>
                  <span className="font-mono font-bold text-[#192200]">
                    {selectedAlumnusDetail.mobileNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">WhatsApp:</span>
                  <span className="font-mono font-bold text-[#192200]">
                    {selectedAlumnusDetail.whatsappNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Hifz Status:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.hifzStatus || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Islamic Qualification:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.islamicQualification || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Academic Qualification:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.academicQualification || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Current Status:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.currentStatus || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Designation / Job:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.jobDesignation || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Institution / Org:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.institutionName || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Work Location:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.workLocation || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.05]">
                  <span className="font-semibold text-[#576b2d]">Will Attend Meet?:</span>
                  <span className="font-bold text-[#192200]">
                    {selectedAlumnusDetail.willAttend || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-[#576b2d]">Registered At:</span>
                  <span className="text-[#576b2d]">{selectedAlumnusDetail.timestamp || "—"}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedAlumnusDetail(null)}
                  className="w-full py-3 rounded-xl bg-[#eef2dc] hover:bg-[#e0e7c5] text-[#192200] font-bold text-xs cursor-pointer transition-colors"
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
