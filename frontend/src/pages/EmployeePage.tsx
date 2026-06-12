import {
  Alert,
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
import dayjs from "dayjs";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import Layout from "../components/Layout";
import MonthCalendar, { DayStatus } from "../components/MonthCalendar";

type CompanyRole = { id: number; name: string; photoUrl?: string | null };
type OfficeLocation = {
  id: number;
  officeName?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};
type Profile = {
  employeeId: number;
  employeeNumber: string;
  name: string;
  companyRole?: CompanyRole | null;
  assignedOfficeLocation?: OfficeLocation | null;
  department?: { id: number; name: string } | null;
  shift?: { id: number; name: string; inTime: string; outTime: string; flexible: boolean } | null;
  status?: string;
  profilePhotoUrl?: string | null;
};
type Attendance = {
  id: number;
  employeeId: number;
  date: string;
  inTime?: string | null;
  outTime?: string | null;
  workedMinutes?: number | null;
  lateMinutes?: number | null;
  earlyLeaveMinutes?: number | null;
  overtimeMinutes?: number | null;
  leaveReason?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInPhotoUrl?: string | null;
  checkInFaceScore?: number | null;
  checkInFaceVerified?: boolean | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutPhotoUrl?: string | null;
  checkOutFaceScore?: number | null;
  checkOutFaceVerified?: boolean | null;
  status: "PRESENT" | "HALF_DAY" | "LEAVE";
};

type MonthSummary = {
  month: string;
  fromDate: string;
  toDate: string;
  workingDays: number;
  presentDays: number;
  halfDayDays: number;
  leaveDays: number;
  totalWorkedMinutes: number;
};

type AttendanceSettings = {
  defaultInTime: string;
  defaultOutTime: string;
  weekendDays: string;
  fullDayMinutes: number;
  halfDayMinutes: number;
  lateGraceMinutes: number;
  earlyLeaveGraceMinutes: number;
  overtimeAfterMinutes: number;
  lateDeductionPerMinute: number;
  overtimePayPerHour: number;
  unpaidLeaveDailyRate: number;
  standardMonthlySalary: number;
  requireQrForPunch: boolean;
  permanentOfficeQr: boolean;
  qrTokenValidityMinutes: number;
};
type Payslip = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  month: string;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  payableDays: number;
  lateMinutes: number;
  overtimeMinutes: number;
  baseSalary: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  overtimePay: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
};
type Holiday = { id: number; date: string; name: string };
type DailyGroupPhoto = { id: number; date: string; photoUrl: string };
type LeaveRequest = {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType?: string | null;
  mailSubject?: string | null;
  mailMessage?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "CANCELLATION_REQUESTED";
  createdAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
  hrRemarks?: string | null;
};
type RegularizationRequest = {
  id: number;
  date: string;
  inTime?: string | null;
  outTime?: string | null;
  reason: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  hrRemarks?: string | null;
};
type WorkRequest = {
  id: number;
  type: "WORK_FROM_HOME" | "ON_DUTY";
  fromDate: string;
  toDate: string;
  reason: string;
  status: "PENDING" | "MANAGER_RECOMMENDED" | "APPROVED" | "REJECTED";
  createdAt?: string;
  remarks?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};
type CompOffRequest = {
  id: number;
  overtimeDate: string;
  requestedDate: string;
  overtimeMinutes: number;
  reason: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  hrRemarks?: string | null;
};
type BreakEntry = { id: number; start: string; end?: string | null };
type PunchPlace = {
  officeLocation: OfficeLocation;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  allowedRadiusMeters: number;
  insideRadius: boolean;
};
type DeviceStatus = { deviceId: string; approved: boolean };

function apiMessage(e: any, fallback: string) {
  return e?.response?.data?.error ?? e?.message ?? fallback;
}

const DEVICE_ID_KEY = "attendance_device_id_v1";

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────
// SECTION WRAPPER COMPONENT
// ─────────────────────────────────────────────────────
function GlassCard({
  children,
  sx = {},
  accentColor,
}: {
  children: React.ReactNode;
  sx?: any;
  accentColor?: string;
}) {
  return (
    <Box
      sx={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(226,232,240,0.8)",
        borderRadius: 3,
        boxShadow: "0 4px 24px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)",
        overflow: "hidden",
        position: "relative",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: "0 8px 32px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)",
        },
        ...(accentColor
          ? {
              "&:before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: accentColor,
                borderRadius: "3px 0 0 3px",
              },
            }
          : {}),
        ...sx,
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>{children}</Box>
    </Box>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
      {icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "rgba(37,99,235,0.08)",
            display: "grid",
            placeItems: "center",
            color: "#2563eb",
          }}
        >
          {icon}
        </Box>
      )}
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 }, color: "#0f172a" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function EmployeePage() {
  const { toastSuccess, toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (err) { toastError(err); setErr(null); }
  }, [err, toastError]);

  useEffect(() => {
    if (ok) { toastSuccess(ok); setOk(null); }
  }, [ok, toastSuccess]);

  const [activeSection, setActiveSection] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dailyPhotos, setDailyPhotos] = useState<DailyGroupPhoto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  const [compOffOvertimeDate, setCompOffOvertimeDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [compOffDate, setCompOffDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [compOffMinutes, setCompOffMinutes] = useState("60");
  const [compOffReason, setCompOffReason] = useState("");
  const [workType, setWorkType] = useState<WorkRequest["type"]>("WORK_FROM_HOME");
  const [workFrom, setWorkFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [workTo, setWorkTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [workReason, setWorkReason] = useState("");
  const [correctionIn, setCorrectionIn] = useState("09:00");
  const [correctionOut, setCorrectionOut] = useState("18:00");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionAttachment, setCorrectionAttachment] = useState<File | null>(null);
  const [compOffAttachment, setCompOffAttachment] = useState<File | null>(null);
  const [breaks, setBreaks] = useState<BreakEntry[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [leaveTo, setLeaveTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [leaveType, setLeaveType] = useState("Casual leave");
  const [leaveSubject, setLeaveSubject] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveAttachment, setLeaveAttachment] = useState<File | null>(null);
  const [workAttachment, setWorkAttachment] = useState<File | null>(null);
  const [todayEntry, setTodayEntry] = useState<Attendance | null>(null);
  const [clockNow, setClockNow] = useState(dayjs());
  const [punchBusy, setPunchBusy] = useState(false);
  const [placeBusy, setPlaceBusy] = useState(false);
  const [place, setPlace] = useState<PunchPlace | null>(null);
  const [qrToken, setQrToken] = useState(() => localStorage.getItem("scannedQrToken") || "");
  const [qrOk, setQrOk] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [qrCameraOpen, setQrCameraOpen] = useState(false);
  const [qrCameraBusy, setQrCameraBusy] = useState(false);
  const [selfieOpen, setSelfieOpen] = useState(false);
  const [selfieKind, setSelfieKind] = useState<"checkin" | "checkout">("checkin");
  const [selfieBusy, setSelfieBusy] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrScanActiveRef = useRef(false);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);

  const navSections = [
    { id: "overview", label: "Overview", icon: <BarChartIcon sx={{ fontSize: 18 }} /> },
    { id: "punch", label: "Punch In/Out", icon: <LoginIcon sx={{ fontSize: 18 }} /> },
    { id: "calendar", label: "Calendar", icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
    { id: "leave", label: "Leave", icon: <EventNoteIcon sx={{ fontSize: 18 }} /> },
    { id: "wfh", label: "WFH / Duty", icon: <HomeWorkIcon sx={{ fontSize: 18 }} /> },
    { id: "correction", label: "Correction", icon: <EditNoteIcon sx={{ fontSize: 18 }} /> },
    { id: "profile", label: "Profile", icon: <PersonIcon sx={{ fontSize: 18 }} /> },
  ];

  function scrollToSection(id: string) {
    setActiveSection(id);
    const node = document.getElementById(`section-${id}`);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadProfile() {
    const res = await api.get<Profile>("/api/employee/profile");
    setProfile(res.data);
  }

  async function loadAttendance(m: string) {
    const res = await api.get<Attendance[]>("/api/employee/attendance", { params: { month: m } });
    setEntries(res.data);
  }

  async function loadSummary(m: string) {
    const res = await api.get<MonthSummary>("/api/employee/attendance/summary", { params: { month: m } });
    setMonthSummary(res.data);
  }

  async function loadPayslip(m: string) {
    const res = await api.get<Payslip>("/api/employee/attendance/payslip", { params: { month: m } });
    setPayslip(res.data);
  }

  async function loadSettings() {
    const res = await api.get<AttendanceSettings>("/api/settings/attendance");
    setSettings(res.data);
  }

  async function loadHolidays(m: string) {
    const res = await api.get<Holiday[]>("/api/holidays", { params: { month: m } });
    setHolidays(res.data);
  }

  async function loadDailyPhotos(m: string) {
    const res = await api.get<DailyGroupPhoto[]>("/api/daily-group-photos", { params: { month: m } });
    setDailyPhotos(res.data);
  }

  async function loadLeaveRequests() {
    const res = await api.get<LeaveRequest[]>("/api/employee/leave-requests");
    setLeaveRequests(res.data);
  }

  async function loadRegularizationRequests() {
    const res = await api.get<RegularizationRequest[]>("/api/employee/regularization-requests");
    setRegularizationRequests(res.data);
  }

  async function loadWorkRequests() {
    const res = await api.get<WorkRequest[]>("/api/employee/work-requests");
    setWorkRequests(res.data);
  }

  async function loadCompOffRequests() {
    const res = await api.get<CompOffRequest[]>("/api/employee/comp-off-requests");
    setCompOffRequests(res.data);
  }

  async function loadToday() {
    const res = await api.get<Attendance | null>("/api/employee/punch/today");
    setTodayEntry(res.data);
  }

  async function loadDeviceStatus() {
    const deviceId = getDeviceId();
    const res = await api.get<DeviceStatus>("/api/account/devices/current", { params: { deviceId } });
    setDeviceStatus(res.data);
  }

  async function uploadProfilePhoto(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<Profile>("/api/employee/profile/photo", fd);
    setProfile(res.data);
    setOk("Profile photo saved as face recognition reference");
  }

  async function registerDevice() {
    setErr(null);
    setOk(null);
    const deviceId = getDeviceId();
    const label = `${navigator.platform || "Browser"} - ${new Date().toLocaleDateString()}`;
    const res = await api.post<DeviceStatus>("/api/account/devices", { deviceId, label });
    setDeviceStatus({ deviceId: res.data.deviceId, approved: res.data.approved });
    setOk("Device registered. Admin must approve it before check-in/check-out.");
  }

  async function exportAttendance() {
    setErr(null);
    try {
      const res = await api.get<Blob>("/api/employee/attendance/export", {
        params: { month },
        responseType: "blob",
      });
      downloadBlob(res.data, `attendance-${month}.csv`);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.message ?? "Export failed");
    }
  }

  async function exportPdf() {
    setErr(null);
    try {
      const res = await api.get<Blob>("/api/employee/attendance/report.pdf", { params: { month }, responseType: "blob" });
      downloadBlob(res.data, `attendance-${month}.pdf`);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.message ?? "PDF export failed");
    }
  }

  async function loadBreaks() {
    const res = await api.get<BreakEntry[]>("/api/employee/breaks/today");
    setBreaks(res.data);
  }

  async function startBreak() {
    await api.post("/api/employee/breaks/start");
    setOk("Break started");
    await loadBreaks();
  }

  async function endBreak() {
    await api.post("/api/employee/breaks/end");
    setOk("Break ended");
    await loadBreaks();
  }

  async function verifyQr(token = qrToken) {
    let normalized = token.trim();
    if (normalized.includes("qrToken=")) {
      try {
        const urlObj = new URL(normalized);
        const tokenParam = urlObj.searchParams.get("qrToken");
        if (tokenParam) normalized = tokenParam.trim();
      } catch (err) {
        const match = normalized.match(/qrToken=([^&]+)/);
        if (match && match[1]) normalized = match[1].trim();
      }
    }
    setQrOk(false);
    setQrMessage(null);
    if (!normalized) { setErr("Scan or enter office QR token first"); return false; }
    try {
      const res = await api.get<{ valid: boolean; officeId?: number; officeName?: string; expiresAt?: string; dailyCode?: string; mode?: string }>("/api/employee/punch/qr", { params: { token: normalized } });
      const assignedOfficeId = profile?.assignedOfficeLocation?.id;
      if (assignedOfficeId && res.data.officeId && assignedOfficeId !== res.data.officeId) {
        const msg = `This QR belongs to ${res.data.officeName ?? "another office"}. Use the QR for ${profile?.assignedOfficeLocation?.officeName ?? "your assigned office"}.`;
        setQrMessage(msg); setErr(msg); return false;
      }
      setQrToken(normalized);
      localStorage.setItem("scannedQrToken", normalized);
      setQrOk(true);
      const dailyCode = res.data.dailyCode ? ` | Today code ${res.data.dailyCode}` : "";
      setQrMessage(`QR verified for ${res.data.officeName ?? "office"}${dailyCode}`);
      setOk(`QR verified. Expires: ${res.data.expiresAt ? new Date(res.data.expiresAt).toLocaleTimeString() : "--"}`);
      return true;
    } catch (e: any) {
      setQrMessage(e?.response?.data?.error ?? "QR verification failed");
      setErr(e?.response?.data?.error ?? "QR verification failed");
      return false;
    }
  }

  function qrRequired() { return Boolean(settings?.requireQrForPunch); }
  function qrRequiredForPunch(kind: "checkin" | "checkout") {
    return qrRequired() && !(kind === "checkout" && Boolean(todayEntry?.inTime));
  }

  async function detectQrWithBarcodeDetector(source: CanvasImageSource) {
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) return null;
    try {
      const detector = new Detector({ formats: ["qr_code"] });
      const codes = await detector.detect(source);
      return codes?.[0]?.rawValue?.trim() || null;
    } catch { return null; }
  }

  function decodeQrFromCanvas(source: CanvasImageSource, width: number, height: number) {
    if (width <= 0 || height <= 0) return null;
    const maxDimension = 600;
    let canvasWidth = width, canvasHeight = height;
    if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
      if (canvasWidth > canvasHeight) { canvasHeight = Math.round((canvasHeight * maxDimension) / canvasWidth); canvasWidth = maxDimension; }
      else { canvasWidth = Math.round((canvasWidth * maxDimension) / canvasHeight); canvasHeight = maxDimension; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, canvasWidth, canvasHeight);
    const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    return jsQR(image.data, canvasWidth, canvasHeight, { inversionAttempts: "attemptBoth" })?.data?.trim() || null;
  }

  function loadQrImage(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read QR image")); };
      img.src = url;
    });
  }

  async function scanQrImage(file: File) {
    setErr(null);
    try {
      let value: string | null = null;
      if ("createImageBitmap" in window) {
        try {
          const bitmap = await createImageBitmap(file);
          value = await detectQrWithBarcodeDetector(bitmap);
          if (!value) value = decodeQrFromCanvas(bitmap, bitmap.width, bitmap.height);
          bitmap.close?.();
        } catch (bitmapError) { console.warn("createImageBitmap failed:", bitmapError); }
      }
      if (!value) {
        const img = await loadQrImage(file);
        value = await detectQrWithBarcodeDetector(img);
        if (!value) value = decodeQrFromCanvas(img, img.naturalWidth, img.naturalHeight);
      }
      if (!value) { setErr("No QR code found in image"); return; }
      await verifyQr(value);
    } catch (e: any) { setErr(e?.message ?? "QR scan failed"); }
  }

  async function startQrCamera() {
    setErr(null); setQrCameraBusy(true);
    try {
      stopQrCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      qrStreamRef.current = stream;
      setQrCameraOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (qrVideoRef.current) { qrVideoRef.current.srcObject = stream; await qrVideoRef.current.play(); }
      qrScanActiveRef.current = true;
      const Detector = (window as any).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      scanQrFromCamera(detector);
    } catch (e: any) { setErr(e?.message ?? "Unable to open camera for QR scan"); stopQrCamera(); }
    finally { setQrCameraBusy(false); }
  }

  function stopQrCamera() {
    qrScanActiveRef.current = false;
    qrStreamRef.current?.getTracks().forEach((track) => track.stop());
    qrStreamRef.current = null;
    if (qrVideoRef.current) qrVideoRef.current.srcObject = null;
    setQrCameraOpen(false);
  }

  async function scanQrFromCamera(detector: any) {
    if (!qrScanActiveRef.current) return;
    try {
      const video = qrVideoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        let value = detector ? (await detector.detect(video))?.[0]?.rawValue?.trim() : null;
        if (!value) value = decodeQrFromCanvas(video, video.videoWidth, video.videoHeight);
        if (value) { stopQrCamera(); const valid = await verifyQr(value); if (valid) await verifyPlace(); return; }
      }
    } catch (err) { console.warn("Frame decode failed (retrying):", err); }
    window.setTimeout(() => scanQrFromCamera(detector), 350);
  }

  function getLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation is not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  async function verifyPlace() {
    setErr(null); setOk(null); setPlaceBusy(true);
    try {
      const loc = await getLocation();
      const res = await api.get<PunchPlace>("/api/employee/punch/place", { params: { latitude: loc.latitude, longitude: loc.longitude } });
      setPlace(res.data);
      if (res.data.insideRadius) setOk(`Location verified: ${Math.round(res.data.distanceMeters)}m from office`);
      else setErr(`Outside office radius: ${Math.round(res.data.distanceMeters)}m away, allowed ${Math.round(res.data.allowedRadiusMeters)}m`);
      return { ...loc, place: res.data };
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? "Location verification failed"); return null; }
    finally { setPlaceBusy(false); }
  }

  async function punch(kind: "checkin" | "checkout", file: File) {
    setErr(null); setOk(null); setPunchBusy(true);
    try {
      if (qrRequiredForPunch(kind)) { const validQr = qrOk || (await verifyQr()); if (!validQr) return; }
      else if (qrToken.trim() && !qrOk) { const validQr = await verifyQr(); if (!validQr) return; }
      const verified = await verifyPlace();
      if (!verified) return;
      if (!verified.place.insideRadius) return;
      if (!deviceStatus?.approved) { setErr("Register this device and wait for admin approval before punch"); return; }
      const fd = new FormData();
      fd.append("latitude", String(verified.latitude));
      fd.append("longitude", String(verified.longitude));
      if (qrToken.trim()) fd.append("qrToken", qrToken.trim());
      fd.append("deviceId", deviceStatus.deviceId);
      fd.append("file", file);
      const res = await api.post<Attendance>(`/api/employee/punch/${kind}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setTodayEntry(res.data);
      setOk(kind === "checkin" ? "Checked in successfully" : "Checked out successfully");
      const today = dayjs().format("YYYY-MM-DD");
      setEntries((prev) => { const idx = prev.findIndex((e) => e.date === today); if (idx === -1) return [res.data, ...prev]; const next = [...prev]; next[idx] = { ...next[idx], ...res.data }; return next; });
      loadSummary(month).catch(() => {});
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? "Punch failed"); }
    finally { setPunchBusy(false); }
  }

  async function openSelfieCamera(kind: "checkin" | "checkout") {
    setErr(null); setSelfieKind(kind); setSelfieBusy(true);
    try {
      stopSelfieCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" } }, audio: false });
      selfieStreamRef.current = stream;
      setSelfieOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (selfieVideoRef.current) { selfieVideoRef.current.srcObject = stream; await selfieVideoRef.current.play(); }
    } catch (e: any) { setErr(e?.message ?? "Unable to open camera for selfie"); stopSelfieCamera(); }
    finally { setSelfieBusy(false); }
  }

  function stopSelfieCamera() {
    selfieStreamRef.current?.getTracks().forEach((track) => track.stop());
    selfieStreamRef.current = null;
    if (selfieVideoRef.current) selfieVideoRef.current.srcObject = null;
    setSelfieOpen(false);
  }

  async function captureSelfieAndPunch() {
    const video = selfieVideoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) { setErr("Camera is not ready yet"); return; }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setErr("Unable to capture selfie"); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) { setErr("Unable to capture selfie"); return; }
    const file = new File([blob], `${selfieKind}-${dayjs().format("YYYYMMDD-HHmmss")}.jpg`, { type: "image/jpeg" });
    stopSelfieCamera();
    await punch(selfieKind, file);
  }

  async function submitLeaveRequest() {
    setErr(null); setOk(null);
    const reason = leaveReason.trim();
    if (!reason) { setErr("Leave reason is required"); return; }
    const res = await api.post<LeaveRequest>("/api/employee/leave-requests", {
      fromDate: leaveFrom, toDate: leaveTo, reason, leaveType,
      mailSubject: leaveSubject.trim() || `Leave request: ${leaveFrom} to ${leaveTo}`,
      mailMessage: leaveMessage.trim() || reason,
    });
    if (leaveAttachment) { const fd = new FormData(); fd.append("file", leaveAttachment); await api.post(`/api/employee/leave-requests/${res.data.id}/attachment`, fd); }
    setOk("Leave request submitted to HR");
    setLeaveOpen(false); setLeaveSubject(""); setLeaveMessage(""); setLeaveReason(""); setLeaveAttachment(null);
    await loadLeaveRequests();
  }

  async function submitRegularizationRequest() {
    setErr(null); setOk(null);
    const reason = correctionReason.trim();
    if (!reason) { setErr("Correction reason is required"); return; }
    const res = await api.post<RegularizationRequest>("/api/employee/regularization-requests", { date: selectedDate, inTime: correctionIn || null, outTime: correctionOut || null, reason });
    if (correctionAttachment) { const fd = new FormData(); fd.append("file", correctionAttachment); await api.post(`/api/employee/regularization-requests/${res.data.id}/attachment`, fd); }
    setCorrectionReason(""); setCorrectionAttachment(null);
    setOk("Attendance correction submitted to HR");
    await loadRegularizationRequests();
  }

  async function submitWorkRequest() {
    const res = await api.post<WorkRequest>("/api/employee/work-requests", { type: workType, fromDate: workFrom, toDate: workTo, reason: workReason });
    if (workAttachment) { const fd = new FormData(); fd.append("file", workAttachment); await api.post(`/api/employee/work-requests/${res.data.id}/attachment`, fd); }
    setWorkReason(""); setWorkAttachment(null);
    setOk("Work request submitted");
    await loadWorkRequests();
  }

  async function submitCompOffRequest() {
    const res = await api.post<CompOffRequest>("/api/employee/comp-off-requests", { overtimeDate: compOffOvertimeDate, requestedDate: compOffDate, overtimeMinutes: Number(compOffMinutes), reason: compOffReason });
    if (compOffAttachment) { const fd = new FormData(); fd.append("file", compOffAttachment); await api.post(`/api/employee/comp-off-requests/${res.data.id}/attachment`, fd); }
    setCompOffReason(""); setCompOffAttachment(null);
    setOk("Comp-off request submitted");
    await loadCompOffRequests();
  }

  async function cancelLeave(id: number) {
    await api.post(`/api/employee/leave-requests/${id}/cancel`, { reason: "Cancelled by employee" });
    setOk("Leave cancellation updated");
    await loadLeaveRequests();
  }

  useEffect(() => {
    setErr(null);
    Promise.all([loadProfile(), loadAttendance(month), loadSummary(month), loadSettings()])
      .then(() => { const storedToken = localStorage.getItem("scannedQrToken"); if (storedToken) verifyQr(storedToken).catch(() => {}); })
      .catch((e) => setErr(apiMessage(e, "Failed to load employee dashboard")));
    loadPayslip(month).catch(() => setPayslip(null));
    loadHolidays(month).catch(() => {});
    loadDailyPhotos(month).catch(() => {});
    loadLeaveRequests().catch(() => {});
    loadRegularizationRequests().catch(() => {});
    loadWorkRequests().catch(() => {});
    loadCompOffRequests().catch(() => {});
    loadBreaks().catch(() => {});
    loadToday().catch(() => {});
    loadDeviceStatus().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([loadAttendance(month), loadSummary(month)]).catch((e) => setErr(apiMessage(e, "Failed to load attendance")));
    loadPayslip(month).catch(() => setPayslip(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => { loadHolidays(month).catch(() => {}); /* eslint-disable-next-line */ }, [month]);
  useEffect(() => { loadDailyPhotos(month).catch(() => {}); /* eslint-disable-next-line */ }, [month]);

  useEffect(() => {
    setClockNow(dayjs());
    if (!todayEntry?.inTime || todayEntry?.outTime) return undefined;
    const timer = window.setInterval(() => setClockNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, [todayEntry?.inTime, todayEntry?.outTime]);

  useEffect(() => { return () => { stopQrCamera(); stopSelfieCamera(); }; /* eslint-disable-next-line */ }, []);

  const statusByDate: Record<string, DayStatus> = useMemo(() => {
    if (!settings || !monthSummary) return {};
    const entryMap: Record<string, DayStatus> = {};
    for (const e of entries) entryMap[e.date] = e.status === "PRESENT" ? "P" : e.status === "HALF_DAY" ? "HD" : "L";
    const holidaySet = new Set(holidays.map((h) => h.date));
    const weekendSet = new Set((settings?.weekendDays ?? "SUNDAY").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean));
    const first = dayjs(`${month}-01`);
    const days = first.daysInMonth();
    const today = dayjs().format("YYYY-MM-DD");
    const out: Record<string, DayStatus> = {};
    for (let d = 1; d <= days; d++) {
      const dt = first.date(d).format("YYYY-MM-DD");
      if (dt < monthSummary.fromDate) { out[dt] = ""; continue; }
      const dowName = first.date(d).format("dddd").toUpperCase();
      if (holidaySet.has(dt) || weekendSet.has(dowName)) out[dt] = "H";
      else out[dt] = dt <= today ? (entryMap[dt] ?? "L") : (entryMap[dt] ?? "");
    }
    return out;
  }, [entries, holidays, month, monthSummary, settings]);

  useEffect(() => {
    const monthStart = `${month}-01`;
    const monthEnd = dayjs(monthStart).endOf("month").format("YYYY-MM-DD");
    let nextDate = selectedDate;
    if (!selectedDate.startsWith(`${month}-`)) nextDate = monthSummary ? monthSummary.fromDate : monthStart;
    if (monthSummary) { if (nextDate < monthSummary.fromDate) nextDate = monthSummary.fromDate; if (nextDate > monthEnd) nextDate = monthEnd; }
    else { if (nextDate < monthStart) nextDate = monthStart; if (nextDate > monthEnd) nextDate = monthEnd; }
    if (nextDate !== selectedDate) setSelectedDate(nextDate);
  }, [month, monthSummary, selectedDate]);

  const selectedEntry = useMemo(() => entries.find((e) => e.date === selectedDate), [entries, selectedDate]);
  const selectedHoliday = useMemo(() => holidays.find((h) => h.date === selectedDate), [holidays, selectedDate]);
  const selectedDailyPhoto = useMemo(() => dailyPhotos.find((p) => p.date === selectedDate), [dailyPhotos, selectedDate]);

  const presentCount = useMemo(() => entries.filter((e) => e.status === "PRESENT").length, [entries]);
  const halfDayCount = useMemo(() => entries.filter((e) => e.status === "HALF_DAY").length, [entries]);
  const leaveCount = useMemo(() => entries.filter((e) => e.status === "LEAVE").length, [entries]);
  const workedMinutes = monthSummary?.totalWorkedMinutes ?? entries.reduce((acc, e) => acc + (e.workedMinutes ?? 0), 0);
  const totalLateMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.lateMinutes ?? 0), 0), [entries]);
  const totalEarlyLeaveMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.earlyLeaveMinutes ?? 0), 0), [entries]);
  const totalOvertimeMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.overtimeMinutes ?? 0), 0), [entries]);
  const hh = Math.floor(workedMinutes / 60);
  const mm = workedMinutes % 60;

  const latestFaceScore = todayEntry?.checkOutFaceScore != null ? todayEntry.checkOutFaceScore : todayEntry?.checkInFaceScore != null ? todayEntry.checkInFaceScore : null;
  const latestFaceVerified = todayEntry?.checkOutFaceScore != null ? todayEntry.checkOutFaceVerified : todayEntry?.checkInFaceScore != null ? todayEntry.checkInFaceVerified : null;
  const faceScoreText = latestFaceScore == null ? "Pending" : `${Math.round(latestFaceScore * 100)}%`;

  const punchCountdown = useMemo(() => {
    const checkedInAt = parseEntryClock(todayEntry?.inTime, todayEntry?.date);
    if (!checkedInAt) return null;
    const checkedOutAt = entryEndClock(checkedInAt, todayEntry?.outTime, todayEntry?.date);
    const requiredMinutes = settings?.fullDayMinutes && settings.fullDayMinutes > 0 ? settings.fullDayMinutes : 480;
    const workTargetAt = checkedInAt.add(requiredMinutes, "minute");
    const end = checkedOutAt || clockNow;
    const workedSeconds = Math.max(0, end.diff(checkedInAt, "second"));
    const targetSeconds = requiredMinutes * 60;
    const extraSeconds = Math.max(0, workedSeconds - targetSeconds);
    const remainingSeconds = Math.max(0, targetSeconds - workedSeconds);
    const hours = Math.floor(workedSeconds / 3600);
    const minutes = Math.floor((workedSeconds % 3600) / 60);
    const seconds = workedSeconds % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    if (checkedOutAt) return {
      label: "Shift completed", value: formatDurationSeconds(workedSeconds), hours: hh, minutes: mm, seconds: ss,
      helper: extraSeconds > 0 ? `Regular ${formatDurationSeconds(targetSeconds)} | Extra ${formatDurationSeconds(extraSeconds)}` : `Checked in ${todayEntry?.inTime ?? "--"} → checked out ${todayEntry?.outTime ?? "--"}`,
      accent: "#16a34a", state: "COMPLETED", badgeText: "🎉 Shift Completed",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", glow: "0 14px 44px rgba(22,163,74,0.15)",
    };
    if (extraSeconds === 0) return {
      label: "Working time", value: formatDurationSeconds(workedSeconds), hours: hh, minutes: mm, seconds: ss,
      helper: `${formatDurationSeconds(remainingSeconds)} left for ${Math.round(requiredMinutes / 60)}h target`,
      accent: "#2563eb", state: "PROGRESS", badgeText: "⚡ Shift In Progress",
      bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", glow: "0 14px 44px rgba(37,99,235,0.15)",
    };
    return {
      label: "Overtime running", value: formatDurationSeconds(workedSeconds), hours: hh, minutes: mm, seconds: ss,
      helper: `Regular ${formatDurationSeconds(targetSeconds)} completed at ${workTargetAt.format("hh:mm A")} | Extra ${formatDurationSeconds(extraSeconds)}`,
      accent: "#d97706", state: "OVERTIME", badgeText: "🔥 Overtime Active",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", glow: "0 14px 44px rgba(217,119,6,0.15)",
    };
  }, [clockNow, settings?.fullDayMinutes, todayEntry?.date, todayEntry?.inTime, todayEntry?.outTime]);

  const afterCheckinCount = useMemo(() => {
    const checkedInAt = parseEntryClock(todayEntry?.inTime, todayEntry?.date);
    if (!checkedInAt) return null;
    const checkedOutAt = entryEndClock(checkedInAt, todayEntry?.outTime, todayEntry?.date);
    const end = checkedOutAt || clockNow;
    const diffSec = Math.max(0, end.diff(checkedInAt, "second"));
    const requiredMinutes = settings?.fullDayMinutes && settings.fullDayMinutes > 0 ? settings.fullDayMinutes : 480;
    const targetSeconds = requiredMinutes * 60;
    const regularSeconds = Math.min(diffSec, targetSeconds);
    const extraSeconds = Math.max(0, diffSec - targetSeconds);
    const remainingSeconds = Math.max(0, targetSeconds - diffSec);
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    return {
      seconds: diffSec, minutes: (diffSec / 60).toFixed(1), hours: (diffSec / 3600).toFixed(2),
      regular: formatDurationSeconds(regularSeconds), extra: formatDurationSeconds(extraSeconds),
      remaining: formatDurationSeconds(remainingSeconds), progress: Math.min(100, Math.round((regularSeconds / targetSeconds) * 100)),
      isOvertime: extraSeconds > 0, all: `${hrs}h ${mins}m ${secs}s`,
    };
  }, [clockNow, settings?.fullDayMinutes, todayEntry?.date, todayEntry?.inTime, todayEntry?.outTime]);

  const selectedStatus = statusByDate[selectedDate] ?? "";
  const selectedStatusColor = selectedStatus === "P" ? "#16a34a" : selectedStatus === "H" ? "#7c3aed" : selectedStatus === "HD" ? "#f59e0b" : selectedStatus === "L" ? "#dc2626" : "#64748b";

  const punchButtonState = !todayEntry?.inTime ? "checkin" : !todayEntry?.outTime ? "checkout" : "done";

  // CSS animations injected once
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    @keyframes livePulse { 0%,100%{transform:scale(0.85);opacity:0.5} 50%{transform:scale(1.2);opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes scanLine { 0%,100%{top:0%} 50%{top:100%} }
    @keyframes ringPulse { 0%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.08);opacity:0.3} 100%{transform:scale(1);opacity:0.8} }
    @keyframes countBounce { 0%,100%{transform:scale(1)} 10%{transform:scale(1.05)} 20%{transform:scale(1)} }
    .emp-section { animation: slideUp 0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
    .emp-nav-btn { transition: all 0.2s cubic-bezier(0.2,0.8,0.2,1) !important; }
    .emp-nav-btn:hover { transform: translateX(3px) !important; }
    .stat-card-anim { animation: slideUp 0.5s cubic-bezier(0.2,0.8,0.2,1) both; }
    .stat-card-anim:nth-child(1){animation-delay:0.05s}
    .stat-card-anim:nth-child(2){animation-delay:0.1s}
    .stat-card-anim:nth-child(3){animation-delay:0.15s}
    .stat-card-anim:nth-child(4){animation-delay:0.2s}
    .stat-card-anim:nth-child(5){animation-delay:0.25s}
    .stat-card-anim:nth-child(6){animation-delay:0.3s}
  `;

  return (
    <Layout title="Employee Dashboard">
      <style>{globalStyles}</style>

      {/* ── TOP NAV BAR ── */}
      <Box
        sx={{
          display: { xs: "grid", md: "flex" },
          gridTemplateColumns: { xs: "repeat(4,1fr)", sm: "repeat(7,1fr)" },
          gap: 0.75,
          p: 1,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(226,232,240,0.9)",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(15,23,42,0.07)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 80,
          zIndex: 10,
        }}
      >
        {navSections.map((s) => {
          const active = activeSection === s.id;
          return (
            <Button
              key={s.id}
              className="emp-nav-btn"
              onClick={() => scrollToSection(s.id)}
              startIcon={s.icon}
              sx={{
                flex: 1,
                minHeight: 40,
                borderRadius: 2,
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 700,
                justifyContent: { xs: "center", sm: "flex-start" },
                px: { xs: 1, sm: 1.5 },
                color: active ? "#ffffff" : "#475569",
                bgcolor: active ? "#2563eb" : "transparent",
                boxShadow: active ? "0 6px 18px rgba(37,99,235,0.3)" : "none",
                "& .MuiButton-startIcon": { display: { xs: "none", sm: "flex" } },
                "&:hover": {
                  bgcolor: active ? "#1d4ed8" : "rgba(37,99,235,0.06)",
                  color: active ? "#ffffff" : "#2563eb",
                },
              }}
            >
              <Box sx={{ display: { xs: "none", sm: "block" } }}>{s.label}</Box>
              <Box sx={{ display: { xs: "block", sm: "none" }, fontSize: 10 }}>{s.label.split(" ")[0]}</Box>
            </Button>
          );
        })}
      </Box>

      {/* ── LIVE TIMER BANNER (when checked in) ── */}
      {punchCountdown && (
        <Box
          sx={{
            background: punchCountdown.bg,
            border: `1.5px solid ${punchCountdown.accent}30`,
            borderRadius: 3,
            p: { xs: 2.5, md: 3 },
            boxShadow: punchCountdown.glow,
            animation: "slideUp 0.4s cubic-bezier(0.2,0.8,0.2,1) both",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {!todayEntry?.outTime && (
                <Box sx={{ position: "relative", width: 16, height: 16 }}>
                  <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: punchCountdown.accent, opacity: 0.2, animation: "ringPulse 2s infinite" }} />
                  <Box sx={{ position: "absolute", inset: "25%", borderRadius: "50%", bgcolor: punchCountdown.accent, animation: "livePulse 1.8s infinite ease-in-out" }} />
                </Box>
              )}
              <Typography sx={{ fontSize: 11, fontWeight: 900, color: punchCountdown.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {punchCountdown.label}
              </Typography>
            </Box>
            <Chip
              label={punchCountdown.badgeText}
              sx={{ fontWeight: 800, fontSize: 12, height: 30, color: "#fff", bgcolor: punchCountdown.accent, boxShadow: `0 4px 12px ${punchCountdown.accent}40`, "& .MuiChip-label": { px: 1.5 } }}
            />
          </Box>

          {/* Clock digits */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
            {[{ label: "HRS", val: punchCountdown.hours }, { label: "MIN", val: punchCountdown.minutes }, { label: "SEC", val: punchCountdown.seconds }].map((seg, i) => (
              <Box key={seg.label} sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.25 } }}>
                {i > 0 && <Typography sx={{ fontSize: { xs: 24, sm: 36 }, fontWeight: 900, color: `${punchCountdown.accent}50`, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>:</Typography>}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{
                    px: { xs: 1.75, sm: 2.25 }, py: { xs: 1, sm: 1.25 }, borderRadius: 2.5,
                    bgcolor: `${punchCountdown.accent}12`, border: `1.5px solid ${punchCountdown.accent}28`,
                    minWidth: { xs: 56, sm: 72 }, textAlign: "center",
                    boxShadow: `inset 0 2px 8px ${punchCountdown.accent}08, 0 2px 8px ${punchCountdown.accent}10`,
                  }}>
                    <Typography sx={{ color: punchCountdown.accent, fontSize: { xs: 28, sm: 38, md: 48 }, fontWeight: 900, fontFamily: "'Inter', monospace", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, animation: seg.label === "SEC" ? "countBounce 1s infinite" : "none" }}>
                      {seg.val}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 9, fontWeight: 900, color: `${punchCountdown.accent}80`, mt: 0.5, letterSpacing: "0.08em" }}>{seg.label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: 13 }}>{punchCountdown.helper}</Typography>

          {afterCheckinCount && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>Progress to full day</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: punchCountdown.accent }}>{afterCheckinCount.progress}%</Typography>
              </Box>
              <Box sx={{ height: 8, borderRadius: 99, bgcolor: `${punchCountdown.accent}15`, overflow: "hidden" }}>
                <Box sx={{
                  height: "100%", width: `${afterCheckinCount.progress}%`, borderRadius: 99,
                  background: `linear-gradient(90deg, ${punchCountdown.accent}80, ${punchCountdown.accent})`,
                  transition: "width 0.8s cubic-bezier(0.2,0.8,0.2,1)",
                  boxShadow: `0 0 12px ${punchCountdown.accent}50`,
                }} />
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════ */}
      {/* SECTION: OVERVIEW */}
      {/* ════════════════════════════════════ */}
      <div id="section-overview" className="emp-section">
        {/* Profile Hero */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #0f766e 100%)",
            borderRadius: 3.5,
            p: { xs: 2.5, md: 3.5 },
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(30,58,138,0.35)",
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <Box sx={{ position: "absolute", bottom: -40, left: 120, width: 140, height: 140, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, flexWrap: "wrap", position: "relative" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined}
                sx={{ width: { xs: 72, sm: 88 }, height: { xs: 72, sm: 88 }, border: "3px solid rgba(255,255,255,0.4)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", bgcolor: "rgba(255,255,255,0.15)", fontSize: { xs: 28, sm: 34 }, fontWeight: 900 }}
              >
                {profile?.name?.[0] ?? "E"}
              </Avatar>
              {todayEntry?.inTime && !todayEntry?.outTime && (
                <Box sx={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", bgcolor: "#22c55e", border: "2px solid white", animation: "livePulse 2s infinite" }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                {profile?.name ?? "Loading..."}
              </Typography>
              <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 500 }}>
                {profile?.companyRole?.name ?? "--"} · {profile?.department?.name ?? "--"} · {profile?.employeeNumber ?? ""}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                {[
                  { icon: <WorkIcon sx={{ fontSize: 12 }} />, label: profile?.shift ? `${profile.shift.name} (${profile.shift.inTime?.slice(0, 5)}–${profile.shift.outTime?.slice(0, 5)})` : "No shift" },
                  { icon: <LocationOnIcon sx={{ fontSize: 12 }} />, label: profile?.assignedOfficeLocation?.officeName ?? "Default office" },
                ].map((tag) => (
                  <Chip
                    key={tag.label}
                    icon={<Box sx={{ color: "rgba(255,255,255,0.8) !important", display: "flex" }}>{tag.icon}</Box>}
                    label={tag.label}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 11, "& .MuiChip-label": { pl: 0.5 }, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: { xs: "100%", sm: "auto" } }}>
              <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={exportAttendance}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 700, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}>
                Export CSV
              </Button>
              <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={exportPdf}
                sx={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.6)" } }}>
                Export PDF
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stat Cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3,1fr)", lg: "repeat(6,1fr)" }, gap: { xs: 1.5, md: 2 } }}>
          {[
            { label: "Working Days", val: monthSummary?.workingDays ?? "-", icon: <CalendarMonthIcon />, color: "#2563eb", sub: "This month" },
            { label: "Present", val: monthSummary?.presentDays ?? presentCount, icon: <CheckCircleIcon />, color: "#16a34a", sub: "Approved" },
            { label: "Half Days", val: monthSummary?.halfDayDays ?? halfDayCount, icon: <AccessTimeIcon />, color: "#f59e0b", sub: "Partial days" },
            { label: "Leave / Absent", val: monthSummary?.leaveDays ?? leaveCount, icon: <EventNoteIcon />, color: "#dc2626", sub: "Marked absent" },
            { label: "Hours Worked", val: `${hh}h ${mm}m`, icon: <TrendingUpIcon />, color: "#7c3aed", sub: "Total this month" },
            { label: "Overtime", val: `${Math.floor(totalOvertimeMinutes / 60)}h ${totalOvertimeMinutes % 60}m`, icon: <FlashOnIcon />, color: "#d97706", sub: "Extra hours" },
          ].map((s, i) => (
            <Box
              key={s.label}
              className="stat-card-anim"
              sx={{
                background: "#fff",
                border: "1px solid rgba(226,232,240,0.8)",
                borderRadius: 2.5,
                p: { xs: 1.75, sm: 2 },
                boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${s.color}18` },
                "&:after": { content: '""', position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: "0 0 2.5px 2.5px" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>{s.label}</Typography>
                  <Typography sx={{ mt: 0.75, fontSize: { xs: 22, sm: 26 }, fontWeight: 900, color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.val}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 11, color: "text.secondary" }}>{s.sub}</Typography>
                </Box>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${s.color}12`, display: "grid", placeItems: "center", color: s.color, border: `1px solid ${s.color}20`, flexShrink: 0 }}>
                  {s.icon}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Payslip Preview */}
        {payslip && (
          <GlassCard accentColor="linear-gradient(180deg, #7c3aed, #4f46e5)">
            <SectionTitle icon={<BarChartIcon sx={{ fontSize: 16 }} />}>Payslip Summary — {payslip.month}</SectionTitle>
            <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2.5 }}>Monthly attendance summary with deductions and earnings preview.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 1.5 }}>
              {[
                { label: "Payable Days", val: payslip.payableDays, color: "#7c3aed" },
                { label: "Net Pay", val: `₹${payslip.netPay.toLocaleString()}`, color: "#16a34a" },
                { label: "Late Deduction", val: `₹${payslip.lateDeduction.toLocaleString()}`, color: "#dc2626" },
                { label: "OT Pay", val: `₹${payslip.overtimePay.toLocaleString()}`, color: "#d97706" },
              ].map((m) => (
                <Box key={m.label} sx={{ p: 1.75, borderRadius: 2, bgcolor: `${m.color}08`, border: `1px solid ${m.color}18` }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 900, color: m.color }}>{m.val}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 1.5, fontSize: 12, color: "text.secondary" }}>
              Base ₹{payslip.baseSalary.toLocaleString()} · Unpaid leave ₹{payslip.unpaidLeaveDeduction.toLocaleString()} · Total deductions ₹{payslip.totalDeductions.toLocaleString()}
            </Typography>
          </GlassCard>
        )}
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: PUNCH IN / OUT */}
      {/* ════════════════════════════════════ */}
      <div id="section-punch" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg, #2563eb, #0f766e)">
          <SectionTitle icon={<LoginIcon sx={{ fontSize: 16 }} />}>Today's Attendance Punch</SectionTitle>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2.5 }}>
            Check-in/out requires approved device + GPS + face selfie inside your assigned office radius{qrRequired() ? " + office QR" : ""}.
          </Typography>

          {!profile?.profilePhotoUrl && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>⚠ Face reference photo required</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>Upload a clear face photo before punching for face recognition verification.</Typography>
              </Box>
              <Button variant="outlined" component="label" size="small" sx={{ borderColor: "#f59e0b", color: "#92400e", fontWeight: 700, flexShrink: 0, borderRadius: 1.5 }}>
                Upload Photo
                <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch((err) => setErr(apiMessage(err, "Upload failed"))); }} />
              </Button>
            </Box>
          )}

          {/* Device Status */}
          <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: deviceStatus?.approved ? "rgba(22,163,74,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${deviceStatus?.approved ? "rgba(22,163,74,0.25)" : "rgba(245,158,11,0.25)"}`, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: deviceStatus?.approved ? "#15803d" : "#92400e" }}>
                {deviceStatus?.approved ? "✓ Device Approved" : "⏳ Device Pending Approval"}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.2, wordBreak: "break-all" }}>ID: {deviceStatus?.deviceId ?? getDeviceId()}</Typography>
            </Box>
            {!deviceStatus?.approved && (
              <Button size="small" variant="outlined" onClick={() => registerDevice().catch((e) => setErr(apiMessage(e, "Device registration failed")))} sx={{ flexShrink: 0, borderRadius: 1.5, fontWeight: 700 }}>
                Register Device
              </Button>
            )}
          </Box>

          {/* QR Section */}
          {!todayEntry?.inTime && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)" }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#1e40af", mb: 1.25, display: "flex", alignItems: "center", gap: 0.75 }}>
                <QrCodeScannerIcon sx={{ fontSize: 16 }} /> Office QR Verification
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1.5 }}>
                {qrRequired() ? "QR is required by company policy." : "QR is optional — punch with GPS + selfie."}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1.25, mb: 1.25 }}>
                <TextField label="QR token" value={qrToken} onChange={(e) => { setQrToken(e.target.value); setQrOk(false); setQrMessage(null); }} placeholder="Scan QR or paste token" size="small" />
                <Button variant={qrOk ? "contained" : "outlined"} onClick={() => verifyQr()} disabled={!qrRequired() && !qrToken.trim()} sx={{ borderRadius: 1.5, fontWeight: 700, minWidth: 120, bgcolor: qrOk ? "#16a34a" : undefined, "&:hover": { bgcolor: qrOk ? "#15803d" : undefined } }}>
                  {qrOk ? "✓ Verified" : "Verify QR"}
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained" size="small" onClick={() => startQrCamera()} disabled={qrCameraBusy || punchBusy} startIcon={<QrCodeScannerIcon sx={{ fontSize: 14 }} />} sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12 }}>
                  {qrCameraBusy ? "Opening..." : "Scan Live QR"}
                </Button>
                <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12 }}>
                  Scan QR Image
                  <input hidden type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) scanQrImage(f); }} />
                </Button>
              </Box>
              {qrMessage && (
                <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 700, color: qrOk ? "#15803d" : "#dc2626", display: "flex", alignItems: "center", gap: 0.5 }}>
                  {qrOk ? "✓" : "✗"} {qrMessage}
                </Typography>
              )}
              {qrCameraOpen && (
                <Box sx={{ mt: 1.5, borderRadius: 2, overflow: "hidden", border: "2px solid #2563eb", position: "relative" }}>
                  <Box component="video" ref={qrVideoRef} muted playsInline sx={{ width: "100%", maxHeight: 280, display: "block", objectFit: "cover", bgcolor: "#111827" }} />
                  <Box sx={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(to right, transparent, #3b82f6, transparent)", boxShadow: "0 0 10px #3b82f6", animation: "scanLine 2.5s linear infinite" }} />
                  <Button size="small" variant="contained" color="error" onClick={stopQrCamera} sx={{ position: "absolute", bottom: 8, right: 8, borderRadius: 1.5, fontWeight: 700, fontSize: 11 }}>Stop</Button>
                </Box>
              )}
            </Box>
          )}

          {/* Location info */}
          <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", p: 1.5, borderRadius: 2, bgcolor: "rgba(15,118,110,0.04)", border: "1px solid rgba(15,118,110,0.12)" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
                <LocationOnIcon sx={{ fontSize: 14, verticalAlign: "middle" }} /> {place?.officeLocation?.officeName ?? profile?.assignedOfficeLocation?.officeName ?? "Default active office"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                Radius: {Math.round(place?.allowedRadiusMeters ?? profile?.assignedOfficeLocation?.radiusMeters ?? 0) || "--"}m
                {place && <span style={{ marginLeft: 8, fontWeight: 700, color: place.insideRadius ? "#16a34a" : "#dc2626" }}>· {Math.round(place.distanceMeters)}m away {place.insideRadius ? "✓" : "✗"}</span>}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => verifyPlace()} disabled={placeBusy || punchBusy} sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12, flexShrink: 0, color: "#0f766e", borderColor: "#0f766e" }}>
              {placeBusy ? "Checking..." : "Verify Location"}
            </Button>
          </Box>

          {placeBusy || punchBusy ? <LinearProgress sx={{ mb: 2, borderRadius: 1 }} /> : null}

          {/* Punch Times display */}
          {todayEntry?.inTime && (
            <Box sx={{ mb: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", textAlign: "center" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>Check-in</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#15803d", fontVariantNumeric: "tabular-nums" }}>{todayEntry.inTime}</Typography>
                {todayEntry.checkInPhotoUrl && (
                  <Box component="img" src={todayEntry.checkInPhotoUrl} alt="Check-in" sx={{ mt: 1, width: "100%", height: 80, objectFit: "cover", borderRadius: 1.5 }} />
                )}
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: todayEntry.outTime ? "rgba(71,85,105,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${todayEntry.outTime ? "rgba(71,85,105,0.2)" : "rgba(245,158,11,0.2)"}`, textAlign: "center" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>Check-out</Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 900, color: todayEntry.outTime ? "#475569" : "#d97706", fontVariantNumeric: "tabular-nums" }}>{todayEntry.outTime ?? "--:--"}</Typography>
                {todayEntry.checkOutPhotoUrl && (
                  <Box component="img" src={todayEntry.checkOutPhotoUrl} alt="Check-out" sx={{ mt: 1, width: "100%", height: 80, objectFit: "cover", borderRadius: 1.5 }} />
                )}
              </Box>
            </Box>
          )}

          {/* Face scores */}
          {(todayEntry?.checkInFaceScore != null || todayEntry?.checkOutFaceScore != null) && (
            <Box sx={{ mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {todayEntry?.checkInFaceScore != null && (
                <Chip
                  icon={<VerifiedUserIcon sx={{ fontSize: 14 }} />}
                  label={`Check-in face: ${Math.round(todayEntry.checkInFaceScore * 100)}% ${todayEntry.checkInFaceVerified ? "✓" : "✗"}`}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: todayEntry.checkInFaceVerified ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: todayEntry.checkInFaceVerified ? "#15803d" : "#dc2626" }}
                />
              )}
              {todayEntry?.checkOutFaceScore != null && (
                <Chip
                  icon={<VerifiedUserIcon sx={{ fontSize: 14 }} />}
                  label={`Check-out face: ${Math.round(todayEntry.checkOutFaceScore * 100)}% ${todayEntry.checkOutFaceVerified ? "✓" : "✗"}`}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: todayEntry.checkOutFaceVerified ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: todayEntry.checkOutFaceVerified ? "#15803d" : "#dc2626" }}
                />
              )}
            </Box>
          )}

          {/* Big Punch Buttons */}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {punchButtonState === "checkin" ? (
              <Button
                variant="contained" size="large" fullWidth
                onClick={() => openSelfieCamera("checkin")}
                disabled={punchBusy || selfieBusy || (qrRequiredForPunch("checkin") && !qrOk) || !deviceStatus?.approved}
                startIcon={<LoginIcon />}
                sx={{ minHeight: 64, fontWeight: 900, fontSize: 18, borderRadius: 2.5, background: "linear-gradient(135deg, #1d4ed8, #2563eb)", boxShadow: "0 10px 28px rgba(37,99,235,0.35)", letterSpacing: "0.05em", transition: "all 0.25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 36px rgba(37,99,235,0.45)" }, "&:disabled": { opacity: 0.6 } }}
              >
                {punchBusy || selfieBusy ? "Processing..." : "CHECK IN"}
              </Button>
            ) : punchButtonState === "checkout" ? (
              <Button
                variant="contained" size="large" fullWidth color="error"
                onClick={() => openSelfieCamera("checkout")}
                disabled={punchBusy || selfieBusy || (qrRequiredForPunch("checkout") && !qrOk) || !deviceStatus?.approved}
                startIcon={<LogoutIcon />}
                sx={{ minHeight: 64, fontWeight: 900, fontSize: 18, borderRadius: 2.5, background: "linear-gradient(135deg, #b91c1c, #dc2626)", boxShadow: "0 10px 28px rgba(220,38,38,0.35)", letterSpacing: "0.05em", transition: "all 0.25s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 14px 36px rgba(220,38,38,0.45)" } }}
              >
                {punchBusy || selfieBusy ? "Processing..." : "CHECK OUT"}
              </Button>
            ) : (
              <Button
                variant="contained" size="large" fullWidth disabled
                startIcon={<CheckCircleIcon />}
                sx={{ minHeight: 64, fontWeight: 900, fontSize: 18, borderRadius: 2.5, background: "linear-gradient(135deg, #15803d, #16a34a)", opacity: "0.85 !important", color: "#fff !important" }}
              >
                SHIFT COMPLETED ✓
              </Button>
            )}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button component="label" size="small" variant="outlined" disabled={punchBusy || !!todayEntry?.inTime} sx={{ flex: 1, borderRadius: 1.5, fontWeight: 600, fontSize: 12 }}>
                Upload check-in selfie
                <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkin", f); }} />
              </Button>
              <Button component="label" size="small" variant="outlined" disabled={punchBusy || !todayEntry?.inTime || !!todayEntry?.outTime} sx={{ flex: 1, borderRadius: 1.5, fontWeight: 600, fontSize: 12 }}>
                Upload check-out selfie
                <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkout", f); }} />
              </Button>
            </Box>
          </Box>

          {/* Break Tracker */}
          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
            <HourglassEmptyIcon sx={{ fontSize: 16 }} /> Break Tracking
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
            <Button variant="contained" size="small" onClick={() => startBreak().catch((e) => setErr(e?.response?.data?.error ?? "Start break failed"))} sx={{ borderRadius: 1.5, fontWeight: 700 }}>Start Break</Button>
            <Button variant="outlined" size="small" onClick={() => endBreak().catch((e) => setErr(e?.response?.data?.error ?? "End break failed"))} sx={{ borderRadius: 1.5, fontWeight: 700 }}>End Break</Button>
          </Box>
          {breaks.map((b) => (
            <Box key={b.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: b.end ? "#475569" : "#22c55e", flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {new Date(b.start).toLocaleTimeString()} → {b.end ? new Date(b.end).toLocaleTimeString() : <span style={{ color: "#22c55e", fontWeight: 700 }}>Running</span>}
              </Typography>
            </Box>
          ))}
          {!breaks.length && <Typography sx={{ fontSize: 12, color: "text.secondary", opacity: 0.7 }}>No breaks today.</Typography>}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: CALENDAR */}
      {/* ════════════════════════════════════ */}
      <div id="section-calendar" className="emp-section">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 2.5 }}>
          <GlassCard accentColor="linear-gradient(180deg, #7c3aed, #6d28d9)">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
              <SectionTitle icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}>Attendance Calendar</SectionTitle>
              <TextField label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ width: 170 }} />
            </Box>
            <MonthCalendar month={month} statusByDate={statusByDate} selectedDate={selectedDate} onDayClick={(d) => setSelectedDate(d)} />
            <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[["P", "Present", "#16a34a"], ["HD", "Half Day", "#f59e0b"], ["L", "Leave/Absent", "#dc2626"], ["H", "Holiday", "#7c3aed"]].map(([code, label, color]) => (
                <Box key={code} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: `${color}15`, border: `1.5px solid ${color}40`, display: "grid", placeItems: "center" }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 900, color }}>{code}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{label}</Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>

          {/* Selected Day Panel */}
          <GlassCard accentColor="linear-gradient(180deg, #0f766e, #0d9488)">
            <SectionTitle icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}>Selected Day</SectionTitle>
            <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 2 }}>Click a date on the calendar to view details.</Typography>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${selectedStatusColor}08`, border: `1px solid ${selectedStatusColor}20`, mb: 2 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>{selectedDate}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Box sx={{ px: 1.25, py: 0.25, borderRadius: 99, bgcolor: `${selectedStatusColor}15`, border: `1px solid ${selectedStatusColor}30` }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: selectedStatusColor }}>{selectedStatus || "—"}</Typography>
                </Box>
                {selectedHoliday && <Typography sx={{ fontSize: 12, color: "text.secondary" }}>· {selectedHoliday.name}</Typography>}
              </Box>
            </Box>

            {selectedEntry && (
              <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
                {[
                  { l: "Check-in", v: selectedEntry.inTime ?? "--" },
                  { l: "Check-out", v: selectedEntry.outTime ?? "--" },
                  { l: "Late", v: `${selectedEntry.lateMinutes ?? 0}m` },
                  { l: "Early Leave", v: `${selectedEntry.earlyLeaveMinutes ?? 0}m` },
                  { l: "Overtime", v: `${selectedEntry.overtimeMinutes ?? 0}m` },
                ].map((r) => (
                  <Box key={r.l} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{r.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.v}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Attendance photos */}
            {(selectedEntry?.checkInPhotoUrl || selectedEntry?.checkOutPhotoUrl) && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 2 }}>
                {[
                  { url: selectedEntry?.checkInPhotoUrl, label: "Check-in Selfie" },
                  { url: selectedEntry?.checkOutPhotoUrl, label: "Check-out Selfie" },
                ].map((ph) => (
                  <Box key={ph.label} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", aspect: "1/1", bgcolor: "rgba(15,23,42,0.03)", position: "relative" }}>
                    {ph.url ? (
                      <Box component="img" src={ph.url} alt={ph.label} sx={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                    ) : (
                      <Box sx={{ height: 120, display: "grid", placeItems: "center" }}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary", textAlign: "center" }}>No photo</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 1, py: 0.5, bgcolor: "rgba(0,0,0,0.55)" }}>
                      <Typography sx={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{ph.label}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Daily group photo */}
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", background: "linear-gradient(135deg, rgba(30,64,175,0.06), rgba(124,58,237,0.06))" }}>
              {selectedDailyPhoto?.photoUrl ? (
                <Box component="img" alt="Daily group" src={selectedDailyPhoto.photoUrl} sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
              ) : (
                <Box sx={{ height: 120, display: "grid", placeItems: "center", textAlign: "center", px: 1 }}>
                  <PhotoCameraIcon sx={{ fontSize: 28, color: "text.secondary", opacity: 0.3, mb: 0.5 }} />
                  <Typography sx={{ opacity: 0.6, fontSize: 12 }}>No daily group photo for this date</Typography>
                </Box>
              )}
            </Box>
          </GlassCard>
        </Box>
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: LEAVE REQUESTS */}
      {/* ════════════════════════════════════ */}
      <div id="section-leave" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg, #dc2626, #b91c1c)">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
            <SectionTitle icon={<EventNoteIcon sx={{ fontSize: 16 }} />}>Leave Requests</SectionTitle>
            <Button variant="contained" onClick={() => setLeaveOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #b91c1c, #dc2626)", boxShadow: "0 4px 14px rgba(220,38,38,0.25)" }}>
              + Request Leave
            </Button>
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2 }}>Submit leave to HR for approval. Approved leave is applied to your calendar.</Typography>

          {leaveRequests.length ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {leaveRequests.slice(0, 6).map((r) => {
                const statusColor = r.status === "APPROVED" ? "#16a34a" : r.status === "REJECTED" ? "#dc2626" : r.status === "CANCELLED" ? "#64748b" : "#d97706";
                return (
                  <Box key={r.id} sx={{ p: 2, borderRadius: 2, border: `1px solid ${statusColor}20`, bgcolor: `${statusColor}06`, transition: "transform 0.2s ease", "&:hover": { transform: "translateX(2px)" } }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
                        {r.mailSubject || `${r.leaveType ?? "Leave"} request`}
                      </Typography>
                      <Chip size="small" label={r.status.replace("_", " ")} sx={{ fontWeight: 800, fontSize: 11, bgcolor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }} />
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {r.fromDate} → {r.toDate} · {r.leaveType ?? "Leave"} · {r.reason}
                      {r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}
                    </Typography>
                    {(r.status === "PENDING" || r.status === "APPROVED") && (
                      <Button size="small" variant="outlined" sx={{ mt: 1, borderRadius: 1.5, fontWeight: 700, fontSize: 11 }} onClick={() => cancelLeave(r.id).catch((e) => setErr(apiMessage(e, "Leave cancel failed")))}>
                        {r.status === "PENDING" ? "Cancel Leave" : "Request Cancellation"}
                      </Button>
                    )}
                    {r.attachmentUrl && (
                      <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ mt: 0.5, fontWeight: 700, fontSize: 11, justifyContent: "flex-start" }}>
                        📎 {r.attachmentName ?? "Attachment"}
                      </Button>
                    )}
                  </Box>
                );
              })}
              {leaveRequests.length > 6 && <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center" }}>Showing latest 6 of {leaveRequests.length}</Typography>}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              <EventNoteIcon sx={{ fontSize: 36, opacity: 0.2, mb: 1 }} />
              <Typography sx={{ fontSize: 13 }}>No leave requests yet.</Typography>
            </Box>
          )}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: WFH / On-Duty */}
      {/* ════════════════════════════════════ */}
      <div id="section-wfh" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg, #0f766e, #059669)">
          <SectionTitle icon={<HomeWorkIcon sx={{ fontSize: 16 }} />}>WFH / On-Duty Request</SectionTitle>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2.5 }}>Request remote work or client-site attendance approval for a date range.</Typography>

          <Box sx={{ display: "grid", gap: 1.5, mb: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField select label="Request type" value={workType} onChange={(e) => setWorkType(e.target.value as WorkRequest["type"])} size="small">
                <MenuItem value="WORK_FROM_HOME">Work from Home</MenuItem>
                <MenuItem value="ON_DUTY">On Duty / Client Site</MenuItem>
              </TextField>
              <TextField label="From" type="date" value={workFrom} onChange={(e) => setWorkFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="To" type="date" value={workTo} onChange={(e) => setWorkTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            </Box>
            <TextField label="Reason" value={workReason} onChange={(e) => setWorkReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12 }}>
                {workAttachment ? `📎 ${workAttachment.name}` : "Attach Proof"}
                <input hidden type="file" onChange={(e) => setWorkAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitWorkRequest().catch((e) => setErr(apiMessage(e, "Work request failed")))} disabled={!workReason.trim()} sx={{ borderRadius: 1.5, fontWeight: 700, bgcolor: "#0f766e", "&:hover": { bgcolor: "#0d6660" } }}>
                Submit Request
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.25, color: "text.secondary" }}>Previous Requests</Typography>
          {workRequests.slice(0, 5).map((r) => {
            const sc = r.status === "APPROVED" ? "#16a34a" : r.status === "REJECTED" ? "#dc2626" : r.status === "MANAGER_RECOMMENDED" ? "#2563eb" : "#d97706";
            return (
              <Box key={r.id} sx={{ p: 1.75, borderRadius: 2, border: `1px solid ${sc}18`, bgcolor: `${sc}05`, mb: 1, "&:last-child": { mb: 0 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{r.type.replaceAll("_", " ")}</Typography>
                  <Chip size="small" label={r.status.replaceAll("_", " ")} sx={{ fontWeight: 700, fontSize: 11, bgcolor: `${sc}12`, color: sc }} />
                </Box>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>{r.fromDate} → {r.toDate} · {r.reason}</Typography>
              </Box>
            );
          })}
          {!workRequests.length && <Typography sx={{ fontSize: 13, color: "text.secondary", opacity: 0.7 }}>No WFH/on-duty requests yet.</Typography>}

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
            <FlashOnIcon sx={{ fontSize: 16 }} /> Comp-Off / Overtime Request
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5, mb: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField label="Overtime date" type="date" value={compOffOvertimeDate} onChange={(e) => setCompOffOvertimeDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Requested off date" type="date" value={compOffDate} onChange={(e) => setCompOffDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Overtime minutes" type="number" value={compOffMinutes} onChange={(e) => setCompOffMinutes(e.target.value)} size="small" />
            </Box>
            <TextField label="Reason" value={compOffReason} onChange={(e) => setCompOffReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12 }}>
                {compOffAttachment ? `📎 ${compOffAttachment.name}` : "Attach OT Proof"}
                <input hidden type="file" onChange={(e) => setCompOffAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitCompOffRequest().catch((e) => setErr(apiMessage(e, "Comp-off request failed")))} disabled={!compOffReason.trim()} sx={{ borderRadius: 1.5, fontWeight: 700 }}>
                Submit Comp-Off
              </Button>
            </Box>
          </Box>
          {compOffRequests.slice(0, 4).map((r) => (
            <Box key={r.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "#f8fafc", mb: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13 }}>OT {r.overtimeDate} → Off {r.requestedDate} · {r.overtimeMinutes}m ({r.status})</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{r.reason}{r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}</Typography>
            </Box>
          ))}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: ATTENDANCE CORRECTION */}
      {/* ════════════════════════════════════ */}
      <div id="section-correction" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg, #d97706, #b45309)">
          <SectionTitle icon={<EditNoteIcon sx={{ fontSize: 16 }} />}>Attendance Correction</SectionTitle>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 2.5 }}>
            Request HR approval if you forgot to punch or need a time correction for a selected date.
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
            📅 Selected date: <span style={{ color: "#d97706" }}>{selectedDate}</span>
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <TextField label="In time" type="time" value={correctionIn} onChange={(e) => setCorrectionIn(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <TextField label="Out time" type="time" value={correctionOut} onChange={(e) => setCorrectionOut(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            </Box>
            <TextField label="Reason for correction" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} multiline minRows={2} size="small" />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: 12 }}>
                {correctionAttachment ? `📎 ${correctionAttachment.name}` : "Attach Proof"}
                <input hidden type="file" onChange={(e) => setCorrectionAttachment(e.target.files?.[0] ?? null)} />
              </Button>
              <Button variant="contained" onClick={() => submitRegularizationRequest().catch((e) => setErr(e?.response?.data?.error ?? "Correction request failed"))} disabled={!selectedDate || !correctionReason.trim()} sx={{ borderRadius: 1.5, fontWeight: 700, bgcolor: "#d97706", "&:hover": { bgcolor: "#b45309" } }}>
                Submit Correction
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1.25, color: "text.secondary" }}>Previous Corrections</Typography>
          {regularizationRequests.slice(0, 5).map((r) => {
            const sc = r.status === "APPROVED" ? "#16a34a" : r.status === "REJECTED" ? "#dc2626" : "#d97706";
            return (
              <Box key={r.id} sx={{ p: 1.75, borderRadius: 2, border: `1px solid ${sc}18`, bgcolor: `${sc}05`, mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{r.date} · {r.inTime ?? "--"} → {r.outTime ?? "--"}
                  <span style={{ marginLeft: 8, fontSize: 11, color: sc }}>({r.status})</span>
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{r.reason}{r.hrRemarks ? ` · HR: ${r.hrRemarks}` : ""}</Typography>
              </Box>
            );
          })}
          {!regularizationRequests.length && <Typography sx={{ fontSize: 13, color: "text.secondary", opacity: 0.7 }}>No correction requests yet.</Typography>}
        </GlassCard>
      </div>

      {/* ════════════════════════════════════ */}
      {/* SECTION: PROFILE */}
      {/* ════════════════════════════════════ */}
      <div id="section-profile" className="emp-section">
        <GlassCard accentColor="linear-gradient(180deg, #475569, #334155)">
          <SectionTitle icon={<PersonIcon sx={{ fontSize: 16 }} />}>My Profile</SectionTitle>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined}
                sx={{ width: 80, height: 80, border: "3px solid rgba(37,99,235,0.2)", boxShadow: "0 8px 24px rgba(37,99,235,0.15)", bgcolor: "#1e40af", fontSize: 28, fontWeight: 900, color: "#fff" }}
              >
                {profile?.name?.[0] ?? "E"}
              </Avatar>
              {profile?.profilePhotoUrl && (
                <Tooltip title="Face reference photo uploaded">
                  <Box sx={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", bgcolor: "#16a34a", border: "2px solid white", display: "grid", placeItems: "center" }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: "#fff" }} />
                  </Box>
                </Tooltip>
              )}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#0f172a" }}>{profile?.name ?? "--"}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }}>{profile?.employeeNumber} · {profile?.companyRole?.name ?? "--"}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2.5 }}>
            {[
              ["Department", profile?.department?.name ?? "--"],
              ["Role", profile?.companyRole?.name ?? "--"],
              ["Shift", profile?.shift ? `${profile.shift.name} (${profile.shift.inTime?.slice(0, 5)}–${profile.shift.outTime?.slice(0, 5)})` : "--"],
              ["Office", profile?.assignedOfficeLocation?.officeName ?? "Default active office"],
              ["Status", profile?.status ?? "--"],
              ["Employee ID", profile?.employeeNumber ?? "--"],
            ].map(([label, val]) => (
              <Box key={label} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Typography>
                <Typography sx={{ mt: 0.4, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{val}</Typography>
              </Box>
            ))}
          </Box>

          <Button variant="outlined" component="label" fullWidth sx={{ borderRadius: 2, fontWeight: 700, py: 1.25, borderStyle: "dashed" }}>
            📷 Upload / Update Face Reference Photo
            <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch((err) => setErr(apiMessage(err, "Upload failed"))); }} />
          </Button>
          <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 12, textAlign: "center" }}>A clear face must be detected before this photo is saved for face recognition.</Typography>

          <Divider sx={{ my: 2.5 }} />
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 2, color: "#0f172a" }}>📊 This Month (Till Date)</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: 1.5 }}>
            {[
              { l: "Working Days", v: monthSummary?.workingDays ?? "-", c: "#2563eb" },
              { l: "Present", v: monthSummary?.presentDays ?? presentCount, c: "#16a34a" },
              { l: "Leave / Absent", v: monthSummary?.leaveDays ?? leaveCount, c: "#dc2626" },
              { l: "Half Days", v: monthSummary?.halfDayDays ?? halfDayCount, c: "#f59e0b" },
              { l: "Hours Worked", v: `${hh}h ${mm}m`, c: "#7c3aed" },
              { l: "Late", v: `${totalLateMinutes}m`, c: "#d97706" },
              { l: "Early Leave", v: `${totalEarlyLeaveMinutes}m`, c: "#0f766e" },
              { l: "Overtime", v: `${Math.floor(totalOvertimeMinutes / 60)}h ${totalOvertimeMinutes % 60}m`, c: "#475569" },
            ].map((s) => (
              <Box key={s.l} sx={{ p: 1.5, borderRadius: 2, bgcolor: `${s.c}06`, border: `1px solid ${s.c}18` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>{s.l}</Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 18, color: s.c }}>{s.v}</Typography>
              </Box>
            ))}
          </Box>
        </GlassCard>
      </div>

      {/* ════════════════════════════════════ */}
      {/* DIALOGS */}
      {/* ════════════════════════════════════ */}

      {/* Selfie Dialog */}
      <Dialog open={selfieOpen} onClose={stopSelfieCamera} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 1, background: selfieKind === "checkin" ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "linear-gradient(135deg, #b91c1c, #dc2626)", color: "#fff", fontSize: 18 }}>
          {selfieKind === "checkin" ? "📸 Check-in Selfie" : "📸 Check-out Selfie"}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box component="video" ref={selfieVideoRef} muted playsInline sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", bgcolor: "#111827", transform: "scaleX(-1)" }} />
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: "text.secondary", fontSize: 13, textAlign: "center" }}>
              Center your face clearly in the frame. This photo verifies your identity.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={stopSelfieCamera} sx={{ borderRadius: 2, fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => captureSelfieAndPunch().catch((e) => setErr(apiMessage(e, "Punch failed")))}
            disabled={punchBusy}
            sx={{ borderRadius: 2, fontWeight: 700, flex: 1, bgcolor: selfieKind === "checkin" ? "#2563eb" : "#dc2626" }}
          >
            {punchBusy ? "Processing..." : `Capture & ${selfieKind === "checkin" ? "Check In" : "Check Out"}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Request Dialog */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 900, pb: 1, background: "linear-gradient(135deg, #b91c1c, #dc2626)", color: "#fff" }}>📅 Request Leave</DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: "grid", gap: 1.5 }}>
          <TextField select label="Leave type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} size="small">
            {["Casual leave", "Sick leave", "Earned leave", "Unpaid leave", "Emergency leave"].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField label="Mail subject" value={leaveSubject} onChange={(e) => setLeaveSubject(e.target.value)} placeholder={`Leave request: ${leaveFrom} to ${leaveTo}`} size="small" />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <TextField label="From date" type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <TextField label="To date" type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          </Box>
          <TextField label="Short reason" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Sick leave, personal work, emergency..." multiline minRows={2} size="small" />
          <TextField label="Mail message to HR" value={leaveMessage} onChange={(e) => setLeaveMessage(e.target.value)} placeholder="Dear HR, I request leave for the selected dates because..." multiline minRows={3} size="small" />
          <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 1.5, fontWeight: 700 }}>
            {leaveAttachment ? `📎 ${leaveAttachment.name}` : "Attach Medical / Support Document"}
            <input hidden type="file" onChange={(e) => setLeaveAttachment(e.target.files?.[0] ?? null)} />
          </Button>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>HR can approve or reject from the HR dashboard. Email is sent when SMTP is enabled.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setLeaveOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={() => submitLeaveRequest().catch((e) => setErr(e?.response?.data?.error ?? "Leave request failed"))} sx={{ borderRadius: 2, fontWeight: 700, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}>
            Submit Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function requestStatusColor(status: WorkRequest["status"]): "default" | "success" | "warning" | "error" | "info" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  if (status === "MANAGER_RECOMMENDED") return "info";
  return "warning";
}
