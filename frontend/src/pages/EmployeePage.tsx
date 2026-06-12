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
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import AppCard from "../components/AppCard";
import { useToast } from "../components/Toast";
import DashboardHero from "../components/DashboardHero";
import Layout from "../components/Layout";
import MonthCalendar, { DayStatus } from "../components/MonthCalendar";
import StatCard from "../components/StatCard";

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

export default function EmployeePage() {
  const { toastSuccess, toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (err) {
      toastError(err);
      setErr(null);
    }
  }, [err, toastError]);

  useEffect(() => {
    if (ok) {
      toastSuccess(ok);
      setOk(null);
    }
  }, [ok, toastSuccess]);
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

  function scrollToSection(id: string) {
    const node = document.getElementById(id);
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
        if (tokenParam) {
          normalized = tokenParam.trim();
        }
      } catch (err) {
        const match = normalized.match(/qrToken=([^&]+)/);
        if (match && match[1]) {
          normalized = match[1].trim();
        }
      }
    }
    setQrOk(false);
    setQrMessage(null);
    if (!normalized) {
      setErr("Scan or enter office QR token first");
      return false;
    }
    try {
      const res = await api.get<{ valid: boolean; officeId?: number; officeName?: string; expiresAt?: string; dailyCode?: string; mode?: string }>("/api/employee/punch/qr", {
        params: { token: normalized },
      });
      const assignedOfficeId = profile?.assignedOfficeLocation?.id;
      if (assignedOfficeId && res.data.officeId && assignedOfficeId !== res.data.officeId) {
        const msg = `This QR belongs to ${res.data.officeName ?? "another office"}. Use the QR for ${
          profile?.assignedOfficeLocation?.officeName ?? "your assigned office"
        }.`;
        setQrMessage(msg);
        setErr(msg);
        return false;
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

  function qrRequired() {
    return Boolean(settings?.requireQrForPunch);
  }

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
    } catch {
      return null;
    }
  }

  function decodeQrFromCanvas(source: CanvasImageSource, width: number, height: number) {
    if (width <= 0 || height <= 0) return null;
    
    // Scale down high-resolution images to max 600px to prevent performance lags and browser crashes on mobile
    const maxDimension = 600;
    let canvasWidth = width;
    let canvasHeight = height;
    if (canvasWidth > maxDimension || canvasHeight > maxDimension) {
      if (canvasWidth > canvasHeight) {
        canvasHeight = Math.round((canvasHeight * maxDimension) / canvasWidth);
        canvasWidth = maxDimension;
      } else {
        canvasWidth = Math.round((canvasWidth * maxDimension) / canvasHeight);
        canvasHeight = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
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
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read QR image"));
      };
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
        } catch (bitmapError) {
          console.warn("createImageBitmap failed, trying image element fallback:", bitmapError);
        }
      }
      if (!value) {
        const img = await loadQrImage(file);
        value = await detectQrWithBarcodeDetector(img);
        if (!value) value = decodeQrFromCanvas(img, img.naturalWidth, img.naturalHeight);
      }
      if (!value) {
        setErr("No QR code found in image");
        return;
      }
      await verifyQr(value);
    } catch (e: any) {
      setErr(e?.message ?? "QR scan failed");
    }
  }

  async function startQrCamera() {
    setErr(null);
    setQrCameraBusy(true);
    try {
      stopQrCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      qrStreamRef.current = stream;
      setQrCameraOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream;
        await qrVideoRef.current.play();
      }
      qrScanActiveRef.current = true;
      const Detector = (window as any).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      scanQrFromCamera(detector);
    } catch (e: any) {
      setErr(e?.message ?? "Unable to open camera for QR scan");
      stopQrCamera();
    } finally {
      setQrCameraBusy(false);
    }
  }

  function stopQrCamera() {
    qrScanActiveRef.current = false;
    qrStreamRef.current?.getTracks().forEach((track) => track.stop());
    qrStreamRef.current = null;
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
    setQrCameraOpen(false);
  }

  async function scanQrFromCamera(detector: any) {
    if (!qrScanActiveRef.current) return;
    try {
      const video = qrVideoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        let value = detector ? (await detector.detect(video))?.[0]?.rawValue?.trim() : null;
        if (!value) {
          value = decodeQrFromCanvas(video, video.videoWidth, video.videoHeight);
        }
        if (value) {
          stopQrCamera();
          const valid = await verifyQr(value);
          if (valid) {
            await verifyPlace();
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Frame decode failed (retrying):", err);
    }
    window.setTimeout(() => scanQrFromCamera(detector), 350);
  }

  function getLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation is not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  async function verifyPlace() {
    setErr(null);
    setOk(null);
    setPlaceBusy(true);
    try {
      const loc = await getLocation();
      const res = await api.get<PunchPlace>("/api/employee/punch/place", {
        params: { latitude: loc.latitude, longitude: loc.longitude },
      });
      setPlace(res.data);
      if (res.data.insideRadius) {
        setOk(`Location verified: ${Math.round(res.data.distanceMeters)}m from office`);
      } else {
        setErr(
          `Outside office radius: ${Math.round(res.data.distanceMeters)}m away, allowed ${Math.round(
            res.data.allowedRadiusMeters,
          )}m`,
        );
      }
      return { ...loc, place: res.data };
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.message ?? "Location verification failed");
      return null;
    } finally {
      setPlaceBusy(false);
    }
  }

  async function punch(kind: "checkin" | "checkout", file: File) {
    setErr(null);
    setOk(null);
    setPunchBusy(true);
    try {
      if (qrRequiredForPunch(kind)) {
        const validQr = qrOk || (await verifyQr());
        if (!validQr) return;
      } else if (qrToken.trim() && !qrOk) {
        const validQr = await verifyQr();
        if (!validQr) return;
      }
      const verified = await verifyPlace();
      if (!verified) return;
      if (!verified.place.insideRadius) return;
      if (!deviceStatus?.approved) {
        setErr("Register this device and wait for admin approval before punch");
        return;
      }
      const fd = new FormData();
      fd.append("latitude", String(verified.latitude));
      fd.append("longitude", String(verified.longitude));
      if (qrToken.trim()) fd.append("qrToken", qrToken.trim());
      fd.append("deviceId", deviceStatus.deviceId);
      fd.append("file", file);
      const res = await api.post<Attendance>(`/api/employee/punch/${kind}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTodayEntry(res.data);
      setOk(kind === "checkin" ? "Checked in successfully" : "Checked out successfully");

      // Update month entries in-memory so the calendar reflects immediately.
      const today = dayjs().format("YYYY-MM-DD");
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.date === today);
        if (idx === -1) return [res.data, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...res.data };
        return next;
      });
      loadSummary(month).catch(() => {});
    } catch (e: any) {
      const serverMsg = e?.response?.data?.error ?? e?.message ?? "Punch failed";
      setErr(serverMsg);
    } finally {
      setPunchBusy(false);
    }
  }

  async function openSelfieCamera(kind: "checkin" | "checkout") {
    setErr(null);
    setSelfieKind(kind);
    setSelfieBusy(true);
    try {
      stopSelfieCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" } },
        audio: false,
      });
      selfieStreamRef.current = stream;
      setSelfieOpen(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
        await selfieVideoRef.current.play();
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unable to open camera for selfie");
      stopSelfieCamera();
    } finally {
      setSelfieBusy(false);
    }
  }

  function stopSelfieCamera() {
    selfieStreamRef.current?.getTracks().forEach((track) => track.stop());
    selfieStreamRef.current = null;
    if (selfieVideoRef.current) {
      selfieVideoRef.current.srcObject = null;
    }
    setSelfieOpen(false);
  }

  async function captureSelfieAndPunch() {
    const video = selfieVideoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      setErr("Camera is not ready yet");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setErr("Unable to capture selfie");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setErr("Unable to capture selfie");
      return;
    }
    const file = new File([blob], `${selfieKind}-${dayjs().format("YYYYMMDD-HHmmss")}.jpg`, { type: "image/jpeg" });
    stopSelfieCamera();
    await punch(selfieKind, file);
  }

  async function submitLeaveRequest() {
    setErr(null);
    setOk(null);
    const reason = leaveReason.trim();
    if (!reason) {
      setErr("Leave reason is required");
      return;
    }
    const res = await api.post<LeaveRequest>("/api/employee/leave-requests", {
      fromDate: leaveFrom,
      toDate: leaveTo,
      reason,
      leaveType,
      mailSubject: leaveSubject.trim() || `Leave request: ${leaveFrom} to ${leaveTo}`,
      mailMessage: leaveMessage.trim() || reason,
    });
    if (leaveAttachment) {
      const fd = new FormData();
      fd.append("file", leaveAttachment);
      await api.post(`/api/employee/leave-requests/${res.data.id}/attachment`, fd);
    }
    setOk("Leave request submitted to HR");
    setLeaveOpen(false);
    setLeaveSubject("");
    setLeaveMessage("");
    setLeaveReason("");
    setLeaveAttachment(null);
    await loadLeaveRequests();
  }

  async function submitRegularizationRequest() {
    setErr(null);
    setOk(null);
    const reason = correctionReason.trim();
    if (!reason) {
      setErr("Correction reason is required");
      return;
    }
    const res = await api.post<RegularizationRequest>("/api/employee/regularization-requests", {
      date: selectedDate,
      inTime: correctionIn || null,
      outTime: correctionOut || null,
      reason,
    });
    if (correctionAttachment) {
      const fd = new FormData();
      fd.append("file", correctionAttachment);
      await api.post(`/api/employee/regularization-requests/${res.data.id}/attachment`, fd);
    }
    setCorrectionReason("");
    setCorrectionAttachment(null);
    setOk("Attendance correction submitted to HR");
    await loadRegularizationRequests();
  }

  async function submitWorkRequest() {
    const res = await api.post<WorkRequest>("/api/employee/work-requests", {
      type: workType,
      fromDate: workFrom,
      toDate: workTo,
      reason: workReason,
    });
    if (workAttachment) {
      const fd = new FormData();
      fd.append("file", workAttachment);
      await api.post(`/api/employee/work-requests/${res.data.id}/attachment`, fd);
    }
    setWorkReason("");
    setWorkAttachment(null);
    setOk("Work request submitted");
    await loadWorkRequests();
  }

  async function submitCompOffRequest() {
    const res = await api.post<CompOffRequest>("/api/employee/comp-off-requests", {
      overtimeDate: compOffOvertimeDate,
      requestedDate: compOffDate,
      overtimeMinutes: Number(compOffMinutes),
      reason: compOffReason,
    });
    if (compOffAttachment) {
      const fd = new FormData();
      fd.append("file", compOffAttachment);
      await api.post(`/api/employee/comp-off-requests/${res.data.id}/attachment`, fd);
    }
    setCompOffReason("");
    setCompOffAttachment(null);
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
      .then(() => {
        const storedToken = localStorage.getItem("scannedQrToken");
        if (storedToken) {
          verifyQr(storedToken).catch(() => {});
        }
      })
      .catch((e) =>
        setErr(apiMessage(e, "Failed to load employee dashboard")),
      );
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

  useEffect(() => {
    loadHolidays(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadDailyPhotos(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    setClockNow(dayjs());
    if (!todayEntry?.inTime || todayEntry?.outTime) return undefined;
    const timer = window.setInterval(() => setClockNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, [todayEntry?.inTime, todayEntry?.outTime]);

  useEffect(() => {
    return () => {
      stopQrCamera();
      stopSelfieCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusByDate: Record<string, DayStatus> = useMemo(() => {
    if (!settings || !monthSummary) return {};

    const entryMap: Record<string, DayStatus> = {};
    for (const e of entries) {
      entryMap[e.date] = e.status === "PRESENT" ? "P" : e.status === "HALF_DAY" ? "HD" : "L";
    }

    const holidaySet = new Set(holidays.map((h) => h.date));
    const weekendSet = new Set(
      (settings?.weekendDays ?? "SUNDAY")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    );

    const first = dayjs(`${month}-01`);
    const days = first.daysInMonth();
    const today = dayjs().format("YYYY-MM-DD");
    const out: Record<string, DayStatus> = {};
    for (let d = 1; d <= days; d++) {
      const dt = first.date(d).format("YYYY-MM-DD");
      if (dt < monthSummary.fromDate) {
        out[dt] = "";
        continue;
      }
      const dowName = first.date(d).format("dddd").toUpperCase();
      if (holidaySet.has(dt) || weekendSet.has(dowName)) {
        out[dt] = "H";
      } else {
        out[dt] = dt <= today ? (entryMap[dt] ?? "L") : (entryMap[dt] ?? "");
      }
    }
    return out;
  }, [entries, holidays, month, monthSummary, settings]);

  useEffect(() => {
    const monthStart = `${month}-01`;
    const monthEnd = dayjs(monthStart).endOf("month").format("YYYY-MM-DD");
    let nextDate = selectedDate;

    if (!selectedDate.startsWith(`${month}-`)) {
      nextDate = monthSummary ? monthSummary.fromDate : monthStart;
    }

    if (monthSummary) {
      if (nextDate < monthSummary.fromDate) nextDate = monthSummary.fromDate;
      if (nextDate > monthEnd) nextDate = monthEnd;
    } else {
      if (nextDate < monthStart) nextDate = monthStart;
      if (nextDate > monthEnd) nextDate = monthEnd;
    }

    if (nextDate !== selectedDate) {
      setSelectedDate(nextDate);
    }
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
  const latestFaceScore =
    todayEntry?.checkOutFaceScore != null
      ? todayEntry.checkOutFaceScore
      : todayEntry?.checkInFaceScore != null
        ? todayEntry.checkInFaceScore
        : null;
  const latestFaceVerified =
    todayEntry?.checkOutFaceScore != null
      ? todayEntry.checkOutFaceVerified
      : todayEntry?.checkInFaceScore != null
        ? todayEntry.checkInFaceVerified
        : null;
  const faceScoreText = latestFaceScore == null ? "Pending" : `${Math.round(latestFaceScore * 100)}%`;
  const faceScoreHelper =
    latestFaceScore == null
      ? "Selfie is checked after check-in/check-out"
      : latestFaceVerified
        ? "Latest punch selfie matched reference"
        : "Latest punch selfie did not match reference";
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

    if (checkedOutAt) {
      return {
        label: "Shift completed",
        value: formatDurationSeconds(workedSeconds),
        helper:
          extraSeconds > 0
            ? `Regular ${formatDurationSeconds(targetSeconds)} | Extra ${formatDurationSeconds(extraSeconds)}`
            : `Checked in ${todayEntry?.inTime ?? "--"} -> checked out ${todayEntry?.outTime ?? "--"}`,
        accent: "#16a34a",
      };
    }

    if (extraSeconds === 0) {
      return {
        label: "Working time",
        value: formatDurationSeconds(workedSeconds),
        helper: `${formatDurationSeconds(remainingSeconds)} left for ${Math.round(requiredMinutes / 60)}h target | Extra 00:00:00`,
        accent: "#2563eb",
      };
    }

    return {
      label: "Overtime running",
      value: formatDurationSeconds(workedSeconds),
      helper: `Regular ${formatDurationSeconds(targetSeconds)} completed at ${workTargetAt.format("hh:mm A")} | Extra ${formatDurationSeconds(extraSeconds)}`,
      accent: "#b45309",
    };
  }, [
    clockNow,
    settings?.fullDayMinutes,
    todayEntry?.date,
    todayEntry?.inTime,
    todayEntry?.outTime,
  ]);

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
      seconds: diffSec,
      minutes: (diffSec / 60).toFixed(1),
      hours: (diffSec / 3600).toFixed(2),
      regular: formatDurationSeconds(regularSeconds),
      extra: formatDurationSeconds(extraSeconds),
      remaining: formatDurationSeconds(remainingSeconds),
      progress: Math.min(100, Math.round((regularSeconds / targetSeconds) * 100)),
      isOvertime: extraSeconds > 0,
      all: `${hrs}h ${mins}m ${secs}s`,
    };
  }, [clockNow, settings?.fullDayMinutes, todayEntry?.date, todayEntry?.inTime, todayEntry?.outTime]);

  const selectedStatus = statusByDate[selectedDate] ?? "";
  const selectedStatusColor =
    selectedStatus === "P"
      ? "#16a34a"
      : selectedStatus === "H"
        ? "#7c3aed"
        : selectedStatus === "HD"
          ? "#f59e0b"
        : selectedStatus === "L"
          ? "#dc2626"
          : "#64748b";
  const selectedStatusLabel = selectedStatus || "--";

  return (
    <Layout title="Employee Dashboard">
      <div className="grid gap-4 md:gap-6">
        {err ? <Alert severity="error">{err}</Alert> : null}
        {ok ? <Alert severity="success">{ok}</Alert> : null}

        {punchCountdown ? (
          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.5, md: 2 },
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 220px" },
              alignItems: "stretch",
              p: { xs: 1.5, md: 2.25 },
              border: `1px solid ${punchCountdown.accent}33`,
              borderRadius: 1,
              bgcolor: "#fff",
              boxShadow: `0 14px 34px ${punchCountdown.accent}16`,
            }}
          >
            <Box sx={{ minWidth: 0, display: "grid", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>
                    {punchCountdown.label}
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: punchCountdown.accent, fontSize: { xs: 38, md: 52 }, lineHeight: 1, fontWeight: 950, fontVariantNumeric: "tabular-nums" }}>
                    {punchCountdown.value}
                  </Typography>
                </Box>
                <Chip
                  label={todayEntry?.outTime ? "Completed" : afterCheckinCount?.isOvertime ? "Extra time" : "Live"}
                  color={todayEntry?.outTime ? "success" : afterCheckinCount?.isOvertime ? "warning" : "primary"}
                  sx={{ borderRadius: 1, fontWeight: 950 }}
                />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 13, lineHeight: 1.45 }}>
                {punchCountdown.helper}
              </Typography>
              {afterCheckinCount ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={afterCheckinCount.progress}
                    color={afterCheckinCount.isOvertime ? "warning" : "primary"}
                    sx={{ height: 8, borderRadius: 1, bgcolor: "rgba(15,23,42,0.08)" }}
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 1 }}>
                    {[
                      { label: "Worked", value: afterCheckinCount.all, color: "#2563eb", bg: "rgba(37,99,235,0.06)", highlight: true },
                      { label: "Regular", value: afterCheckinCount.regular, color: "#16a34a", bg: "rgba(22,163,74,0.06)" },
                      { label: "Extra", value: afterCheckinCount.extra, color: "#b45309", bg: "rgba(180,83,9,0.07)", highlight: afterCheckinCount.isOvertime },
                      { label: "Left", value: afterCheckinCount.remaining, color: "#475569", bg: "rgba(71,85,105,0.06)" },
                    ].map((stat, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          bgcolor: stat.bg,
                          border: `1px solid ${stat.color}18`,
                          textAlign: "center",
                        }}
                      >
                        <Typography sx={{ fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>
                          {stat.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 950,
                            fontSize: 13,
                            lineHeight: 1.15,
                            fontVariantNumeric: "tabular-nums",
                            color: stat.highlight ? stat.color : "text.primary"
                          }}
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null}
            </Box>
            {!todayEntry?.outTime ? (
              <Button
                variant="contained"
                color={afterCheckinCount?.isOvertime ? "warning" : "primary"}
                onClick={() => scrollToSection("employee-punch")}
                sx={{ minHeight: { xs: 48, lg: "100%" }, fontWeight: 950, borderRadius: 1 }}
              >
                Go to checkout
              </Button>
            ) : null}
          </Box>
        ) : null}

        <DashboardHero
          eyebrow="Employee workspace"
          title="My attendance cockpit"
          subtitle="Check in with verified office location, review month totals, request leave, and download your attendance report."
          right={
            <Box sx={{ display: "grid", gap: 1, minWidth: { xs: "100%", lg: 240 } }}>
              <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={exportAttendance}>
                Export CSV
              </Button>
              <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={exportPdf}>
                Export PDF
              </Button>
              <Button variant="outlined" onClick={() => verifyPlace()} disabled={placeBusy || punchBusy}>
                {placeBusy ? "Checking..." : "Verify place"}
              </Button>
            </Box>
          }
        >
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" } }}>
            {[
              ["Role", profile?.companyRole?.name ?? "--"],
              ["Department", profile?.department?.name ?? "--"],
              ["Shift", profile?.shift ? `${profile.shift.name} (${profile.shift.inTime?.slice(0, 5)}-${profile.shift.outTime?.slice(0, 5)})` : "--"],
              ["Office", profile?.assignedOfficeLocation?.officeName ?? "Default active office"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "text.secondary" }}>{label}</Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 950 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </DashboardHero>

        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Working days" value={monthSummary?.workingDays ?? "-"} helper={`Counted till today in ${month}`} icon={<CalendarMonthIcon />} />
          <StatCard label="Present" value={monthSummary?.presentDays ?? presentCount} helper="Approved present days this month" icon={<VerifiedUserIcon />} accent="#16a34a" />
          <StatCard label="Leave / absent" value={monthSummary?.leaveDays ?? leaveCount} helper="Non-working marked days" icon={<AccessTimeIcon />} accent="#dc2626" />
          <StatCard label="Face match" value={faceScoreText} helper={faceScoreHelper} icon={<VerifiedUserIcon />} accent={latestFaceVerified === false ? "#dc2626" : "#0f766e"} />
          <StatCard label="Photo linked" value={selectedDailyPhoto ? "Daily" : "None"} helper={`Source for ${selectedDate}`} icon={<PhotoCameraIcon />} accent="#b45309" />
        </div>

        <AppCard>
          <Typography sx={{ fontWeight: 950 }}>Employee self-service hub</Typography>
          <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
            Jump straight to punch, leave, WFH, correction, reports, and profile surfaces.
          </Typography>
          <Box sx={{ mt: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(6,1fr)" } }}>
            {[
              ["Punch", "employee-punch"],
              ["Leave", "employee-leave"],
              ["WFH", "employee-work"],
              ["Correction", "employee-correction"],
              ["Reports", "employee-calendar"],
              ["Profile", "employee-profile"],
            ].map(([label, id]) => (
              <Button key={id} variant="outlined" onClick={() => scrollToSection(id)} sx={{ minHeight: 46, borderRadius: 1.5 }}>
                {label}
              </Button>
            ))}
          </Box>
        </AppCard>

        {payslip ? (
          <AppCard>
            <Typography sx={{ fontWeight: 950 }}>Payslip-style attendance summary</Typography>
            <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
              Monthly payable-days and deduction preview for {payslip.month}.
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4,1fr)" } }}>
              <Metric label="Payable days" value={payslip.payableDays} />
              <Metric label="Late deduction" value={`Rs ${payslip.lateDeduction}`} />
              <Metric label="OT pay" value={`Rs ${payslip.overtimePay}`} />
              <Metric label="Net pay" value={`Rs ${payslip.netPay}`} />
            </Box>
            <Typography sx={{ mt: 1.5, opacity: 0.75, fontSize: 12 }}>
              Base Rs {payslip.baseSalary} | Unpaid leave deduction Rs {payslip.unpaidLeaveDeduction} | Total deductions Rs {payslip.totalDeductions}
            </Typography>
          </AppCard>
        ) : null}

        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 grid gap-4 md:gap-6">
            <AppCard>
              <Box id="employee-profile" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined} sx={{ width: { xs: 52, sm: 62 }, height: { xs: 52, sm: 62 } }}>
                  {profile?.name?.[0] ?? "E"}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.1 }}>
                    {profile?.name ?? "..."}
                  </Typography>
                  <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{profile?.employeeNumber ?? ""}</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>
                    Company role: <b>{profile?.companyRole?.name ?? "--"}</b>
                  </Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>
                    Office: <b>{profile?.assignedOfficeLocation?.officeName ?? "Default active office"}</b>
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" component="label" sx={{ mt: 1.5 }}>
                Upload face reference photo
                <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch((err) => setErr(apiMessage(err, "Upload failed"))); }} />
              </Button>
              <Typography sx={{ mt: 1, opacity: 0.72, fontSize: 12 }}>
                A clear face must be detected before this photo is saved for recognition.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontWeight: 900 }}>This month (till date)</Typography>
              <Box sx={{ display: "grid", gap: 0.6, mt: 1 }}>
                <Typography>
                  Working days: <b>{monthSummary?.workingDays ?? "-"}</b>
                </Typography>
                <Typography>
                  Present: <b style={{ color: "#16a34a" }}>{monthSummary?.presentDays ?? presentCount}</b>
                </Typography>
                <Typography>
                  Half day: <b style={{ color: "#f59e0b" }}>{monthSummary?.halfDayDays ?? halfDayCount}</b>
                </Typography>
                <Typography>
                  Absent/Leave: <b style={{ color: "#dc2626" }}>{monthSummary?.leaveDays ?? leaveCount}</b>
                </Typography>
                <Typography>
                  Worked: <b>{hh}h {mm}m</b>
                </Typography>
                <Typography>
                  Late: <b>{totalLateMinutes}m</b> | Early leave: <b>{totalEarlyLeaveMinutes}m</b>
                </Typography>
                <Typography>
                  Overtime: <b>{Math.floor(totalOvertimeMinutes / 60)}h {totalOvertimeMinutes % 60}m</b>
                </Typography>
                {monthSummary ? (
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    {monthSummary.fromDate <= monthSummary.toDate
                      ? `Range: ${monthSummary.fromDate} -> ${monthSummary.toDate}`
                      : `Attendance starts on ${monthSummary.fromDate}`}
                  </Typography>
                ) : null}
              </Box>
            </AppCard>

            <AppCard>
              <Box id="employee-punch" />
              <Typography sx={{ fontWeight: 950, mb: 1 }}>Today punch</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13 }}>
                Check-in/out requires approved device + GPS permission + face selfie inside your assigned office radius{qrRequired() ? " + office QR" : ""}.
              </Typography>
              <Divider sx={{ my: 2 }} />
              {!profile?.profilePhotoUrl ? (
                <Alert severity="warning" sx={{ borderRadius: 2, mb: 1.5 }}>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <Typography sx={{ fontSize: 13 }}>
                      Upload a face reference photo before punching so face recognition can verify your selfie.
                    </Typography>
                    <Button variant="outlined" component="label" size="small" sx={{ justifySelf: "start" }}>
                      Upload face reference photo
                      <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProfilePhoto(f).catch((err) => setErr(apiMessage(err, "Upload failed"))); }} />
                    </Button>
                  </Box>
                </Alert>
              ) : null}

              <Box sx={{ display: "grid", gap: 0.75, p: { xs: 1.1, sm: 1.5 }, borderRadius: 2, background: "linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.95))", border: "1px solid rgba(59,130,246,0.16)" }}>
                <Typography sx={{ fontWeight: 900 }}>Device approval</Typography>
                <Box
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    bgcolor: deviceStatus?.approved ? "rgba(22, 163, 74, 0.06)" : "rgba(245, 158, 11, 0.08)",
                    p: 1.25,
                    display: "grid",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                    Status:{" "}
                    <span style={{ color: deviceStatus?.approved ? "#16a34a" : "#b45309" }}>
                      {deviceStatus?.approved ? "Approved" : "Not approved"}
                    </span>
                  </Typography>
                  <Typography sx={{ opacity: 0.7, fontSize: 12, wordBreak: "break-all" }}>
                    Device ID: {deviceStatus?.deviceId ?? getDeviceId()}
                  </Typography>
                  {!deviceStatus?.approved ? (
                    <Button variant="outlined" onClick={() => registerDevice().catch((e) => setErr(apiMessage(e, "Device registration failed")))}>
                      Register this device
                    </Button>
                  ) : null}
                </Box>

                <Divider sx={{ my: 1 }} />
                {todayEntry?.inTime ? (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      p: 1.25,
                      borderRadius: 1,
                      border: "1px solid rgba(22,163,74,0.2)",
                      bgcolor: "rgba(22,163,74,0.06)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 950, color: "#15803d" }}>
                        Checked in
                      </Typography>
                      <Chip
                        size="small"
                        label={todayEntry?.outTime ? "Completed" : afterCheckinCount?.isOvertime ? "Extra time" : "Live now"}
                        color={todayEntry?.outTime ? "success" : afterCheckinCount?.isOvertime ? "warning" : "success"}
                        sx={{ borderRadius: 1, fontWeight: 900 }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                      QR is already verified for today's check-in. Checkout needs only GPS, approved device, and selfie.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ fontWeight: 900 }}>Office QR</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                      {qrRequired()
                        ? "QR is required by company policy for attendance punch."
                        : `QR is optional. You can punch with GPS + selfie${settings?.permanentOfficeQr ? ", and the office QR can stay active much longer." : "."}`}
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr auto" } }}>
                      <TextField
                        label="QR token"
                        value={qrToken}
                        onChange={(e) => {
                          setQrToken(e.target.value);
                          setQrOk(false);
                          setQrMessage(null);
                        }}
                        placeholder="Scan QR or paste token"
                      />
                      <Button variant={qrOk ? "contained" : "outlined"} onClick={() => verifyQr()} disabled={!qrRequired() && !qrToken.trim()}>
                        {qrOk ? "QR verified" : "Verify QR"}
                      </Button>
                    </Box>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "auto auto 1fr" }, alignItems: "center" }}>
                      <Button variant="contained" onClick={() => startQrCamera()} disabled={qrCameraBusy || punchBusy} fullWidth>
                        {qrCameraBusy ? "Opening..." : "Scan live QR"}
                      </Button>
                      <Button variant="outlined" component="label" fullWidth>
                        Scan QR image
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.currentTarget.value = "";
                            if (f) scanQrImage(f);
                          }}
                        />
                      </Button>
                      {qrMessage ? (
                        <Typography sx={{ color: qrOk ? "success.main" : "error.main", fontSize: 12, fontWeight: 800, wordBreak: "break-word" }}>
                          {qrMessage}
                        </Typography>
                      ) : null}
                    </Box>
                    {qrCameraOpen ? (
                      <Box sx={{ display: "grid", gap: 1.5, p: 1.5, border: "1px solid #dbeafe", borderRadius: 2, bgcolor: "#f0f7ff" }}>
                        <Box sx={{ position: "relative", borderRadius: 1.5, overflow: "hidden", border: "2px solid #2563eb", bgcolor: "#111827", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
                          <Box
                            component="video"
                            ref={qrVideoRef}
                            muted
                            playsInline
                            sx={{ width: "100%", maxHeight: 280, display: "block", objectFit: "cover" }}
                          />
                          {/* Pulsing Scan Line Overlay */}
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              height: "3px",
                              background: "linear-gradient(to right, transparent, #3b82f6, transparent)",
                              boxShadow: "0 0 10px #3b82f6, 0 0 4px #2563eb",
                              animation: "scanIndicator 2.5s linear infinite",
                              "@keyframes scanIndicator": {
                                "0%": { top: "0%" },
                                "50%": { top: "100%" },
                                "100%": { top: "0%" }
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1.5, alignItems: "center" }}>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 550 }}>
                            Point your camera at the office QR. Once recognized, location and QR verification will complete automatically.
                          </Typography>
                          <Button size="small" variant="outlined" color="error" onClick={stopQrCamera} sx={{ borderRadius: 1.5, fontWeight: 900 }}>
                            Stop Camera
                          </Button>
                        </Box>
                      </Box>
                    ) : null}
                  </>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography sx={{ opacity: 0.9 }}>
                  Workplace:{" "}
                  <b>
                    {place?.officeLocation?.officeName ??
                      profile?.assignedOfficeLocation?.officeName ??
                      "Default active office"}
                  </b>
                </Typography>
                <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                  Radius:{" "}
                  <b>
                    {Math.round(place?.allowedRadiusMeters ?? profile?.assignedOfficeLocation?.radiusMeters ?? 0) || "--"}m
                  </b>
                  {place ? (
                    <>
                      {" "}
                      | Current distance:{" "}
                      <b style={{ color: place.insideRadius ? "#16a34a" : "#dc2626" }}>
                        {Math.round(place.distanceMeters)}m
                      </b>
                    </>
                  ) : null}
                </Typography>
                {placeBusy || punchBusy ? <LinearProgress sx={{ my: 0.5 }} /> : null}
                <Typography sx={{ opacity: 0.9 }}>
                  Check-in: <b>{todayEntry?.inTime ?? "--"}</b>
                </Typography>
                <Typography sx={{ opacity: 0.9 }}>
                  Check-out: <b>{todayEntry?.outTime ?? "--"}</b>
                </Typography>
              {todayEntry?.checkInLatitude != null && todayEntry?.checkInLongitude != null ? (
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    Last location: {todayEntry.checkInLatitude.toFixed(5)}, {todayEntry.checkInLongitude.toFixed(5)}
                  </Typography>
                ) : null}
                {todayEntry?.checkInFaceScore != null ? (
                  <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                    Face check-in score: <b style={{ color: todayEntry.checkInFaceVerified ? "#16a34a" : "#dc2626" }}>{Math.round(todayEntry.checkInFaceScore * 100)}%</b>
                  </Typography>
                ) : null}
                {todayEntry?.checkOutFaceScore != null ? (
                  <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                    Face check-out score: <b style={{ color: todayEntry.checkOutFaceVerified ? "#16a34a" : "#dc2626" }}>{Math.round(todayEntry.checkOutFaceScore * 100)}%</b>
                  </Typography>
                ) : null}

                {afterCheckinCount ? (
                  <Box sx={{ mt: 1.5, p: 1.5, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 1, bgcolor: "#fff", display: "grid", gap: 1.25 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 950, textTransform: "uppercase", color: "text.secondary" }}>
                          Active shift
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontWeight: 950, fontSize: { xs: 30, sm: 34 }, lineHeight: 1, color: afterCheckinCount.isOvertime ? "#b45309" : "primary.main", fontVariantNumeric: "tabular-nums" }}>
                          {formatDurationSeconds(afterCheckinCount.seconds)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "text.secondary" }}>
                          Check-in time
                        </Typography>
                        <Typography sx={{ fontWeight: 950 }}>{todayEntry?.inTime ?? "--"}</Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={afterCheckinCount.progress} color={afterCheckinCount.isOvertime ? "warning" : "primary"} sx={{ height: 8, borderRadius: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, gap: 1 }}>
                      {[
                        ["Worked", afterCheckinCount.all, "#2563eb"],
                        ["Regular", afterCheckinCount.regular, "#16a34a"],
                        ["Extra", afterCheckinCount.extra, "#b45309"],
                        ["Left", afterCheckinCount.remaining, "#475569"],
                      ].map(([label, value, color]) => (
                        <Box key={label} sx={{ p: 1, borderRadius: 1, bgcolor: `${color}0d`, border: `1px solid ${color}1f`, minHeight: 62 }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: "text.secondary" }}>{label}</Typography>
                          <Typography sx={{ mt: 0.4, fontSize: 13, fontWeight: 950, color, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 3 }}>
                {!todayEntry?.inTime ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => openSelfieCamera("checkin")}
                    disabled={punchBusy || selfieBusy || (qrRequiredForPunch("checkin") && !qrOk) || !deviceStatus?.approved}
                    sx={{ minHeight: 64, fontWeight: 900, fontSize: 18, borderRadius: 3, boxShadow: "0 8px 16px rgba(59,130,246,0.2)" }}
                    fullWidth
                  >
                    {punchBusy || selfieBusy ? "Processing..." : "CHECK IN"}
                  </Button>
                ) : !todayEntry?.outTime ? (
                  <Button
                    variant="contained"
                    size="large"
                    color="error"
                    onClick={() => openSelfieCamera("checkout")}
                    disabled={punchBusy || selfieBusy || (qrRequiredForPunch("checkout") && !qrOk) || !deviceStatus?.approved}
                    sx={{ minHeight: 66, fontWeight: 950, fontSize: 18, borderRadius: 2, boxShadow: "0 10px 18px rgba(239,68,68,0.18)" }}
                    fullWidth
                  >
                    {punchBusy || selfieBusy ? "Processing..." : "CHECK OUT"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    color="success"
                    disabled
                    sx={{ minHeight: 64, fontWeight: 900, fontSize: 18, borderRadius: 3 }}
                    fullWidth
                  >
                    SHIFT COMPLETED
                  </Button>
                )}

                <Button variant="outlined" onClick={() => verifyPlace()} disabled={placeBusy || punchBusy} sx={{ borderRadius: 2 }}>
                  {placeBusy ? "Checking..." : "Verify Place Manually"}
                </Button>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
                <Button component="label" size="small" variant="text" disabled={punchBusy || !!todayEntry?.inTime} sx={{ fontSize: 11, opacity: 0.6 }}>
                  Upload check-in selfie
                  <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkin", f); }} />
                </Button>
                <Button component="label" size="small" variant="text" disabled={punchBusy || !todayEntry?.inTime || !!todayEntry?.outTime} sx={{ fontSize: 11, opacity: 0.6 }}>
                  Upload check-out selfie
                  <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) punch("checkout", f); }} />
                </Button>
              </Box>
            </AppCard>

            <AppCard>
              <Typography sx={{ fontWeight: 950 }}>Break tracking</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>Track break start/end for productive-hours review.</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={() => startBreak().catch((e) => setErr(e?.response?.data?.error ?? "Start break failed"))}>Start break</Button>
                <Button variant="outlined" onClick={() => endBreak().catch((e) => setErr(e?.response?.data?.error ?? "End break failed"))}>End break</Button>
              </Box>
              <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
                {breaks.map((b) => (
                  <Typography key={b.id} sx={{ fontSize: 13, color: "text.secondary" }}>
                    {new Date(b.start).toLocaleTimeString()} {"->"} {b.end ? new Date(b.end).toLocaleTimeString() : "Running"}
                  </Typography>
                ))}
                {!breaks.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No breaks today.</Typography> : null}
              </Box>
            </AppCard>

            <AppCard>
              <Box id="employee-leave" />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography sx={{ fontWeight: 950 }}>Leave requests</Typography>
                <Button variant="contained" onClick={() => setLeaveOpen(true)}>
                  Request
                </Button>
              </Box>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Submit leave to HR for approval. Approved leave will be applied to your calendar.
              </Typography>
              <Divider sx={{ my: 2 }} />

              {leaveRequests.length ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  {leaveRequests.slice(0, 6).map((r) => (
                    <Box
                      key={r.id}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid rgba(15,23,42,0.08)",
                        p: 1.25,
                        background:
                          r.status === "APPROVED"
                            ? "rgba(22, 163, 74, 0.06)"
                            : r.status === "REJECTED"
                              ? "rgba(220, 38, 38, 0.06)"
                              : "rgba(245, 158, 11, 0.06)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                        {r.mailSubject || `${r.leaveType ?? "Leave"} request`} | {r.fromDate} {"->"} {r.toDate}{" "}
                        <span style={{ opacity: 0.7, fontWeight: 800 }}>({r.status})</span>
                      </Typography>
                      <Typography sx={{ opacity: 0.8, fontSize: 12 }}>
                        {r.leaveType ? `${r.leaveType} | ` : ""}{r.reason}
                        {r.hrRemarks ? ` | HR: ${r.hrRemarks}` : ""}
                      </Typography>
                      {r.mailMessage ? (
                        <Typography sx={{ opacity: 0.68, fontSize: 12, mt: 0.4 }}>
                          Message: {r.mailMessage}
                        </Typography>
                      ) : null}
                      {r.attachmentUrl ? (
                        <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ mt: 0.6, justifyContent: "flex-start" }}>
                          Attachment{r.attachmentName ? `: ${r.attachmentName}` : ""}
                        </Button>
                      ) : null}
                      {r.status === "PENDING" || r.status === "APPROVED" ? (
                        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => cancelLeave(r.id).catch((e) => setErr(apiMessage(e, "Leave cancel failed")))}>
                          {r.status === "PENDING" ? "Cancel leave" : "Request cancellation"}
                        </Button>
                      ) : null}
                    </Box>
                  ))}
                  {leaveRequests.length > 6 ? (
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                      Showing latest 6 of {leaveRequests.length}.
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No leave requests yet.</Typography>
              )}
            </AppCard>

            <AppCard>
              <Box id="employee-work" />
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start", flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>WFH / On-duty request</Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                    Request remote work or client-site attendance approval for a date range.
                  </Typography>
                </Box>
                <Chip size="small" label={`${workRequests.filter((r) => r.status === "PENDING" || r.status === "MANAGER_RECOMMENDED").length} pending`} sx={{ borderRadius: 1, fontWeight: 900 }} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr 1fr" }, gap: 1.5 }}>
                  <TextField select label="Request type" value={workType} onChange={(e) => setWorkType(e.target.value as WorkRequest["type"])}>
                    <MenuItem value="WORK_FROM_HOME">Work from home</MenuItem>
                    <MenuItem value="ON_DUTY">On duty / client site</MenuItem>
                  </TextField>
                  <TextField label="From" type="date" value={workFrom} onChange={(e) => setWorkFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="To" type="date" value={workTo} onChange={(e) => setWorkTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Box>
                <TextField label="Reason" value={workReason} onChange={(e) => setWorkReason(e.target.value)} multiline minRows={2} />
                <Button variant="outlined" component="label">
                  {workAttachment ? `Proof attached: ${workAttachment.name}` : "Attach WFH / on-duty proof"}
                  <input hidden type="file" onChange={(e) => setWorkAttachment(e.target.files?.[0] ?? null)} />
                </Button>
                <Button variant="contained" onClick={() => submitWorkRequest().catch((e) => setErr(apiMessage(e, "Work request failed")))} disabled={!workReason.trim()}>
                  Submit request
                </Button>
                <Divider />
                <Box sx={{ display: "grid", gap: 1 }}>
                  {workRequests.slice(0, 5).map((r) => (
                    <Box key={r.id} sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", display: "grid", gap: 0.6 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
                          {r.type.replaceAll("_", " ")}
                        </Typography>
                        <Chip size="small" label={r.status.replaceAll("_", " ")} color={requestStatusColor(r.status)} sx={{ borderRadius: 1, fontWeight: 900 }} />
                      </Box>
                      <Typography sx={{ opacity: 0.8, fontSize: 12 }}>
                        {r.fromDate} {"->"} {r.toDate} | {r.reason}{r.remarks ? ` | Remarks: ${r.remarks}` : ""}
                      </Typography>
                      {r.attachmentUrl ? (
                        <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ justifyContent: "flex-start" }}>
                          Attachment{r.attachmentName ? `: ${r.attachmentName}` : ""}
                        </Button>
                      ) : null}
                    </Box>
                  ))}
                  {!workRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No WFH/on-duty requests yet.</Typography> : null}
                </Box>
              </Box>
            </AppCard>

            <AppCard>
              <Typography sx={{ fontWeight: 950 }}>Comp-off / overtime approval</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Request a compensatory off day for approved overtime work.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
                  <TextField label="Overtime date" type="date" value={compOffOvertimeDate} onChange={(e) => setCompOffOvertimeDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Requested off date" type="date" value={compOffDate} onChange={(e) => setCompOffDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Overtime minutes" type="number" value={compOffMinutes} onChange={(e) => setCompOffMinutes(e.target.value)} />
                </Box>
                <TextField label="Reason" value={compOffReason} onChange={(e) => setCompOffReason(e.target.value)} multiline minRows={2} />
                <Button variant="outlined" component="label">
                  {compOffAttachment ? `Comp-off proof: ${compOffAttachment.name}` : "Attach overtime proof"}
                  <input hidden type="file" onChange={(e) => setCompOffAttachment(e.target.files?.[0] ?? null)} />
                </Button>
                <Button variant="contained" onClick={() => submitCompOffRequest().catch((e) => setErr(apiMessage(e, "Comp-off request failed")))} disabled={!compOffReason.trim()}>
                  Submit comp-off
                </Button>
                <Divider />
                <Box sx={{ display: "grid", gap: 1 }}>
                  {compOffRequests.slice(0, 5).map((r) => (
                    <Box key={r.id} sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                        OT {r.overtimeDate} | Off {r.requestedDate} | {r.overtimeMinutes}m ({r.status})
                      </Typography>
                      <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                        {r.reason}{r.hrRemarks ? ` | HR: ${r.hrRemarks}` : ""}
                      </Typography>
                      {r.attachmentUrl ? (
                        <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ justifyContent: "flex-start" }}>
                          Attachment{r.attachmentName ? `: ${r.attachmentName}` : ""}
                        </Button>
                      ) : null}
                    </Box>
                  ))}
                  {!compOffRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No comp-off requests yet.</Typography> : null}
                </Box>
              </Box>
            </AppCard>

            <AppCard>
              <Box id="employee-correction" />
              <Typography sx={{ fontWeight: 950 }}>Attendance correction</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Request HR approval if you forgot punch or need a time correction for the selected date.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Selected date: {selectedDate}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <TextField label="In time" type="time" value={correctionIn} onChange={(e) => setCorrectionIn(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Out time" type="time" value={correctionOut} onChange={(e) => setCorrectionOut(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Box>
                <TextField label="Reason" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} multiline minRows={2} />
                <Button variant="outlined" component="label">
                  {correctionAttachment ? `Proof attached: ${correctionAttachment.name}` : "Attach correction proof"}
                  <input hidden type="file" onChange={(e) => setCorrectionAttachment(e.target.files?.[0] ?? null)} />
                </Button>
                <Button variant="contained" onClick={() => submitRegularizationRequest().catch((e) => setErr(e?.response?.data?.error ?? "Correction request failed"))} disabled={!selectedDate || !correctionReason.trim()}>
                  Submit correction
                </Button>
                <Divider />
                <Box sx={{ display: "grid", gap: 1 }}>
                  {regularizationRequests.slice(0, 5).map((r) => (
                    <Box key={r.id} sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                        {r.date} | {r.inTime ?? "--"} {"->"} {r.outTime ?? "--"} ({r.status})
                      </Typography>
                      <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                        {r.reason}{r.hrRemarks ? ` | HR: ${r.hrRemarks}` : ""}
                      </Typography>
                      {r.attachmentUrl ? (
                        <Button size="small" variant="text" component="a" href={r.attachmentUrl} target="_blank" rel="noreferrer" sx={{ justifyContent: "flex-start" }}>
                          Attachment{r.attachmentName ? `: ${r.attachmentName}` : ""}
                        </Button>
                      ) : null}
                    </Box>
                  ))}
                  {!regularizationRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No correction requests yet.</Typography> : null}
                </Box>
              </Box>
            </AppCard>

            <AppCard>
              <Typography sx={{ fontWeight: 950, mb: 1 }}>Selected day</Typography>
              <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1.5 }}>
                Click a date on the calendar to view status and photo.
              </Typography>
              <Divider />

              <Box sx={{ mt: 2, display: "grid", gap: 0.6 }}>
                <Typography sx={{ fontWeight: 950 }}>{selectedDate}</Typography>
                <Typography sx={{ opacity: 0.9 }}>
                  Status:{" "}
                  <b style={{ color: selectedStatusColor }}>{selectedStatusLabel}</b>
                  {selectedHoliday ? <span style={{ opacity: 0.75 }}> | {selectedHoliday.name}</span> : null}
                </Typography>
                <Typography sx={{ opacity: 0.9 }}>
                  Time:{" "}
                  <b>
                    {selectedEntry?.inTime ?? "--"} {"->"} {selectedEntry?.outTime ?? "--"}
                  </b>
                </Typography>
                {selectedEntry ? (
                  <Typography sx={{ opacity: 0.9 }}>
                    Analytics:{" "}
                    <b>
                      Late {selectedEntry.lateMinutes ?? 0}m | Early {selectedEntry.earlyLeaveMinutes ?? 0}m | OT{" "}
                      {selectedEntry.overtimeMinutes ?? 0}m
                    </b>
                  </Typography>
                ) : null}
                {selectedEntry?.checkInFaceScore != null || selectedEntry?.checkOutFaceScore != null ? (
                  <Typography sx={{ opacity: 0.9 }}>
                    Face match:{" "}
                    {selectedEntry?.checkInFaceScore != null ? (
                      <b style={{ color: selectedEntry.checkInFaceVerified ? "#16a34a" : "#dc2626" }}>
                        IN {Math.round(selectedEntry.checkInFaceScore * 100)}%
                      </b>
                    ) : (
                      <b>IN --</b>
                    )}{" "}
                    |{" "}
                    {selectedEntry?.checkOutFaceScore != null ? (
                      <b style={{ color: selectedEntry.checkOutFaceVerified ? "#16a34a" : "#dc2626" }}>
                        OUT {Math.round(selectedEntry.checkOutFaceScore * 100)}%
                      </b>
                    ) : (
                      <b>OUT --</b>
                    )}
                  </Typography>
                ) : null}
                {selectedStatus === "L" ? (
                  <Typography sx={{ opacity: 0.9 }}>
                    Leave reason: <b>{selectedEntry?.leaveReason?.trim() || "--"}</b>
                  </Typography>
                ) : null}
                <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                  Photo source:{" "}
                  <b>{selectedDailyPhoto?.photoUrl ? "Daily group photo" : "No photo for this date"}</b>
                </Typography>
                {selectedEntry?.checkInLatitude != null && selectedEntry?.checkInLongitude != null ? (
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    Check-in location:{" "}
                    <b>
                      {selectedEntry.checkInLatitude.toFixed(5)}, {selectedEntry.checkInLongitude.toFixed(5)}
                    </b>
                  </Typography>
                ) : null}
                {selectedEntry?.checkOutLatitude != null && selectedEntry?.checkOutLongitude != null ? (
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    Check-out location:{" "}
                    <b>
                      {selectedEntry.checkOutLatitude.toFixed(5)}, {selectedEntry.checkOutLongitude.toFixed(5)}
                    </b>
                  </Typography>
                ) : null}
              </Box>

              <Box
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "linear-gradient(135deg, rgba(30,64,175,0.06), rgba(124,58,237,0.06))",
                }}
              >
                {selectedDailyPhoto?.photoUrl ? (
                  <Box component="img" alt="Daily group" src={selectedDailyPhoto.photoUrl} sx={{ width: "100%", height: { xs: 170, sm: 200 }, objectFit: "cover", display: "block" }} />
                ) : (
                  <Box sx={{ height: { xs: 170, sm: 200 }, display: "grid", placeItems: "center", textAlign: "center", px: 1 }}>
                    <Typography sx={{ opacity: 0.75 }}>No daily group photo uploaded for this date</Typography>
                  </Box>
                )}
              </Box>

              {selectedEntry?.checkInPhotoUrl || selectedEntry?.checkOutPhotoUrl ? (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1 }}>
                    Attendance selfies
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.08)",
                        height: { xs: 190, sm: 160 },
                        background: "rgba(15, 23, 42, 0.02)",
                      }}
                    >
                      {selectedEntry?.checkInPhotoUrl ? (
                        <Box component="img" alt="Check-in" src={selectedEntry.checkInPhotoUrl} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                          <Typography sx={{ opacity: 0.75, fontSize: 12 }}>No check-in photo</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.08)",
                        height: { xs: 190, sm: 160 },
                        background: "rgba(15, 23, 42, 0.02)",
                      }}
                    >
                      {selectedEntry?.checkOutPhotoUrl ? (
                        <Box component="img" alt="Check-out" src={selectedEntry.checkOutPhotoUrl} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                          <Typography sx={{ opacity: 0.75, fontSize: 12 }}>No check-out photo</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </AppCard>
          </div>

          <div className="lg:col-span-8">
            <AppCard>
              <Box id="employee-calendar" />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, alignItems: "center", gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Attendance calendar
                </Typography>
                <TextField
                  label="Month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: { xs: "100%", sm: 170 } }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />

              <MonthCalendar month={month} statusByDate={statusByDate} selectedDate={selectedDate} onDayClick={(d) => setSelectedDate(d)} />

                <Typography sx={{ mt: 2, opacity: 0.75, fontSize: 12 }}>
                <b style={{ color: "#16a34a" }}>P</b> = Present,{" "}
                <b style={{ color: "#f59e0b" }}>HD</b> = Half day,{" "}
                <b style={{ color: "#dc2626" }}>L</b> = Leave/Absent,{" "}
                <b style={{ color: "#7c3aed" }}>H</b> = Holiday.
              </Typography>
            </AppCard>
          </div>
        </div>
      </div>

      <Dialog open={selfieOpen} onClose={stopSelfieCamera} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>
          {selfieKind === "checkin" ? "Check-in selfie" : "Check-out selfie"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5 }}>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Center your face clearly. This photo is checked against your face reference before attendance is marked.
          </Typography>
          <Box
            component="video"
            ref={selfieVideoRef}
            muted
            playsInline
            sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 1, bgcolor: "#111827", transform: "scaleX(-1)" }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={stopSelfieCamera}>Cancel</Button>
          <Button variant="contained" onClick={() => captureSelfieAndPunch().catch((e) => setErr(apiMessage(e, "Punch failed")))} disabled={punchBusy}>
            Capture and {selfieKind === "checkin" ? "check in" : "check out"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Compose leave mail to HR</DialogTitle>
        <DialogContent sx={{ pt: 1, display: "grid", gap: 1.5 }}>
          <TextField select label="Leave type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            {["Casual leave", "Sick leave", "Earned leave", "Unpaid leave", "Emergency leave"].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Mail subject"
            value={leaveSubject}
            onChange={(e) => setLeaveSubject(e.target.value)}
            placeholder={`Leave request: ${leaveFrom} to ${leaveTo}`}
          />
          <TextField
            label="From date"
            type="date"
            value={leaveFrom}
            onChange={(e) => setLeaveFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To date"
            type="date"
            value={leaveTo}
            onChange={(e) => setLeaveTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Short reason"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            placeholder="Sick leave, personal work, emergency..."
            multiline
            minRows={2}
          />
          <TextField
            label="Mail message to HR"
            value={leaveMessage}
            onChange={(e) => setLeaveMessage(e.target.value)}
            placeholder="Dear HR, I request leave for the selected dates because..."
            multiline
            minRows={4}
          />
          <Button variant="outlined" component="label">
            {leaveAttachment ? `Medical / support document: ${leaveAttachment.name}` : "Attach medical or support document"}
            <input hidden type="file" onChange={(e) => setLeaveAttachment(e.target.files?.[0] ?? null)} />
          </Button>
          <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
            HR can approve or reject from the HR dashboard. Email is sent when SMTP is enabled; otherwise the in-app request still appears.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLeaveOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              submitLeaveRequest().catch((e) => setErr(e?.response?.data?.error ?? "Leave request failed"))
            }
          >
            Submit
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

function Metric(props: { label: string; value: string | number }) {
  return (
    <Box sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1.2, bgcolor: "#f8fafc" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "text.secondary" }}>{props.label}</Typography>
      <Typography sx={{ mt: 0.4, fontWeight: 950 }}>{props.value}</Typography>
    </Box>
  );
}
