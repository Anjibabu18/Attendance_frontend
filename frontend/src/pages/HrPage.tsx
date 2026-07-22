import { Alert, Avatar, Box, Button, Chip, Divider, Drawer, Tab, Tabs, TextField, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsIcon from "@mui/icons-material/Groups";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Autocomplete from "@mui/material/Autocomplete";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
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
  }

  async function exportPayrollCsv() {
    const res = await api.get<Blob>("/api/hr/payroll/export", { params: { month }, responseType: "blob" });
    downloadBlob(res.data, `payroll-${month}.csv`);
  }

  async function scanMissingCheckouts() {
    const res = await api.post<Record<string, number>>("/api/hr/exceptions/scan-missing-checkouts");
    setOk(`Missing checkout scan complete: ${res.data.createdExceptions ?? 0} new exceptions`);
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
          return acc;
        },
        { netPay: 0, overtimeMinutes: 0, deductions: 0 },
      ),
    [payrollRows],
  );
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
              <Button variant="outlined" onClick={() => loadPendingLeaveRequests().catch(() => {})}>
                Refresh requests
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

        <RealtimeBoard month={month} />

        {analytics ? (
          <AnalyticsPanel title="Company analytics" subtitle={`Attendance movement for ${month}`} analytics={analytics} />
        ) : null}

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
          <Box sx={{ display: "grid", gap: 1 }}>
            { (payrollRows || []).slice(0, 8).map((row) => (
              <Box key={row.employeeId} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "190px 100px 110px 110px 110px 110px 110px" }, gap: 1, alignItems: "center", p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{row.employeeName}</Typography>
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>{row.employeeNumber}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12 }}>Days: <b>{row.payableDays}/{row.workingDays}</b></Typography>
                <Typography sx={{ fontSize: 12 }}>Per day: <b>Rs {row.dailyRate}</b></Typography>
                <Typography sx={{ fontSize: 12 }}>Earned: <b>Rs {row.earnedSalary}</b></Typography>
                <Typography sx={{ fontSize: 12 }}>Late: <b>{row.lateMinutes}m</b></Typography>
                <Typography sx={{ fontSize: 12 }}>Deductions: <b>Rs {row.totalDeductions}</b></Typography>
                <Typography sx={{ fontSize: 12 }}>Net: <b>Rs {row.netPay}</b></Typography>
              </Box>
            ))}
            {!payrollRows.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No payroll rows available for this month yet.</Typography> : null}
          </Box>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar 
                        src={(selected.profilePhotoUrl?.trim() ? selected.profilePhotoUrl : undefined) || (selected.companyRole?.photoUrl?.trim() ? selected.companyRole.photoUrl : undefined)} 
                        sx={{ width: 52, height: 52, bgcolor: "primary.main", color: "white", fontWeight: 900 }}
                      >
                        {selected.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 950 }}>{selected.name}</Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                          ID: <b>{selected.id}</b> | Emp#: <b>{selected.employeeNumber}</b>
                        </Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                          Company role: <b>{selected.companyRole?.name ?? "--"}</b>
                        </Typography>
                        <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                          Office:{" "}
                          <b>
                            {selected.assignedOfficeLocation?.officeName ?? "Default active office"}
                            {selected.assignedOfficeLocation
                              ? ` (${Math.round(selected.assignedOfficeLocation.radiusMeters)}m)`
                              : ""}
                          </b>
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        component="label"
                        disabled={!selected.companyRole?.id}
                        sx={{ whiteSpace: "nowrap" }}
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
                                <Typography sx={{ fontSize: 8, fontWeight: 950, color: "#64748b", lineHeight: 1 }}>IN SELFIE</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 950, color: e.checkInFaceVerified ? "#16a34a" : e.checkInFaceScore != null ? "#dc2626" : "#64748b", lineHeight: 1.2 }}>
                                  {e.checkInFaceScore != null ? `${Math.round(e.checkInFaceScore * 100)}%` : "N/A"}
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
                                <Typography sx={{ fontSize: 8, fontWeight: 950, color: "#64748b", lineHeight: 1 }}>OUT SELFIE</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 950, color: e.checkOutFaceVerified ? "#16a34a" : e.checkOutFaceScore != null ? "#dc2626" : "#64748b", lineHeight: 1.2 }}>
                                  {e.checkOutFaceScore != null ? `${Math.round(e.checkOutFaceScore * 100)}%` : "N/A"}
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






