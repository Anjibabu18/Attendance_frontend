import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WorkIcon from "@mui/icons-material/Work";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WifiProtectedSetupIcon from "@mui/icons-material/WifiProtectedSetup";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import Layout from "../components/Layout";
import MonthCalendar, { DayStatus } from "../components/MonthCalendar";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────
type CompanyRole = { id: number; name: string; photoUrl?: string | null };
type OfficeLocation = { id: number; officeName?: string | null; latitude: number; longitude: number; radiusMeters: number };
type Profile = {
  employeeId: number; employeeNumber: string; name: string;
  companyRole?: CompanyRole | null;
  assignedOfficeLocation?: OfficeLocation | null;
  department?: { id: number; name: string } | null;
  shift?: { id: number; name: string; inTime: string; outTime: string; flexible: boolean } | null;
  status?: string; profilePhotoUrl?: string | null;
};
type Attendance = {
  id: number; employeeId: number; date: string;
  inTime?: string | null; outTime?: string | null;
  workedMinutes?: number | null; lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null; overtimeMinutes?: number | null;
  leaveReason?: string | null;
  checkInLatitude?: number | null; checkInLongitude?: number | null;
  checkInPhotoUrl?: string | null; checkInFaceScore?: number | null; checkInFaceVerified?: boolean | null;
  checkOutLatitude?: number | null; checkOutLongitude?: number | null;
  checkOutPhotoUrl?: string | null; checkOutFaceScore?: number | null; checkOutFaceVerified?: boolean | null;
  status: "PRESENT" | "HALF_DAY" | "LEAVE";
};
type MonthSummary = { month: string; fromDate: string; toDate: string; workingDays: number; presentDays: number; halfDayDays: number; leaveDays: number; totalWorkedMinutes: number };
type AttendanceSettings = { defaultInTime: string; defaultOutTime: string; weekendDays: string; fullDayMinutes: number; halfDayMinutes: number; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; overtimeAfterMinutes: number; lateDeductionPerMinute: number; overtimePayPerHour: number; unpaidLeaveDailyRate: number; standardMonthlySalary: number; requireQrForPunch: boolean; permanentOfficeQr: boolean; qrTokenValidityMinutes: number };
type Payslip = { employeeId: number; employeeName: string; employeeNumber: string; month: string; presentDays: number; halfDays: number; leaveDays: number; payableDays: number; lateMinutes: number; overtimeMinutes: number; baseSalary: number; lateDeduction: number; unpaidLeaveDeduction: number; overtimePay: number; grossPay: number; totalDeductions: number; netPay: number };
type Holiday = { id: number; date: string; name: string };
type DailyGroupPhoto = { id: number; date: string; photoUrl: string };
type LeaveRequest = { id: number; fromDate: string; toDate: string; reason: string; leaveType?: string | null; mailSubject?: string | null; mailMessage?: string | null; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "CANCELLATION_REQUESTED"; createdAt: string; decidedAt?: string | null; decidedBy?: string | null; hrRemarks?: string | null };
type RegularizationRequest = { id: number; date: string; inTime?: string | null; outTime?: string | null; reason: string; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; hrRemarks?: string | null };
type WorkRequest = { id: number; type: "WORK_FROM_HOME" | "ON_DUTY"; fromDate: string; toDate: string; reason: string; status: "PENDING" | "MANAGER_RECOMMENDED" | "APPROVED" | "REJECTED"; createdAt?: string; remarks?: string | null; attachmentUrl?: string | null; attachmentName?: string | null };
type CompOffRequest = { id: number; overtimeDate: string; requestedDate: string; overtimeMinutes: number; reason: string; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; hrRemarks?: string | null };
type BreakEntry = { id: number; start: string; end?: string | null };
type PunchPlace = { officeLocation: OfficeLocation; latitude: number; longitude: number; distanceMeters: number; allowedRadiusMeters: number; insideRadius: boolean };
type DeviceStatus = { deviceId: string; approved: boolean };

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function apiMessage(e: any, fallback: string) { return e?.response?.data?.error ?? e?.message ?? fallback; }
const DEVICE_ID_KEY = "attendance_device_id_v1";
function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}
function parseEntryClock(value?: string | null, date?: string | null) {
  if (!value) return null;
  const normalized = value.length === 5 ? `${value}:00` : value;
  const parsed = dayjs(`${date || dayjs().format("YYYY-MM-DD")}T${normalized}`);
  return parsed.isValid() ? parsed : null;
}
function entryEndClock(start: dayjs.Dayjs, value?: string | null, date?: string | null) {
  const parsed = parseEntryClock(value, date);
  if (!parsed) return null;
  return parsed.isBefore(start) ? parsed.add(1, "day") : parsed;
}
function formatDurationSeconds(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────
function GlassCard({ children, sx = {}, accentColor, animate = true }: { children: React.ReactNode; sx?: any; accentColor?: string; animate?: boolean }) {
  return (
    <Box sx={{
      background: "rgba(255,255,255,0.98)",
      border: "1px solid rgba(226,232,240,0.8)",
      borderRadius: { xs: 3, sm: 3.5 },
      boxShadow: "0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)",
      overflow: "hidden", position: "relative",
      transition: "box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.2,0.8,0.2,1)",
      animation: animate ? "slideUp 0.45s cubic-bezier(0.2,0.8,0.2,1) both" : undefined,
      "&:hover": { boxShadow: "0 12px 40px rgba(15,23,42,0.10), 0 2px 8px rgba(99,102,241,0.08)" },
      ...(accentColor ? {
        "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accentColor, borderRadius: "3.5px 0 0 3.5px", zIndex: 0 }
      } : {}),
      ...sx,
    }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

function SectionTitle({ children, icon, subtitle }: { children: React.ReactNode; icon?: React.ReactNode; subtitle?: string }) {
  return (
    <Box sx={{ mb: subtitle ? 0.5 : 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        {icon && (
          <Box sx={{ width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 }, borderRadius: 2, background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(37,99,235,0.08))", display: "grid", placeItems: "center", color: "#4f46e5", flexShrink: 0, border: "1px solid rgba(99,102,241,0.15)" }}>
            {icon}
          </Box>
        )}
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17, md: 18 }, color: "#0f172a", lineHeight: 1.2 }}>{children}</Typography>
      </Box>
      {subtitle && <Typography sx={{ mt: 0.6, color: "text.secondary", fontSize: { xs: 12, sm: 13 }, lineHeight: 1.55, mb: 2 }}>{subtitle}</Typography>}
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: "1px solid rgba(226,232,240,0.5)", "&:last-child": { borderBottom: "none", pb: 0 } }}>
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textAlign: "right", maxWidth: "55%" }}>{value}</Typography>
    </Box>
  );
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, { color: string; bg: string; border: string }> }) {
  const cfg = labels[status] ?? { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" };
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", px: 1.25, py: 0.35, borderRadius: 1.5, bgcolor: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {status.replace(/_/g, " ")}
    </Box>
  );
}

// NAV sections
const NAV_SECTIONS = [
  { id: "overview",    label: "Overview",     shortLabel: "Home",    icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
  { id: "punch",       label: "Punch",        shortLabel: "Punch",   icon: <LoginIcon sx={{ fontSize: 18 }} /> },
  { id: "calendar",   label: "Calendar",     shortLabel: "Cal",     icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
  { id: "leave",       label: "Leave",        shortLabel: "Leave",   icon: <EventNoteIcon sx={{ fontSize: 18 }} /> },
  { id: "wfh",         label: "WFH / Duty",   shortLabel: "WFH",     icon: <HomeWorkIcon sx={{ fontSize: 18 }} /> },
  { id: "correction",  label: "Correction",   shortLabel: "Fix",     icon: <EditNoteIcon sx={{ fontSize: 18 }} /> },
  { id: "profile",     label: "Profile",      shortLabel: "Me",      icon: <PersonIcon sx={{ fontSize: 18 }} /> },
];

const LEAVE_STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:   { color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)"   },
  APPROVED:  { color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.25)"   },
  REJECTED:  { color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.25)"   },
  CANCELLED: { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.25)" },
  CANCELLATION_REQUESTED: { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)" },
};
const WORK_STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:              { color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)"   },
  MANAGER_RECOMMENDED:  { color: "#2563eb", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.25)"   },
  APPROVED:             { color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.25)"   },
  REJECTED:             { color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.25)"   },
};

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
export default function EmployeePage() {
  const { toastSuccess, toastError } = useToast();

  // Data states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dailyPhotos, setDailyPhotos] = useState<DailyGroupPhoto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [breaks, setBreaks] = useState<BreakEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<Attendance | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [place, setPlace] = useState<PunchPlace | null>(null);

  // UI states
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [clockNow, setClockNow] = useState(dayjs());
  const [punchBusy, setPunchBusy] = useState(false);
  const [placeBusy, setPlaceBusy] = useState(false);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [selfieKind, setSelfieKind] = useState<"checkin" | "checkout">("checkin");
  const [selfieBusy, setSelfieBusy] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [qrCameraOpen, setQrCameraOpen] = useState(false);
  const [qrCameraBusy, setQrCameraBusy] = useState(false);
  const [qrToken, setQrToken] = useState(() => localStorage.getItem("scannedQrToken") || "");
  const [qrOk, setQrOk] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);

  // Form states
  const [leaveFrom, setLeaveFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [leaveTo, setLeaveTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [leaveType, setLeaveType] = useState("Casual leave");
  const [leaveSubject, setLeaveSubject] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveAttachment, setLeaveAttachment] = useState<File | null>(null);
  const [workType, setWorkType] = useState<WorkRequest["type"]>("WORK_FROM_HOME");
  const [workFrom, setWorkFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [workTo, setWorkTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [workReason, setWorkReason] = useState("");
  const [workAttachment, setWorkAttachment] = useState<File | null>(null);
  const [correctionIn, setCorrectionIn] = useState("09:00");
  const [correctionOut, setCorrectionOut] = useState("18:00");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionAttachment, setCorrectionAttachment] = useState<File | null>(null);
  const [compOffOvertimeDate, setCompOffOvertimeDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [compOffDate, setCompOffDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [compOffMinutes, setCompOffMinutes] = useState("60");
  const [compOffReason, setCompOffReason] = useState("");
  const [compOffAttachment, setCompOffAttachment] = useState<File | null>(null);

  // Collapsible sections on mobile
  const [qrExpanded, setQrExpanded] = useState(false);
  const [breakExpanded, setBreakExpanded] = useState(false);

  // Refs
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrScanActiveRef = useRef(false);

  // ── Toast bridge ──
  useEffect(() => { if (err) { toastError(err); setErr(null); } }, [err, toastError]);
  useEffect(() => { if (ok) { toastSuccess(ok); setOk(null); } }, [ok, toastSuccess]);

  // ── API loaders ──
  const loadProfile       = () => api.get<Profile>("/api/employee/profile").then(r => setProfile(r.data));
  const loadAttendance    = (m: string) => api.get<Attendance[]>("/api/employee/attendance", { params: { month: m } }).then(r => setEntries(r.data));
  const loadSummary       = (m: string) => api.get<MonthSummary>("/api/employee/attendance/summary", { params: { month: m } }).then(r => setMonthSummary(r.data));
  const loadSettings      = () => api.get<AttendanceSettings>("/api/settings/attendance").then(r => setSettings(r.data));
  const loadHolidays      = (m: string) => api.get<Holiday[]>("/api/holidays", { params: { month: m } }).then(r => setHolidays(r.data));
  const loadDailyPhotos   = (m: string) => api.get<DailyGroupPhoto[]>("/api/daily-group-photos", { params: { month: m } }).then(r => setDailyPhotos(r.data));
  const loadLeaveRequests = () => api.get<LeaveRequest[]>("/api/employee/leave-requests").then(r => setLeaveRequests(r.data));
  const loadRegReqs       = () => api.get<RegularizationRequest[]>("/api/employee/regularization-requests").then(r => setRegularizationRequests(r.data));
  const loadWorkRequests  = () => api.get<WorkRequest[]>("/api/employee/work-requests").then(r => setWorkRequests(r.data));
  const loadCompOff       = () => api.get<CompOffRequest[]>("/api/employee/comp-off-requests").then(r => setCompOffRequests(r.data));
  const loadBreaks        = () => api.get<BreakEntry[]>("/api/employee/breaks/today").then(r => setBreaks(r.data));
  const loadToday         = () => api.get<Attendance | null>("/api/employee/punch/today").then(r => setTodayEntry(r.data));
  const loadDeviceStatus  = () => api.get<DeviceStatus>("/api/account/devices/current", { params: { deviceId: getDeviceId() } }).then(r => setDeviceStatus(r.data));
  const loadPayslip       = (m: string) => api.get<Payslip>("/api/employee/attendance/payslip", { params: { month: m } }).then(r => setPayslip(r.data)).catch(() => setPayslip(null));

  // ── Initial load ──
  useEffect(() => {
    Promise.all([loadProfile(), loadAttendance(month), loadSummary(month), loadSettings()])
      .then(() => { const t = localStorage.getItem("scannedQrToken"); if (t) verifyQr(t).catch(() => {}); })
      .catch(e => setErr(apiMessage(e, "Failed to load dashboard")));
    [loadPayslip(month), loadHolidays(month), loadDailyPhotos(month), loadLeaveRequests(), loadRegReqs(), loadWorkRequests(), loadCompOff(), loadBreaks(), loadToday(), loadDeviceStatus()]
      .forEach(p => p.catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Month change ──
  useEffect(() => {
    Promise.all([loadAttendance(month), loadSummary(month)]).catch(e => setErr(apiMessage(e, "Failed to load attendance")));
    loadPayslip(month); loadHolidays(month).catch(() => {}); loadDailyPhotos(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // ── Live clock ──
  useEffect(() => {
    setClockNow(dayjs());
    if (!todayEntry?.inTime || todayEntry?.outTime) return undefined;
    const t = window.setInterval(() => setClockNow(dayjs()), 1000);
    return () => window.clearInterval(t);
  }, [todayEntry?.inTime, todayEntry?.outTime]);

  // ── Cleanup on unmount ──
  useEffect(() => () => { stopSelfieCamera(); stopQrCamera(); }, []);

  // ── Selected date guard ──
  useEffect(() => {
    const start = `${month}-01`;
    const end = dayjs(start).endOf("month").format("YYYY-MM-DD");
    const from = monthSummary?.fromDate ?? start;
    let d = selectedDate;
    if (!d.startsWith(`${month}-`)) d = from;
    if (d < from) d = from;
    if (d > end) d = end;
    if (d !== selectedDate) setSelectedDate(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, monthSummary]);

  // ── QR helpers ──
  async function verifyQr(token = qrToken): Promise<boolean> {
    let tok = token.trim();
    if (tok.includes("qrToken=")) {
      try { const u = new URL(tok); tok = u.searchParams.get("qrToken")?.trim() ?? tok; }
      catch { const m = tok.match(/qrToken=([^&]+)/); if (m?.[1]) tok = m[1].trim(); }
    }
    setQrOk(false); setQrMessage(null);
    if (!tok) { setErr("Scan or enter office QR token first"); return false; }
    try {
      const res = await api.get<{ valid: boolean; officeId?: number; officeName?: string; expiresAt?: string; dailyCode?: string }>("/api/employee/punch/qr", { params: { token: tok } });
      const aid = profile?.assignedOfficeLocation?.id;
      if (aid && res.data.officeId && aid !== res.data.officeId) {
        const msg = `QR for ${res.data.officeName ?? "another office"}. Use your assigned office QR.`;
        setQrMessage(msg); setErr(msg); return false;
      }
      setQrToken(tok); localStorage.setItem("scannedQrToken", tok); setQrOk(true);
      setQrMessage(`✓ Verified: ${res.data.officeName ?? "Office"}${res.data.dailyCode ? ` · Code ${res.data.dailyCode}` : ""}`);
      setOk(`QR OK · Expires ${res.data.expiresAt ? new Date(res.data.expiresAt).toLocaleTimeString() : "--"}`);
      return true;
    } catch (e: any) { const msg = e?.response?.data?.error ?? "QR verification failed"; setQrMessage(`✗ ${msg}`); setErr(msg); return false; }
  }

  function decodeQrFromCanvas(src: CanvasImageSource, w: number, h: number) {
    if (w <= 0 || h <= 0) return null;
    const max = 600; let cw = w, ch = h;
    if (cw > max || ch > max) { if (cw > ch) { ch = Math.round(ch * max / cw); cw = max; } else { cw = Math.round(cw * max / ch); ch = max; } }
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return null;
    ctx.drawImage(src, 0, 0, cw, ch);
    return jsQR(ctx.getImageData(0, 0, cw, ch).data, cw, ch, { inversionAttempts: "attemptBoth" })?.data?.trim() || null;
  }

  async function scanQrImage(file: File) {
    try {
      let val: string | null = null;
      if ("createImageBitmap" in window) { try { const bm = await createImageBitmap(file); val = decodeQrFromCanvas(bm, bm.width, bm.height); bm.close?.(); } catch {} }
      if (!val) { const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); const u = URL.createObjectURL(file); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(); }; i.src = u; }); val = decodeQrFromCanvas(img, img.naturalWidth, img.naturalHeight); }
      if (!val) { setErr("No QR code found in image"); return; }
      await verifyQr(val);
    } catch { setErr("QR scan failed"); }
  }

  async function startQrCamera() {
    setQrCameraBusy(true);
    try {
      stopQrCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      qrStreamRef.current = stream; setQrCameraOpen(true);
      await new Promise(r => setTimeout(r, 120));
      if (qrVideoRef.current) { qrVideoRef.current.srcObject = stream; await qrVideoRef.current.play(); }
      qrScanActiveRef.current = true;
      const Det = (window as any).BarcodeDetector;
      scanQrFromCamera(Det ? new Det({ formats: ["qr_code"] }) : null);
    } catch (e: any) { setErr(e?.message ?? "Camera unavailable"); stopQrCamera(); }
    finally { setQrCameraBusy(false); }
  }
  function stopQrCamera() {
    qrScanActiveRef.current = false;
    qrStreamRef.current?.getTracks().forEach(t => t.stop()); qrStreamRef.current = null;
    if (qrVideoRef.current) qrVideoRef.current.srcObject = null;
    setQrCameraOpen(false);
  }
  async function scanQrFromCamera(det: any) {
    if (!qrScanActiveRef.current) return;
    try {
      const v = qrVideoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth > 0) {
        let val = det ? (await det.detect(v))?.[0]?.rawValue?.trim() : null;
        if (!val) val = decodeQrFromCanvas(v, v.videoWidth, v.videoHeight);
        if (val) { stopQrCamera(); await verifyQr(val); return; }
      }
    } catch {}
    window.setTimeout(() => scanQrFromCamera(det), 350);
  }

  // ── Location ──
  function getLocation() {
    return new Promise<{ latitude: number; longitude: number }>((res, rej) => {
      if (!navigator.geolocation) return rej(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), rej, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }
  async function verifyPlace() {
    setPlaceBusy(true);
    try {
      const loc = await getLocation();
      const res = await api.get<PunchPlace>("/api/employee/punch/place", { params: loc });
      setPlace(res.data);
      if (res.data.insideRadius) setOk(`Location OK · ${Math.round(res.data.distanceMeters)}m from office`);
      else setErr(`Outside office radius · ${Math.round(res.data.distanceMeters)}m (limit ${Math.round(res.data.allowedRadiusMeters)}m)`);
      return { ...loc, place: res.data };
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? "Location failed"); return null; }
    finally { setPlaceBusy(false); }
  }

  // ── Punch ──
  async function punch(kind: "checkin" | "checkout", file: File) {
    setPunchBusy(true);
    try {
      const qrReq = settings?.requireQrForPunch && !(kind === "checkout" && todayEntry?.inTime);
      if (qrReq) { const ok = qrOk || await verifyQr(); if (!ok) return; }
      else if (qrToken.trim() && !qrOk) { const ok = await verifyQr(); if (!ok) return; }
      const verified = await verifyPlace();
      if (!verified?.place.insideRadius) return;
      if (!deviceStatus?.approved) { setErr("Device not approved. Register and wait for admin approval."); return; }
      const fd = new FormData();
      fd.append("latitude", String(verified.latitude));
      fd.append("longitude", String(verified.longitude));
      if (qrToken.trim()) fd.append("qrToken", qrToken.trim());
      fd.append("deviceId", deviceStatus.deviceId);
      fd.append("file", file);
      const res = await api.post<Attendance>(`/api/employee/punch/${kind}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setTodayEntry(res.data);
      setOk(kind === "checkin" ? "✓ Checked in successfully" : "✓ Checked out successfully");
      const today = dayjs().format("YYYY-MM-DD");
      setEntries(prev => { const i = prev.findIndex(e => e.date === today); if (i === -1) return [res.data, ...prev]; const n = [...prev]; n[i] = { ...n[i], ...res.data }; return n; });
      loadSummary(month).catch(() => {});
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? "Punch failed"); }
    finally { setPunchBusy(false); }
  }

  async function openSelfieCamera(kind: "checkin" | "checkout") {
    setSelfieKind(kind); setSelfieBusy(true);
    try {
      stopSelfieCamera();
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" } }, audio: false });
      selfieStreamRef.current = s; setSelfieOpen(true);
      await new Promise(r => setTimeout(r, 120));
      if (selfieVideoRef.current) { selfieVideoRef.current.srcObject = s; await selfieVideoRef.current.play(); }
    } catch (e: any) { setErr(e?.message ?? "Camera unavailable"); stopSelfieCamera(); }
    finally { setSelfieBusy(false); }
  }
  function stopSelfieCamera() {
    selfieStreamRef.current?.getTracks().forEach(t => t.stop()); selfieStreamRef.current = null;
    if (selfieVideoRef.current) selfieVideoRef.current.srcObject = null;
    setSelfieOpen(false);
  }
  async function captureSelfieAndPunch() {
    const v = selfieVideoRef.current;
    if (!v || v.videoWidth <= 0) { setErr("Camera not ready"); return; }
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d"); if (!ctx) { setErr("Cannot capture"); return; }
    ctx.drawImage(v, 0, 0);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", 0.92));
    if (!blob) { setErr("Cannot capture"); return; }
    const file = new File([blob], `${selfieKind}-${dayjs().format("YYYYMMDDHHmmss")}.jpg`, { type: "image/jpeg" });
    stopSelfieCamera();
    await punch(selfieKind, file);
  }

  // ── Upload profile photo ──
  async function uploadProfilePhoto(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const res = await api.post<Profile>("/api/employee/profile/photo", fd);
    setProfile(res.data); setOk("Profile photo saved as face reference");
  }

  // ── Leave ──
  async function submitLeaveRequest() {
    if (!leaveReason.trim()) { setErr("Leave reason is required"); return; }
    const res = await api.post<LeaveRequest>("/api/employee/leave-requests", { fromDate: leaveFrom, toDate: leaveTo, reason: leaveReason.trim(), leaveType, mailSubject: leaveSubject.trim() || `Leave: ${leaveFrom} to ${leaveTo}`, mailMessage: leaveMessage.trim() || leaveReason.trim() });
    if (leaveAttachment) { const fd = new FormData(); fd.append("file", leaveAttachment); await api.post(`/api/employee/leave-requests/${res.data.id}/attachment`, fd); }
    setOk("Leave request submitted"); setLeaveOpen(false); setLeaveSubject(""); setLeaveMessage(""); setLeaveReason(""); setLeaveAttachment(null);
    await loadLeaveRequests();
  }
  async function cancelLeave(id: number) {
    await api.post(`/api/employee/leave-requests/${id}/cancel`, { reason: "Cancelled by employee" });
    setOk("Leave cancelled"); await loadLeaveRequests();
  }

  // ── Correction ──
  async function submitRegularizationRequest() {
    if (!correctionReason.trim()) { setErr("Reason is required"); return; }
    const res = await api.post<RegularizationRequest>("/api/employee/regularization-requests", { date: selectedDate, inTime: correctionIn || null, outTime: correctionOut || null, reason: correctionReason.trim() });
    if (correctionAttachment) { const fd = new FormData(); fd.append("file", correctionAttachment); await api.post(`/api/employee/regularization-requests/${res.data.id}/attachment`, fd); }
    setCorrectionReason(""); setCorrectionAttachment(null); setOk("Correction submitted"); await loadRegReqs();
  }

  // ── Work request ──
  async function submitWorkRequest() {
    if (!workReason.trim()) { setErr("Reason is required"); return; }
    const res = await api.post<WorkRequest>("/api/employee/work-requests", { type: workType, fromDate: workFrom, toDate: workTo, reason: workReason.trim() });
    if (workAttachment) { const fd = new FormData(); fd.append("file", workAttachment); await api.post(`/api/employee/work-requests/${res.data.id}/attachment`, fd); }
    setWorkReason(""); setWorkAttachment(null); setOk("Work request submitted"); await loadWorkRequests();
  }

  // ── Comp-off ──
  async function submitCompOffRequest() {
    if (!compOffReason.trim()) { setErr("Reason is required"); return; }
    const res = await api.post<CompOffRequest>("/api/employee/comp-off-requests", { overtimeDate: compOffOvertimeDate, requestedDate: compOffDate, overtimeMinutes: Number(compOffMinutes), reason: compOffReason.trim() });
    if (compOffAttachment) { const fd = new FormData(); fd.append("file", compOffAttachment); await api.post(`/api/employee/comp-off-requests/${res.data.id}/attachment`, fd); }
    setCompOffReason(""); setCompOffAttachment(null); setOk("Comp-off submitted"); await loadCompOff();
  }

  // ── Breaks ──
  async function startBreak() { await api.post("/api/employee/breaks/start"); setOk("Break started"); await loadBreaks(); }
  async function endBreak() { await api.post("/api/employee/breaks/end"); setOk("Break ended"); await loadBreaks(); }

  // ── Export ──
  async function exportAttendance() {
    try { const res = await api.get<Blob>("/api/employee/attendance/export", { params: { month }, responseType: "blob" }); downloadBlob(res.data, `attendance-${month}.csv`); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Export failed"); }
  }
  async function exportPdf() {
    try { const res = await api.get<Blob>("/api/employee/attendance/report.pdf", { params: { month }, responseType: "blob" }); downloadBlob(res.data, `attendance-${month}.pdf`); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "PDF export failed"); }
  }

  // ── Register device ──
  async function registerDevice() {
    const deviceId = getDeviceId();
    const label = `${navigator.platform || "Browser"} · ${new Date().toLocaleDateString()}`;
    const res = await api.post<DeviceStatus>("/api/account/devices", { deviceId, label });
    setDeviceStatus({ deviceId: res.data.deviceId, approved: res.data.approved });
    setOk("Device registered. Waiting for admin approval.");
  }

  // ── Derived values ──
  const statusByDate: Record<string, DayStatus> = useMemo(() => {
    if (!settings || !monthSummary) return {};
    const entryMap: Record<string, DayStatus> = {};
    for (const e of entries) entryMap[e.date] = e.status === "PRESENT" ? "P" : e.status === "HALF_DAY" ? "HD" : "L";
    const holidays_ = new Set(holidays.map(h => h.date));
    const weekends_ = new Set((settings.weekendDays ?? "SUNDAY").split(",").map(s => s.trim().toUpperCase()));
    const first = dayjs(`${month}-01`);
    const today = dayjs().format("YYYY-MM-DD");
    const out: Record<string, DayStatus> = {};
    for (let d = 1; d <= first.daysInMonth(); d++) {
      const dt = first.date(d).format("YYYY-MM-DD");
      if (dt < monthSummary.fromDate) { out[dt] = ""; continue; }
      const dow = first.date(d).format("dddd").toUpperCase();
      if (holidays_.has(dt) || weekends_.has(dow)) out[dt] = "H";
      else out[dt] = dt <= today ? (entryMap[dt] ?? "L") : (entryMap[dt] ?? "");
    }
    return out;
  }, [entries, holidays, month, monthSummary, settings]);

  const selectedEntry = useMemo(() => entries.find(e => e.date === selectedDate), [entries, selectedDate]);
  const selectedHoliday = useMemo(() => holidays.find(h => h.date === selectedDate), [holidays, selectedDate]);
  const selectedDailyPhoto = useMemo(() => dailyPhotos.find(p => p.date === selectedDate), [dailyPhotos, selectedDate]);

  const presentCount  = useMemo(() => entries.filter(e => e.status === "PRESENT").length, [entries]);
  const halfDayCount  = useMemo(() => entries.filter(e => e.status === "HALF_DAY").length, [entries]);
  const leaveCount    = useMemo(() => entries.filter(e => e.status === "LEAVE").length, [entries]);
  const workedMinutes = monthSummary?.totalWorkedMinutes ?? entries.reduce((a, e) => a + (e.workedMinutes ?? 0), 0);
  const totalLateMin  = useMemo(() => entries.reduce((a, e) => a + (e.lateMinutes ?? 0), 0), [entries]);
  const totalOTMin    = useMemo(() => entries.reduce((a, e) => a + (e.overtimeMinutes ?? 0), 0), [entries]);
  const hh = Math.floor(workedMinutes / 60), mm = workedMinutes % 60;

  const punchCountdown = useMemo(() => {
    const checkedInAt = parseEntryClock(todayEntry?.inTime, todayEntry?.date);
    if (!checkedInAt) return null;
    const checkedOutAt = entryEndClock(checkedInAt, todayEntry?.outTime, todayEntry?.date);
    const reqMin = (settings?.fullDayMinutes ?? 480);
    const targetSec = reqMin * 60;
    const end = checkedOutAt || clockNow;
    const workedSec = Math.max(0, end.diff(checkedInAt, "second"));
    const extraSec = Math.max(0, workedSec - targetSec);
    const remSec = Math.max(0, targetSec - workedSec);
    const H = String(Math.floor(workedSec / 3600)).padStart(2, "0");
    const M = String(Math.floor((workedSec % 3600) / 60)).padStart(2, "0");
    const S = String(workedSec % 60).padStart(2, "0");
    if (checkedOutAt) return { label: "Shift completed", H, M, S, value: formatDurationSeconds(workedSec), helper: `Regular ${formatDurationSeconds(targetSec)} · Extra ${formatDurationSeconds(extraSec)}`, accent: "#16a34a", state: "COMPLETED", badge: "🎉 Done", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", glow: "0 14px 48px rgba(22,163,74,0.18)", progress: 100 };
    if (extraSec === 0) return { label: "Working", H, M, S, value: formatDurationSeconds(workedSec), helper: `${formatDurationSeconds(remSec)} left for ${Math.round(reqMin / 60)}h target`, accent: "#4f46e5", state: "PROGRESS", badge: "⚡ Active", bg: "linear-gradient(135deg,#eef2ff,#dbeafe)", glow: "0 14px 48px rgba(79,70,229,0.15)", progress: Math.min(100, Math.round((workedSec / targetSec) * 100)) };
    return { label: "Overtime", H, M, S, value: formatDurationSeconds(workedSec), helper: `Regular done · Extra ${formatDurationSeconds(extraSec)}`, accent: "#d97706", state: "OVERTIME", badge: "🔥 OT", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", glow: "0 14px 48px rgba(217,119,6,0.18)", progress: 100 };
  }, [clockNow, settings?.fullDayMinutes, todayEntry?.date, todayEntry?.inTime, todayEntry?.outTime]);

  const punchButtonState = !todayEntry?.inTime ? "checkin" : !todayEntry?.outTime ? "checkout" : "done";
  const selectedStatusColor = { P: "#16a34a", HD: "#f59e0b", H: "#7c3aed", L: "#dc2626", "": "#64748b" }[statusByDate[selectedDate] ?? ""] ?? "#64748b";

  // ── Shared keyframe styles ──
  const CSS = `
    @keyframes _liveRing{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.15);opacity:.2}}
    @keyframes _liveDot{0%,100%{transform:scale(.8);opacity:.5}50%{transform:scale(1.3);opacity:1}}
    @keyframes _secBounce{0%,100%{transform:scale(1) translateY(0)}15%{transform:scale(1.08) translateY(-2px)}30%{transform:scale(.96) translateY(0)}}
    @keyframes _navPop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes _pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes _shine{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes _heroIn{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes _cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes _scanLine{0%,100%{top:5%;opacity:.6}50%{top:88%;opacity:1}}
    .emp-hero{animation:_heroIn .55s cubic-bezier(.2,.8,.2,1) both}
    .emp-section{animation:_cardIn .45s cubic-bezier(.2,.8,.2,1) both}
    .emp-stat:nth-child(1){animation:_cardIn .4s .04s both}
    .emp-stat:nth-child(2){animation:_cardIn .4s .08s both}
    .emp-stat:nth-child(3){animation:_cardIn .4s .12s both}
    .emp-stat:nth-child(4){animation:_cardIn .4s .16s both}
    .emp-stat:nth-child(5){animation:_cardIn .4s .20s both}
    .emp-stat:nth-child(6){animation:_cardIn .4s .24s both}
    .emp-nav{animation:_navPop .4s .15s cubic-bezier(.2,.8,.2,1) both}
  `;

  // ── RENDER ──
  return (
    <Layout title="My Dashboard">
      <style>{CSS}</style>

      {/* ── STICKY SECTION NAV ── */}
      <Box
        className="emp-nav"
        sx={{
          display: "flex",
          gap: { xs: 0.5, sm: 0.75 },
          p: { xs: 0.75, sm: 1 },
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(226,232,240,0.85)",
          borderRadius: { xs: 2.5, sm: 3 },
          boxShadow: "0 4px 20px rgba(15,23,42,0.07)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: { xs: 70, md: 80 },
          zIndex: 9,
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {NAV_SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <Button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                const el = document.getElementById(`section-${s.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              startIcon={<Box sx={{ display: { xs: "none", sm: "flex" } }}>{s.icon}</Box>}
              sx={{
                flex: { xs: "0 0 auto", sm: 1 },
                minWidth: { xs: 56, sm: "auto" },
                minHeight: { xs: 38, sm: 42 },
                borderRadius: { xs: 2, sm: 2.5 },
                fontSize: { xs: 10, sm: 12, md: 13 },
                fontWeight: active ? 800 : 600,
                flexDirection: { xs: "column", sm: "row" },
                gap: 0.25,
                px: { xs: 0.75, sm: 1.5 },
                py: { xs: 0.5, sm: 0 },
                color: active ? "#fff" : "#475569",
                background: active ? "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)" : "transparent",
                boxShadow: active ? "0 4px 16px rgba(79,70,229,0.28)" : "none",
                transition: "all 0.2s cubic-bezier(0.2,0.8,0.2,1)",
                "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.5 }, display: { xs: "none", sm: "flex" } },
                "&:hover": {
                  background: active ? "linear-gradient(135deg,#6366f1,#3b82f6)" : "rgba(79,70,229,0.07)",
                  color: active ? "#fff" : "#4f46e5",
                  transform: "translateY(-1px)",
                },
                whiteSpace: "nowrap",
              }}
            >
              <Box sx={{ display: { xs: "flex", sm: "none" }, mb: 0.25 }}>{s.icon}</Box>
              <Box component="span" sx={{ display: { xs: "block", sm: "none" }, fontSize: 9, fontWeight: 700, letterSpacing: "0.02em" }}>{s.shortLabel}</Box>
              <Box component="span" sx={{ display: { xs: "none", sm: "block" } }}>{s.label}</Box>
            </Button>
          );
        })}
      </Box>

      {/* ── LIVE TIMER BANNER ── */}
      {punchCountdown && (
        <Box
          className="emp-section"
          sx={{
            background: punchCountdown.bg,
            border: `1.5px solid ${punchCountdown.accent}28`,
            borderRadius: { xs: 2.5, sm: 3 },
            p: { xs: 2, sm: 2.5, md: 3 },
            boxShadow: punchCountdown.glow,
          }}
        >
          {/* Header row */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {punchCountdown.state !== "COMPLETED" && (
                <Box sx={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
                  <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: punchCountdown.accent, opacity: 0.2, animation: "_liveRing 2s infinite" }} />
                  <Box sx={{ position: "absolute", inset: "22%", borderRadius: "50%", bgcolor: punchCountdown.accent, animation: "_liveDot 1.8s infinite ease-in-out" }} />
                </Box>
              )}
              <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 900, color: punchCountdown.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {punchCountdown.label}
              </Typography>
            </Box>
            <Chip
              label={punchCountdown.badge}
              size="small"
              sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 12 }, color: "#fff", bgcolor: punchCountdown.accent, boxShadow: `0 4px 12px ${punchCountdown.accent}45`, height: 28, "& .MuiChip-label": { px: 1.25 } }}
            />
          </Box>

          {/* Segmented clock */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.25, md: 1.75 }, flexWrap: "nowrap", overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
            {[{ l: "HRS", v: punchCountdown.H }, { l: "MIN", v: punchCountdown.M }, { l: "SEC", v: punchCountdown.S }].map((seg, i) => (
              <Box key={seg.l} sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
                {i > 0 && (
                  <Typography sx={{ fontSize: { xs: 22, sm: 32, md: 44 }, fontWeight: 900, color: `${punchCountdown.accent}55`, lineHeight: 1, fontVariantNumeric: "tabular-nums", animation: "_pulse 1s infinite" }}>:</Typography>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{
                    px: { xs: 1.25, sm: 1.75, md: 2.25 },
                    py: { xs: 0.75, sm: 1, md: 1.25 },
                    borderRadius: { xs: 2, sm: 2.5 },
                    bgcolor: `${punchCountdown.accent}10`,
                    border: `1.5px solid ${punchCountdown.accent}25`,
                    minWidth: { xs: 50, sm: 66, md: 80 },
                    textAlign: "center",
                    boxShadow: `inset 0 2px 8px ${punchCountdown.accent}08`,
                  }}>
                    <Typography sx={{
                      color: punchCountdown.accent,
                      fontSize: { xs: 26, sm: 36, md: 48 },
                      fontWeight: 900, fontFamily: "'Inter', monospace",
                      fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
                      animation: seg.l === "SEC" ? "_secBounce 1s infinite" : "none",
                    }}>
                      {seg.v}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: { xs: 8, sm: 9 }, fontWeight: 900, color: `${punchCountdown.accent}70`, mt: 0.5, letterSpacing: "0.08em" }}>{seg.l}</Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ flex: 1, display: { xs: "none", sm: "flex" }, flexDirection: "column", justifyContent: "center", pl: 1 }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>{punchCountdown.helper}</Typography>
            </Box>
          </Box>

          {/* Progress bar */}
          {punchCountdown.state === "PROGRESS" && (
            <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 700, color: "text.secondary" }}>Progress to full day</Typography>
                <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 800, color: punchCountdown.accent }}>{punchCountdown.progress}%</Typography>
              </Box>
              <Box sx={{ height: { xs: 6, sm: 8 }, borderRadius: 99, bgcolor: `${punchCountdown.accent}15`, overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${punchCountdown.progress}%`, borderRadius: 99, background: `linear-gradient(90deg, ${punchCountdown.accent}80, ${punchCountdown.accent})`, transition: "width 1s cubic-bezier(0.2,0.8,0.2,1)", boxShadow: `0 0 10px ${punchCountdown.accent}50` }} />
              </Box>
            </Box>
          )}

          <Typography sx={{ mt: 1.25, fontSize: { xs: 11, sm: 12 }, color: "text.secondary", display: { xs: "block", sm: "none" } }}>{punchCountdown.helper}</Typography>
        </Box>
      )}

      {/* ════════════ OVERVIEW ════════════ */}
      <div id="section-overview" className="emp-section">
        {/* Profile Hero */}
        <Box
          className="emp-hero"
          sx={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #1d4ed8 45%, #0f766e 100%)",
            borderRadius: { xs: 3, sm: 3.5 },
            p: { xs: 2, sm: 2.5, md: 3.5 },
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(30,27,75,0.35)",
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{ position: "absolute", top: { xs: -40, sm: -60 }, right: { xs: -40, sm: -60 }, width: { xs: 140, sm: 200 }, height: { xs: 140, sm: 200 }, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <Box sx={{ position: "absolute", bottom: { xs: -30, sm: -40 }, left: { xs: 60, sm: 120 }, width: { xs: 100, sm: 140 }, height: { xs: 100, sm: 140 }, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, gap: { xs: 1.75, sm: 2.5 }, flexWrap: { xs: "wrap", lg: "nowrap" }, position: "relative" }}>
            {/* Avatar */}
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined}
                sx={{ width: { xs: 60, sm: 76, md: 92 }, height: { xs: 60, sm: 76, md: 92 }, border: "3px solid rgba(255,255,255,0.4)", boxShadow: "0 8px 28px rgba(0,0,0,0.25)", bgcolor: "rgba(255,255,255,0.15)", fontSize: { xs: 24, sm: 30, md: 36 }, fontWeight: 900 }}
              >
                {profile?.name?.[0] ?? "E"}
              </Avatar>
              {todayEntry?.inTime && !todayEntry?.outTime && (
                <Box sx={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: "50%", bgcolor: "#22c55e", border: "2.5px solid white", animation: "_liveDot 2s infinite" }} />
              )}
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 18, sm: 24, md: 30 }, fontWeight: 900, color: "#fff", lineHeight: 1.15, wordBreak: "break-word" }}>
                {profile?.name ?? "Loading..."}
              </Typography>
              <Typography sx={{ mt: 0.4, color: "rgba(255,255,255,0.72)", fontSize: { xs: 12, sm: 13 }, fontWeight: 500 }}>
                {profile?.companyRole?.name ?? "--"} · {profile?.department?.name ?? "--"} · {profile?.employeeNumber ?? ""}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75, mt: 1.25, flexWrap: "wrap" }}>
                {[
                  { icon: <WorkIcon sx={{ fontSize: 11 }} />, label: profile?.shift ? `${profile.shift.name} (${profile.shift.inTime?.slice(0, 5)}–${profile.shift.outTime?.slice(0, 5)})` : "No shift" },
                  { icon: <LocationOnIcon sx={{ fontSize: 11 }} />, label: profile?.assignedOfficeLocation?.officeName ?? "Default office" },
                ].map(tag => (
                  <Chip
                    key={tag.label}
                    icon={<Box sx={{ color: "rgba(255,255,255,0.8) !important", display: "flex" }}>{tag.icon}</Box>}
                    label={tag.label}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 600, fontSize: { xs: 10, sm: 11 }, "& .MuiChip-label": { pl: 0.5 }, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.18)", height: 24 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Export buttons */}
            <Box sx={{ display: "flex", flexDirection: { xs: "row", sm: "column" }, gap: 1, width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
              <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={exportAttendance} size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 700, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 2, flex: { xs: 1, sm: "none" }, fontSize: { xs: 11, sm: 12 }, "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}>
                CSV
              </Button>
              <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={exportPdf} size="small"
                sx={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", fontWeight: 700, borderRadius: 2, flex: { xs: 1, sm: "none" }, fontSize: { xs: 11, sm: 12 }, "&:hover": { bgcolor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.6)" } }}>
                PDF
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stat cards grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3,1fr)", lg: "repeat(6,1fr)" }, gap: { xs: 1, sm: 1.5, md: 2 } }}>
          {[
            { label: "Working Days",  val: monthSummary?.workingDays ?? "-",     icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />, color: "#2563eb" },
            { label: "Present",       val: monthSummary?.presentDays ?? presentCount, icon: <CheckCircleIcon sx={{ fontSize: 20 }} />, color: "#16a34a" },
            { label: "Half Days",     val: monthSummary?.halfDayDays ?? halfDayCount, icon: <AccessTimeIcon sx={{ fontSize: 20 }} />,  color: "#f59e0b" },
            { label: "Leave/Absent",  val: monthSummary?.leaveDays ?? leaveCount,icon: <EventNoteIcon sx={{ fontSize: 20 }} />,     color: "#dc2626" },
            { label: "Hours Worked",  val: `${hh}h ${mm}m`,                      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,   color: "#7c3aed" },
            { label: "Overtime",      val: `${Math.floor(totalOTMin / 60)}h ${totalOTMin % 60}m`, icon: <FlashOnIcon sx={{ fontSize: 20 }} />, color: "#d97706" },
          ].map((s, idx) => (
            <Box
              key={s.label}
              className="emp-stat"
              sx={{
                background: "#fff",
                border: "1px solid rgba(226,232,240,0.8)",
                borderRadius: { xs: 2.5, sm: 3 },
                p: { xs: 1.5, sm: 1.75, md: 2 },
                boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
                position: "relative", overflow: "hidden", cursor: "default",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${s.color}18` },
                "&::after": { content: '""', position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, borderRadius: "0 0 2.5px 2.5px", transform: "scaleX(0.4)", transformOrigin: "left", transition: "transform 0.3s ease" },
                "&:hover::after": { transform: "scaleX(1)" },
                "&::before": { content: '""', position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${s.color}12 0%, transparent 70%)`, transition: "transform 0.3s ease, opacity 0.3s ease", opacity: 0 },
                "&:hover::before": { opacity: 1, transform: "scale(2)" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", lineHeight: 1 }}>{s.label}</Typography>
                  <Typography sx={{ mt: { xs: 0.5, sm: 0.75 }, fontSize: { xs: 20, sm: 22, md: 26 }, fontWeight: 900, color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color 0.2s" }}>{s.val}</Typography>
                </Box>
                <Box sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: 2, bgcolor: `${s.color}10`, display: "grid", placeItems: "center", color: s.color, border: `1px solid ${s.color}20`, flexShrink: 0, transition: "transform 0.25s ease, box-shadow 0.25s ease", "&:hover": { transform: "scale(1.12) rotate(-6deg)", boxShadow: `0 6px 18px ${s.color}28` } }}>
                  {s.icon}
                </Box>
              </Box>
              <Typography sx={{ mt: { xs: 0.5, sm: 0.75 }, fontSize: { xs: 10, sm: 11 }, color: "text.secondary", position: "relative", zIndex: 1 }}>This month</Typography>
            </Box>
          ))}
        </Box>

        {/* Payslip */}
        {payslip && (
          <GlassCard accentColor="linear-gradient(180deg,#7c3aed,#4f46e5)">
            <SectionTitle icon={<CurrencyRupeeIcon sx={{ fontSize: 16 }} />} subtitle="Monthly pay breakdown.">
              Payslip — {payslip.month}
            </SectionTitle>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: { xs: 1, sm: 1.5 } }}>
              {[
                { label: "Payable Days", val: payslip.payableDays,                color: "#7c3aed" },
                { label: "Net Pay",      val: `₹${payslip.netPay.toLocaleString()}`, color: "#16a34a" },
                { label: "Deduction",    val: `₹${payslip.totalDeductions.toLocaleString()}`, color: "#dc2626" },
                { label: "OT Pay",       val: `₹${payslip.overtimePay.toLocaleString()}`, color: "#d97706" },
              ].map(m => (
                <Box key={m.label} sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: `${m.color}07`, border: `1px solid ${m.color}18`, transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
                  <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: { xs: 16, sm: 18, md: 20 }, fontWeight: 900, color: m.color }}>{m.val}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 1.5, fontSize: { xs: 11, sm: 12 }, color: "text.secondary" }}>Base ₹{payslip.baseSalary.toLocaleString()} · Late ₹{payslip.lateDeduction.toLocaleString()} deducted · Unpaid ₹{payslip.unpaidLeaveDeduction.toLocaleString()}</Typography>
          </GlassCard>
        )}
      </div>

      {/* ════════════ PUNCH IN / OUT ════════════ */}
      <div id="section-punch" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg,#2563eb,#0f766e)">
          <SectionTitle icon={<LoginIcon sx={{ fontSize: 16 }} />} subtitle={`Check-in/out: approved device + GPS + selfie inside office radius${settings?.requireQrForPunch ? " + QR" : ""}.`}>
            Attendance Punch
          </SectionTitle>

          {/* Face photo warning */}
          {!profile?.profilePhotoUrl && (
            <Box sx={{ mb: 2, p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: "#92400e" }}>⚠ Face reference photo required</Typography>
                <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: "text.secondary", mt: 0.25 }}>Upload a clear face photo for face-recognition verification.</Typography>
              </Box>
              <Button variant="outlined" component="label" size="small" sx={{ borderColor: "#f59e0b", color: "#92400e", fontWeight: 700, borderRadius: 2, flexShrink: 0, fontSize: 12 }}>
                Upload
                <input hidden type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch(e => setErr(apiMessage(e, "Upload failed"))); }} />
              </Button>
            </Box>
          )}

          {/* Device status */}
          <Box sx={{ mb: 2, p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: deviceStatus?.approved ? "rgba(22,163,74,0.05)" : "rgba(245,158,11,0.05)", border: `1px solid ${deviceStatus?.approved ? "rgba(22,163,74,0.22)" : "rgba(245,158,11,0.22)"}`, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: deviceStatus?.approved ? "#15803d" : "#92400e" }}>
                {deviceStatus?.approved ? "✓ Device Approved" : "⏳ Pending Approval"}
              </Typography>
              <Typography sx={{ fontSize: { xs: 9, sm: 10.5 }, color: "text.secondary", mt: 0.2, wordBreak: "break-all" }}>ID: {deviceStatus?.deviceId ?? getDeviceId()}</Typography>
            </Box>
            {!deviceStatus?.approved && (
              <Button size="small" variant="outlined" onClick={() => registerDevice().catch(e => setErr(apiMessage(e, "Registration failed")))} sx={{ borderRadius: 2, fontWeight: 700, flexShrink: 0, fontSize: 12 }}>
                Register
              </Button>
            )}
          </Box>

          {/* QR (collapsible on mobile) */}
          {!todayEntry?.inTime && (
            <Box sx={{ mb: 2, borderRadius: 2.5, border: "1px solid rgba(37,99,235,0.12)", overflow: "hidden" }}>
              <Box
                onClick={() => setQrExpanded(v => !v)}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 1.5, sm: 2 }, py: { xs: 1.25, sm: 1.5 }, bgcolor: "rgba(37,99,235,0.04)", cursor: "pointer", "&:hover": { bgcolor: "rgba(37,99,235,0.07)" } }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <QrCodeScannerIcon sx={{ fontSize: 16, color: "#2563eb" }} />
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: "#1e40af" }}>QR Verification {settings?.requireQrForPunch ? "(Required)" : "(Optional)"}</Typography>
                  {qrOk && <Chip label="✓" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800, height: 20, "& .MuiChip-label": { px: 0.75 } }} />}
                </Box>
                {qrExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: "#2563eb" }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: "#2563eb" }} />}
              </Box>
              <Collapse in={qrExpanded}>
                <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "grid", gap: 1.25 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1 }}>
                    <TextField label="QR Token" value={qrToken} onChange={e => { setQrToken(e.target.value); setQrOk(false); setQrMessage(null); }} placeholder="Scan or paste token" size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                    <Button variant={qrOk ? "contained" : "outlined"} onClick={() => verifyQr()} sx={{ borderRadius: 2, fontWeight: 700, minWidth: 110, bgcolor: qrOk ? "#16a34a" : undefined, "&:hover": { bgcolor: qrOk ? "#15803d" : undefined } }}>
                      {qrOk ? "✓ OK" : "Verify"}
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="contained" size="small" onClick={startQrCamera} disabled={qrCameraBusy} startIcon={<QrCodeScannerIcon sx={{ fontSize: 14 }} />} sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>
                      {qrCameraBusy ? "Opening..." : "Scan Camera"}
                    </Button>
                    <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>
                      From Image
                      <input hidden type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) scanQrImage(f); }} />
                    </Button>
                  </Box>
                  {qrMessage && <Typography sx={{ fontSize: 12, fontWeight: 700, color: qrOk ? "#15803d" : "#dc2626" }}>{qrMessage}</Typography>}
                  {qrCameraOpen && (
                    <Box sx={{ borderRadius: 2.5, overflow: "hidden", border: "2px solid #2563eb", position: "relative", bgcolor: "#111827" }}>
                      <Box component="video" ref={qrVideoRef} muted playsInline sx={{ width: "100%", maxHeight: { xs: 220, sm: 280 }, display: "block", objectFit: "cover" }} />
                      <Box sx={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(to right,transparent,#3b82f6,transparent)", boxShadow: "0 0 10px #3b82f6", animation: "_scanLine 2.5s linear infinite" }} />
                      <Button size="small" variant="contained" color="error" onClick={stopQrCamera} sx={{ position: "absolute", bottom: 8, right: 8, borderRadius: 2, fontWeight: 700, fontSize: 11 }}>Stop</Button>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Location bar */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: "rgba(15,118,110,0.04)", border: "1px solid rgba(15,118,110,0.14)" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 700, color: "#0f766e", display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                <LocationOnIcon sx={{ fontSize: 14 }} />
                {place?.officeLocation?.officeName ?? profile?.assignedOfficeLocation?.officeName ?? "Default office"}
              </Typography>
              <Typography sx={{ fontSize: { xs: 10.5, sm: 12 }, color: "text.secondary", mt: 0.25 }}>
                Radius: {Math.round(place?.allowedRadiusMeters ?? profile?.assignedOfficeLocation?.radiusMeters ?? 0) || "--"}m
                {place && <Box component="span" sx={{ ml: 1, fontWeight: 800, color: place.insideRadius ? "#16a34a" : "#dc2626" }}>· {Math.round(place.distanceMeters)}m {place.insideRadius ? "✓" : "✗"}</Box>}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => verifyPlace()} disabled={placeBusy || punchBusy} sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12, flexShrink: 0, color: "#0f766e", borderColor: "rgba(15,118,110,0.4)" }}>
              {placeBusy ? "Locating..." : "Check GPS"}
            </Button>
          </Box>

          {(placeBusy || punchBusy) && <LinearProgress sx={{ mb: 2, borderRadius: 1, height: 4 }} />}

          {/* Today punch times */}
          {todayEntry?.inTime && (
            <Box sx={{ mb: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: { xs: 1, sm: 1.5 } }}>
              {[
                { label: "Check-in", time: todayEntry.inTime, photo: todayEntry.checkInPhotoUrl, color: "#15803d", bg: "rgba(22,163,74,0.05)", border: "rgba(22,163,74,0.2)" },
                { label: "Check-out", time: todayEntry.outTime, photo: todayEntry.checkOutPhotoUrl, color: todayEntry.outTime ? "#475569" : "#d97706", bg: todayEntry.outTime ? "rgba(71,85,105,0.05)" : "rgba(217,119,6,0.05)", border: todayEntry.outTime ? "rgba(71,85,105,0.2)" : "rgba(217,119,6,0.2)" },
              ].map(p => (
                <Box key={p.label} sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: p.bg, border: `1px solid ${p.border}`, textAlign: "center" }}>
                  <Typography sx={{ fontSize: { xs: 9, sm: 10.5 }, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.label}</Typography>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 900, color: p.color, fontVariantNumeric: "tabular-nums" }}>{p.time ?? "--:--"}</Typography>
                  {p.photo && <Box component="img" src={p.photo} alt={p.label} sx={{ mt: 1, width: "100%", height: { xs: 64, sm: 80 }, objectFit: "cover", borderRadius: 1.5 }} />}
                </Box>
              ))}
            </Box>
          )}

          {/* Face scores */}
          {(todayEntry?.checkInFaceScore != null || todayEntry?.checkOutFaceScore != null) && (
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {[
                { score: todayEntry?.checkInFaceScore, verified: todayEntry?.checkInFaceVerified, label: "Check-in face" },
                { score: todayEntry?.checkOutFaceScore, verified: todayEntry?.checkOutFaceVerified, label: "Check-out face" },
              ].filter(x => x.score != null).map(x => (
                <Chip key={x.label} icon={<VerifiedUserIcon sx={{ fontSize: 13 }} />}
                  label={`${x.label}: ${Math.round((x.score ?? 0) * 100)}% ${x.verified ? "✓" : "✗"}`}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: x.verified ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", color: x.verified ? "#15803d" : "#dc2626", fontSize: { xs: 10.5, sm: 11.5 } }}
                />
              ))}
            </Box>
          )}

          {/* Main punch buttons */}
          <Box sx={{ display: "grid", gap: 1.25 }}>
            {punchButtonState === "checkin" ? (
              <Button variant="contained" size="large" fullWidth onClick={() => openSelfieCamera("checkin")} disabled={punchBusy || selfieBusy || !deviceStatus?.approved} startIcon={<LoginIcon />}
                sx={{ minHeight: { xs: 52, sm: 60 }, fontWeight: 900, fontSize: { xs: 15, sm: 17 }, borderRadius: 3, background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 10px 28px rgba(37,99,235,0.35)", letterSpacing: "0.05em", transition: "all 0.25s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 40px rgba(37,99,235,0.45)" }, "&:disabled": { opacity: 0.6 } }}>
                {punchBusy || selfieBusy ? "Processing..." : "CHECK IN"}
              </Button>
            ) : punchButtonState === "checkout" ? (
              <Button variant="contained" size="large" fullWidth onClick={() => openSelfieCamera("checkout")} disabled={punchBusy || selfieBusy || !deviceStatus?.approved} startIcon={<LogoutIcon />}
                sx={{ minHeight: { xs: 52, sm: 60 }, fontWeight: 900, fontSize: { xs: 15, sm: 17 }, borderRadius: 3, background: "linear-gradient(135deg,#b91c1c,#dc2626)", boxShadow: "0 10px 28px rgba(220,38,38,0.35)", letterSpacing: "0.05em", transition: "all 0.25s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 40px rgba(220,38,38,0.45)" } }}>
                {punchBusy || selfieBusy ? "Processing..." : "CHECK OUT"}
              </Button>
            ) : (
              <Button variant="contained" size="large" fullWidth disabled startIcon={<CheckCircleIcon />}
                sx={{ minHeight: { xs: 52, sm: 60 }, fontWeight: 900, fontSize: { xs: 15, sm: 17 }, borderRadius: 3, background: "linear-gradient(135deg,#15803d,#16a34a)", opacity: "0.85 !important", color: "#fff !important" }}>
                SHIFT COMPLETE ✓
              </Button>
            )}

            {/* Upload fallback buttons */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Button component="label" size="small" variant="outlined" disabled={punchBusy || !!todayEntry?.inTime} sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: 10.5, sm: 12 } }}>
                Upload Check-in
                <input hidden type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkin", f); }} />
              </Button>
              <Button component="label" size="small" variant="outlined" disabled={punchBusy || !todayEntry?.inTime || !!todayEntry?.outTime} sx={{ borderRadius: 2, fontWeight: 600, fontSize: { xs: 10.5, sm: 12 } }}>
                Upload Check-out
                <input hidden type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkout", f); }} />
              </Button>
            </Box>
          </Box>

          {/* Break tracker (collapsible on mobile) */}
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <Box
            onClick={() => setBreakExpanded(v => !v)}
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", mb: breakExpanded ? 1.5 : 0 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 }, display: "flex", alignItems: "center", gap: 0.75 }}>
              <HourglassEmptyIcon sx={{ fontSize: 16 }} /> Break Tracker
              {breaks.filter(b => !b.end).length > 0 && <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", display: "inline-block", ml: 0.5, animation: "_liveDot 2s infinite" }} />}
            </Typography>
            {breakExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
          </Box>
          <Collapse in={breakExpanded}>
            <Box sx={{ display: "flex", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
              <Button variant="contained" size="small" onClick={() => startBreak().catch(e => setErr(e?.response?.data?.error ?? "Break failed"))} sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>Start Break</Button>
              <Button variant="outlined" size="small" onClick={() => endBreak().catch(e => setErr(e?.response?.data?.error ?? "Break failed"))} sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>End Break</Button>
            </Box>
            <Box sx={{ display: "grid", gap: 0.75 }}>
              {breaks.map(b => (
                <Box key={b.id} sx={{ display: "flex", alignItems: "center", gap: 1.25, p: "8px 12px", borderRadius: 2, bgcolor: b.end ? "rgba(100,116,139,0.05)" : "rgba(34,197,94,0.06)", border: `1px solid ${b.end ? "rgba(100,116,139,0.15)" : "rgba(34,197,94,0.2)"}` }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: b.end ? "#94a3b8" : "#22c55e", flexShrink: 0, animation: b.end ? undefined : "_liveDot 2s infinite" }} />
                  <Typography sx={{ fontSize: { xs: 11.5, sm: 12.5 }, color: "text.secondary" }}>
                    {new Date(b.start).toLocaleTimeString()} → {b.end ? new Date(b.end).toLocaleTimeString() : <Box component="span" sx={{ color: "#22c55e", fontWeight: 700 }}>Active</Box>}
                  </Typography>
                </Box>
              ))}
              {!breaks.length && <Typography sx={{ fontSize: 12, color: "text.secondary", opacity: 0.65 }}>No breaks today.</Typography>}
            </Box>
          </Collapse>
        </GlassCard>
      </div>

      {/* ════════════ CALENDAR ════════════ */}
      <div id="section-calendar" className="emp-section">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <GlassCard accentColor="linear-gradient(180deg,#7c3aed,#6d28d9)">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
              <SectionTitle icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}>Attendance Calendar</SectionTitle>
              <TextField label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ width: { xs: "100%", sm: 160 } }} />
            </Box>
            <MonthCalendar month={month} statusByDate={statusByDate} selectedDate={selectedDate} onDayClick={d => setSelectedDate(d)} />
            <Box sx={{ mt: 2, display: "flex", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
              {[["P", "Present", "#16a34a"], ["HD", "Half Day", "#f59e0b"], ["L", "Absent", "#dc2626"], ["H", "Holiday", "#7c3aed"]].map(([code, label, color]) => (
                <Box key={code} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1.25, bgcolor: `${color}12`, border: `1.5px solid ${color}35`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: { xs: 8, sm: 9 }, fontWeight: 900, color }}>{code}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: "text.secondary" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>

          {/* Selected Day */}
          <GlassCard accentColor="linear-gradient(180deg,#0f766e,#0d9488)">
            <SectionTitle icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} subtitle="Click a date to view details.">
              {selectedDate}
            </SectionTitle>

            <Box sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: `${selectedStatusColor}08`, border: `1px solid ${selectedStatusColor}22`, mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ px: 1.25, py: 0.35, borderRadius: 1.5, bgcolor: `${selectedStatusColor}14`, border: `1px solid ${selectedStatusColor}30` }}>
                <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 900, color: selectedStatusColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {statusByDate[selectedDate] || "—"}
                </Typography>
              </Box>
              {selectedHoliday && <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>🎉 {selectedHoliday.name}</Typography>}
            </Box>

            {selectedEntry && (
              <Box sx={{ mb: 2 }}>
                {[
                  ["Check-in",  selectedEntry.inTime ?? "--"],
                  ["Check-out", selectedEntry.outTime ?? "--"],
                  ["Late",      `${selectedEntry.lateMinutes ?? 0}m`],
                  ["Early Leave",`${selectedEntry.earlyLeaveMinutes ?? 0}m`],
                  ["Overtime",  `${selectedEntry.overtimeMinutes ?? 0}m`],
                ].map(([l, v]) => <InfoRow key={l} label={l} value={v} />)}
              </Box>
            )}

            {/* Selfie photos grid */}
            {(selectedEntry?.checkInPhotoUrl || selectedEntry?.checkOutPhotoUrl) && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: { xs: 1, sm: 1.25 }, mb: 2 }}>
                {[
                  { url: selectedEntry?.checkInPhotoUrl,  label: "Check-in Selfie" },
                  { url: selectedEntry?.checkOutPhotoUrl, label: "Check-out Selfie" },
                ].map(ph => (
                  <Box key={ph.label} sx={{ borderRadius: 2.5, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", bgcolor: "rgba(15,23,42,0.02)", position: "relative" }}>
                    {ph.url ? (
                      <Box component="img" src={ph.url} alt={ph.label} sx={{ width: "100%", height: { xs: 90, sm: 110 }, objectFit: "cover", display: "block" }} />
                    ) : (
                      <Box sx={{ height: { xs: 90, sm: 110 }, display: "grid", placeItems: "center" }}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", opacity: 0.6, textAlign: "center" }}>No photo</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 1, py: 0.5, background: "linear-gradient(to top,rgba(0,0,0,0.6),transparent)" }}>
                      <Typography sx={{ fontSize: 9.5, color: "#fff", fontWeight: 700 }}>{ph.label}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Daily group photo */}
            <Box sx={{ borderRadius: 2.5, overflow: "hidden", border: "1px solid rgba(226,232,240,0.7)", background: "linear-gradient(135deg,rgba(30,64,175,0.05),rgba(124,58,237,0.05))" }}>
              {selectedDailyPhoto?.photoUrl ? (
                <Box component="img" alt="Daily group" src={selectedDailyPhoto.photoUrl} sx={{ width: "100%", height: { xs: 120, sm: 160 }, objectFit: "cover", display: "block" }} />
              ) : (
                <Box sx={{ height: { xs: 100, sm: 130 }, display: "grid", placeItems: "center", textAlign: "center", px: 1 }}>
                  <PhotoCameraIcon sx={{ fontSize: 26, color: "text.secondary", opacity: 0.25, mb: 0.5 }} />
                  <Typography sx={{ opacity: 0.55, fontSize: { xs: 11, sm: 12 } }}>No group photo for {selectedDate}</Typography>
                </Box>
              )}
            </Box>
          </GlassCard>
        </Box>
      </div>

      {/* ════════════ LEAVE ════════════ */}
      <div id="section-leave" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg,#dc2626,#b91c1c)">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <SectionTitle icon={<EventNoteIcon sx={{ fontSize: 16 }} />}>Leave Requests</SectionTitle>
            <Button variant="contained" onClick={() => setLeaveOpen(true)} size="small"
              sx={{ borderRadius: 2.5, fontWeight: 700, background: "linear-gradient(135deg,#b91c1c,#dc2626)", boxShadow: "0 4px 14px rgba(220,38,38,0.25)", fontSize: { xs: 12, sm: 13 } }}>
              + Request Leave
            </Button>
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: { xs: 12, sm: 13 }, mb: 2 }}>Submit leave to HR. Approved leave reflects in your calendar.</Typography>

          {leaveRequests.length ? (
            <Box sx={{ display: "grid", gap: 1.25 }}>
              {leaveRequests.slice(0, 8).map((r, i) => (
                <Box
                  key={r.id}
                  sx={{
                    p: { xs: 1.5, sm: 2 }, borderRadius: 2.5,
                    border: `1px solid ${LEAVE_STATUS_CFG[r.status]?.border ?? "rgba(226,232,240,0.8)"}`,
                    bgcolor: `${LEAVE_STATUS_CFG[r.status]?.color ?? "#64748b"}05`,
                    animation: `_cardIn 0.35s ${i * 0.04}s both`,
                    transition: "transform 0.2s ease",
                    "&:hover": { transform: "translateX(2px)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 13.5 }, color: "#0f172a", flex: 1, minWidth: 0 }}>
                      {r.mailSubject || `${r.leaveType ?? "Leave"} request`}
                    </Typography>
                    <StatusBadge status={r.status} labels={LEAVE_STATUS_CFG} />
                  </Box>
                  <Typography sx={{ fontSize: { xs: 11.5, sm: 12.5 }, color: "text.secondary", lineHeight: 1.5 }}>
                    {r.fromDate} → {r.toDate} · {r.leaveType ?? "Leave"} · {r.reason}
                    {r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                    {(r.status === "PENDING" || r.status === "APPROVED") && (
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, fontSize: { xs: 10.5, sm: 11.5 } }}
                        onClick={() => cancelLeave(r.id).catch(e => setErr(apiMessage(e, "Cancel failed")))}>
                        {r.status === "PENDING" ? "Cancel" : "Request Cancellation"}
                      </Button>
                    )}
                    {r.attachmentUrl && (
                      <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ fontWeight: 700, fontSize: { xs: 10.5, sm: 11.5 } }}>
                        📎 {r.attachmentName ?? "Attachment"}
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
              {leaveRequests.length > 8 && <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}>Showing latest 8 of {leaveRequests.length} requests</Typography>}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: { xs: 3, sm: 4 }, color: "text.secondary" }}>
              <EventNoteIcon sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.18, mb: 1 }} />
              <Typography sx={{ fontSize: { xs: 12.5, sm: 13 } }}>No leave requests yet.</Typography>
            </Box>
          )}
        </GlassCard>
      </div>

      {/* ════════════ WFH / ON-DUTY ════════════ */}
      <div id="section-wfh" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg,#0f766e,#059669)">
          <SectionTitle icon={<HomeWorkIcon sx={{ fontSize: 16 }} />} subtitle="Request remote work or on-site duty approval for a date range.">
            WFH / On-Duty Request
          </SectionTitle>
          <Box sx={{ display: "grid", gap: 1.5, mb: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.4fr 1fr 1fr" }, gap: 1.25 }}>
              <TextField select label="Type" value={workType} onChange={e => setWorkType(e.target.value as WorkRequest["type"])} size="small">
                <MenuItem value="WORK_FROM_HOME">Work from Home</MenuItem>
                <MenuItem value="ON_DUTY">On Duty / Client Site</MenuItem>
              </TextField>
              <TextField label="From" type="date" value={workFrom} onChange={e => setWorkFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="To" type="date" value={workTo} onChange={e => setWorkTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            </Box>
            <TextField label="Reason" value={workReason} onChange={e => setWorkReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>
                {workAttachment ? `📎 ${workAttachment.name}` : "Attach Proof"}
                <input hidden type="file" onChange={e => setWorkAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitWorkRequest().catch(e => setErr(apiMessage(e, "Submit failed")))} disabled={!workReason.trim()} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: "#0f766e", "&:hover": { bgcolor: "#0d6660" } }}>
                Submit
              </Button>
            </Box>
          </Box>

          {workRequests.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 12.5, sm: 13 }, mb: 1.25, color: "text.secondary" }}>Previous Requests</Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {workRequests.slice(0, 5).map(r => (
                  <Box key={r.id} sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, border: `1px solid ${WORK_STATUS_CFG[r.status]?.border ?? "rgba(226,232,240,0.8)"}`, bgcolor: `${WORK_STATUS_CFG[r.status]?.color ?? "#64748b"}05`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap", transition: "transform 0.2s", "&:hover": { transform: "translateX(2px)" } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 } }}>{r.type.replaceAll("_", " ")}</Typography>
                      <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: "text.secondary" }}>{r.fromDate} → {r.toDate} · {r.reason}</Typography>
                    </Box>
                    <StatusBadge status={r.status} labels={WORK_STATUS_CFG} />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Comp-off */}
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <SectionTitle icon={<WifiProtectedSetupIcon sx={{ fontSize: 16 }} />} subtitle="Request a compensatory off for overtime worked.">
            Comp-Off Request
          </SectionTitle>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.25 }}>
              <TextField label="OT Date" type="date" value={compOffOvertimeDate} onChange={e => setCompOffOvertimeDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Off Date" type="date" value={compOffDate} onChange={e => setCompOffDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="OT Minutes" type="number" value={compOffMinutes} onChange={e => setCompOffMinutes(e.target.value)} size="small" />
            </Box>
            <TextField label="Reason" value={compOffReason} onChange={e => setCompOffReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>
                {compOffAttachment ? `📎 ${compOffAttachment.name}` : "Attach OT Proof"}
                <input hidden type="file" onChange={e => setCompOffAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitCompOffRequest().catch(e => setErr(apiMessage(e, "Submit failed")))} disabled={!compOffReason.trim()} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Submit Comp-Off
              </Button>
            </Box>
            {compOffRequests.slice(0, 4).map(r => (
              <Box key={r.id} sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, border: "1px solid rgba(226,232,240,0.7)", bgcolor: "#f8fafc" }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5 } }}>OT {r.overtimeDate} → Off {r.requestedDate} · {r.overtimeMinutes}min ({r.status})</Typography>
                <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: "text.secondary" }}>{r.reason}{r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}</Typography>
              </Box>
            ))}
          </Box>
        </GlassCard>
      </div>

      {/* ════════════ CORRECTION ════════════ */}
      <div id="section-correction" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg,#d97706,#b45309)">
          <SectionTitle icon={<EditNoteIcon sx={{ fontSize: 16 }} />} subtitle="Request HR approval to fix forgotten or incorrect punch times for a selected date.">
            Attendance Correction
          </SectionTitle>

          <Box sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, bgcolor: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.18)", mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: "#92400e" }}>
              📅 Correcting for: <Box component="span" sx={{ color: "#d97706" }}>{selectedDate}</Box>
              <Box component="span" sx={{ fontSize: 11, color: "text.secondary", ml: 1 }}>(Select date on calendar)</Box>
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
              <TextField label="In time" type="time" value={correctionIn} onChange={e => setCorrectionIn(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Out time" type="time" value={correctionOut} onChange={e => setCorrectionOut(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            </Box>
            <TextField label="Reason for correction" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}>
                {correctionAttachment ? `📎 ${correctionAttachment.name}` : "Attach Proof"}
                <input hidden type="file" onChange={e => setCorrectionAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitRegularizationRequest().catch(e => setErr(e?.response?.data?.error ?? "Submit failed"))} disabled={!selectedDate || !correctionReason.trim()}
                sx={{ borderRadius: 2, fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                Submit Correction
              </Button>
            </Box>
          </Box>

          {regularizationRequests.length > 0 && (
            <>
              <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 12.5, sm: 13 }, mb: 1.25, color: "text.secondary" }}>Previous Corrections</Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {regularizationRequests.slice(0, 5).map(r => {
                  const sc = r.status === "APPROVED" ? "#16a34a" : r.status === "REJECTED" ? "#dc2626" : "#d97706";
                  return (
                    <Box key={r.id} sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 2.5, border: `1px solid ${sc}18`, bgcolor: `${sc}05`, transition: "transform 0.2s", "&:hover": { transform: "translateX(2px)" } }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 } }}>
                        {r.date} · {r.inTime ?? "--"} → {r.outTime ?? "--"}
                        <Box component="span" sx={{ ml: 1, fontSize: 11, color: sc }}>({r.status})</Box>
                      </Typography>
                      <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: "text.secondary" }}>{r.reason}{r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </GlassCard>
      </div>

      {/* ════════════ PROFILE ════════════ */}
      <div id="section-profile" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg,#475569,#334155)">
          <SectionTitle icon={<PersonIcon sx={{ fontSize: 16 }} />}>My Profile</SectionTitle>

          {/* Avatar row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.75, sm: 2.5 }, mb: { xs: 2, sm: 3 }, flexWrap: "wrap" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined}
                sx={{ width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 }, border: "3px solid rgba(37,99,235,0.2)", boxShadow: "0 8px 24px rgba(37,99,235,0.15)", bgcolor: "#1e40af", fontSize: { xs: 24, sm: 30 }, fontWeight: 900, color: "#fff" }}
              >
                {profile?.name?.[0] ?? "E"}
              </Avatar>
              {profile?.profilePhotoUrl && (
                <Tooltip title="Face reference photo uploaded">
                  <Box sx={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", bgcolor: "#16a34a", border: "2.5px solid white", display: "grid", placeItems: "center" }}>
                    <CheckCircleIcon sx={{ fontSize: 13, color: "#fff" }} />
                  </Box>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 22 }, color: "#0f172a", wordBreak: "break-word" }}>{profile?.name ?? "--"}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: { xs: 12, sm: 13.5 } }}>{profile?.employeeNumber} · {profile?.companyRole?.name ?? "--"}</Typography>
            </Box>
          </Box>

          {/* Info grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: { xs: 0.75, sm: 1 }, mb: { xs: 2, sm: 2.5 } }}>
            {[
              ["Department",  profile?.department?.name ?? "--"],
              ["Role",        profile?.companyRole?.name ?? "--"],
              ["Shift",       profile?.shift ? `${profile.shift.name} (${profile.shift.inTime?.slice(0, 5)}–${profile.shift.outTime?.slice(0, 5)})` : "--"],
              ["Office",      profile?.assignedOfficeLocation?.officeName ?? "Default"],
              ["Status",      profile?.status ?? "--"],
              ["Employee #",  profile?.employeeNumber ?? "--"],
            ].map(([l, v]) => (
              <Box key={l} sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid rgba(226,232,240,0.8)", transition: "border-color 0.2s", "&:hover": { borderColor: "rgba(99,102,241,0.3)" } }}>
                <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</Typography>
                <Typography sx={{ mt: 0.4, fontWeight: 700, fontSize: { xs: 12.5, sm: 13.5 }, color: "#0f172a" }}>{v}</Typography>
              </Box>
            ))}
          </Box>

          {/* Upload photo */}
          <Button variant="outlined" component="label" fullWidth
            sx={{ borderRadius: 2.5, fontWeight: 700, py: { xs: 1, sm: 1.25 }, borderStyle: "dashed", fontSize: { xs: 12, sm: 13 } }}>
            📷 Upload / Update Face Reference Photo
            <input hidden type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch(e => setErr(apiMessage(e, "Upload failed"))); }} />
          </Button>
          <Typography sx={{ mt: 1, color: "text.secondary", fontSize: { xs: 11, sm: 12 }, textAlign: "center" }}>A clear face must be detected to save as recognition reference.</Typography>

          {/* Month stats */}
          <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 13.5, sm: 15 }, mb: { xs: 1.25, sm: 2 }, color: "#0f172a" }}>📊 This Month's Summary</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: { xs: 1, sm: 1.5 } }}>
            {[
              { l: "Working Days", v: monthSummary?.workingDays ?? "-", c: "#2563eb" },
              { l: "Present",      v: monthSummary?.presentDays ?? presentCount, c: "#16a34a" },
              { l: "Leave",        v: monthSummary?.leaveDays ?? leaveCount, c: "#dc2626" },
              { l: "Half Days",    v: monthSummary?.halfDayDays ?? halfDayCount, c: "#f59e0b" },
              { l: "Worked",       v: `${hh}h ${mm}m`, c: "#7c3aed" },
              { l: "Late",         v: `${totalLateMin}m`, c: "#d97706" },
              { l: "Overtime",     v: `${Math.floor(totalOTMin / 60)}h ${totalOTMin % 60}m`, c: "#0f766e" },
              { l: "Payable Days", v: payslip?.payableDays ?? "--", c: "#475569" },
            ].map(s => (
              <Box key={s.l} sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2.5, bgcolor: `${s.c}06`, border: `1px solid ${s.c}18`, transition: "transform 0.2s ease", "&:hover": { transform: "translateY(-2px)" } }}>
                <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.l}</Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: { xs: 15, sm: 18 }, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</Typography>
              </Box>
            ))}
          </Box>
        </GlassCard>
      </div>

      {/* ════════════ DIALOGS ════════════ */}

      {/* Selfie camera */}
      <Dialog open={selfieOpen} onClose={stopSelfieCamera} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: { xs: 3, sm: 4 }, overflow: "hidden", m: { xs: 1.5, sm: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 0.5, background: selfieKind === "checkin" ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "linear-gradient(135deg,#b91c1c,#dc2626)", color: "#fff", fontSize: { xs: 16, sm: 18 } }}>
          {selfieKind === "checkin" ? "📸 Check-in Selfie" : "📸 Check-out Selfie"}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box component="video" ref={selfieVideoRef} muted playsInline sx={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", bgcolor: "#111827", transform: "scaleX(-1)" }} />
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography sx={{ color: "text.secondary", fontSize: { xs: 12, sm: 13 }, textAlign: "center" }}>
              Center your face in the frame. This verifies your identity.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
          <Button onClick={stopSelfieCamera} sx={{ borderRadius: 2, fontWeight: 700, fontSize: { xs: 12, sm: 13 } }}>Cancel</Button>
          <Button variant="contained" onClick={() => captureSelfieAndPunch().catch(e => setErr(apiMessage(e, "Punch failed")))} disabled={punchBusy} sx={{ borderRadius: 2, fontWeight: 700, flex: 1, bgcolor: selfieKind === "checkin" ? "#2563eb" : "#dc2626", fontSize: { xs: 12, sm: 13 } }}>
            {punchBusy ? "Processing..." : `Capture & ${selfieKind === "checkin" ? "Check In" : "Check Out"}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave dialog */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: { xs: 3, sm: 4 }, m: { xs: 1.5, sm: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 900, background: "linear-gradient(135deg,#b91c1c,#dc2626)", color: "#fff", fontSize: { xs: 15, sm: 17 } }}>📅 Request Leave</DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: "grid", gap: 1.5 }}>
          <TextField select label="Leave type" value={leaveType} onChange={e => setLeaveType(e.target.value)} size="small">
            {["Casual leave", "Sick leave", "Earned leave", "Unpaid leave", "Emergency leave"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Mail subject" value={leaveSubject} onChange={e => setLeaveSubject(e.target.value)} placeholder={`Leave: ${leaveFrom} to ${leaveTo}`} size="small" />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
            <TextField label="From" type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <TextField label="To" type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          </Box>
          <TextField label="Reason (required)" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} multiline minRows={2} size="small" />
          <TextField label="Message to HR" value={leaveMessage} onChange={e => setLeaveMessage(e.target.value)} placeholder="Dear HR, I request leave because..." multiline minRows={3} size="small" />
          <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, fontWeight: 700, justifyContent: "flex-start" }}>
            {leaveAttachment ? `📎 ${leaveAttachment.name}` : "Attach Medical / Support Document"}
            <input hidden type="file" onChange={e => setLeaveAttachment(e.target.files?.[0] ?? null)} />
          </Button>
          <Typography sx={{ color: "text.secondary", fontSize: { xs: 11, sm: 12 } }}>HR will review and email you if SMTP is configured.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
          <Button onClick={() => setLeaveOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={() => submitLeaveRequest().catch(e => setErr(e?.response?.data?.error ?? "Submit failed"))} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}>
            Submit Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
