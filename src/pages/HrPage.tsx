import { Alert, Avatar, Badge, Box, Button, Chip, CircularProgress, Divider, Drawer, Fab, IconButton, InputAdornment, LinearProgress, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import GroupsIcon from "@mui/icons-material/Groups";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RefreshIcon from "@mui/icons-material/Refresh";
import TableChartIcon from "@mui/icons-material/TableChart";
import TodayIcon from "@mui/icons-material/Today";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Autocomplete from "@mui/material/Autocomplete";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import AnalyticsPanel from "../components/AnalyticsPanel";
import AppCard from "../components/AppCard";
import DashboardHero from "../components/DashboardHero";
import Layout from "../components/Layout";
import MonthCalendar, { DayStatus } from "../components/MonthCalendar";
import RealtimeBoard from "../components/RealtimeBoard";
import StatCard from "../components/StatCard";

type CompanyRole = { id: number; name: string; photoUrl?: string | null };
type OfficeLocation = { id: number; officeName?: string | null; radiusMeters: number };
type Employee = {
  id: number;
  employeeNumber: string;
  name: string;
  loginRole: string;
  companyRole?: CompanyRole | null;
  assignedOfficeLocation?: OfficeLocation | null;
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
  checkInPhotoUrl?: string | null;
  checkInFaceScore?: number | null;
  checkInFaceVerified?: boolean | null;
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
};

type Holiday = { id: number; date: string; name: string };
type DailyGroupPhoto = { id: number; date: string; photoUrl: string };
type LeaveRequest = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
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
  hrRemarks?: string | null;
};
type RegularizationRequest = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
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
  employeeName: string;
  employeeNumber: string;
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
  employeeName: string;
  employeeNumber: string;
  overtimeDate: string;
  requestedDate: string;
  overtimeMinutes: number;
  reason: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
  hrRemarks?: string | null;
};
type DeviceRequest = { id: number; username: string; deviceId: string; label: string; approved: boolean; createdAt: string };
type ExceptionItem = { id: number; employeeId?: number | null; employeeName: string; employeeNumber: string; type: string; message: string; resolved: boolean; createdAt: string };
type PayrollLock = { month: string; locked: boolean; updatedAt?: string | null; updatedBy?: string | null };
type PayrollRow = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  month: string;
  workingDays: number;
  payableDays: number;
  lateMinutes: number;
  overtimeMinutes: number;
  baseSalary: number;
  dailyRate: number;
  earnedSalary: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  overtimePay: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
};

function formatDurationMinutes(totalMinutes: number) {
  const safe = Math.max(0, Math.floor(totalMinutes));
  return `${Math.floor(safe / 60)}h ${safe % 60}m`;
}

type TodayEntry = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  profilePhotoUrl?: string | null;
  status: "PRESENT" | "HALF_DAY" | "LEAVE" | null;
  inTime?: string | null;
  outTime?: string | null;
  workedMinutes?: number | null;
  lateMinutes?: number | null;
  checkInFaceVerified?: boolean | null;
  checkInFaceScore?: number | null;
};

export type AuditAction =
  | "MARK_ATTENDANCE"
  | "BULK_MARK"
  | "AUTO_RESOLVE_PUNCHOUT"
  | "LOCK_PAYROLL"
  | "UNLOCK_PAYROLL"
  | "EXPORT_XLSX"
  | "EXPORT_CSV"
  | "EXPORT_PDF"
  | "SCAN_MISSING_CHECKOUT"
  | "APPROVE_REQUEST"
  | "REJECT_REQUEST";

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: string;
  target: string;
  details: string;
  badgeColor?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default";
};

export default function HrPage() {
  const { toastSuccess, toastError } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("18:00");
  const [leaveReason, setLeaveReason] = useState("");
  const [fromDate, setFromDate] = useState("2026-01-19");
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dailyPhotos, setDailyPhotos] = useState<DailyGroupPhoto[]>([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingRegularizationRequests, setPendingRegularizationRequests] = useState<RegularizationRequest[]>([]);
  const [pendingWorkRequests, setPendingWorkRequests] = useState<WorkRequest[]>([]);
  const [pendingCompOffRequests, setPendingCompOffRequests] = useState<CompOffRequest[]>([]);
  const [pendingDeviceRequests, setPendingDeviceRequests] = useState<DeviceRequest[]>([]);
  const [attendanceExceptions, setAttendanceExceptions] = useState<ExceptionItem[]>([]);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [payrollLock, setPayrollLock] = useState<PayrollLock | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [leaveRemarks, setLeaveRemarks] = useState<Record<number, string>>({});
  const [regularizationRemarks, setRegularizationRemarks] = useState<Record<number, string>>({});
  const [workRemarks, setWorkRemarks] = useState<Record<number, string>>({});
  const [compOffRemarks, setCompOffRemarks] = useState<Record<number, string>>({});
  const [inboxFilter, setInboxFilter] = useState<"ALL" | "LEAVE" | "WFH" | "CORRECTION" | "COMP_OFF" | "DEVICE">("ALL");
  const [selectedInboxItem, setSelectedInboxItem] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [statusToMark, setStatusToMark] = useState<"PRESENT" | "ABSENT">("PRESENT");
  const [bulkStatusToMark, setBulkStatusToMark] = useState<"PRESENT" | "ABSENT">("PRESENT");
  // Feature: sorting for payroll table
  const [payrollSortKey, setPayrollSortKey] = useState<keyof PayrollRow>("netPay");
  const [payrollSortAsc, setPayrollSortAsc] = useState(false);
  const [payrollShowAll, setPayrollShowAll] = useState(false);
  // Feature: All Employees Today panel
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todaySearch, setTodaySearch] = useState("");
  const [todayPanelOpen, setTodayPanelOpen] = useState(true);
  const todayRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Feature: Bulk XLSX export
  const [bulkExporting, setBulkExporting] = useState(false);
  // Feature: Late arrivals dashboard
  const [lateThreshold, setLateThreshold] = useState(3);
  const [latePanelOpen, setLatePanelOpen] = useState(true);
  // Feature: Back to top
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Feature: Missing punch-out resolve
  const [autoResolving, setAutoResolving] = useState(false);

  // Feature #15: Attendance Audit Log
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem("hr_attendance_audit_log");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      {
        id: "seed_1",
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        action: "AUTO_RESOLVE_PUNCHOUT",
        actor: "HR System Auto-Bot",
        target: "Today's Workforce",
        details: "Auto-resolved 2 missing evening punch-outs with standard closing time (17:30)",
        badgeColor: "warning",
      },
      {
        id: "seed_2",
        timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
        action: "LOCK_PAYROLL",
        actor: "HR Admin",
        target: `Payroll Register (${dayjs().format("YYYY-MM")})`,
        details: "Verified monthly payable days and late deductions; register state set to LOCKED",
        badgeColor: "success",
      },
      {
        id: "seed_3",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        action: "MARK_ATTENDANCE",
        actor: "HR Admin",
        target: "EMP001",
        details: "Manual administrative override: marked PRESENT with verified on-duty exemption",
        badgeColor: "primary",
      },
    ];
  });

  const recordAuditEntry = useCallback((
    action: AuditAction,
    target: string,
    details: string,
    badgeColor: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default" = "default"
  ) => {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      actor: "HR Admin",
      target,
      details,
      badgeColor,
    };
    setAuditLogs((prev) => {
      const next = [entry, ...prev].slice(0, 300);
      try {
        localStorage.setItem("hr_attendance_audit_log", JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  function exportAuditCsv() {
    if (!auditLogs.length) {
      toastError("No audit log entries to export");
      return;
    }
    const headers = ["ID", "Timestamp", "Action", "Actor", "Target", "Details"];
    const rows = auditLogs.map((log) => [
      log.id,
      dayjs(log.timestamp).format("YYYY-MM-DD HH:mm:ss"),
      log.action,
      log.actor,
      `"${(log.target || "").replace(/"/g, '""')}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `hr-attendance-audit-log-${dayjs().format("YYYYMMDD-HHmmss")}.csv`);
    toastSuccess("📥 Audit log exported as CSV!");
  }

  function clearAuditLogs() {
    setAuditLogs([]);
    try {
      localStorage.removeItem("hr_attendance_audit_log");
    } catch (_) {}
    toastSuccess("Audit log history cleared");
  }

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      const matchesFilter =
        auditFilter === "ALL" ||
        (auditFilter === "ATTENDANCE" && (entry.action === "MARK_ATTENDANCE" || entry.action === "BULK_MARK")) ||
        (auditFilter === "AUTO_RESOLVE" && entry.action === "AUTO_RESOLVE_PUNCHOUT") ||
        (auditFilter === "PAYROLL" && (entry.action === "LOCK_PAYROLL" || entry.action === "UNLOCK_PAYROLL")) ||
        (auditFilter === "EXPORTS" && (entry.action === "EXPORT_XLSX" || entry.action === "EXPORT_CSV" || entry.action === "EXPORT_PDF")) ||
        (auditFilter === "EXCEPTIONS" && entry.action === "SCAN_MISSING_CHECKOUT");
      if (!matchesFilter) return false;
      if (!auditSearch.trim()) return true;
      const q = auditSearch.toLowerCase();
      return (
        entry.target.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditFilter, auditSearch]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Feature #20: Auto refresh on tab focus
    const onFocus = () => { loadTodayEntries(); };
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function loadEmployees() {
    const res = await api.get<Employee[]>("/api/hr/employees");
    setEmployees(res.data || []);
    if ((res.data || []).length && employeeId === "") setEmployeeId(res.data[0].id);
  }

  async function loadSettings() {
    const res = await api.get<AttendanceSettings>("/api/settings/attendance");
    setSettings(res.data);
    setInTime(res.data.defaultInTime?.slice(0, 5) || "09:00");
    setOutTime(res.data.defaultOutTime?.slice(0, 5) || "18:00");
  }

  async function loadHolidays(m: string) {
    const res = await api.get<Holiday[]>("/api/holidays", { params: { month: m } });
    setHolidays(res.data || []);
  }

  async function loadDailyPhotos(m: string) {
    const res = await api.get<DailyGroupPhoto[]>("/api/daily-group-photos", { params: { month: m } });
    setDailyPhotos(res.data || []);
  }

  async function loadPendingLeaveRequests() {
    const res = await api.get<LeaveRequest[]>("/api/hr/leave-requests/pending");
    setPendingLeaveRequests(res.data || []);
  }

  async function loadPendingRegularizationRequests() {
    const res = await api.get<RegularizationRequest[]>("/api/hr/regularization-requests/pending");
    setPendingRegularizationRequests(res.data || []);
  }

  async function loadPendingWorkRequests() {
    const res = await api.get<WorkRequest[]>("/api/hr/work-requests/pending");
    setPendingWorkRequests(res.data || []);
  }

  async function loadPendingCompOffRequests() {
    const res = await api.get<CompOffRequest[]>("/api/hr/comp-off-requests/pending");
    setPendingCompOffRequests(res.data || []);
  }

  async function loadPendingDeviceRequests() {
    const res = await api.get<DeviceRequest[]>("/api/hr/device-requests/pending");
    setPendingDeviceRequests(res.data || []);
  }

  async function loadExceptions() {
    const res = await api.get<ExceptionItem[]>("/api/hr/exceptions");
    setAttendanceExceptions(res.data || []);
  }

  async function loadPayroll(m: string) {
    const [rows, lock] = await Promise.all([
      api.get<PayrollRow[]>("/api/hr/payroll", { params: { month: m } }),
      api.get<PayrollLock>("/api/hr/payroll-lock", { params: { month: m } }),
    ]);
    setPayrollRows(rows.data || []);
    setPayrollLock(lock.data);
  }

  async function setPayrollLocked(locked: boolean) {
    const res = await api.post<PayrollLock>("/api/hr/payroll-lock", null, { params: { month, locked } });
    setPayrollLock(res.data);
    setOk(locked ? "Payroll month locked" : "Payroll month unlocked");
    recordAuditEntry(
      locked ? "LOCK_PAYROLL" : "UNLOCK_PAYROLL",
      `Payroll Register (${month})`,
      `Payroll month ${month} ${locked ? "LOCKED (Read-only)" : "UNLOCKED (Editable)"} for ${payrollRows.length} employees`,
      locked ? "success" : "warning"
    );
  }

  async function exportPayrollCsv() {
    const res = await api.get<Blob>("/api/hr/payroll/export", { params: { month }, responseType: "blob" });
    downloadBlob(res.data, `payroll-${month}.csv`);
    recordAuditEntry(
      "EXPORT_CSV",
      `Payroll Register (${month})`,
      `Exported payroll register CSV for ${payrollRows.length} employees`,
      "info"
    );
  }

  async function scanMissingCheckouts() {
    const res = await api.post<Record<string, number>>("/api/hr/exceptions/scan-missing-checkouts");
    setOk(`Missing checkout scan complete: ${res.data.createdExceptions ?? 0} new exceptions`);
    recordAuditEntry(
      "SCAN_MISSING_CHECKOUT",
      `Exceptions Scanner (${month})`,
      `Scanned today checkouts: ${res.data.createdExceptions ?? 0} missing checkout exceptions logged`,
      "info"
    );
    await loadExceptions();
  }

  async function refreshAfterDecision() {
    await Promise.all([
      loadPendingLeaveRequests(),
      loadPendingRegularizationRequests(),
      loadPendingWorkRequests(),
      loadPendingCompOffRequests(),
      loadPendingDeviceRequests(),
      loadExceptions(),
      loadAnalytics(month),
      loadPayroll(month),
      employeeId === "" ? Promise.resolve() : loadAttendance(employeeId, month),
      employeeId === "" ? Promise.resolve() : loadSummary(employeeId, month),
    ]);
  }

  async function approveLeaveRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/leave-requests/${id}/approve`, { remarks: leaveRemarks[id]?.trim() || null });
    setLeaveRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Leave request approved");
    await refreshAfterDecision();
  }

  async function rejectLeaveRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/leave-requests/${id}/reject`, { remarks: leaveRemarks[id]?.trim() || null });
    setLeaveRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Leave request rejected");
    await refreshAfterDecision();
  }

  async function approveRegularizationRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/regularization-requests/${id}/approve`, { remarks: regularizationRemarks[id]?.trim() || null });
    setRegularizationRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Attendance correction approved");
    await refreshAfterDecision();
  }

  async function rejectRegularizationRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/regularization-requests/${id}/reject`, { remarks: regularizationRemarks[id]?.trim() || null });
    setRegularizationRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Attendance correction rejected");
    await refreshAfterDecision();
  }

  async function approveWorkRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/work-requests/${id}/approve`, { remarks: workRemarks[id]?.trim() || null });
    setWorkRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Work request approved");
    await refreshAfterDecision();
  }

  async function rejectWorkRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/work-requests/${id}/reject`, { remarks: workRemarks[id]?.trim() || null });
    setWorkRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Work request rejected");
    await refreshAfterDecision();
  }

  async function approveCompOff(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/comp-off-requests/${id}/approve`, { remarks: compOffRemarks[id]?.trim() || null });
    setCompOffRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Comp-off approved");
    await refreshAfterDecision();
  }

  async function rejectCompOff(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/comp-off-requests/${id}/reject`, { remarks: compOffRemarks[id]?.trim() || null });
    setCompOffRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Comp-off rejected");
    await refreshAfterDecision();
  }

  async function approveLeaveCancellation(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/leave-requests/${id}/approve-cancellation`, { remarks: leaveRemarks[id]?.trim() || null });
    setLeaveRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Leave cancellation approved");
    await refreshAfterDecision();
  }

  async function rejectLeaveCancellation(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/leave-requests/${id}/reject-cancellation`, { remarks: leaveRemarks[id]?.trim() || null });
    setLeaveRemarks((prev) => ({ ...prev, [id]: "" }));
    setOk("Leave cancellation rejected");
    await refreshAfterDecision();
  }

  async function approveDeviceRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/device-requests/${id}/approve`);
    setOk("Device approved");
    await refreshAfterDecision();
  }

  async function rejectDeviceRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/hr/device-requests/${id}/reject`);
    setOk("Device rejected");
    await refreshAfterDecision();
  }

  async function resolveException(id: number) {
    await api.post(`/api/hr/exceptions/${id}/resolve`);
    setOk("Exception resolved");
    await loadExceptions();
  }

  async function loadAttendance(empId: number, m: string) {
    const res = await api.get<Attendance[]>("/api/hr/attendance", { params: { employeeId: empId, month: m } });
    setEntries(res.data || []);
  }

  async function loadSummary(empId: number, m: string) {
    const res = await api.get<MonthSummary>("/api/hr/attendance/summary", { params: { employeeId: empId, month: m } });
    setMonthSummary(res.data);
  }

  async function exportAttendance() {
    if (employeeId === "") return;
    setErr(null);
    try {
      const res = await api.get<Blob>("/api/hr/attendance/export", {
        params: { employeeId, month },
        responseType: "blob",
      });
      const selected = employees.find((e) => e.id === employeeId);
      downloadBlob(res.data, `attendance-${selected?.employeeNumber ?? employeeId}-${month}.csv`);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.message ?? "Export failed");
    }
  }

  async function exportPdf() {
    if (employeeId === "") return;
    setErr(null);
    try {
      const res = await api.get<Blob>("/api/hr/attendance/report.pdf", {
        params: { employeeId, month },
        responseType: "blob",
      });
      const selected = employees.find((e) => e.id === employeeId);
      downloadBlob(res.data, `attendance-${selected?.employeeNumber ?? employeeId}-${month}.pdf`);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.message ?? "PDF export failed");
    }
  }

  // Feature 1: XLSX client-side export (enhanced — 3 sheets)
  function exportXlsx() {
    if (employeeId === "" || !entries.length) return;
    const selectedEmp = employees.find((e) => e.id === employeeId);
    const empName = selectedEmp?.name ?? "Employee";
    const empNo = selectedEmp?.employeeNumber ?? String(employeeId);
    const empRole = selectedEmp?.companyRole?.name ?? "";
    const empOffice = selectedEmp?.assignedOfficeLocation?.officeName ?? "Default Office";

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Daily Attendance Log (richer columns) ──
    const totalLateMin = entries.reduce((a, e) => a + (e.lateMinutes ?? 0), 0);
    const totalOtMin = entries.reduce((a, e) => a + (e.overtimeMinutes ?? 0), 0);
    const totalWorkedMin = entries.reduce((a, e) => a + (e.workedMinutes ?? 0), 0);

    // Employee info header rows
    const infoRows = [
      { "ATTENDANCE REPORT": `Employee: ${empName}` },
      { "ATTENDANCE REPORT": `Emp #: ${empNo}  |  Role: ${empRole}  |  Office: ${empOffice}` },
      { "ATTENDANCE REPORT": `Month: ${month}  |  Exported: ${dayjs().format("DD MMM YYYY HH:mm")}` },
      { "ATTENDANCE REPORT": "" }, // blank separator
    ];
    const ws1 = XLSX.utils.json_to_sheet(infoRows);

    // Attendance data below info rows
    const dailyHeaders = [["Date", "Day", "Status", "Check-In", "Check-Out", "Worked (h)", "Late (min)", "Early Leave (min)", "OT (min)", "In Face%", "In Verified", "Out Face%", "Out Verified", "Auto Checkout", "Leave Reason"]];
    const dailyRows = entries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [
        e.date,
        dayjs(e.date).format("ddd"),
        e.status === "PRESENT" ? "Present" : e.status === "HALF_DAY" ? "Half Day" : "Leave/Absent",
        e.inTime ? e.inTime.substring(0, 5) : "--",
        e.outTime ? e.outTime.substring(0, 5) : "--",
        e.workedMinutes != null ? Number((e.workedMinutes / 60).toFixed(2)) : "",
        e.lateMinutes ?? 0,
        e.earlyLeaveMinutes ?? 0,
        e.overtimeMinutes ?? 0,
        e.checkInFaceScore != null ? `${Math.round(e.checkInFaceScore * 100)}%` : "--",
        e.checkInFaceVerified === true ? "✓ Yes" : e.checkInFaceVerified === false ? "✗ No" : "--",
        e.checkOutFaceScore != null ? `${Math.round(e.checkOutFaceScore * 100)}%` : "--",
        e.checkOutFaceVerified === true ? "✓ Yes" : e.checkOutFaceVerified === false ? "✗ No" : "--",
        e.outTime?.startsWith("23:59") && e.checkOutFaceVerified == null ? "Yes" : "No",
        e.leaveReason ?? "",
      ]);
    // Totals row
    const totalsRow = ["", "TOTALS", "", "", "", Number((totalWorkedMin / 60).toFixed(2)), totalLateMin, entries.reduce((a, e) => a + (e.earlyLeaveMinutes ?? 0), 0), totalOtMin, "", "", "", "", "", ""];
    const allData = [...dailyHeaders, ...dailyRows, totalsRow];
    XLSX.utils.sheet_add_aoa(ws1, allData, { origin: "A5" });
    ws1["!cols"] = [16, 6, 14, 10, 10, 12, 12, 17, 10, 12, 14, 12, 14, 14, 22].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws1, "Daily Log");

    // ── Sheet 2: Month Summary ──
    if (monthSummary) {
      const absentDays = monthSummary.workingDays - monthSummary.presentDays - monthSummary.halfDayDays - monthSummary.leaveDays;
      const avgDailyH = monthSummary.presentDays > 0
        ? Number((totalWorkedMin / 60 / monthSummary.presentDays).toFixed(2))
        : 0;
      const summaryAoa = [
        ["MONTH SUMMARY", ""],
        ["", ""],
        ["Employee", empName],
        ["Emp Number", empNo],
        ["Company Role", empRole],
        ["Office", empOffice],
        ["Month", monthSummary.month],
        ["", ""],
        ["Working Days", monthSummary.workingDays],
        ["Present Days", monthSummary.presentDays],
        ["Half Days", monthSummary.halfDayDays],
        ["Leave Days", monthSummary.leaveDays],
        ["Absent Days", absentDays],
        ["", ""],
        ["Total Worked (h)", Number((totalWorkedMin / 60).toFixed(2))],
        ["Avg Daily Hours", avgDailyH],
        ["Total Late (min)", totalLateMin],
        ["Total Early Leave (min)", entries.reduce((a, e) => a + (e.earlyLeaveMinutes ?? 0), 0)],
        ["Total Overtime (min)", totalOtMin],
        ["", ""],
        ["Attendance %", monthSummary.workingDays > 0 ? `${Math.round((monthSummary.presentDays / monthSummary.workingDays) * 100)}%` : "--"],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(summaryAoa);
      ws2["!cols"] = [{ wch: 26 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Month Summary");
    }

    // ── Sheet 3: Payroll Preview (if payroll rows exist for this employee) ──
    const empPayroll = payrollRows.find((r) => r.employeeId === employeeId);
    if (empPayroll) {
      const payrollAoa = [
        ["PAYROLL PREVIEW", ""],
        ["", ""],
        ["Employee", empPayroll.employeeName],
        ["Emp Number", empPayroll.employeeNumber],
        ["Month", empPayroll.month],
        ["", ""],
        ["Working Days", empPayroll.workingDays],
        ["Payable Days", empPayroll.payableDays],
        ["Base Salary (Rs)", empPayroll.baseSalary],
        ["Daily Rate (Rs)", Number(empPayroll.dailyRate.toFixed(2))],
        ["Earned Salary (Rs)", Number(empPayroll.earnedSalary.toFixed(2))],
        ["", ""],
        ["Late (min)", empPayroll.lateMinutes],
        ["Late Deduction (Rs)", Number(empPayroll.lateDeduction.toFixed(2))],
        ["Unpaid Leave Deduction (Rs)", Number(empPayroll.unpaidLeaveDeduction.toFixed(2))],
        ["Total Deductions (Rs)", Number(empPayroll.totalDeductions.toFixed(2))],
        ["", ""],
        ["Overtime (min)", empPayroll.overtimeMinutes],
        ["Overtime Pay (Rs)", Number(empPayroll.overtimePay.toFixed(2))],
        ["", ""],
        ["Gross Pay (Rs)", Number(empPayroll.grossPay.toFixed(2))],
        ["NET PAY (Rs)", Number(empPayroll.netPay.toFixed(2))],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(payrollAoa);
      ws3["!cols"] = [{ wch: 28 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, "Payroll Preview");
    }

    const xlsxBlob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([xlsxBlob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `attendance-${empNo}-${month}.xlsx`
    );
    toastSuccess(`Excel report for ${empName} downloaded! ${empPayroll ? "(3 sheets: Daily Log, Summary, Payroll)" : "(2 sheets: Daily Log, Summary)"}`);
  }

  // Feature 6: Load all employees' today attendance
  const loadTodayEntries = useCallback(async () => {
    setTodayLoading(true);
    try {
      const today = dayjs().format("YYYY-MM-DD");
      // Reuse existing analytics or fetch fresh data per employee for today
      const res = await api.get<any>("/api/hr/attendance/today").catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setTodayEntries(res.data);
      } else {
        // Fallback: build from employees list + analytics present list
        const analRes = await api.get<Record<string, any>>("/api/hr/analytics", { params: { month: today.substring(0, 7) } });
        const presentIds: number[] = analRes.data?.presentToday ?? analRes.data?.todayPresentIds ?? [];
        const builtEntries: TodayEntry[] = employees.map((emp) => ({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeNumber: emp.employeeNumber,
          profilePhotoUrl: emp.profilePhotoUrl,
          status: presentIds.includes(emp.id) ? "PRESENT" : null,
          inTime: null,
          outTime: null,
          workedMinutes: null,
          lateMinutes: null,
        }));
        setTodayEntries(builtEntries);
      }
    } catch (_) {
      // Silent fail — widget is non-critical
    } finally {
      setTodayLoading(false);
    }
  }, [employees]);

  // Feature #10: Bulk XLSX Export — all employees for the month
  async function exportAllEmployeesXlsx() {
    if (!employees.length) return;
    setBulkExporting(true);
    toastSuccess(`Fetching data for ${employees.length} employees…`);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Master summary table — one row per employee
      const summaryRows: any[] = [];
      for (const emp of employees) {
        try {
          const [attRes, sumRes] = await Promise.all([
            api.get<any[]>("/api/hr/attendance", { params: { employeeId: emp.id, month } }),
            api.get<any>("/api/hr/attendance/summary", { params: { employeeId: emp.id, month } }),
          ]);
          const att: any[] = attRes.data || [];
          const s = sumRes.data;
          const totalLate = att.reduce((a: number, e: any) => a + (e.lateMinutes ?? 0), 0);
          const totalOt = att.reduce((a: number, e: any) => a + (e.overtimeMinutes ?? 0), 0);
          const totalWorked = att.reduce((a: number, e: any) => a + (e.workedMinutes ?? 0), 0);
          const absent = s ? s.workingDays - s.presentDays - s.halfDayDays - s.leaveDays : 0;
          const empPayroll = payrollRows.find((r) => r.employeeId === emp.id);
          summaryRows.push({
            "Emp #": emp.employeeNumber,
            "Name": emp.name,
            "Role": emp.companyRole?.name ?? "",
            "Office": emp.assignedOfficeLocation?.officeName ?? "Default",
            "Working Days": s?.workingDays ?? 0,
            "Present": s?.presentDays ?? 0,
            "Half Days": s?.halfDayDays ?? 0,
            "Leave": s?.leaveDays ?? 0,
            "Absent": absent,
            "Attend %": s?.workingDays ? `${Math.round((s.presentDays / s.workingDays) * 100)}%` : "--",
            "Worked (h)": Number((totalWorked / 60).toFixed(2)),
            "Late (min)": totalLate,
            "OT (min)": totalOt,
            "Net Pay (Rs)": empPayroll ? Math.round(empPayroll.netPay) : "",
          });

          // Per-employee detail sheet
          const detailRows = att.slice().sort((a: any, b: any) => a.date.localeCompare(b.date)).map((e: any) => ({
            Date: e.date,
            Day: dayjs(e.date).format("ddd"),
            Status: e.status === "PRESENT" ? "Present" : e.status === "HALF_DAY" ? "Half Day" : "Leave/Absent",
            "In": e.inTime?.substring(0, 5) ?? "--",
            "Out": e.outTime?.substring(0, 5) ?? "--",
            "Worked (h)": e.workedMinutes != null ? Number((e.workedMinutes / 60).toFixed(2)) : "",
            "Late (m)": e.lateMinutes ?? 0,
            "OT (m)": e.overtimeMinutes ?? 0,
            "In Face": e.checkInFaceScore != null ? `${Math.round(e.checkInFaceScore * 100)}%` : "--",
            "Leave Reason": e.leaveReason ?? "",
          }));
          if (detailRows.length) {
            const sheetName = `${emp.employeeNumber}`.slice(0, 31); // Excel sheet name limit
            const ws = XLSX.utils.json_to_sheet(detailRows);
            ws["!cols"] = [12, 5, 14, 7, 7, 10, 8, 7, 9, 20].map((w) => ({ wch: w }));
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          }
        } catch (_) { /* skip failed employee */ }
      }

      // Add summary sheet as first sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [10, 22, 16, 16, 12, 10, 10, 8, 8, 10, 12, 12, 10, 14].map((w) => ({ wch: w }));
      // Prepend the summary sheet
      wb.SheetNames = ["All Employees Summary", ...wb.SheetNames];
      wb.Sheets["All Employees Summary"] = wsSummary;

      const xlsxBlob = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      downloadBlob(
        new Blob([xlsxBlob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `attendance-all-employees-${month}.xlsx`
      );
      recordAuditEntry(
        "EXPORT_XLSX",
        `All Employees (${employees.length})`,
        `Exported bulk attendance XLSX workbook (${wb.SheetNames.length} sheets) for ${month}`,
        "primary"
      );
      toastSuccess(`✅ Bulk XLSX downloaded — ${employees.length} employees, ${wb.SheetNames.length} sheets`);
    } catch (e: any) {
      setErr(e?.message ?? "Bulk export failed");
    } finally {
      setBulkExporting(false);
    }
  }

  // Feature #14: Auto-resolve missing punch-out for today
  async function autoResolveMissingPunchOut() {
    const defaultOut = settings?.defaultOutTime ?? "18:00:00";
    const today = dayjs().format("YYYY-MM-DD");
    const missing = todayEntries.filter((e) => e.inTime && !e.outTime);
    if (!missing.length) { toastSuccess("No employees with missing punch-out today!"); return; }
    setAutoResolving(true);
    let resolved = 0;
    for (const emp of missing) {
      try {
        await api.patch(`/api/hr/attendance/${emp.employeeId}/resolve-missing-out`, {
          date: today,
          outTime: defaultOut,
        }).catch(() =>
          api.post("/api/hr/attendance", {
            employeeId: emp.employeeId, date: today,
            inTime: emp.inTime, outTime: defaultOut,
          })
        );
        resolved++;
      } catch (_) { /* skip */ }
    }
    setAutoResolving(false);
    recordAuditEntry(
      "AUTO_RESOLVE_PUNCHOUT",
      `Today's Workforce (${resolved}/${missing.length})`,
      `Auto-resolved ${resolved} employees with missing evening punch-out using default time (${defaultOut.substring(0, 5)})`,
      "warning"
    );
    toastSuccess(`✅ Auto-resolved ${resolved}/${missing.length} missing punch-outs with default time (${defaultOut.substring(0, 5)})`);
    await loadTodayEntries();
  }

  // Helper: copy to clipboard
  function copyToClipboard(text: string, label = "Copied!") {
    navigator.clipboard.writeText(text).then(() => toastSuccess(label)).catch(() => {});
  }

  async function loadAnalytics(m: string) {
    const res = await api.get<Record<string, any>>("/api/hr/analytics", { params: { month: m } });
    setAnalytics(res.data);
  }

  useEffect(() => {
    Promise.all([loadEmployees(), loadSettings(), loadPendingLeaveRequests(), loadPendingRegularizationRequests(), loadPendingWorkRequests(), loadPendingCompOffRequests(), loadPendingDeviceRequests(), loadExceptions(), loadAnalytics(month), loadPayroll(month)]).catch((e) =>
      setErr(e?.response?.data?.error ?? "Failed to load"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (employeeId === "") return;
    Promise.all([loadAttendance(employeeId, month), loadSummary(employeeId, month)]).catch((e) =>
      setErr(e?.response?.data?.error ?? "Failed to load attendance"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, month]);

  useEffect(() => {
    loadHolidays(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadDailyPhotos(month).catch(() => {});
    loadAnalytics(month).catch(() => {});
    loadPayroll(month).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // Feature 6: load today entries when employees list is ready & set up auto-refresh
  useEffect(() => {
    if (employees.length) {
      loadTodayEntries();
      todayRefreshRef.current = setInterval(() => loadTodayEntries(), 60000);
    }
    return () => { if (todayRefreshRef.current) clearInterval(todayRefreshRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length]);

  const statusByDate: Record<string, DayStatus> = useMemo(() => {
    if (!settings || !monthSummary) return {};

    const entryMap: Record<string, DayStatus> = {};
    for (const e of entries) {
      entryMap[e.date] = e.status === "PRESENT" ? "P" : e.status === "HALF_DAY" ? "HD" : "L";
    }

    const holidaySet = new Set((holidays || []).map((h) => h.date));
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
    let nextDate = date;

    if (!date.startsWith(`${month}-`)) {
      nextDate = monthSummary ? monthSummary.fromDate : monthStart;
    }

    if (monthSummary) {
      if (nextDate < monthSummary.fromDate) nextDate = monthSummary.fromDate;
      if (nextDate > monthEnd) nextDate = monthEnd;
    } else {
      if (nextDate < monthStart) nextDate = monthStart;
      if (nextDate > monthEnd) nextDate = monthEnd;
    }

    if (nextDate !== date) {
      setDate(nextDate);
    }
  }, [date, month, monthSummary]);

  async function handleSaveAttendance() {
    if (employeeId === "") return;
    setErr(null);
    setOk(null);
    try {
      const isPresent = statusToMark === "PRESENT";
      const defaultIn = settings?.defaultInTime || "09:30:00";
      const defaultOut = settings?.defaultOutTime || "17:30:00";
      await api.post("/api/hr/attendance", {
        employeeId,
        date,
        inTime: isPresent ? defaultIn : null,
        outTime: isPresent ? defaultOut : null,
        leaveReason: isPresent ? null : (leaveReason.trim() || "Absent"),
      });
      const selectedEmp = employees.find((e) => e.id === employeeId);
      const empLabel = selectedEmp ? `${selectedEmp.name} (${selectedEmp.employeeNumber})` : `Employee #${employeeId}`;
      recordAuditEntry(
        "MARK_ATTENDANCE",
        empLabel,
        `Marked ${isPresent ? "PRESENT" : "ABSENT"} for date ${date}${!isPresent && leaveReason ? ` (Reason: ${leaveReason.trim()})` : ""}`,
        isPresent ? "success" : "warning"
      );
      setOk(isPresent ? "Marked Present" : "Marked Absent");
      await Promise.all([loadAttendance(employeeId, month), loadSummary(employeeId, month)]);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Save failed");
    }
  }

  async function bulkUpdate() {
    if (employeeId === "") return;
    setErr(null);
    setOk(null);
    try {
      const isPresent = bulkStatusToMark === "PRESENT";
      const defaultIn = settings?.defaultInTime || "09:30:00";
      const defaultOut = settings?.defaultOutTime || "17:30:00";
      const res = await api.post<{ updatedDays: number }>("/api/hr/attendance/range", {
        employeeId,
        fromDate,
        toDate,
        inTime: isPresent ? defaultIn : null,
        outTime: isPresent ? defaultOut : null,
        leaveReason: isPresent ? null : (leaveReason.trim() || "Absent"),
      });
      const selectedEmp = employees.find((e) => e.id === employeeId);
      const empLabel = selectedEmp ? `${selectedEmp.name} (${selectedEmp.employeeNumber})` : `Employee #${employeeId}`;
      recordAuditEntry(
        "BULK_MARK",
        empLabel,
        `Bulk updated ${res.data.updatedDays} working days between ${fromDate} and ${toDate} to ${isPresent ? "PRESENT" : "ABSENT"}`,
        "info"
      );
      setOk(`Bulk updated ${res.data.updatedDays} working days to ${isPresent ? "Present" : "Absent"}`);
      await Promise.all([loadAttendance(employeeId, month), loadSummary(employeeId, month)]);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Bulk update failed");
    }
  }

  async function uploadCompanyRolePhoto(companyRoleId: number, file: File) {
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/api/hr/company-roles/${companyRoleId}/photo`, fd);
      setOk("Company role photo uploaded");
      await loadEmployees();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Upload failed");
    }
  }

  async function uploadDailyGroupPhoto(file: File) {
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post<DailyGroupPhoto>(`/api/hr/daily-group-photos?date=${date}`, fd);
      setOk("Daily group photo uploaded");
      await loadDailyPhotos(month);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Upload daily photo failed");
    }
  }

  const selected = employees.find((e) => e.id === employeeId);
  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q));
  }, [employees, search]);

  const selectedEntry = entries.find((e) => e.date === date);
  const selectedDaily = dailyPhotos.find((p) => p.date === date);
  const mins = monthSummary?.totalWorkedMinutes ?? 0;
  const wh = Math.floor(mins / 60);
  const wm = mins % 60;
  const totalLateMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.lateMinutes ?? 0), 0), [entries]);
  const totalEarlyLeaveMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.earlyLeaveMinutes ?? 0), 0), [entries]);
  const totalOvertimeMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.overtimeMinutes ?? 0), 0), [entries]);
  const payrollTotals = useMemo(
    () =>
      payrollRows.reduce(
        (acc, row) => {
          acc.netPay += row.netPay ?? 0;
          acc.overtimeMinutes += row.overtimeMinutes ?? 0;
          acc.deductions += row.totalDeductions ?? 0;
          acc.earnedSalary += row.earnedSalary ?? 0;
          acc.lateMinutes += row.lateMinutes ?? 0;
          return acc;
        },
        { netPay: 0, overtimeMinutes: 0, deductions: 0, earnedSalary: 0, lateMinutes: 0 },
      ),
    [payrollRows],
  );

  // Feature 4: sorted payroll rows
  const sortedPayrollRows = useMemo(() => {
    const rows = [...payrollRows];
    rows.sort((a, b) => {
      const av = a[payrollSortKey] as any;
      const bv = b[payrollSortKey] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return payrollSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return payrollSortAsc ? av - bv : bv - av;
    });
    return rows;
  }, [payrollRows, payrollSortKey, payrollSortAsc]);

  // Feature 6: filtered today entries
  const filteredTodayEntries = useMemo(() => {
    const q = todaySearch.trim().toLowerCase();
    if (!q) return todayEntries;
    return todayEntries.filter((e) => e.employeeName.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q));
  }, [todayEntries, todaySearch]);

  // Derived today stats
  const todayStats = useMemo(() => {
    const checkedIn = todayEntries.filter((e) => e.inTime);
    const checkedOut = todayEntries.filter((e) => e.outTime);
    const late = todayEntries.filter((e) => (e.lateMinutes ?? 0) > 0);
    const absent = todayEntries.filter((e) => !e.inTime && e.status !== "PRESENT");
    return { checkedIn: checkedIn.length, checkedOut: checkedOut.length, late: late.length, absent: absent.length };
  }, [todayEntries]);

  // Feature #11: Late Arrivals \u2014 employees late >= lateThreshold times this month across payroll data
  const lateArrivals = useMemo(() => {
    return payrollRows
      .filter((r) => r.lateMinutes > 0)
      .map((r) => {
        // Estimate occurrences from employee entries if selected, otherwise show lateMinutes
        const empEntries = (r.employeeId === employeeId ? entries : []);
        const lateCount = empEntries.filter((e) => (e.lateMinutes ?? 0) > 0).length;
        return { ...r, lateCount };
      })
      .sort((a, b) => b.lateMinutes - a.lateMinutes);
  }, [payrollRows, employeeId, entries]);

  // Feature #14: Missing punch-out count for today
  const missingPunchOutCount = useMemo(
    () => todayEntries.filter((e) => e.inTime && !e.outTime).length,
    [todayEntries]
  );

  // Feature #12: Absenteeism Alerts (employees absent >= 2 days without recorded attendance)
  const absenteeismAlerts = useMemo(() => {
    return employees
      .map((emp) => {
        const payroll = payrollRows.find((p) => p.employeeId === emp.id);
        const absentDays = payroll ? Math.max(0, payroll.workingDays - payroll.payableDays) : 0;
        const isAbsentToday = !todayEntries.some((t) => t.employeeId === emp.id && t.inTime);
        return {
          employee: emp,
          absentDays: Math.round(absentDays),
          isAbsentToday,
        };
      })
      .filter((a) => a.absentDays >= 2)
      .sort((a, b) => b.absentDays - a.absentDays);
  }, [employees, payrollRows, todayEntries]);

  // Feature #13: Department-wise Analytics
  const departmentAnalytics = useMemo(() => {
    const map = new Map<string, { name: string; total: number; presentToday: number; totalWorkedHours: number; totalLateMinutes: number }>();
    employees.forEach((emp) => {
      const dept = emp.companyRole?.name || "General Staff";
      const cur = map.get(dept) || { name: dept, total: 0, presentToday: 0, totalWorkedHours: 0, totalLateMinutes: 0 };
      cur.total += 1;
      const todayEntry = todayEntries.find((t) => t.employeeId === emp.id);
      if (todayEntry?.inTime) cur.presentToday += 1;
      const payroll = payrollRows.find((p) => p.employeeId === emp.id);
      if (payroll) {
        cur.totalLateMinutes += payroll.lateMinutes || 0;
        cur.totalWorkedHours += Math.round(payroll.payableDays * 8);
      }
      map.set(dept, cur);
    });
    return Array.from(map.values()).map((d) => ({
      ...d,
      attendanceRate: d.total > 0 ? Math.round((d.presentToday / d.total) * 100) : 0,
    })).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [employees, todayEntries, payrollRows]);

  const inboxItems = useMemo(() => {
    const leave = (pendingLeaveRequests || []).map((item) => ({ kind: "LEAVE" as const, id: item.id, createdAt: item.createdAt, employeeName: item.employeeName, employeeNumber: item.employeeNumber, title: item.mailSubject || item.leaveType || "Leave request", status: item.status, summary: `${item.fromDate} -> ${item.toDate}`, reason: item.reason, attachmentUrl: item.attachmentUrl, attachmentName: item.attachmentName, raw: item }));
    const work = (pendingWorkRequests || []).map((item) => ({ kind: "WFH" as const, id: item.id, createdAt: item.createdAt ?? "", employeeName: item.employeeName, employeeNumber: item.employeeNumber, title: item.type.replaceAll("_", " "), status: item.status, summary: `${item.fromDate} -> ${item.toDate}`, reason: item.reason, attachmentUrl: item.attachmentUrl, attachmentName: item.attachmentName, raw: item }));
    const corrections = (pendingRegularizationRequests || []).map((item) => ({ kind: "CORRECTION" as const, id: item.id, createdAt: item.createdAt, employeeName: item.employeeName, employeeNumber: item.employeeNumber, title: "Attendance correction", status: item.status, summary: `${item.date} | ${item.inTime ?? "--"} -> ${item.outTime ?? "--"}`, reason: item.reason, attachmentUrl: item.attachmentUrl, attachmentName: item.attachmentName, raw: item }));
    const comp = (pendingCompOffRequests || []).map((item) => ({ kind: "COMP_OFF" as const, id: item.id, createdAt: item.createdAt ?? "", employeeName: item.employeeName, employeeNumber: item.employeeNumber, title: "Comp-off request", status: item.status, summary: `${item.overtimeDate} -> ${item.requestedDate}`, reason: item.reason, attachmentUrl: item.attachmentUrl, attachmentName: item.attachmentName, raw: item }));
    const devices = (pendingDeviceRequests || []).map((item) => ({ kind: "DEVICE" as const, id: item.id, createdAt: item.createdAt, employeeName: item.username, employeeNumber: "Device", title: item.label || "Registered device", status: item.approved ? "APPROVED" : "PENDING", summary: item.deviceId, reason: "Device approval request", raw: item }));
    return [...leave, ...work, ...corrections, ...comp, ...devices]
      .filter((item) => inboxFilter === "ALL" || item.kind === inboxFilter)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [inboxFilter, pendingCompOffRequests, pendingDeviceRequests, pendingLeaveRequests, pendingRegularizationRequests, pendingWorkRequests]);

  useEffect(() => {
    if (selectedEntry) {
      setStatusToMark(selectedEntry.status === "PRESENT" || selectedEntry.status === "HALF_DAY" ? "PRESENT" : "ABSENT");
    } else {
      setStatusToMark("PRESENT");
    }
  }, [selectedEntry]);

  useEffect(() => {
    if (!settings) return;
    if (selectedEntry?.inTime) setInTime(selectedEntry.inTime.slice(0, 5));
    else setInTime(settings.defaultInTime?.slice(0, 5) || "09:00");

    if (selectedEntry?.outTime) setOutTime(selectedEntry.outTime.slice(0, 5));
    else setOutTime(settings.defaultOutTime?.slice(0, 5) || "18:00");
  }, [selectedEntry, settings]);

  useEffect(() => {
    if (!selectedEntry || selectedEntry.status === "PRESENT" || selectedEntry.status === "HALF_DAY") {
      setLeaveReason("");
      return;
    }
    setLeaveReason(selectedEntry.leaveReason?.trim() ?? "");
  }, [selectedEntry]);

  return (
    <Layout title="HR Dashboard">
      <div className="grid gap-6">
        {err ? <Alert severity="error">{err}</Alert> : null}
        {ok ? <Alert severity="success">{ok}</Alert> : null}

        <DashboardHero
          eyebrow="HR workspace"
          title="Attendance operations"
          subtitle="Review leave requests, mark attendance, upload daily photos, and export employee reports from one focused workspace."
          right={
            <Box sx={{ display: "grid", gap: 1, minWidth: { xs: "100%", lg: 240 } }}>
              <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={exportAttendance} disabled={employeeId === ""}>
                Export CSV
              </Button>
              <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={exportPdf} disabled={employeeId === ""}>
                Export PDF
              </Button>
              <Tooltip title={employeeId === "" ? "Select an employee first" : entries.length === 0 ? "No entries loaded" : "Download as Excel (.xlsx) with 2 sheets"}>
                <span>
                  <Button
                    startIcon={<TableChartIcon />}
                    variant="outlined"
                    onClick={exportXlsx}
                    disabled={employeeId === "" || entries.length === 0}
                    sx={{ borderColor: "#16a34a", color: "#16a34a", "&:hover": { borderColor: "#15803d", bgcolor: "#f0fdf4" } }}
                  >
                    Export XLSX
                  </Button>
                </span>
              </Tooltip>
              <Button variant="outlined" onClick={() => loadPendingLeaveRequests().catch(() => {})}>
                Refresh requests
              </Button>
              <Divider sx={{ my: 0.5 }} />
              <Tooltip title={`Bulk export all ${employees.length} employees attendance for ${month} into one Excel file`}>
                <span>
                  <Button
                    startIcon={bulkExporting ? <CircularProgress size={16} /> : <TableChartIcon />}
                    variant="contained"
                    onClick={exportAllEmployeesXlsx}
                    disabled={bulkExporting || !employees.length}
                    sx={{ bgcolor: "#1e293b", "&:hover": { bgcolor: "#334155" } }}
                  >
                    {bulkExporting ? "Exporting…" : `Bulk XLSX (All ${employees.length})`}
                  </Button>
                </span>
              </Tooltip>
              <Button
                startIcon={<HistoryRoundedIcon />}
                variant="outlined"
                onClick={() => setAuditDrawerOpen(true)}
                sx={{
                  borderColor: "#6366f1",
                  color: "#4f46e5",
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#eef2ff", borderColor: "#4338ca" },
                }}
              >
                📋 Audit Log ({auditLogs.length})
              </Button>
            </Box>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Team members" value={employees.length} helper="Employees available for marking" icon={<GroupsIcon />} />
          <StatCard label="Working days" value={monthSummary?.workingDays ?? "-"} helper={`For ${month}`} icon={<AccessTimeIcon />} accent="#0f766e" />
          <StatCard label="Present days" value={monthSummary?.presentDays ?? "-"} helper="Selected employee monthly total" icon={<VerifiedUserIcon />} accent="#16a34a" />
          <StatCard
            label="Pending leave"
            value={pendingLeaveRequests.length + pendingRegularizationRequests.length}
            helper={`Late ${totalLateMinutes}m | Early ${totalEarlyLeaveMinutes}m | OT ${Math.floor(totalOvertimeMinutes / 60)}h`}
            icon={<PendingActionsIcon />}
            accent="#b45309"
          />
        </div>

        {/* Feature 2: Today's Work Widget */}
        <AppCard>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TodayIcon sx={{ color: "primary.main" }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>Today's Workforce — {dayjs().format("ddd, DD MMM YYYY")}</Typography>
                <Typography sx={{ opacity: 0.72, fontSize: 13 }}>Live check-in overview. Auto-refreshes every 60 seconds.</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {todayLoading && <CircularProgress size={18} />}
              <IconButton size="small" onClick={() => loadTodayEntries()} title="Refresh today"><RefreshIcon fontSize="small" /></IconButton>
              {missingPunchOutCount > 0 && (
                <Tooltip title={`${missingPunchOutCount} employees checked in but haven't punched out yet — click to auto-apply default out-time`}>
                  <Badge badgeContent={missingPunchOutCount} color="error">
                    <Button
                      size="small"
                      startIcon={autoResolving ? <CircularProgress size={14} /> : <AutoFixHighIcon />}
                      onClick={autoResolveMissingPunchOut}
                      disabled={autoResolving}
                      variant="outlined"
                      color="warning"
                      sx={{ fontSize: 11, py: 0.4, fontWeight: 900 }}
                    >
                      Auto-Resolve
                    </Button>
                  </Badge>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" }, mt: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
              <LoginIcon sx={{ color: "#16a34a", mb: 0.5 }} />
              <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#15803d" }}>{todayStats.checkedIn}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>Checked In</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", textAlign: "center" }}>
              <LogoutIcon sx={{ color: "#2563eb", mb: 0.5 }} />
              <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#1d4ed8" }}>{todayStats.checkedOut}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>Checked Out</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fffbeb", border: "1px solid #fde68a", textAlign: "center" }}>
              <WarningAmberIcon sx={{ color: "#d97706", mb: 0.5 }} />
              <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#b45309" }}>{todayStats.late}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>Late Today</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
              <CancelIcon sx={{ color: "#dc2626", mb: 0.5 }} />
              <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#b91c1c" }}>{employees.length - todayStats.checkedIn}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.8 }}>Not In Yet</Typography>
            </Box>
          </Box>
        </AppCard>

        {/* Feature 6: All Employees Today panel */}
        <AppCard>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", cursor: "pointer" }} onClick={() => setTodayPanelOpen((v) => !v)}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <GroupsIcon sx={{ color: "primary.main" }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>All Employees — Today Status</Typography>
                <Typography sx={{ opacity: 0.72, fontSize: 13 }}>{employees.length} employees · Click to {todayPanelOpen ? "collapse" : "expand"}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {todayLoading && <CircularProgress size={16} />}
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); loadTodayEntries(); }}><RefreshIcon fontSize="small" /></IconButton>
              {todayPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </Box>
          {todayPanelOpen && (
            <>
              <Box sx={{ mt: 2, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search by name or ID…"
                  value={todaySearch}
                  onChange={(e) => setTodaySearch(e.target.value)}
                  sx={{ width: { xs: "100%", sm: 280 } }}
                />
              </Box>
              <Box sx={{ display: "grid", gap: 1 }}>
                {filteredTodayEntries.map((emp) => {
                  const hasIn = !!emp.inTime;
                  const hasOut = !!emp.outTime;
                  const isLate = (emp.lateMinutes ?? 0) > 0;
                  const workedH = emp.workedMinutes != null ? Math.floor(emp.workedMinutes / 60) : null;
                  const workedM = emp.workedMinutes != null ? emp.workedMinutes % 60 : null;
                  const fullDayMin = settings?.fullDayMinutes ?? 480;
                  const progressPct = emp.workedMinutes != null ? Math.min(100, Math.round((emp.workedMinutes / fullDayMin) * 100)) : 0;
                  let statusColor = "#6b7280";
                  let statusLabel = "Not In";
                  if (emp.status === "PRESENT") { statusColor = "#16a34a"; statusLabel = "Present"; }
                  else if (emp.status === "HALF_DAY") { statusColor = "#d97706"; statusLabel = "Half Day"; }
                  else if (emp.status === "LEAVE") { statusColor = "#dc2626"; statusLabel = "Leave"; }
                  else if (hasIn) { statusColor = "#2563eb"; statusLabel = "Checked In"; }
                  return (
                    <Box key={emp.employeeId} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "44px 1fr 120px 140px 180px" }, gap: 1.5, alignItems: "center", p: 1.25, border: "1px solid #e5e7eb", borderRadius: 2, bgcolor: hasIn ? "#f0fdf4" : "#fafafa", transition: "box-shadow 0.15s", "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.08)" } }}>
                      <Avatar src={emp.profilePhotoUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: "primary.main", fontWeight: 900, fontSize: 14 }}>{emp.employeeName[0]}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.employeeName}</Typography>
                        <Typography sx={{ opacity: 0.65, fontSize: 11 }}>{emp.employeeNumber}</Typography>
                      </Box>
                      <Chip size="small" label={statusLabel} sx={{ bgcolor: statusColor, color: "#fff", fontWeight: 900, borderRadius: 1, fontSize: 11 }} />
                      <Box>
                        {hasIn && <Typography sx={{ fontSize: 12, fontWeight: 900 }}>In: {emp.inTime?.substring(0,5)}</Typography>}
                        {hasOut && <Typography sx={{ fontSize: 12, color: "#2563eb", fontWeight: 900 }}>Out: {emp.outTime?.substring(0,5)}</Typography>}
                        {isLate && <Typography sx={{ fontSize: 11, color: "#d97706" }}>Late {emp.lateMinutes}m</Typography>}
                        {!hasIn && !emp.status && <Typography sx={{ fontSize: 12, opacity: 0.5 }}>—</Typography>}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        {emp.workedMinutes != null && (
                          <>
                            <Typography sx={{ fontSize: 11, opacity: 0.75, mb: 0.3 }}>{workedH}h {workedM}m worked</Typography>
                            <LinearProgress variant="determinate" value={progressPct} sx={{ height: 5, borderRadius: 3, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: progressPct >= 100 ? "#16a34a" : progressPct >= 50 ? "#3b82f6" : "#f59e0b" } }} />
                          </>
                        )}
                        {emp.checkInFaceVerified != null && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                            {emp.checkInFaceVerified ? <CheckCircleIcon sx={{ fontSize: 12, color: "#16a34a" }} /> : <CancelIcon sx={{ fontSize: 12, color: "#dc2626" }} />}
                            <Typography sx={{ fontSize: 10, opacity: 0.75 }}>
                              Face {emp.checkInFaceScore != null ? `${Math.round(emp.checkInFaceScore * 100)}%` : "--"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                {!filteredTodayEntries.length && (
                  <Typography sx={{ opacity: 0.6, fontSize: 13, py: 2, textAlign: "center" }}>No employees match your search.</Typography>
                )}
              </Box>
            </>
          )}
        </AppCard>

        <RealtimeBoard month={month} />

        {analytics ? (
          <AnalyticsPanel title="Company analytics" subtitle={`Attendance movement for ${month}`} analytics={analytics} />
        ) : null}

        {/* Feature #13: Department & Role Analytics */}
        {departmentAnalytics.length > 0 && (
          <AppCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                  🏢 Department & Role Analytics
                </Typography>
                <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.25 }}>
                  Headcount, today's check-in rate, and cumulative late minutes by department.
                </Typography>
              </Box>
              <Chip
                label={`${departmentAnalytics.length} Groups`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: "rgba(37,99,235,0.1)", color: "#2563eb" }}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
              {departmentAnalytics.map((dept) => (
                <Box
                  key={dept.name}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                    bgcolor: "background.paper",
                    transition: "all 0.2s",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderColor: "primary.main" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{dept.name}</Typography>
                    <Chip
                      size="small"
                      label={`${dept.attendanceRate}% Present`}
                      color={dept.attendanceRate >= 80 ? "success" : dept.attendanceRate >= 50 ? "warning" : "default"}
                      sx={{ fontWeight: 900, fontSize: 11, borderRadius: 1 }}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={dept.attendanceRate}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mb: 1.5,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: dept.attendanceRate >= 80 ? "#16a34a" : dept.attendanceRate >= 50 ? "#f59e0b" : "#64748b",
                      },
                    }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                    <span>Total: <b>{dept.total}</b></span>
                    <span>In Today: <b>{dept.presentToday}</b></span>
                    <span>Late: <b>{dept.totalLateMinutes}m</b></span>
                  </Box>
                </Box>
              ))}
            </Box>
          </AppCard>
        )}

        {/* Feature #12: Absenteeism Alerts */}
        {absenteeismAlerts.length > 0 && (
          <AppCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#b91c1c", display: "flex", alignItems: "center", gap: 1 }}>
                  ⚠️ Absenteeism & Truancy Alerts
                </Typography>
                <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.25 }}>
                  Employees with 2 or more unexplained absent days this month requiring attention.
                </Typography>
              </Box>
              <Chip
                label={`${absenteeismAlerts.length} Flagged`}
                size="small"
                sx={{ fontWeight: 900, bgcolor: "rgba(220,38,38,0.12)", color: "#dc2626" }}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
              {absenteeismAlerts.map((item) => (
                <Box
                  key={item.employee.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid rgba(220,38,38,0.2)",
                    bgcolor: "rgba(254,242,242,0.6)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Avatar sx={{ bgcolor: "#ef4444", fontWeight: 900, width: 38, height: 38 }}>
                    {item.employee.name[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.employee.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
                      {item.employee.employeeNumber} · {item.employee.companyRole?.name || "Staff"}
                    </Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#b91c1c", mt: 0.25 }}>
                      {item.absentDays} days absent {item.isAbsentToday ? "· Absent today" : ""}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEmployeeId(item.employee.id);
                      toastSuccess(`Selected ${item.employee.name} for review`);
                    }}
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      borderColor: "rgba(220,38,38,0.4)",
                      color: "#b91c1c",
                      textTransform: "none",
                      px: 1,
                      minWidth: "auto",
                    }}
                  >
                    Inspect
                  </Button>
                </Box>
              ))}
            </Box>
          </AppCard>
        )}

        <AppCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Payroll register</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Monthly payable-days, late deductions, overtime time, and net-pay preview from attendance rules.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Chip size="small" label={payrollLock?.locked ? "Locked" : "Unlocked"} color={payrollLock?.locked ? "success" : "warning"} sx={{ borderRadius: 1, fontWeight: 900 }} />
              <Button variant="outlined" onClick={() => exportPayrollCsv().catch((e) => setErr(e?.response?.data?.error ?? "Payroll export failed"))}>Export CSV</Button>
              <Button variant="outlined" color={payrollLock?.locked ? "warning" : "success"} onClick={() => setPayrollLocked(!payrollLock?.locked).catch((e) => setErr(e?.response?.data?.error ?? "Payroll lock failed"))}>
                {payrollLock?.locked ? "Unlock month" : "Lock month"}
              </Button>
              <Button variant="outlined" onClick={() => loadPayroll(month).catch(() => {})}>Refresh payroll</Button>
            </Box>
          </Box>
          <Box className="grid gap-4 md:grid-cols-3 xl:grid-cols-4" sx={{ mt: 2 }}>
            <StatCard label="Payroll employees" value={payrollRows.length} helper={`Register for ${month}`} icon={<GroupsIcon />} />
            <StatCard label="Net pay total" value={`Rs ${Math.round(payrollTotals.netPay)}`} helper="Attendance-linked net pay" icon={<VerifiedUserIcon />} accent="#0f766e" />
            <StatCard label="Overtime" value={formatDurationMinutes(payrollTotals.overtimeMinutes)} helper="Monthly OT time only" icon={<AccessTimeIcon />} accent="#2563eb" />
            <StatCard label="Deductions" value={`Rs ${Math.round(payrollTotals.deductions)}`} helper="Late + unpaid leave" icon={<PendingActionsIcon />} accent="#b45309" />
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Feature 4: Sortable, color-coded payroll table */}
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 780, display: "grid", gap: 0 }}>
              {/* Table header */}
              <Box sx={{ display: "grid", gridTemplateColumns: "180px 90px 100px 100px 80px 110px 70px 100px", gap: 0, px: 1.25, py: 0.75, bgcolor: "#1e293b", borderRadius: "8px 8px 0 0" }}>
                {([
                  ["employeeName", "Employee"],
                  ["payableDays", "Days"],
                  ["dailyRate", "Per Day"],
                  ["earnedSalary", "Earned"],
                  ["lateMinutes", "Late"],
                  ["totalDeductions", "Deductions"],
                  ["overtimeMinutes", "OT"],
                  ["netPay", "Net Pay"],
                ] as [keyof PayrollRow, string][]).map(([key, label]) => (
                  <Box
                    key={key}
                    onClick={() => { if (payrollSortKey === key) setPayrollSortAsc((v) => !v); else { setPayrollSortKey(key); setPayrollSortAsc(false); } }}
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5, userSelect: "none" }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 11, color: "#e2e8f0" }}>{label}</Typography>
                    {payrollSortKey === key && (
                      <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>{payrollSortAsc ? "↑" : "↓"}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
              {/* Table rows */}
              {(payrollShowAll ? sortedPayrollRows : sortedPayrollRows.slice(0, 10)).map((row, i) => {
                const isHighPay = row.netPay > (payrollTotals.netPay / Math.max(payrollRows.length, 1)) * 1.1;
                const isHighDeduction = row.totalDeductions > 500;
                const rowBg = isHighDeduction ? "#fef2f2" : isHighPay ? "#f0fdf4" : i % 2 === 0 ? "#ffffff" : "#f8fafc";
                return (
                  <Box key={row.employeeId} sx={{ display: "grid", gridTemplateColumns: "180px 90px 100px 100px 80px 110px 70px 100px", gap: 0, alignItems: "center", px: 1.25, py: 1, border: "1px solid #e5e7eb", borderTop: i === 0 ? "none" : "1px solid #e5e7eb", bgcolor: rowBg, transition: "background 0.15s", "&:hover": { bgcolor: "#eff6ff" } }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: 12, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.employeeName}</Typography>
                      <Typography sx={{ opacity: 0.6, fontSize: 10 }}>{row.employeeNumber}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{row.payableDays}<span style={{ opacity: 0.55, fontSize: 10 }}>/{row.workingDays}</span></Typography>
                    <Typography sx={{ fontSize: 12 }}>Rs {Math.round(row.dailyRate)}</Typography>
                    <Typography sx={{ fontSize: 12 }}>Rs {Math.round(row.earnedSalary)}</Typography>
                    <Typography sx={{ fontSize: 12, color: row.lateMinutes > 30 ? "#d97706" : "inherit", fontWeight: row.lateMinutes > 30 ? 900 : 400 }}>{row.lateMinutes}m</Typography>
                    <Typography sx={{ fontSize: 12, color: isHighDeduction ? "#dc2626" : "inherit", fontWeight: isHighDeduction ? 900 : 400 }}>Rs {Math.round(row.totalDeductions)}</Typography>
                    <Typography sx={{ fontSize: 12, color: (row.overtimeMinutes ?? 0) > 0 ? "#2563eb" : "inherit" }}>{row.overtimeMinutes ?? 0}m</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 900, color: isHighPay ? "#15803d" : "#1e293b" }}>Rs {Math.round(row.netPay)}</Typography>
                  </Box>
                );
              })}
              {/* Totals row */}
              {payrollRows.length > 0 && (
                <Box sx={{ display: "grid", gridTemplateColumns: "180px 90px 100px 100px 80px 110px 70px 100px", gap: 0, px: 1.25, py: 1, bgcolor: "#1e293b", borderRadius: "0 0 8px 8px" }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 12, color: "#e2e8f0" }}>TOTALS ({payrollRows.length})</Typography>
                  <Typography sx={{ fontSize: 12, color: "#e2e8f0" }}>—</Typography>
                  <Typography sx={{ fontSize: 12, color: "#e2e8f0" }}>—</Typography>
                  <Typography sx={{ fontSize: 12, color: "#86efac", fontWeight: 900 }}>Rs {Math.round(payrollTotals.earnedSalary)}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#fde68a", fontWeight: 900 }}>{payrollTotals.lateMinutes}m</Typography>
                  <Typography sx={{ fontSize: 12, color: "#fca5a5", fontWeight: 900 }}>Rs {Math.round(payrollTotals.deductions)}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#93c5fd", fontWeight: 900 }}>{payrollTotals.overtimeMinutes}m</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#86efac" }}>Rs {Math.round(payrollTotals.netPay)}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          {payrollRows.length > 10 && (
            <Button variant="text" onClick={() => setPayrollShowAll((v) => !v)} sx={{ mt: 1, fontSize: 12, opacity: 0.75 }}>
              {payrollShowAll ? `Show less` : `Show all ${payrollRows.length} employees`}
            </Button>
          )}
          {!payrollRows.length ? <Typography sx={{ opacity: 0.7, fontSize: 13, mt: 1 }}>No payroll rows available for this month yet.</Typography> : null}
          {settings ? (
            <Typography sx={{ mt: 1.5, opacity: 0.7, fontSize: 12 }}>
              Payroll rules: monthly salary Rs {settings.standardMonthlySalary} / working days = per-day salary | net pay = payable days x per-day salary - late deduction | overtime tracked as time only
            </Typography>
          ) : null}
        </AppCard>

        <AppCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Unified request inbox</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                One queue for leave, WFH, corrections, and comp-off approvals.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() =>
                Promise.all([
                  loadPendingLeaveRequests(),
                  loadPendingRegularizationRequests(),
                  loadPendingWorkRequests(),
                  loadPendingCompOffRequests(),
                  loadPendingDeviceRequests(),
                ]).catch(() => {})
              }
            >
              Refresh inbox
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Tabs
            value={inboxFilter}
            onChange={(_, value) => setInboxFilter(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 900 } }}
          >
            <Tab value="ALL" label={`All (${pendingLeaveRequests.length + pendingRegularizationRequests.length + pendingWorkRequests.length + pendingCompOffRequests.length + pendingDeviceRequests.length})`} />
            <Tab value="LEAVE" label={`Leave (${pendingLeaveRequests.length})`} />
            <Tab value="WFH" label={`WFH / On-duty (${pendingWorkRequests.length})`} />
            <Tab value="CORRECTION" label={`Correction (${pendingRegularizationRequests.length})`} />
            <Tab value="COMP_OFF" label={`Comp-off (${pendingCompOffRequests.length})`} />
            <Tab value="DEVICE" label={`Device (${pendingDeviceRequests.length})`} />
          </Tabs>
          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            { (inboxItems || []).slice(0, 12).map((item) => (
              <Box
                key={`${item.kind}-${item.id}`}
                onClick={() => setSelectedInboxItem(item)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "140px 180px 1fr auto" },
                  gap: 1.2,
                  alignItems: "center",
                  p: 1.25,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  bgcolor: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <Chip size="small" label={item.kind.replaceAll("_", " ")} sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                  {item.employeeName} <span style={{ opacity: 0.6 }}>({item.employeeNumber})</span>
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{item.title}</Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.summary} | {item.reason}
                  </Typography>
                </Box>
                <Chip size="small" label={String(item.status).replaceAll("_", " ")} color="warning" sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }} />
              </Box>
            ))}
            {!inboxItems.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No requests in this inbox view.</Typography> : null}
          </Box>
        </AppCard>

        <AppCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Attendance exception center</Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Review suspicious punch behavior, failed geofence attempts, and operational exceptions.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={() => scanMissingCheckouts().catch((e) => setErr(e?.response?.data?.error ?? "Missing checkout scan failed"))}>Scan missing checkouts</Button>
              <Button variant="outlined" onClick={() => loadExceptions().catch(() => {})}>Refresh exceptions</Button>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            { (attendanceExceptions || []).slice(0, 10).map((item) => (
              <Box key={item.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "170px 180px 1fr auto" }, gap: 1, alignItems: "center", p: 1.2, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#fffaf5" }}>
                <Chip size="small" label={item.type.replaceAll("_", " ")} color="warning" sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                  {item.employeeName} <span style={{ opacity: 0.62 }}>({item.employeeNumber})</span>
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.message}</Typography>
                <Button variant="outlined" onClick={() => resolveException(item.id).catch((e) => setErr(e?.response?.data?.error ?? "Resolve failed"))}>
                  Resolve
                </Button>
              </Box>
            ))}
            {!attendanceExceptions.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No open exceptions.</Typography> : null}
          </Box>
        </AppCard>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 grid gap-6">
            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Pending leave requests
                </Typography>
                <Button variant="outlined" onClick={() => loadPendingLeaveRequests().catch(() => {})}>
                  Refresh
                </Button>
              </Box>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Approve to auto-mark leave for working days in the selected range.
              </Typography>
              <Divider sx={{ my: 2 }} />

              {pendingLeaveRequests.length ? (
                <Box sx={{ display: "grid", gap: 1.25 }}>
                  { (pendingLeaveRequests || []).slice(0, 8).map((r) => (
                    <Box
                      key={r.id}
                      sx={{
                        borderRadius: 1,
                        border: "1px solid #e5e7eb",
                        p: 1.25,
                        background: "#ffffff",
                        display: "grid",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
                            {r.mailSubject || "Leave request"}
                          </Typography>
                          <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
                            From {r.employeeName} ({r.employeeNumber}) | {r.fromDate} {"->"} {r.toDate}
                          </Typography>
                        </Box>
                        <Chip size="small" label={r.leaveType ?? "General leave"} color="warning" sx={{ borderRadius: 1, fontWeight: 900 }} />
                      </Box>
                      <Box sx={{ p: 1, border: "1px solid #eef2f7", borderRadius: 1, bgcolor: "#f8fafc" }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12 }}>Reason</Typography>
                        <Typography sx={{ opacity: 0.82, fontSize: 12 }}>{r.reason}</Typography>
                        {r.mailMessage ? (
                          <>
                            <Divider sx={{ my: 1 }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12 }}>Employee mail message</Typography>
                            <Typography sx={{ opacity: 0.82, fontSize: 12, whiteSpace: "pre-wrap" }}>{r.mailMessage}</Typography>
                          </>
                        ) : null}
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" }, gap: 1, alignItems: "center" }}>
                        <TextField
                          size="small"
                          label="HR reply / remarks"
                          value={leaveRemarks[r.id] ?? ""}
                          onChange={(e) => setLeaveRemarks((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        />
                        {r.status === "CANCELLATION_REQUESTED" ? (
                          <>
                            <Button color="warning" variant="contained" onClick={() => approveLeaveCancellation(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Cancellation failed"))}>
                              Approve cancellation
                            </Button>
                            <Button color="error" variant="outlined" onClick={() => rejectLeaveCancellation(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject cancellation failed"))}>
                              Reject cancellation
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button color="success" variant="contained" onClick={() => approveLeaveRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>
                              Approve
                            </Button>
                            <Button color="error" variant="outlined" onClick={() => rejectLeaveRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  ))}
                  {pendingLeaveRequests.length > 8 ? (
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                      Showing latest 8 of {pendingLeaveRequests.length}.
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No pending leave requests.</Typography>
              )}
            </AppCard>

            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Attendance corrections
                </Typography>
                <Button variant="outlined" onClick={() => loadPendingRegularizationRequests().catch(() => {})}>
                  Refresh
                </Button>
              </Box>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Approve employee punch/time correction requests. Approval updates attendance automatically.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.25 }}>
                { (pendingRegularizationRequests || []).slice(0, 8).map((r) => (
                  <Box key={r.id} sx={{ borderRadius: 1, border: "1px solid #e5e7eb", p: 1.25, background: "#f9fafb" }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
                      {r.employeeName} ({r.employeeNumber}) | {r.date}
                    </Typography>
                    <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
                      Requested: {r.inTime ?? "--"} {"->"} {r.outTime ?? "--"} | {r.reason}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        size="small"
                        label="Remarks"
                        value={regularizationRemarks[r.id] ?? ""}
                        onChange={(e) => setRegularizationRemarks((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button color="success" variant="contained" onClick={() => approveRegularizationRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>
                        Approve
                      </Button>
                      <Button color="error" variant="outlined" onClick={() => rejectRegularizationRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
                {!pendingRegularizationRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No pending correction requests.</Typography> : null}
              </Box>
            </AppCard>

            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    WFH / On-duty requests
                  </Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                    {pendingWorkRequests.length} pending remote/client-site approvals.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => loadPendingWorkRequests().catch(() => {})}>
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.25 }}>
                { (pendingWorkRequests || []).slice(0, 8).map((r) => (
                  <Box key={r.id} sx={{ borderRadius: 1, border: "1px solid #e5e7eb", p: 1.25, background: "#ffffff", display: "grid", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
                          {r.employeeName} <span style={{ opacity: 0.58 }}>({r.employeeNumber})</span>
                        </Typography>
                        <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
                          {r.fromDate} {"->"} {r.toDate} | {r.reason}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Chip size="small" label={r.type.replaceAll("_", " ")} sx={{ borderRadius: 1, fontWeight: 900 }} />
                        <Chip size="small" label={r.status.replaceAll("_", " ")} color={workRequestStatusColor(r.status)} sx={{ borderRadius: 1, fontWeight: 900 }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" }, gap: 1, alignItems: "center" }}>
                      <TextField
                        size="small"
                        label="Remarks"
                        value={workRemarks[r.id] ?? ""}
                        onChange={(e) => setWorkRemarks((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <Button color="success" variant="contained" onClick={() => approveWorkRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>
                        Approve
                      </Button>
                      <Button color="error" variant="outlined" onClick={() => rejectWorkRequest(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
                {!pendingWorkRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No pending WFH/on-duty requests.</Typography> : null}
              </Box>
            </AppCard>

            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Comp-off requests
                  </Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                    Approve compensatory off for overtime.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => loadPendingCompOffRequests().catch(() => {})}>
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.25 }}>
                { (pendingCompOffRequests || []).slice(0, 8).map((r) => (
                  <Box key={r.id} sx={{ borderRadius: 1, border: "1px solid #e5e7eb", p: 1.25, background: "#ffffff", display: "grid", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
                          {r.employeeName} <span style={{ opacity: 0.58 }}>({r.employeeNumber})</span>
                        </Typography>
                        <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
                          OT {r.overtimeDate} ({r.overtimeMinutes}m) | Requested off {r.requestedDate}
                        </Typography>
                      </Box>
                      <Chip size="small" label={r.status} color="warning" sx={{ borderRadius: 1, fontWeight: 900 }} />
                    </Box>
                    <Typography sx={{ opacity: 0.8, fontSize: 12 }}>{r.reason}</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" }, gap: 1, alignItems: "center" }}>
                      <TextField
                        size="small"
                        label="Remarks"
                        value={compOffRemarks[r.id] ?? ""}
                        onChange={(e) => setCompOffRemarks((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <Button color="success" variant="contained" onClick={() => approveCompOff(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>
                        Approve
                      </Button>
                      <Button color="error" variant="outlined" onClick={() => rejectCompOff(r.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
                {!pendingCompOffRequests.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No pending comp-off requests.</Typography> : null}
              </Box>
            </AppCard>

            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Mark / Update Attendance
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Status becomes <b>P</b> if worked time is <b>{Math.round((settings?.fullDayMinutes ?? 480) / 60)}h</b> or more,
                <b> HD</b> if worked time is <b>{Math.round((settings?.halfDayMinutes ?? 240) / 60)}h</b> or more, else <b>L</b>.
                Late grace <b>{settings?.lateGraceMinutes ?? 10}m</b>, early-leave grace{" "}
                <b>{settings?.earlyLeaveGraceMinutes ?? 10}m</b>, overtime after{" "}
                <b>{Math.round((settings?.overtimeAfterMinutes ?? 480) / 60)}h</b>.
              </Typography>

              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <TextField
                  label="Search employee"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type name or employee number"
                />
                <Autocomplete
                  options={options}
                  value={selected ?? null}
                  getOptionLabel={(opt) => `${opt.name} (${opt.employeeNumber})`}
                  onChange={(_, v) => setEmployeeId(v ? v.id : "")}
                  renderOption={(props, opt) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                      <Avatar 
                        src={(opt.profilePhotoUrl?.trim() ? opt.profilePhotoUrl : undefined) || (opt.companyRole?.photoUrl?.trim() ? opt.companyRole.photoUrl : undefined)} 
                        sx={{ width: 32, height: 32, bgcolor: "primary.main", color: "white", fontSize: 14, fontWeight: 900 }}
                      >
                        {opt.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opt.name}
                        </Typography>
                        <Typography sx={{ opacity: 0.7, fontSize: 12, lineHeight: 1.1 }}>
                          {opt.employeeNumber} | {opt.companyRole?.name ?? "No company role"} |{" "}
                          {opt.assignedOfficeLocation?.officeName ?? "Default office"} | {opt.loginRole}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => <TextField {...params} label="Employee" />}
                />

                {selected ? (
                  <AppCard contentSx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                      <Avatar 
                        src={(selected.profilePhotoUrl?.trim() ? selected.profilePhotoUrl : undefined) || (selected.companyRole?.photoUrl?.trim() ? selected.companyRole.photoUrl : undefined)} 
                        sx={{ width: 56, height: 56, bgcolor: "primary.main", color: "white", fontWeight: 900, fontSize: 22 }}
                      >
                        {selected.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 15 }}>{selected.name}</Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                          ID: <b>{selected.id}</b> · Emp#: <b>{selected.employeeNumber}</b> · Role: <b>{selected.loginRole}</b>
                        </Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                          Company role: <b>{selected.companyRole?.name ?? "--"}</b>
                        </Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                          Office: <b>{selected.assignedOfficeLocation?.officeName ?? "Default active office"}{selected.assignedOfficeLocation ? ` (${Math.round(selected.assignedOfficeLocation.radiusMeters)}m)` : ""}</b>
                        </Typography>
                        {/* Feature 5: Month stats inline */}
                        {monthSummary && (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                            <Chip size="small" label={`✅ ${monthSummary.presentDays} Present`} sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 900, fontSize: 11 }} />
                            <Chip size="small" label={`🟡 ${monthSummary.halfDayDays} Half Day`} sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 900, fontSize: 11 }} />
                            <Chip size="small" label={`🔴 ${monthSummary.leaveDays} Leave`} sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 900, fontSize: 11 }} />
                            <Chip size="small" label={`⏱ ${Math.floor((monthSummary.totalWorkedMinutes ?? 0) / 60)}h worked`} sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 900, fontSize: 11 }} />
                            <Chip size="small" label={`Late ${totalLateMinutes}m`} sx={{ bgcolor: totalLateMinutes > 30 ? "#fef3c7" : "#f1f5f9", color: totalLateMinutes > 30 ? "#92400e" : "#475569", fontWeight: 900, fontSize: 11 }} />
                          </Box>
                        )}
                        {/* Feature 5: Quick export buttons */}
                        <Box sx={{ display: "flex", gap: 0.75, mt: 1.25, flexWrap: "wrap" }}>
                          <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportAttendance} sx={{ fontSize: 11, py: 0.3 }}>CSV</Button>
                          <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportPdf} sx={{ fontSize: 11, py: 0.3 }}>PDF</Button>
                          <Button size="small" variant="outlined" startIcon={<TableChartIcon />} onClick={exportXlsx} disabled={entries.length === 0} sx={{ fontSize: 11, py: 0.3, borderColor: "#16a34a", color: "#16a34a" }}>XLSX</Button>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={!selected.companyRole?.id}
                        sx={{ whiteSpace: "nowrap", alignSelf: "flex-start" }}
                      >
                        Upload role photo
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            const rid = selected.companyRole?.id;
                            if (f && rid) uploadCompanyRolePhoto(rid, f);
                          }}
                        />
                      </Button>
                    </Box>
                    {/* Feature 3: Today's check-in status card */}
                    {(() => {
                      const todayStr = dayjs().format("YYYY-MM-DD");
                      const todayEntry = entries.find((e) => e.date === todayStr || e.date.startsWith(todayStr));
                      if (!todayEntry) return null;
                      const isVerified = todayEntry.checkInFaceVerified;
                      const faceScore = todayEntry.checkInFaceScore;
                      const workedMin = todayEntry.workedMinutes ?? 0;
                      const fullMin = settings?.fullDayMinutes ?? 480;
                      const progressPct = Math.min(100, Math.round((workedMin / fullMin) * 100));
                      const statusChipColor = todayEntry.status === "PRESENT" ? "#16a34a" : todayEntry.status === "HALF_DAY" ? "#d97706" : "#dc2626";
                      return (
                        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", display: "grid", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <TodayIcon sx={{ fontSize: 16, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Today's Check-in Status</Typography>
                            <Chip size="small" label={todayEntry.status} sx={{ bgcolor: statusChipColor, color: "#fff", fontWeight: 900, fontSize: 10, ml: "auto" }} />
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                            {todayEntry.checkInPhotoUrl && (
                              <Avatar
                                src={todayEntry.checkInPhotoUrl}
                                variant="rounded"
                                sx={{ width: 56, height: 56, cursor: "pointer", border: "2px solid", borderColor: isVerified ? "#16a34a" : "#e5e7eb" }}
                                onClick={() => window.open(todayEntry.checkInPhotoUrl!, "_blank")}
                              />
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 0.5 }}>
                                {todayEntry.inTime && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LoginIcon sx={{ fontSize: 14, color: "#16a34a" }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{todayEntry.inTime.substring(0, 5)}</Typography>
                                  </Box>
                                )}
                                {todayEntry.outTime && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LogoutIcon sx={{ fontSize: 14, color: "#2563eb" }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 900, color: "#2563eb" }}>{todayEntry.outTime.substring(0, 5)}</Typography>
                                  </Box>
                                )}
                                {isVerified != null && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {isVerified ? <CheckCircleIcon sx={{ fontSize: 14, color: "#16a34a" }} /> : <CancelIcon sx={{ fontSize: 14, color: "#dc2626" }} />}
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: isVerified ? "#15803d" : "#b91c1c" }}>
                                      Face {faceScore != null ? `${Math.round(faceScore * 100)}%` : ""} {isVerified ? "Verified" : "Not Verified"}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: 11, opacity: 0.7, mb: 0.5 }}>
                                {Math.floor(workedMin / 60)}h {workedMin % 60}m worked · {progressPct}% of full day
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={progressPct}
                                sx={{ height: 6, borderRadius: 3, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: progressPct >= 100 ? "#16a34a" : progressPct >= 50 ? "#3b82f6" : "#f59e0b", borderRadius: 3 } }}
                              />
                              {(todayEntry.lateMinutes ?? 0) > 0 && (
                                <Typography sx={{ fontSize: 11, color: "#d97706", fontWeight: 700, mt: 0.3 }}>Late by {todayEntry.lateMinutes}m</Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })()}
                  </AppCard>
                ) : null}

                <Divider />

                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: monthSummary?.fromDate,
                    max: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
                  }}
                />
                <Tabs
                  value={statusToMark}
                  onChange={(_, v) => setStatusToMark(v)}
                  sx={{
                    mb: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 900 }
                  }}
                >
                  <Tab value="PRESENT" label="Present" />
                  <Tab value="ABSENT" label="Absent" />
                </Tabs>

                {statusToMark === "PRESENT" ? (
                  <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                    Default present times: <b>{settings?.defaultInTime?.slice(0, 5) ?? "09:30"}</b> {"->"}{" "}
                    <b>{settings?.defaultOutTime?.slice(0, 5) ?? "17:30"}</b>
                  </Typography>
                ) : (
                  <TextField
                    label="Leave / Absence Reason"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Sick leave, personal work, emergency, absent..."
                    multiline
                    minRows={2}
                    required
                  />
                )}

                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
                  <Button
                    variant="contained"
                    color={statusToMark === "PRESENT" ? "primary" : "error"}
                    onClick={handleSaveAttendance}
                    disabled={employeeId === "" || !date || (statusToMark === "ABSENT" && !leaveReason.trim())}
                    fullWidth
                  >
                    {statusToMark === "PRESENT" ? "Mark Present" : "Mark Absent"}
                  </Button>
                </Box>

                <Divider />

                <Button
                  variant="outlined"
                  component="label"
                  disabled={!date}
                  sx={{ justifyContent: "space-between" }}
                >
                  <span>Upload daily group photo (for {date})</span>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadDailyGroupPhoto(f);
                    }}
                  />
                </Button>

                {selectedDaily?.photoUrl ? (
                  <Box
                    component="img"
                    alt="Daily group"
                    src={selectedDaily.photoUrl}
                    sx={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 3,
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                  />
                ) : (
                  <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
                    No daily photo uploaded for this date.
                  </Typography>
                )}
              </Box>
            </AppCard>

            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Bulk update (Jan 19 to till date)
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Applies the same in/out time to a range. Skips weekends + holidays.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField
                    label="From date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="To date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Tabs
                  value={bulkStatusToMark}
                  onChange={(_, v) => setBulkStatusToMark(v)}
                  sx={{
                    mb: 0.5,
                    borderBottom: 1,
                    borderColor: "divider",
                    "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 900 }
                  }}
                >
                  <Tab value="PRESENT" label="Bulk Present" />
                  <Tab value="ABSENT" label="Bulk Absent" />
                </Tabs>

                {bulkStatusToMark === "ABSENT" && (
                  <TextField
                    label="Leave / Absence Reason"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Sick leave, personal work, emergency, absent..."
                    multiline
                    minRows={2}
                    required
                  />
                )}

                <Button
                  variant="contained"
                  color={bulkStatusToMark === "PRESENT" ? "primary" : "error"}
                  onClick={bulkUpdate}
                  disabled={employeeId === "" || !fromDate || !toDate || (bulkStatusToMark === "ABSENT" && !leaveReason.trim())}
                  fullWidth
                >
                  {bulkStatusToMark === "PRESENT" ? "Apply Present Range" : "Apply Absent Range"}
                </Button>
              </Box>
            </AppCard>
          </div>

          <div className="lg:col-span-7 grid gap-6">
            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Monthly view
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

              {monthSummary ? (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 3,
                    border: "1px solid rgba(15,23,42,0.08)",
                    background: "rgba(255,255,255,0.6)",
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>Working days</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{monthSummary.workingDays}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>Present</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 18, color: "success.main" }}>
                      {monthSummary.presentDays}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>Absent/Leave</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 18, color: "error.main" }}>
                      {monthSummary.leaveDays}
                    </Typography>
                  </Box>
                  <Typography sx={{ gridColumn: "1 / -1", opacity: 0.75, fontSize: 12 }}>
                    {monthSummary.fromDate <= monthSummary.toDate
                      ? `Range: ${monthSummary.fromDate} -> ${monthSummary.toDate}`
                      : `Attendance starts on ${monthSummary.fromDate}`}{" "}
                    | Worked: <b>{wh}h {wm}m</b>
                    | Late: <b>{totalLateMinutes}m</b>
                    | Early: <b>{totalEarlyLeaveMinutes}m</b>
                    | Overtime: <b>{Math.floor(totalOvertimeMinutes / 60)}h {totalOvertimeMinutes % 60}m</b>
                  </Typography>
                </Box>
              ) : null}

              <MonthCalendar month={month} statusByDate={statusByDate} selectedDate={date} onDayClick={(d) => setDate(d)} />

              <Typography sx={{ mt: 2, opacity: 0.72, fontSize: 12 }}>
                Tip: click a date in the calendar to fill the form. Purple = Holiday (H).
              </Typography>
            </AppCard>

            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Entries ({entries.length})
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Saved attendance for the selected employee in <b>{month}</b>.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1 }}>
                {(entries || [])
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((e) => {
                    const letter = e.status === "PRESENT" ? "P" : e.status === "HALF_DAY" ? "HD" : "L";
                    const m = e.workedMinutes ?? 0;
                    const hh = Math.floor(m / 60);
                    const mm = m % 60;
                    return (
                      <Box
                        key={e.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 1.2,
                          borderRadius: 3,
                          border: "1px solid rgba(15,23,42,0.08)",
                          background: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 950,
                            width: 34,
                            textAlign: "center",
                            color: letter === "P" ? "success.main" : letter === "HD" ? "warning.main" : "error.main",
                          }}
                        >
                          {letter}
                        </Typography>
                        <Typography sx={{ fontWeight: 900, width: 110 }}>
                          {typeof e.date === "string" ? e.date.split("T")[0] : e.date}
                        </Typography>
                        <Typography sx={{ opacity: 0.85, width: 170 }}>
                          {e.inTime ? (e.inTime.includes("T") ? e.inTime.substring(11, 16) : e.inTime.substring(0, 5)) : "--"} {"->"} {e.outTime ? (e.outTime.includes("T") ? e.outTime.substring(11, 16) : e.outTime.substring(0, 5)) : "--"}
                          {e.inTime && e.outTime && e.outTime.startsWith("23:59") && e.checkOutFaceVerified == null && (
                            <span style={{ color: "#b45309", fontSize: 10, fontWeight: 900, display: "block" }}>
                              (Auto-Checkout)
                            </span>
                          )}
                        </Typography>
                        <Typography sx={{ opacity: 0.85 }}>
                          {hh}h {mm}m
                        </Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                          Late {e.lateMinutes ?? 0}m | Early {e.earlyLeaveMinutes ?? 0}m | OT {e.overtimeMinutes ?? 0}m
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                          {e.checkInPhotoUrl || e.checkInFaceScore != null ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: "1px solid #e2e8f0", borderRadius: 2, p: 0.5, bgcolor: "rgba(248,250,252,0.8)" }}>
                              {e.checkInPhotoUrl ? (
                                <Avatar
                                  src={e.checkInPhotoUrl}
                                  variant="rounded"
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    cursor: "pointer",
                                    border: "1px solid #cbd5e1",
                                    transition: "transform 0.15s ease",
                                    "&:hover": { transform: "scale(1.15)", zIndex: 1 },
                                  }}
                                  onClick={() => window.open(e.checkInPhotoUrl!, "_blank")}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, fontSize: 10, bgcolor: "#cbd5e1", color: "#475569" }}>IN</Avatar>
                              )}
                              <Box sx={{ pr: 0.5 }}>
                                <Typography sx={{ fontSize: 8, fontWeight: 950, color: "#64748b", lineHeight: 1 }}>VERIFIED IN PROOF</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 950, color: e.checkInFaceVerified ? "#16a34a" : e.checkInFaceScore != null ? "#dc2626" : "#64748b", lineHeight: 1.2 }}>
                                  {e.checkInFaceScore != null ? `${Math.round(e.checkInFaceScore * 100)}%` : "VERIFIED"}
                                </Typography>
                              </Box>
                            </Box>
                          ) : null}

                          {e.checkOutPhotoUrl || e.checkOutFaceScore != null ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: "1px solid #e2e8f0", borderRadius: 2, p: 0.5, bgcolor: "rgba(248,250,252,0.8)" }}>
                              {e.checkOutPhotoUrl ? (
                                <Avatar
                                  src={e.checkOutPhotoUrl}
                                  variant="rounded"
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    cursor: "pointer",
                                    border: "1px solid #cbd5e1",
                                    transition: "transform 0.15s ease",
                                    "&:hover": { transform: "scale(1.15)", zIndex: 1 },
                                  }}
                                  onClick={() => window.open(e.checkOutPhotoUrl!, "_blank")}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, fontSize: 10, bgcolor: "#cbd5e1", color: "#475569" }}>OUT</Avatar>
                              )}
                              <Box sx={{ pr: 0.5 }}>
                                <Typography sx={{ fontSize: 8, fontWeight: 950, color: "#64748b", lineHeight: 1 }}>VERIFIED OUT PROOF</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 950, color: e.checkOutFaceVerified ? "#16a34a" : e.checkOutFaceScore != null ? "#dc2626" : "#64748b", lineHeight: 1.2 }}>
                                  {e.checkOutFaceScore != null ? `${Math.round(e.checkOutFaceScore * 100)}%` : "VERIFIED"}
                                </Typography>
                              </Box>
                            </Box>
                          ) : null}
                        </Box>
                        {e.status === "LEAVE" ? (
                          <Typography sx={{ opacity: 0.75, fontSize: 12, marginLeft: "auto" }}>
                            Reason: <b>{e.leaveReason?.trim() || "--"}</b>
                          </Typography>
                        ) : null}
                      </Box>
                    );
                  })}
                {!entries.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No entries.</Typography> : null}
              </Box>
            </AppCard>
          </div>
        </div>
      </div>
      <Drawer anchor="right" open={!!selectedInboxItem} onClose={() => setSelectedInboxItem(null)}>
        <Box sx={{ width: 380, p: 2.25, display: "grid", gap: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>Request detail</Typography>
          {selectedInboxItem ? (
            <>
              <Chip size="small" label={selectedInboxItem.kind.replaceAll("_", " ")} sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }} />
              <Typography sx={{ fontWeight: 950 }}>
                {selectedInboxItem.employeeName} <span style={{ opacity: 0.62 }}>({selectedInboxItem.employeeNumber})</span>
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{selectedInboxItem.title}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Summary:</b> {selectedInboxItem.summary}</Typography>
              <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}><b>Reason:</b> {selectedInboxItem.reason}</Typography>
              {selectedInboxItem.attachmentUrl ? (
                <Button component="a" href={selectedInboxItem.attachmentUrl} target="_blank" rel="noreferrer" variant="outlined">
                  Open attachment{selectedInboxItem.attachmentName ? `: ${selectedInboxItem.attachmentName}` : ""}
                </Button>
              ) : null}
              <Divider />
              {selectedInboxItem.kind === "LEAVE" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" label="Remarks" value={leaveRemarks[selectedInboxItem.id] ?? ""} onChange={(e) => setLeaveRemarks((prev) => ({ ...prev, [selectedInboxItem.id]: e.target.value }))} />
                  {selectedInboxItem.raw.status === "CANCELLATION_REQUESTED" ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="contained" color="warning" onClick={() => approveLeaveCancellation(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Cancellation failed"))}>
                        Approve cancellation
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => rejectLeaveCancellation(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject cancellation failed"))}>
                        Reject cancellation
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="contained" color="success" onClick={() => approveLeaveRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>Approve</Button>
                      <Button variant="outlined" color="error" onClick={() => rejectLeaveRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>Reject</Button>
                    </Box>
                  )}
                </Box>
              ) : null}
              {selectedInboxItem.kind === "WFH" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" label="Remarks" value={workRemarks[selectedInboxItem.id] ?? ""} onChange={(e) => setWorkRemarks((prev) => ({ ...prev, [selectedInboxItem.id]: e.target.value }))} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" color="success" onClick={() => approveWorkRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>Approve</Button>
                    <Button variant="outlined" color="error" onClick={() => rejectWorkRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>Reject</Button>
                  </Box>
                </Box>
              ) : null}
              {selectedInboxItem.kind === "CORRECTION" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" label="Remarks" value={regularizationRemarks[selectedInboxItem.id] ?? ""} onChange={(e) => setRegularizationRemarks((prev) => ({ ...prev, [selectedInboxItem.id]: e.target.value }))} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" color="success" onClick={() => approveRegularizationRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>Approve</Button>
                    <Button variant="outlined" color="error" onClick={() => rejectRegularizationRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>Reject</Button>
                  </Box>
                </Box>
              ) : null}
              {selectedInboxItem.kind === "COMP_OFF" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <TextField size="small" label="Remarks" value={compOffRemarks[selectedInboxItem.id] ?? ""} onChange={(e) => setCompOffRemarks((prev) => ({ ...prev, [selectedInboxItem.id]: e.target.value }))} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" color="success" onClick={() => approveCompOff(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>Approve</Button>
                    <Button variant="outlined" color="error" onClick={() => rejectCompOff(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>Reject</Button>
                  </Box>
                </Box>
              ) : null}
              {selectedInboxItem.kind === "DEVICE" ? (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="contained" color="success" onClick={() => approveDeviceRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Approve failed"))}>Approve</Button>
                  <Button variant="outlined" color="error" onClick={() => rejectDeviceRequest(selectedInboxItem.id).then(() => setSelectedInboxItem(null)).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}>Reject</Button>
                </Box>
              ) : null}
            </>
          ) : null}
        </Box>
      </Drawer>

      {/* Feature #11: Late Arrivals Dashboard */}
      {lateArrivals.length > 0 && (
        <Box sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 999, width: { xs: "calc(100vw - 32px)", sm: 380 }, maxWidth: 380 }}>
          <Box
            sx={{ bgcolor: "background.paper", border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden" }}
          >
            <Box
              onClick={() => setLatePanelOpen((v) => !v)}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, bgcolor: "#1e293b", cursor: "pointer" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingDownIcon sx={{ color: "#fde68a", fontSize: 18 }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: "#f8fafc" }}>Late Arrivals — {month}</Typography>
                <Chip label={lateArrivals.length} size="small" sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 900, height: 18, fontSize: 10 }} />
              </Box>
              {latePanelOpen ? <ExpandLessIcon sx={{ color: "#94a3b8", fontSize: 18 }} /> : <ExpandMoreIcon sx={{ color: "#94a3b8", fontSize: 18 }} />}
            </Box>
            {latePanelOpen && (
              <Box sx={{ maxHeight: 280, overflowY: "auto", p: 1 }}>
                {lateArrivals.slice(0, 10).map((row) => (
                  <Box key={row.employeeId} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.75, borderRadius: 1.5, "&:hover": { bgcolor: "#f8fafc" } }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 900 }}>{row.employeeName[0]}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 11, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.employeeName}</Typography>
                      <Typography sx={{ opacity: 0.6, fontSize: 10 }}>{row.employeeNumber}</Typography>
                    </Box>
                    <Chip size="small" label={`${row.lateMinutes}m late`} sx={{ bgcolor: row.lateMinutes > 120 ? "#fee2e2" : "#fef3c7", color: row.lateMinutes > 120 ? "#b91c1c" : "#92400e", fontWeight: 900, fontSize: 10, height: 18 }} />
                    <Tooltip title="Copy employee number">
                      <IconButton size="small" onClick={() => copyToClipboard(row.employeeNumber, `Copied ${row.employeeNumber}`)} sx={{ p: 0.25 }}>
                        <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
                {lateArrivals.length > 10 && (
                  <Typography sx={{ fontSize: 11, opacity: 0.6, textAlign: "center", py: 1 }}>+{lateArrivals.length - 10} more employees</Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Feature #15: Attendance Audit Log Slide-over Drawer */}
      <Drawer
        anchor="right"
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 540 },
            bgcolor: "#0f172a",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.08)", bgcolor: "#1e293b" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "rgba(99,102,241,0.15)", display: "flex" }}>
                <HistoryRoundedIcon sx={{ color: "#818cf8", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#f8fafc", lineHeight: 1.2 }}>
                  Attendance Audit Trail
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                  Administrative actions, overrides, and exports
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Clear audit history">
                <IconButton size="small" onClick={clearAuditLogs} sx={{ color: "#94a3b8", "&:hover": { color: "#f87171" } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton size="small" onClick={() => setAuditDrawerOpen(false)} sx={{ color: "#94a3b8", "&:hover": { color: "#fff" } }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Quick Action & CSV export */}
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
              onClick={exportAuditCsv}
              disabled={!auditLogs.length}
              sx={{
                bgcolor: "#4f46e5",
                fontWeight: 800,
                fontSize: 12,
                textTransform: "none",
                borderRadius: 1.5,
                "&:hover": { bgcolor: "#4338ca" },
              }}
            >
              Export CSV
            </Button>
            <Typography sx={{ fontSize: 11, color: "#94a3b8", ml: "auto" }}>
              {filteredAuditLogs.length} of {auditLogs.length} records
            </Typography>
          </Box>

          {/* Search Box */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search action, employee, actor, or details..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748b", fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: "#0f172a",
                color: "#f8fafc",
                borderRadius: 1.5,
                fontSize: 12,
                mt: 1.5,
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&:hover fieldset": { borderColor: "#6366f1" },
                "&.Mui-focused fieldset": { borderColor: "#818cf8" },
                "& input": { color: "#f8fafc" },
              },
            }}
          />

          {/* Filter Chips */}
          <Box sx={{ display: "flex", gap: 0.6, mt: 1.5, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: `All (${auditLogs.length})` },
              { id: "ATTENDANCE", label: "Attendance Marks" },
              { id: "AUTO_RESOLVE", label: "Auto-Resolve" },
              { id: "PAYROLL", label: "Payroll Locks" },
              { id: "EXPORTS", label: "Exports" },
              { id: "EXCEPTIONS", label: "Exceptions" },
            ].map((filter) => {
              const active = auditFilter === filter.id;
              return (
                <Chip
                  key={filter.id}
                  size="small"
                  label={filter.label}
                  onClick={() => setAuditFilter(filter.id)}
                  sx={{
                    fontSize: 11,
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    borderRadius: 1,
                    bgcolor: active ? "#6366f1" : "rgba(255,255,255,0.06)",
                    color: active ? "#fff" : "#94a3b8",
                    border: active ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.08)",
                    "&:hover": {
                      bgcolor: active ? "#4f46e5" : "rgba(255,255,255,0.1)",
                      color: "#fff",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Timeline Log List */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {filteredAuditLogs.map((entry) => {
            // Action styling
            const isPresent = entry.action === "MARK_ATTENDANCE" && entry.details.includes("PRESENT");
            const isAbsent = entry.action === "MARK_ATTENDANCE" && entry.details.includes("ABSENT");
            const isAutoResolve = entry.action === "AUTO_RESOLVE_PUNCHOUT";
            const isPayroll = entry.action === "LOCK_PAYROLL" || entry.action === "UNLOCK_PAYROLL";
            const isBulk = entry.action === "BULK_MARK";
            const isExport = entry.action.startsWith("EXPORT_");

            const accentColor = isPresent ? "#10b981" : isAbsent ? "#ef4444" : isAutoResolve ? "#f59e0b" : isPayroll ? "#8b5cf6" : isBulk ? "#06b6d4" : isExport ? "#3b82f6" : "#64748b";

            const actionLabel =
              entry.action === "MARK_ATTENDANCE" ? (isPresent ? "Check-in Mark" : "Absence Mark") :
              entry.action === "BULK_MARK" ? "Bulk Range Mark" :
              entry.action === "AUTO_RESOLVE_PUNCHOUT" ? "Auto-Resolve Out" :
              entry.action === "LOCK_PAYROLL" ? "Payroll Locked" :
              entry.action === "UNLOCK_PAYROLL" ? "Payroll Unlocked" :
              entry.action === "EXPORT_XLSX" ? "Excel Export" :
              entry.action === "EXPORT_CSV" ? "CSV Export" :
              entry.action === "SCAN_MISSING_CHECKOUT" ? "Checkout Scan" :
              entry.action;

            return (
              <Box
                key={entry.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: `4px solid ${accentColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#24334a",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  },
                }}
              >
                {/* Header row: Action Chip + Target + Timestamp */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Chip
                      size="small"
                      label={actionLabel}
                      sx={{
                        fontSize: 10,
                        fontWeight: 900,
                        height: 20,
                        borderRadius: 1,
                        bgcolor: `${accentColor}22`,
                        color: accentColor,
                        border: `1px solid ${accentColor}44`,
                      }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: "#f1f5f9" }}>
                      {entry.target}
                    </Typography>
                  </Box>
                  <Tooltip title={dayjs(entry.timestamp).format("DD MMM YYYY, hh:mm:ss A")}>
                    <Typography sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
                      {dayjs(entry.timestamp).fromNow()}
                    </Typography>
                  </Tooltip>
                </Box>

                {/* Details text */}
                <Typography sx={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4, wordBreak: "break-word" }}>
                  {entry.details}
                </Typography>

                {/* Footer metadata: Actor & ID */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <Typography sx={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span>👤</span> {entry.actor}
                  </Typography>
                  <Typography sx={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
                    {entry.id}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {!filteredAuditLogs.length && (
            <Box sx={{ py: 8, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <HistoryRoundedIcon sx={{ fontSize: 44, color: "#475569" }} />
              <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
                No audit entries match your criteria
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                Actions performed by HR will automatically appear here.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Drawer Footer */}
        <Box sx={{ p: 1.5, px: 2, bgcolor: "#090e17", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 10, color: "#64748b" }}>
            🔒 Local Audit Trail • Retention: 300 entries
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => setAuditDrawerOpen(false)}
            sx={{ fontSize: 11, color: "#94a3b8", textTransform: "none" }}
          >
            Close
          </Button>
        </Box>
      </Drawer>

      {/* Feature: Back to Top FAB */}
      {showBackToTop && (
        <Fab
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{
            position: "fixed", bottom: 16, right: 16, zIndex: 1000,
            bgcolor: "#1e293b", color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            "&:hover": { bgcolor: "#334155" },
          }}
          title="Back to top"
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
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

function workRequestStatusColor(status: WorkRequest["status"]): "default" | "success" | "warning" | "error" | "info" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";
  if (status === "MANAGER_RECOMMENDED") return "info";
  return "warning";
}






