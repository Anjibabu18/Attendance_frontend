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
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import AppCard from "../components/AppCard";
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
  officeIpRestrictionEnabled: boolean;
  allowedOfficeCidrs: string;
  trustProxyHeaders: boolean;
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

export default function EmployeePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
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
  const [punchBusy, setPunchBusy] = useState(false);
  const [placeBusy, setPlaceBusy] = useState(false);
  const [place, setPlace] = useState<PunchPlace | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [qrOk, setQrOk] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [payslip, setPayslip] = useState<Payslip | null>(null);

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
    const normalized = token.trim();
    setQrOk(false);
    setQrMessage(null);
    if (!normalized) {
      setErr("Scan or enter office QR token first");
      return false;
    }
    try {
      const res = await api.get<{ valid: boolean; officeName?: string; expiresAt?: string }>("/api/employee/punch/qr", {
        params: { token: normalized },
      });
      setQrToken(normalized);
      setQrOk(true);
      setQrMessage(`QR verified for ${res.data.officeName ?? "office"}`);
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

  async function scanQrImage(file: File) {
    setErr(null);
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setErr("QR image scanning is not supported in this browser. Paste the QR token manually.");
      return;
    }
    try {
      const detector = new Detector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      const value = codes?.[0]?.rawValue;
      if (!value) {
        setErr("No QR code found in image");
        return;
      }
      await verifyQr(value);
    } catch (e: any) {
      setErr(e?.message ?? "QR scan failed");
    }
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
      if (qrRequired()) {
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
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.error ?? e?.message ?? "Punch failed";
      const msg =
        status === 403 && String(serverMsg).toLowerCase().includes("office")
          ? "You must be connected to the office Wi-Fi/network to punch attendance."
          : serverMsg;
      setErr(msg);
    } finally {
      setPunchBusy(false);
    }
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
    Promise.all([loadProfile(), loadAttendance(month), loadSummary(month), loadSettings()]).catch((e) =>
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
      <div className="grid gap-6">
        {err ? <Alert severity="error">{err}</Alert> : null}
        {ok ? <Alert severity="success">{ok}</Alert> : null}

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
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" } }}>
            {[
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Working days" value={monthSummary?.workingDays ?? "-"} helper={`Counted till today in ${month}`} icon={<CalendarMonthIcon />} />
          <StatCard label="Present" value={monthSummary?.presentDays ?? presentCount} helper="Approved present days this month" icon={<VerifiedUserIcon />} accent="#16a34a" />
          <StatCard label="Leave / absent" value={monthSummary?.leaveDays ?? leaveCount} helper="Non-working marked days" icon={<AccessTimeIcon />} accent="#dc2626" />
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
            <Box sx={{ mt: 2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" } }}>
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

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 grid gap-6">
            <AppCard>
              <Box id="employee-profile" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar src={profile?.profilePhotoUrl ?? profile?.companyRole?.photoUrl ?? undefined} sx={{ width: 62, height: 62 }}>
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
                This photo is compared with check-in/check-out selfies for face recognition.
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
                  Upload a face reference photo before punching so face recognition can verify your selfie.
                </Alert>
              ) : null}

              <Box sx={{ display: "grid", gap: 0.75, p: 1.5, borderRadius: 3, background: "linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.95))", border: "1px solid rgba(59,130,246,0.16)" }}>
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
                {settings?.officeIpRestrictionEnabled ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Office Wi-Fi/IP restriction is active. Connect to the approved office network before punching.
                  </Alert>
                ) : null}
                <Divider sx={{ my: 1 }} />
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
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="outlined" component="label">
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
                    <Typography sx={{ color: qrOk ? "success.main" : "error.main", fontSize: 12, fontWeight: 800 }}>
                      {qrMessage}
                    </Typography>
                  ) : null}
                </Box>
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
              </Box>

              <Box sx={{ display: "grid", gap: 1, mt: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, alignItems: "stretch" }}>
                <Button variant="outlined" onClick={() => verifyPlace()} disabled={placeBusy || punchBusy}>
                  {placeBusy ? "Checking..." : "Verify place"}
                </Button>
                <Button
                  component="label"
                  variant="contained"
                  disabled={punchBusy || !!todayEntry?.inTime}
                  sx={{ minHeight: 54, fontWeight: 900 }}
                >
                  {punchBusy ? "Working..." : "Check in"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (f) punch("checkin", f);
                    }}
                  />
                </Button>

                <Button
                  component="label"
                  variant="outlined"
                  disabled={punchBusy || !todayEntry?.inTime || !!todayEntry?.outTime}
                  sx={{ minHeight: 54, fontWeight: 900 }}
                >
                  {punchBusy ? "Working..." : "Check out"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (f) punch("checkout", f);
                    }}
                  />
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
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
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
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "linear-gradient(135deg, rgba(30,64,175,0.06), rgba(124,58,237,0.06))",
                }}
              >
                {selectedDailyPhoto?.photoUrl ? (
                  <Box component="img" alt="Daily group" src={selectedDailyPhoto.photoUrl} sx={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                ) : (
                  <Box sx={{ height: 200, display: "grid", placeItems: "center" }}>
                    <Typography sx={{ opacity: 0.75 }}>No daily group photo uploaded for this date</Typography>
                  </Box>
                )}
              </Box>

              {selectedEntry?.checkInPhotoUrl || selectedEntry?.checkOutPhotoUrl ? (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ opacity: 0.7, fontSize: 12, mb: 1 }}>
                    Attendance selfies
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "1fr 1fr" }}>
                    <Box
                      sx={{
                        borderRadius: 4,
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.08)",
                        height: 160,
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
                        borderRadius: 4,
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.08)",
                        height: 160,
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
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Attendance calendar
                </Typography>
                <TextField
                  label="Month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 170 }}
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
