import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  Drawer,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WorkHistoryRoundedIcon from "@mui/icons-material/WorkHistoryRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { motion } from "framer-motion";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import ScheduledPushCard from '../components/ScheduledPushCard';

import { api } from "../api/client";
import { useToast } from "../components/Toast";
import { clearAuth } from "../auth/auth";
import { GlobalLoader } from "../components/GlobalLoader";
import { useThemeContext } from "../theme/ThemeContext";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import { enablePushNotifications, disablePushNotifications, isPushEnabled, sendTestNotification } from "../utils/pushNotifications";

const MotionBox = motion.create(Box);

type CompanyRole = { id: number; name: string; photoUrl?: string | null };
type Department = { id: number; name: string };
type Shift = { id: number; name: string; inTime: string; outTime: string; flexible: boolean };
type Manager = { id: number; username: string; enabled: boolean };
type OfficeLocation = { id: number; officeName?: string | null; latitude: number; longitude: number; radiusMeters: number; active: boolean; officeIpAddress?: string | null; };
type Holiday = { id: number; date: string; name: string };
type PayrollLock = { month: string; locked: boolean; updatedAt?: string | null; updatedBy?: string | null };
type OfficeQr = { valid: boolean; token: string | null; officeId?: number; officeName?: string | null; createdAt?: string; expiresAt?: string; printedQrExpiresAt?: string; dailyCode?: string; mode?: string };
type Employee = {
  id: number;
  employeeNumber: string;
  name: string;
  username?: string | null;
  loginRole: string;
  enabled?: boolean;
  status?: string | null;
  profilePhotoUrl?: string | null;
  companyRole?: CompanyRole | null;
  department?: Department | null;
  shift?: Shift | null;
  assignedOfficeLocation?: OfficeLocation | null;
};
type EmployeeDetail = {
  employee: Employee & { joinDate?: string | null; exitDate?: string | null; lastLoginAt?: string | null; lastLoginIp?: string | null };
  summary: { workingDays: number; presentDays: number; halfDays: number; leaveDays: number; absentDays: number; workedMinutes: number; lateMinutes: number; overtimeMinutes: number };
  attendance: Array<{ id: number; date: string; status: string; inTime?: string | null; outTime?: string | null; workedMinutes: number; lateMinutes: number; overtimeMinutes: number }>;
  leaveBalances: Array<{ id: number; leaveType: string; allocatedDays: number; usedDays: number; remainingDays: number }>;
  managers: Array<{ id: number; username: string; enabled: boolean }>;
  exceptions: Array<{ id: number; type: string; message: string; resolved: boolean; createdAt: string }>;
  requests: Array<{ id: number; type: string; status: string; date: string; title: string }>;
};
type ApprovalKind = "leave" | "correction" | "work" | "compOff" | "device";
type ApprovalItem = {
  id: number;
  kind: ApprovalKind;
  title: string;
  employeeName: string;
  employeeNumber: string;
  dateText: string;
  detail: string;
  reason: string;
  status: string;
  createdAt?: string | null;
  attachmentUrl?: string | null;
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
  autoAbsentCutoffTime?: string | null;
};

const cardSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "8px",
  boxShadow: "0 18px 46px rgba(0,0,0,0.08)",
  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
  minWidth: 0,
  "&:hover": { transform: "translateY(-2px)", borderColor: "primary.light", boxShadow: "0 24px 70px rgba(0,0,0,0.12)" },
};

const timeOnly = (value?: string | null, fallback = "09:00") => {
  if (!value) return fallback;
  if (/^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString().slice(11, 16);
};
const timePayload = (value: string) => `1970-01-01T${value.length === 5 ? `${value}:00` : value}Z`;
const dateOnly = (value?: string | Date | null) => value ? new Date(value).toISOString().slice(0, 10) : "--";
const displayTime = (value?: string | Date | null) => value ? timeOnly(String(value), "--") : "--";

const requestTone = (kind: ApprovalKind) => {
  if (kind === "leave") return { bg: "#EFF6FF", color: "#1D4ED8", label: "Leave" };
  if (kind === "correction") return { bg: "#F0FDFA", color: "#0F766E", label: "Correction" };
  if (kind === "work") return { bg: "#F5F3FF", color: "#6D28D9", label: "Work" };
  if (kind === "device") return { bg: "#FDF4FF", color: "#C026D3", label: "Device" };
  return { bg: "#FFF7ED", color: "#C2410C", label: "Comp off" };
};

export default function AdminPage() {
  const { toastSuccess, toastError } = useToast();
  const { mode, toggleColorMode } = useThemeContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [payrollLock, setPayrollLock] = useState<PayrollLock | null>(null);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<ApprovalKind | "all">("all");
  const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [selectedQrOfficeId, setSelectedQrOfficeId] = useState("");
  const [officeQr, setOfficeQr] = useState<OfficeQr | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [leaveBalanceForm, setLeaveBalanceForm] = useState({ leaveType: "CASUAL_LEAVE", allocatedDays: 12, usedDays: 0 });
  const [reportBusy, setReportBusy] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [shiftName, setShiftName] = useState("General");
  const [shiftIn, setShiftIn] = useState("09:30");
  const [shiftOut, setShiftOut] = useState("17:30");
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().slice(0, 10));
  const [holidayName, setHolidayName] = useState("Festival");
  const [officeName, setOfficeName] = useState("");
  const [officeLat, setOfficeLat] = useState("");
  const [officeLng, setOfficeLng] = useState("");
  const [officeRadius, setOfficeRadius] = useState("100");
  const [officeIp, setOfficeIp] = useState("");
  const [editOfficeId, setEditOfficeId] = useState<number | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const [employeeForm, setEmployeeForm] = useState({ employeeNumber: "", name: "", username: "", password: "", companyRoleId: "", departmentId: "", shiftId: "", officeLocationId: "" });
  const [editEmployeeForm, setEditEmployeeForm] = useState({ id: 0, employeeNumber: "", name: "", companyRoleId: "", departmentId: "", shiftId: "", officeLocationId: "" });
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const [employeeRes, roleRes, departmentRes, shiftRes, managerRes, officeRes, holidayRes, settingsRes, analyticsRes, payrollLockRes, leaveReqRes, correctionReqRes, workReqRes, compOffReqRes, deviceReqRes] = await Promise.allSettled([
        api.get<Employee[]>("/api/admin/employees"),
        api.get<CompanyRole[]>("/api/admin/company-roles"),
        api.get<Department[]>("/api/admin/departments"),
        api.get<Shift[]>("/api/admin/shifts"),
        api.get<Manager[]>("/api/admin/managers"),
        api.get<OfficeLocation[]>("/api/admin/office-location"),
        api.get<Holiday[]>("/api/admin/holidays", { params: { month } }),
        api.get<AttendanceSettings>("/api/admin/settings/attendance"),
        api.get<Record<string, any>>("/api/admin/analytics", { params: { month } }),
        api.get<PayrollLock>("/api/hr/payroll-lock", { params: { month } }),
        api.get<any[]>("/api/hr/leave-requests/pending"),
        api.get<any[]>("/api/hr/regularization-requests/pending"),
        api.get<any[]>("/api/hr/work-requests/pending"),
        api.get<any[]>("/api/hr/comp-off-requests/pending"),
        api.get<any[]>("/api/hr/device-requests/pending"),
      ]);
      if (employeeRes.status === "fulfilled") setEmployees(employeeRes.value.data);
      if (roleRes.status === "fulfilled") setRoles(roleRes.value.data);
      if (departmentRes.status === "fulfilled") setDepartments(departmentRes.value.data);
      if (shiftRes.status === "fulfilled") setShifts(shiftRes.value.data);
      if (managerRes.status === "fulfilled") setManagers(managerRes.value.data);
      if (officeRes.status === "fulfilled") {
        setOffices(officeRes.value.data);
        if (officeRes.value.data.length > 0 && !editOfficeId && !officeLat) {
          const off = officeRes.value.data[0];
          setEditOfficeId(off.id);
          setOfficeName(off.officeName || "");
          setOfficeLat(String(off.latitude));
          setOfficeLng(String(off.longitude));
          setOfficeRadius(String(off.radiusMeters));
          setOfficeIp(off.officeIpAddress || "");
        }
      }
      if (holidayRes.status === "fulfilled") setHolidays(holidayRes.value.data);
      if (settingsRes.status === "fulfilled") setSettings(settingsRes.value.data);
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data);
      if (payrollLockRes.status === "fulfilled") setPayrollLock(payrollLockRes.value.data);
      const approvalRows: ApprovalItem[] = [];
      if (leaveReqRes.status === "fulfilled") {
        approvalRows.push(...leaveReqRes.value.data.map((item: any) => ({
          id: item.id,
          kind: "leave" as const,
          title: item.leaveType || "Leave request",
          employeeName: item.employee?.name || "Employee",
          employeeNumber: item.employee?.employeeNumber || "--",
          dateText: `${dateOnly(item.fromDate)} to ${dateOnly(item.toDate)}`,
          detail: item.mailSubject || "Leave approval pending",
          reason: item.reason || item.mailMessage || "--",
          status: item.status,
          createdAt: item.createdAt,
          attachmentUrl: item.attachmentUrl,
        })));
      }
      if (correctionReqRes.status === "fulfilled") {
        approvalRows.push(...correctionReqRes.value.data.map((item: any) => ({
          id: item.id,
          kind: "correction" as const,
          title: "Attendance correction",
          employeeName: item.employee?.name || "Employee",
          employeeNumber: item.employee?.employeeNumber || "--",
          dateText: dateOnly(item.date),
          detail: `Requested ${displayTime(item.requestedInTime)} - ${displayTime(item.requestedOutTime)}`,
          reason: item.reason || "--",
          status: item.status,
          createdAt: item.createdAt,
          attachmentUrl: item.attachmentUrl,
        })));
      }
      if (workReqRes.status === "fulfilled") {
        approvalRows.push(...workReqRes.value.data.map((item: any) => ({
          id: item.id,
          kind: "work" as const,
          title: String(item.type || "Work request").replaceAll("_", " "),
          employeeName: item.employee?.name || "Employee",
          employeeNumber: item.employee?.employeeNumber || "--",
          dateText: `${dateOnly(item.fromDate)} to ${dateOnly(item.toDate)}`,
          detail: "Remote/on-duty work request",
          reason: item.reason || "--",
          status: item.status,
          createdAt: item.createdAt,
          attachmentUrl: item.attachmentUrl,
        })));
      }
      if (compOffReqRes.status === "fulfilled") {
        approvalRows.push(...compOffReqRes.value.data.map((item: any) => ({
          id: item.id,
          kind: "compOff" as const,
          title: "Comp-off request",
          employeeName: item.employee?.name || "Employee",
          employeeNumber: item.employee?.employeeNumber || "--",
          dateText: `${dateOnly(item.requestedDate)} for overtime on ${dateOnly(item.overtimeDate)}`,
          detail: `${item.overtimeMinutes || 0} overtime minutes`,
          reason: item.reason || "--",
          status: item.status,
          createdAt: item.createdAt,
          attachmentUrl: item.attachmentUrl,
        })));
      }
      if (deviceReqRes.status === "fulfilled") {
        approvalRows.push(...deviceReqRes.value.data.map((item: any) => ({
          id: item.id,
          kind: "device" as const,
          title: "Device registration",
          employeeName: item.employee?.name || item.username || "Employee",
          employeeNumber: item.employee?.employeeNumber || "--",
          dateText: `Device: ${item.label || "Mobile Device"}`,
          detail: `Device ID: ${item.deviceId}`,
          reason: item.model || "--",
          status: item.approved ? "APPROVED" : "PENDING",
          createdAt: item.createdAt,
        })));
      }
      const requestResults = [
        { label: "Employees", result: employeeRes },
        { label: "Roles", result: roleRes },
        { label: "Departments", result: departmentRes },
        { label: "Shifts", result: shiftRes },
        { label: "Managers", result: managerRes },
        { label: "Office locations", result: officeRes },
        { label: "Holidays", result: holidayRes },
        { label: "Attendance settings", result: settingsRes },
        { label: "Analytics", result: analyticsRes },
        { label: "Payroll lock", result: payrollLockRes },
        { label: "Leave approvals", result: leaveReqRes },
        { label: "Corrections", result: correctionReqRes },
        { label: "Work requests", result: workReqRes },
        { label: "Comp-off requests", result: compOffReqRes },
        { label: "Device requests", result: deviceReqRes },
      ];
      const rejected = requestResults.filter((item): item is { label: string; result: PromiseRejectedResult } => item.result.status === "rejected");
      const failedList = rejected.map((item) => `${item.label} (${item.result.reason?.response?.status || "network"})`).join(", ");
      const unauthorized = rejected.find((item) => item.result.reason?.response?.status === 401 || item.result.reason?.response?.status === 403);
      const notFound = rejected.find((item) => item.result.reason?.response?.status === 404);
      const serverError = rejected.find((item) => item.result.reason?.response?.status >= 500);
      if (!rejected.length) setAdminLoadError(null);
      else if (unauthorized) setAdminLoadError(`Admin access failed for: ${failedList}. Login again as ROLE_ADMIN.`);
      else if (notFound) setAdminLoadError(`Backend is not on the latest Node build. Missing routes: ${failedList}. Redeploy Attendance_Backend_Nodejs main.`);
      else if (serverError) setAdminLoadError(`${serverError.label} failed: ${serverError.result.reason?.response?.data?.error || "Backend server error. Check deployed backend logs."}`);
      else setAdminLoadError(`Some admin data could not load: ${failedList}`);
      setApprovalItems(approvalRows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    } catch (err: any) {
      toastError(err?.response?.data?.error || "Failed to load admin dashboard");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { refresh(); }, [month]);
  useEffect(() => { setPushEnabled(isPushEnabled()); }, []);

  const handleTogglePush = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setPushBusy(true);
    try {
      if (event.target.checked) {
        await enablePushNotifications();
        setPushEnabled(true);
        toastSuccess("Push notifications enabled");
      } else {
        await disablePushNotifications();
        setPushEnabled(false);
        toastSuccess("Push notifications disabled");
      }
    } catch (err: any) {
      toastError(err?.message || "Failed to toggle push notifications");
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestPush = async () => {
    setPushBusy(true);
    try {
      await sendTestNotification();
      toastSuccess("Test notification sent");
    } catch (err: any) {
      toastError(err?.message || "Failed to send test notification");
    } finally {
      setPushBusy(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => [employee.name, employee.employeeNumber, employee.username, employee.department?.name, employee.companyRole?.name].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [employees, search]);
  const activeEmployees = employees.filter((employee) => employee.enabled !== false && employee.status !== "INACTIVE").length;
  const configuredEmployees = employees.filter((employee) => employee.department || employee.shift || employee.assignedOfficeLocation).length;
  const setupProgress = employees.length ? Math.round((configuredEmployees / employees.length) * 100) : 0;
  const filteredApprovalItems = approvalFilter === "all" ? approvalItems : approvalItems.filter((item) => item.kind === approvalFilter);
  const approvalCounts = {
    all: approvalItems.length,
    leave: approvalItems.filter((item) => item.kind === "leave").length,
    correction: approvalItems.filter((item) => item.kind === "correction").length,
    work: approvalItems.filter((item) => item.kind === "work").length,
    compOff: approvalItems.filter((item) => item.kind === "compOff").length,
    device: approvalItems.filter((item) => item.kind === "device").length,
  };

  async function decideApproval(item: ApprovalItem, action: "approve" | "reject") {
    const endpoint = item.kind === "leave"
      ? "leave-requests"
      : item.kind === "correction"
        ? "regularization-requests"
        : item.kind === "work"
          ? "work-requests"
          : item.kind === "device"
            ? "device-requests"
            : "comp-off-requests";
    const key = `${item.kind}-${item.id}`;
    setApprovalBusyId(`${key}-${action}`);
    try {
      await api.post(`/api/hr/${endpoint}/${item.id}/${action}`, { remarks: approvalRemarks[key] || undefined });
      setApprovalRemarks((previous) => ({ ...previous, [key]: "" }));
      toastSuccess(action === "approve" ? "Request approved" : "Request rejected");
      await refresh();
    } finally {
      setApprovalBusyId(null);
    }
  }

  const selectedQrOffice = offices.find((office) => String(office.id) === selectedQrOfficeId) || offices[0];
  const qrImageUrl = officeQr?.token ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(officeQr.token)}` : "";

  async function loadLatestOfficeQr(officeId = selectedQrOffice?.id) {
    if (!officeId) return;
    setQrBusy(true);
    try {
      const response = await api.get<OfficeQr>("/api/admin/production/qr/latestToken", { params: { officeId } });
      setOfficeQr(response.data.token ? response.data : null);
    } finally {
      setQrBusy(false);
    }
  }

  async function generateOfficeQr() {
    const officeId = selectedQrOffice?.id;
    if (!officeId) {
      toastError("Create an office location first");
      return;
    }
    setQrBusy(true);
    try {
      const response = await api.post<OfficeQr>("/api/admin/production/qr", { officeId });
      setOfficeQr(response.data);
      toastSuccess("Permanent office QR ready");
    } finally {
      setQrBusy(false);
    }
  }

  async function copyOfficeQrToken() {
    if (!officeQr?.token) return;
    await navigator.clipboard.writeText(officeQr.token);
    toastSuccess("QR token copied");
  }

  useEffect(() => {
    if (!selectedQrOfficeId && offices.length) setSelectedQrOfficeId(String(offices[0].id));
  }, [offices, selectedQrOfficeId]);

  useEffect(() => {
    if (selectedQrOfficeId) loadLatestOfficeQr(Number(selectedQrOfficeId)).catch(() => undefined);
  }, [selectedQrOfficeId]);

  async function createRole() {
    if (!roleName.trim()) return;
    await api.post("/api/admin/company-roles", { name: roleName.trim() });
    setRoleName("");
    toastSuccess("Role created");
    await refresh();
  }

  async function createDepartment() {
    if (!departmentName.trim()) return;
    await api.post("/api/admin/departments", { name: departmentName.trim() });
    setDepartmentName("");
    toastSuccess("Department created");
    await refresh();
  }

  async function createShift() {
    await api.post("/api/admin/shifts", { name: shiftName.trim() || "General", inTime: timePayload(shiftIn), outTime: timePayload(shiftOut), flexible: false });
    toastSuccess("Shift created");
    await refresh();
  }

  async function createManager() {
    if (!managerUsername.trim() || !managerPassword.trim()) return;
    await api.post("/api/admin/manager", { username: managerUsername.trim(), password: managerPassword });
    setManagerUsername("");
    setManagerPassword("");
    toastSuccess("Manager created");
    await refresh();
  }

  async function createOffice() {
    if (!officeLat.trim() || !officeLng.trim()) return;
    const radius = Number(officeRadius);
    if (!Number.isFinite(radius) || radius <= 0) return toastError("Radius must be a positive number in meters.");
    
    if (editOfficeId) {
      await api.put(`/api/admin/office-location/${editOfficeId}`, {
        officeName: officeName.trim(),
        latitude: Number(officeLat),
        longitude: Number(officeLng),
        radiusMeters: radius,
        officeIpAddress: officeIp.trim() || undefined,
      });
      toastSuccess("Office updated successfully");
    } else {
      await api.post("/api/admin/office-location/active", {
        officeName: officeName.trim(),
        latitude: Number(officeLat),
        longitude: Number(officeLng),
        radiusMeters: radius,
        officeIpAddress: officeIp.trim() || undefined,
      });
      toastSuccess("Office saved successfully");
    }
    
    setOfficeName("");
    setOfficeLat("");
    setOfficeLng("");
    setOfficeRadius("100");
    setOfficeIp("");
    setEditOfficeId(null);
    await refresh();
  }

  function handleLogout() {
    clearAuth();
    window.location.href = "/";
  }

  async function resetDeviceBinding(employeeId: number) {
    if (!window.confirm("Are you sure you want to clear this employee's bound device?")) return;
    await api.post(`/api/admin/employees/${employeeId}/reset-device-binding`);
    toastSuccess("Device binding reset");
    await refresh();
  }

  async function createHoliday() {
    await api.post("/api/admin/holidays", { date: holidayDate, name: holidayName.trim() || "Holiday" });
    toastSuccess("Holiday saved");
    await refresh();
  }

  async function createEmployee() {
    const { employeeNumber, name, username, password } = employeeForm;
    if (!employeeNumber.trim() || !name.trim() || !username.trim() || !password.trim()) return;
    await api.post("/api/admin/employees", {
      employeeNumber: employeeNumber.trim(),
      name: name.trim(),
      username: username.trim(),
      password,
      companyRoleId: employeeForm.companyRoleId ? Number(employeeForm.companyRoleId) : null,
      departmentId: employeeForm.departmentId ? Number(employeeForm.departmentId) : null,
      shiftId: employeeForm.shiftId ? Number(employeeForm.shiftId) : null,
      officeLocationId: employeeForm.officeLocationId ? Number(employeeForm.officeLocationId) : null,
    });
    setEmployeeForm({ employeeNumber: "", name: "", username: "", password: "", companyRoleId: "", departmentId: "", shiftId: "", officeLocationId: "" });
    toastSuccess("Employee created");
    await refresh();
  }

  async function updateEmployeeProfile() {
    const { id, employeeNumber, name } = editEmployeeForm;
    if (!employeeNumber.trim() || !name.trim()) return;
    await api.post(`/api/admin/employees/${id}`, {
      employeeNumber: employeeNumber.trim(),
      name: name.trim(),
      companyRoleId: editEmployeeForm.companyRoleId ? Number(editEmployeeForm.companyRoleId) : null,
      departmentId: editEmployeeForm.departmentId ? Number(editEmployeeForm.departmentId) : null,
      shiftId: editEmployeeForm.shiftId ? Number(editEmployeeForm.shiftId) : null,
      officeLocationId: editEmployeeForm.officeLocationId ? Number(editEmployeeForm.officeLocationId) : null,
    });
    setEditEmployeeDialogOpen(false);
    toastSuccess("Profile updated");
    await refresh();
    
    // Refresh detail drawer if open
    if (selectedEmployee && selectedEmployee.id === id) {
      openEmployeeDetail(selectedEmployee);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    await api.post("/api/admin/settings/attendance", settings);
    toastSuccess("Attendance settings saved");
    await refresh();
  }

  function downloadStatutoryReport() {
    window.open(`/api/admin/reports/statutory?month=${month}`, "_blank");
  }

  async function openEmployeeDetail(employee: Employee) {
    setSelectedEmployee(employee);
    setEmployeeDetail(null);
    setDetailBusy(true);
    try {
      const response = await api.get<EmployeeDetail>(`/api/admin/employees/${employee.id}/detail`, { params: { month, year: Number(month.slice(0, 4)) } });
      setEmployeeDetail(response.data);
      setSelectedManagerId(response.data.managers[0]?.id ? String(response.data.managers[0].id) : "");
    } catch (err: any) {
      toastError(err?.response?.data?.error || "Employee detail failed");
    } finally {
      setDetailBusy(false);
    }
  }


  async function assignSelectedManager() {
    if (!selectedEmployee || !selectedManagerId) return;
    await api.post("/api/admin/manager-assignments", { managerUserId: Number(selectedManagerId), employeeIds: [selectedEmployee.id] });
    toastSuccess("Manager assigned");
    await openEmployeeDetail(selectedEmployee);
  }

  async function saveSelectedLeaveBalance() {
    if (!selectedEmployee) return;
    await api.post("/api/admin/leave-balances", {
      employeeId: selectedEmployee.id,
      leaveType: leaveBalanceForm.leaveType,
      year: Number(month.slice(0, 4)),
      allocatedDays: Number(leaveBalanceForm.allocatedDays),
      usedDays: Number(leaveBalanceForm.usedDays),
    });
    toastSuccess("Leave balance saved");
    await openEmployeeDetail(selectedEmployee);
  }

  async function deleteHoliday(id: number) {
    if (!window.confirm("Delete this holiday?")) return;
    await api.delete(`/api/admin/holidays/${id}`);
    toastSuccess("Holiday deleted");
    await refresh();
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportEmployeesCsv() {
    setReportBusy(true);
    try {
      const res = await api.get<Blob>("/api/admin/backup/employees.csv", { responseType: "blob" });
      downloadBlob(res.data, `employees-backup-${month}.csv`);
    } finally {
      setReportBusy(false);
    }
  }

  async function exportPayrollCsv() {
    setReportBusy(true);
    try {
      const res = await api.get<Blob>("/api/hr/payroll/export", { params: { month }, responseType: "blob" });
      downloadBlob(res.data, `payroll-${month}.csv`);
    } finally {
      setReportBusy(false);
    }
  }

  async function setAdminPayrollLocked(locked: boolean) {
    const res = await api.post<PayrollLock>("/api/hr/payroll-lock", null, { params: { month, locked } });
    setPayrollLock(res.data);
    toastSuccess(locked ? "Payroll locked" : "Payroll unlocked");
  }
  const statCards = [
    { label: "Employees", value: employees.length, helper: `${activeEmployees} active`, icon: <BadgeRoundedIcon />, color: "#2563EB" },
    { label: "Managers", value: managers.length, helper: "Team owners", icon: <GroupsRoundedIcon />, color: "#0F766E" },
    { label: "Org Units", value: departments.length + roles.length, helper: "Departments + roles", icon: <ApartmentRoundedIcon />, color: "#7C3AED" },
    { label: "Holidays", value: holidays.length, helper: month, icon: <CalendarMonthRoundedIcon />, color: "#EA580C" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", overflowX: "hidden", bgcolor: "background.default", backgroundImage: mode === 'dark' ? "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px)" : "linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(15,23,42,0.035) 1px, transparent 1px)", backgroundSize: "34px 34px", color: "text.primary" }}>
      {busy && <GlobalLoader message="Loading Admin Workspace..." />}
      <Box sx={{ position: "sticky", top: 0, zIndex: 20, bgcolor: "background.paper", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 3 }, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "#0F2F5F", borderRadius: "8px" }}><AdminPanelSettingsRoundedIcon /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: { xs: 22, md: 30 }, lineHeight: 1 }}>Admin Command Center</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>People, policies, holidays, shifts, managers, and setup health.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button onClick={refresh} startIcon={<RefreshRoundedIcon />} variant="outlined" sx={{ borderRadius: "8px", fontWeight: 900 }} disabled={busy}>Refresh</Button>
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
              <IconButton
                onClick={toggleColorMode}
                sx={{
                  width: 40, height: 40, borderRadius: '10px',
                  bgcolor: mode === 'dark' ? 'rgba(14,165,233,0.15)' : 'rgba(0,0,0,0.05)',
                  border: mode === 'dark' ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(0,0,0,0.1)',
                  color: mode === 'dark' ? '#38BDF8' : '#64748B',
                  transition: 'all 0.35s ease',
                  boxShadow: mode === 'dark' ? '0 0 12px rgba(14,165,233,0.25)' : 'none',
                }}
              >
                {mode === 'dark' ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button onClick={handleLogout} startIcon={<LogoutRoundedIcon />} variant="outlined" color="error" sx={{ borderRadius: "8px", fontWeight: 900 }}>Logout</Button>
          </Box>
        </Box>
      </Box>

      <MotionBox initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2, md: 3 }, py: 3, display: "grid", gap: 2.5 }}>
        <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, bgcolor: "#10204A", color: "white", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" }, gap: 3, alignItems: "center" }}>
          <Box>
            <Chip label="Production workspace" sx={{ bgcolor: "rgba(147,197,253,0.16)", color: "#BFDBFE", border: "1px solid rgba(191,219,254,0.22)", fontWeight: 900, mb: 2 }} />
            <Typography sx={{ fontWeight: 950, fontSize: { xs: 30, md: 46 }, lineHeight: 1.03 }}>Control the full attendance system from one place.</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 1.5, maxWidth: 760 }}>Create people, tune attendance rules, manage holidays, assign teams, and verify setup readiness without leaving the admin console.</Typography>
          </Box>
          <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "8px", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}><Typography sx={{ fontWeight: 900 }}>Setup completion</Typography><Typography sx={{ fontWeight: 950 }}>{setupProgress}%</Typography></Box>
            <LinearProgress value={setupProgress} variant="determinate" sx={{ height: 10, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.14)", "& .MuiLinearProgress-bar": { bgcolor: "#60A5FA" } }} />
            <Typography sx={{ color: "rgba(255,255,255,0.68)", mt: 1, fontSize: 13 }}>{configuredEmployees} of {employees.length} employees have department, shift, or office setup.</Typography>
          </Box>
        </Box>

        {adminLoadError ? (
          <Box sx={{ border: "1px solid #FCA5A5", bgcolor: "#FEF2F2", color: "#991B1B", borderRadius: "8px", p: 1.5 }}>
            <Typography sx={{ fontWeight: 950 }}>Admin data could not load</Typography>
            <Typography sx={{ fontSize: 13, mt: 0.35 }}>{adminLoadError}</Typography>
          </Box>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          {statCards.map((item, index) => (
            <MotionBox key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} sx={{ ...cardSx, p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}><Typography sx={{ color: "#64748B", fontWeight: 900, fontSize: 13 }}>{item.label}</Typography><Box sx={{ color: item.color }}>{item.icon}</Box></Box>
              <Typography sx={{ fontWeight: 950, fontSize: 28 }}>{item.value}</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 12 }}>{item.helper}</Typography>
            </MotionBox>
          ))}
        </Box>

        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "#0F766E", borderRadius: "8px" }}><WorkHistoryRoundedIcon /></Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22 }}>Request Approval Center</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13 }}>Approve or reject leaves, attendance corrections, work requests, and comp-off requests.</Typography>
              </Box>
            </Box>
            <Chip label={`${approvalItems.length} pending`} sx={{ borderRadius: "8px", fontWeight: 950, bgcolor: approvalItems.length ? "#FEF3C7" : "#DCFCE7", color: approvalItems.length ? "#92400E" : "#166534" }} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {[
              ["all", "All", approvalCounts.all],
              ["leave", "Leaves", approvalCounts.leave],
              ["correction", "Attendance corrections", approvalCounts.correction],
              ["work", "Work/WFH", approvalCounts.work],
              ["compOff", "Comp-off", approvalCounts.compOff],
              ["device", "Device requests", approvalCounts.device],
            ].map(([key, label, count]) => (
              <Button key={String(key)} size="small" variant={approvalFilter === key ? "contained" : "outlined"} onClick={() => setApprovalFilter(key as ApprovalKind | "all")} sx={{ borderRadius: "8px", fontWeight: 900 }}>
                {label} ({count})
              </Button>
            ))}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
            {filteredApprovalItems.map((item) => {
              const tone = requestTone(item.kind);
              const key = `${item.kind}-${item.id}`;
              return (
                <Box key={key} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5, bgcolor: "#FFFFFF", display: "grid", gap: 1.1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.25, alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap" }}>
                        <Chip size="small" label={tone.label} sx={{ borderRadius: "8px", bgcolor: tone.bg, color: tone.color, fontWeight: 900 }} />
                        <Chip size="small" label={item.status} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: "#F1F5F9", color: "#334155" }} />
                      </Box>
                      <Typography sx={{ fontWeight: 950, mt: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</Typography>
                      <Typography sx={{ color: "#64748B", fontSize: 13 }}>{item.employeeName} - {item.employeeNumber}</Typography>
                    </Box>
                    <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 800, textAlign: "right", minWidth: 100 }}>{item.dateText}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", p: 1 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{item.detail}</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.35 }}>{item.reason}</Typography>
                  </Box>
                  <TextField size="small" label="Admin remarks" value={approvalRemarks[key] || ""} onChange={(event) => setApprovalRemarks((previous) => ({ ...previous, [key]: event.target.value }))} />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                    <Button variant="contained" disabled={approvalBusyId === `${key}-approve`} onClick={() => decideApproval(item, "approve").catch((err) => toastError(err?.response?.data?.error || "Approve failed"))} sx={{ borderRadius: "8px", fontWeight: 950 }}>Approve</Button>
                    <Button variant="outlined" color="error" disabled={approvalBusyId === `${key}-reject`} onClick={() => decideApproval(item, "reject").catch((err) => toastError(err?.response?.data?.error || "Reject failed"))} sx={{ borderRadius: "8px", fontWeight: 950 }}>Reject / Cancel</Button>
                  </Box>
                </Box>
              );
            })}
            {!filteredApprovalItems.length ? (
              <Box sx={{ border: "1px dashed #CBD5E1", borderRadius: "8px", p: 2, bgcolor: "#F8FAFC", gridColumn: "1 / -1" }}>
                <Typography sx={{ fontWeight: 900 }}>No pending requests</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13 }}>New leave, correction, WFH/work, and comp-off requests will appear here for admin action.</Typography>
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 430px" }, gap: 2.5, alignItems: "start" }}>
          <Box sx={{ ...cardSx, p: 2.25 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22 }}>Employees</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13 }}>Search, review, and create employee accounts.</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "stretch", sm: "flex-end" }, width: { xs: "100%", md: "auto" }, "& > *": { flexShrink: 0 } }}>
                <Button variant="outlined" size="small" onClick={downloadStatutoryReport}>Export statutory report</Button>
                <TextField size="small" label="Search employees" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: "100%", sm: 280 } }} />
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fit, minmax(330px, 1fr))" }, gap: 1 }}>
              {filteredEmployees.slice(0, 10).map((employee) => (
                <Box key={employee.id} onClick={() => openEmployeeDetail(employee)} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5, display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 1.25, alignItems: "center", cursor: "pointer", bgcolor: "rgba(248,250,252,0.72)", transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease", "&:hover": { transform: "translateY(-2px)", borderColor: "#93C5FD", bgcolor: "#FFFFFF", boxShadow: "0 16px 40px rgba(15,23,42,0.09)" } }}>
                  <Avatar src={employee.profilePhotoUrl || undefined} sx={{ width: 46, height: 46, border: "2px solid #FFFFFF", boxShadow: "0 10px 24px rgba(15,23,42,0.16)" }}>{employee.name[0]}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.name}</Typography>
                      <Chip size="small" label={employee.enabled === false ? "Disabled" : employee.status || "Active"} sx={{ borderRadius: "8px", fontWeight: 900, height: 22, bgcolor: employee.enabled === false ? "#FEE2E2" : "#E0F2FE", color: employee.enabled === false ? "#991B1B" : "#075985" }} />
                    </Box>
                    <Typography sx={{ color: "#64748B", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employee.employeeNumber} - {employee.department?.name || "No department"} - {employee.shift?.name || "No shift"}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, pt: 0.5 }}>
                    <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={(event) => { event.stopPropagation(); openEmployeeDetail(employee); }} sx={{ borderRadius: "8px", fontWeight: 900 }}>View profile</Button>
                    <Button size="small" variant="outlined" color="error" onClick={(event) => { event.stopPropagation(); resetDeviceBinding(employee.id); }} sx={{ borderRadius: "8px", fontWeight: 900 }}>Reset device</Button>
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontWeight: 950, mb: 1 }}>Create employee</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
              <TextField size="small" label="Employee #" value={employeeForm.employeeNumber} onChange={(e) => setEmployeeForm({ ...employeeForm, employeeNumber: e.target.value })} />
              <TextField size="small" label="Name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} />
              <TextField size="small" label="Username" value={employeeForm.username} onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })} />
              <TextField size="small" label="Password" type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} />
              <TextField select size="small" label="Role" value={employeeForm.companyRoleId} onChange={(e) => setEmployeeForm({ ...employeeForm, companyRoleId: e.target.value })}>{roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</TextField>
              <TextField select size="small" label="Department" value={employeeForm.departmentId} onChange={(e) => setEmployeeForm({ ...employeeForm, departmentId: e.target.value })}>{departments.map((department) => <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>)}</TextField>
              <TextField select size="small" label="Shift" value={employeeForm.shiftId} onChange={(e) => setEmployeeForm({ ...employeeForm, shiftId: e.target.value })}>{shifts.map((shift) => <MenuItem key={shift.id} value={shift.id}>{shift.name}</MenuItem>)}</TextField>
              <Button onClick={() => createEmployee().catch((err) => toastError(err?.response?.data?.error || "Employee create failed"))} variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900 }}>Create</Button>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Box sx={{ ...cardSx, p: 2.25 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 20, mb: 1.5 }}>Org setup</Typography>
              <Box sx={{ display: "grid", gap: 1.25 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 88px" }, gap: 1 }}>
                  <TextField size="small" label="Role" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
                  <Button variant="outlined" onClick={() => createRole().catch((err) => toastError(err?.response?.data?.error || "Role failed"))} sx={{ borderRadius: "8px", fontWeight: 900 }}>Add</Button>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 88px" }, gap: 1 }}>
                  <TextField size="small" label="Department" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} />
                  <Button variant="outlined" onClick={() => createDepartment().catch((err) => toastError(err?.response?.data?.error || "Department failed"))} sx={{ borderRadius: "8px", fontWeight: 900 }}>Add</Button>
                </Box>
                <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.25, bgcolor: "#F8FAFC" }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>Shift window</Typography>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <TextField size="small" label="Shift name" value={shiftName} onChange={(e) => setShiftName(e.target.value)} fullWidth />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr) 96px" }, gap: 1 }}>
                      <TextField size="small" label="In" type="time" value={shiftIn} onChange={(e) => setShiftIn(e.target.value)} InputLabelProps={{ shrink: true }} />
                      <TextField size="small" label="Out" type="time" value={shiftOut} onChange={(e) => setShiftOut(e.target.value)} InputLabelProps={{ shrink: true }} />
                      <Button variant="outlined" onClick={() => createShift().catch((err) => toastError(err?.response?.data?.error || "Shift failed"))} sx={{ borderRadius: "8px", fontWeight: 900, minHeight: 40 }}>Add</Button>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.25, bgcolor: "#F8FAFC" }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>Manager account</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr) 96px" }, gap: 1 }}>
                    <TextField size="small" label="Manager email" value={managerUsername} onChange={(e) => setManagerUsername(e.target.value)} />
                    <TextField size="small" label="Password" type="password" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} />
                    <Button variant="outlined" onClick={() => createManager().catch((err) => toastError(err?.response?.data?.error || "Manager failed"))} sx={{ borderRadius: "8px", fontWeight: 900, minHeight: 40 }}>Add</Button>
                  </Box>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ border: "1px solid #DCE7F3", borderRadius: "8px", p: 1.5, bgcolor: "#FFFFFF" }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 14, mb: 1 }}>Office Location & Wi-Fi IP Fencing</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
                    <TextField size="small" label="Office name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
                    <TextField size="small" label="IP whitelist optional" value={officeIp} onChange={(e) => setOfficeIp(e.target.value)} />
                    <TextField size="small" label="Latitude" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} />
                    <TextField size="small" label="Longitude" value={officeLng} onChange={(e) => setOfficeLng(e.target.value)} />
                    <TextField size="small" label="Radius meters" value={officeRadius} onChange={(e) => setOfficeRadius(e.target.value)} />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="contained" onClick={() => createOffice().catch((err) => toastError(err?.response?.data?.error || "Office failed"))} sx={{ borderRadius: "8px", fontWeight: 900, flex: 1 }}>
                        {editOfficeId ? "Update office" : "Save office"}
                      </Button>
                      {editOfficeId && (
                        <Button variant="outlined" onClick={() => { setEditOfficeId(null); setOfficeName(""); setOfficeLat(""); setOfficeLng(""); setOfficeRadius("100"); setOfficeIp(""); }} sx={{ borderRadius: "8px", fontWeight: 900 }}>
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {offices.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {offices.map((off) => (
                        <Box key={off.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{off.officeName || `Office #${off.id}`}</Typography>
                            <Typography sx={{ color: '#64748B', fontSize: 12 }}>Radius: {off.radiusMeters}m | IP: {off.officeIpAddress || 'None'}</Typography>
                          </Box>
                          <Button size="small" variant="outlined" onClick={() => {
                            setEditOfficeId(off.id);
                            setOfficeName(off.officeName || "");
                            setOfficeLat(String(off.latitude));
                            setOfficeLng(String(off.longitude));
                            setOfficeRadius(String(off.radiusMeters));
                            setOfficeIp(off.officeIpAddress || "");
                          }}>Edit</Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ ...cardSx, p: 2.25 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "#1D4ED8", borderRadius: "8px" }}><QrCode2RoundedIcon /></Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 20 }}>Permanent Office QR</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 12 }}>One permanent office QR employees scan every day for punch in/out.</Typography>
                  </Box>
                </Box>
                <Chip size="small" label={officeQr?.token ? "Permanent" : "Not created"} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: officeQr?.token ? "#DCFCE7" : "#F1F5F9", color: officeQr?.token ? "#166534" : "#475569" }} />
              </Box>
              <Box sx={{ display: "grid", gap: 1.25 }}>
                <TextField select size="small" label="Office location" value={selectedQrOfficeId} onChange={(event) => { setSelectedQrOfficeId(event.target.value); setOfficeQr(null); }}>
                  {offices.map((office) => <MenuItem key={office.id} value={office.id}>{office.officeName || `Office #${office.id}`}</MenuItem>)}
                </TextField>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                  <Button disabled={qrBusy || !selectedQrOffice} variant="contained" onClick={() => generateOfficeQr().catch((err) => toastError(err?.response?.data?.error || "QR generation failed"))} sx={{ borderRadius: "8px", fontWeight: 950 }}>{officeQr?.token ? "Show permanent QR" : "Create permanent QR"}</Button>
                  <Button disabled={qrBusy || !selectedQrOffice} variant="outlined" onClick={() => loadLatestOfficeQr().catch((err) => toastError(err?.response?.data?.error || "QR load failed"))} sx={{ borderRadius: "8px", fontWeight: 950 }}>Refresh QR</Button>
                </Box>
                {officeQr?.token ? (
                  <Box sx={{ border: "1px solid #DCE7F3", borderRadius: "8px", p: 1.5, bgcolor: "#F8FAFC", display: "grid", gap: 1.25, justifyItems: "center" }}>
                    <Box component="img" src={qrImageUrl} alt="Office attendance QR" sx={{ width: "min(100%, 240px)", aspectRatio: "1 / 1", borderRadius: "8px", border: "8px solid white", boxShadow: "0 14px 34px rgba(15,23,42,0.12)" }} />
                    <Box sx={{ width: "100%", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", p: 1 }}>
                      <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 900 }}>Office</Typography>
                      <Typography sx={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{officeQr.officeName || selectedQrOffice?.officeName || "Office"}</Typography>
                    </Box>
                    <Button fullWidth variant="outlined" startIcon={<OpenInNewRoundedIcon />} onClick={() => window.open(qrImageUrl, "_blank")} sx={{ borderRadius: "8px", fontWeight: 900 }}>Open printable QR</Button>
                    <Typography sx={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>This same QR stays valid. Print it once and keep it at the office entrance for daily punch scans.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ border: "1px dashed #CBD5E1", borderRadius: "8px", p: 1.5, bgcolor: "#F8FAFC" }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>No QR loaded</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 12 }}>Select an office. Existing permanent QR will load automatically, or create it once.</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ ...cardSx, p: 2.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 950, fontSize: 20 }}>Holidays</Typography>
                  <Typography sx={{ color: "#64748B", fontSize: 12 }}>Create and review company holidays for payroll and attendance.</Typography>
                </Box>
                <Chip size="small" label={`${holidays.length} days`} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: "#FFF7ED", color: "#C2410C" }} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                <TextField size="small" label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Holiday date" type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Holiday name" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }} />
                <Button variant="contained" onClick={() => createHoliday().catch((err) => toastError(err?.response?.data?.error || "Holiday failed"))} sx={{ borderRadius: "8px", fontWeight: 900, gridColumn: { xs: "auto", sm: "1 / -1" } }}>Save holiday</Button>
              </Box>
              <Box sx={{ display: "grid", gap: 1, mt: 1.5 }}>
                {holidays.map((holiday) => (
                  <Box key={holiday.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, border: "1px solid #E2E8F0", borderRadius: "8px", px: 1.25, py: 1, bgcolor: "#F8FAFC" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{holiday.name}</Typography>
                      <Typography sx={{ color: "#64748B", fontSize: 12 }}>{holiday.date}</Typography>
                    </Box>
                    <Button size="small" color="error" onClick={() => deleteHoliday(holiday.id).catch((err) => toastError(err?.response?.data?.error || "Holiday delete failed"))} sx={{ borderRadius: "8px", fontWeight: 900 }}>Delete</Button>
                  </Box>
                ))}
                {!holidays.length ? <Typography sx={{ color: "#64748B", fontSize: 13 }}>No holidays configured for {month}.</Typography> : null}
              </Box>
            </Box>
          </Box>
        </Box>


        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 22 }}>Payroll lock and exports</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>Freeze payroll after review and download clean operational reports for the selected month.</Typography>
            </Box>
            <Chip icon={payrollLock?.locked ? <LockRoundedIcon /> : <LockOpenRoundedIcon />} label={payrollLock?.locked ? `Locked by ${payrollLock.updatedBy || "admin"}` : "Payroll open"} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: payrollLock?.locked ? "#FEE2E2" : "#DCFCE7", color: payrollLock?.locked ? "#991B1B" : "#166534" }} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
            <Button disabled={reportBusy} onClick={() => exportEmployeesCsv().catch((err) => toastError(err?.response?.data?.error || "Employee export failed"))} variant="outlined" startIcon={<FileDownloadRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900 }}>Employees CSV</Button>
            <Button disabled={reportBusy} onClick={() => exportPayrollCsv().catch((err) => toastError(err?.response?.data?.error || "Payroll export failed"))} variant="outlined" startIcon={<FileDownloadRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900 }}>Payroll CSV</Button>
            <Button disabled={payrollLock?.locked} onClick={() => setAdminPayrollLocked(true).catch((err) => toastError(err?.response?.data?.error || "Payroll lock failed"))} variant="contained" startIcon={<LockRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900, bgcolor: "#0F172A" }}>Lock month</Button>
            <Button disabled={!payrollLock?.locked} onClick={() => setAdminPayrollLocked(false).catch((err) => toastError(err?.response?.data?.error || "Payroll unlock failed"))} variant="outlined" startIcon={<LockOpenRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900 }}>Unlock month</Button>
          </Box>
        </Box>
        {settings && (
          <Box sx={{ ...cardSx, p: 2.25 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}><Box><Typography sx={{ fontWeight: 950, fontSize: 22 }}>Attendance policy</Typography><Typography sx={{ color: "#64748B", fontSize: 13 }}>Admin settings used by employee, HR, manager, payroll, and reports.</Typography></Box><Button onClick={() => saveSettings().catch((err) => toastError(err?.response?.data?.error || "Settings failed"))} variant="contained" startIcon={<SaveRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 900 }}>Save policy</Button></Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
              <TextField size="small" label="Default in" value={timeOnly(settings.defaultInTime)} onChange={(e) => setSettings({ ...settings, defaultInTime: e.target.value })} />
              <TextField size="small" label="Default out" value={timeOnly(settings.defaultOutTime, "17:30")} onChange={(e) => setSettings({ ...settings, defaultOutTime: e.target.value })} />
              <TextField size="small" label="Full day (min)" type="number" value={settings.fullDayMinutes} onChange={(e) => setSettings({ ...settings, fullDayMinutes: Number(e.target.value) })} />
              <TextField size="small" label="Overtime start (min)" type="number" value={settings.overtimeAfterMinutes} onChange={(e) => setSettings({ ...settings, overtimeAfterMinutes: Number(e.target.value) })} />
              <TextField size="small" label="Overtime pay/hr (Rs)" type="number" value={settings.overtimePayPerHour} onChange={(e) => setSettings({ ...settings, overtimePayPerHour: Number(e.target.value) })} />
              <TextField size="small" label="Base Salary (Rs)" type="number" value={settings.standardMonthlySalary} onChange={(e) => setSettings({ ...settings, standardMonthlySalary: Number(e.target.value) })} />
              <TextField size="small" label="Weekend days" value={settings.weekendDays} onChange={(e) => setSettings({ ...settings, weekendDays: e.target.value })} />
              <TextField size="small" label="Auto-absent Cutoff Time" type="time" value={timeOnly(settings.autoAbsentCutoffTime, "")} onChange={(e) => setSettings({ ...settings, autoAbsentCutoffTime: e.target.value ? timePayload(e.target.value) : null })} InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="QR validity minutes" type="number" value={settings.qrTokenValidityMinutes} onChange={(e) => setSettings({ ...settings, qrTokenValidityMinutes: Number(e.target.value) })} />
              <FormControlLabel control={<Switch checked={settings.requireQrForPunch} onChange={(e) => setSettings({ ...settings, requireQrForPunch: e.target.checked })} />} label="Require QR" />
              <FormControlLabel control={<Switch checked={settings.permanentOfficeQr} onChange={(e) => setSettings({ ...settings, permanentOfficeQr: e.target.checked })} />} label="Permanent office QR" />
            </Box>
          </Box>
        )}

        {/* Push Notifications Section */}
        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "rgba(59,130,246,0.1)", color: "#3B82F6", borderRadius: "8px" }}><NotificationsActiveRoundedIcon /></Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22 }}>Push Notifications</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13 }}>Configure browser push notifications for Admin alerts.</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <FormControlLabel 
                control={<Switch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} color="primary" />} 
                label={<Typography sx={{ fontWeight: 700, fontSize: 14 }}>Enable Push</Typography>} 
                sx={{ mr: 2 }}
              />
              <Button onClick={handleTestPush} disabled={!pushEnabled || pushBusy} variant="outlined" startIcon={<NotificationsActiveRoundedIcon />} sx={{ borderRadius: "8px", fontWeight: 800 }}>
                Test Notification
              </Button>
            </Box>
          </Box>
          {!pushEnabled && (
             <Box sx={{ bgcolor: "rgba(239,68,68,0.05)", p: 1.5, borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>
               <Typography sx={{ fontSize: 13, color: "#991B1B" }}>Push notifications are currently disabled on this browser. Enable them to receive real-time admin alerts.</Typography>
             </Box>
          )}
        </Box>
        <ScheduledPushCard />
      </MotionBox>
      
      <Drawer anchor="right" open={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2.5 } }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar src={selectedEmployee?.profilePhotoUrl || undefined} sx={{ width: 58, height: 58 }}>{selectedEmployee?.name?.[0]}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 22 }}>{selectedEmployee?.name || "Employee"}</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>{selectedEmployee?.employeeNumber} - {selectedEmployee?.department?.name || "No department"}</Typography>
            </Box>
          </Box>
          {detailBusy ? <LinearProgress /> : null}
          {employeeDetail ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
                {[
                  ["Present", employeeDetail.summary.presentDays, "#DCFCE7", "#166534"],
                  ["Half", employeeDetail.summary.halfDays, "#FEF3C7", "#92400E"],
                  ["Leave", employeeDetail.summary.leaveDays, "#DBEAFE", "#1D4ED8"],
                  ["Absent", employeeDetail.summary.absentDays, "#FEE2E2", "#991B1B"],
                ].map(([label, value, bg, color]) => <Box key={String(label)} sx={{ borderRadius: "8px", bgcolor: String(bg), p: 1.25 }}><Typography sx={{ color: String(color), fontWeight: 900, fontSize: 11 }}>{label}</Typography><Typography sx={{ color: String(color), fontWeight: 950, fontSize: 22 }}>{value}</Typography></Box>)}
              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontWeight: 950 }}>Profile and assignment</Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ borderRadius: '6px', py: 0.25, fontSize: 12, fontWeight: 800 }}
                    onClick={() => {
                      setEditEmployeeForm({
                        id: employeeDetail.employee.id,
                        employeeNumber: employeeDetail.employee.employeeNumber,
                        name: employeeDetail.employee.name,
                        companyRoleId: employeeDetail.employee.companyRole?.id ? String(employeeDetail.employee.companyRole.id) : "",
                        departmentId: employeeDetail.employee.department?.id ? String(employeeDetail.employee.department.id) : "",
                        shiftId: employeeDetail.employee.shift?.id ? String(employeeDetail.employee.shift.id) : "",
                        officeLocationId: employeeDetail.employee.assignedOfficeLocation?.id ? String(employeeDetail.employee.assignedOfficeLocation.id) : "",
                      });
                      setEditEmployeeDialogOpen(true);
                    }}
                  >
                    Edit Profile
                  </Button>
                </Box>
                <Typography sx={{ color: "#475569", fontSize: 13 }}>Username: {employeeDetail.employee.username || "--"}</Typography>
                <Typography sx={{ color: "#475569", fontSize: 13 }}>Role: {employeeDetail.employee.companyRole?.name || "Unassigned"}</Typography>
                <Typography sx={{ color: "#475569", fontSize: 13 }}>Shift: {employeeDetail.employee.shift?.name || "Unassigned"}</Typography>
                <Typography sx={{ color: "#475569", fontSize: 13 }}>Office: {employeeDetail.employee.assignedOfficeLocation?.officeName || "Default office"}</Typography>
                <Typography sx={{ color: "#475569", fontSize: 13 }}>Manager: {employeeDetail.managers.map((m) => m.username).join(", ") || "Not assigned"}</Typography>
              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Manager assignment</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
                  <TextField select size="small" label="Manager" value={selectedManagerId} onChange={(event) => setSelectedManagerId(event.target.value)}>
                    <MenuItem value="">No manager</MenuItem>
                    {managers.map((manager) => <MenuItem key={manager.id} value={manager.id}>{manager.username}</MenuItem>)}
                  </TextField>
                  <Button onClick={() => assignSelectedManager().catch((err) => toastError(err?.response?.data?.error || "Manager assignment failed"))} variant="contained" sx={{ borderRadius: "8px", fontWeight: 900 }}>Assign</Button>
                </Box>
              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Leave wallet</Typography>
                <Box sx={{ display: "grid", gap: 0.75 }}>
                  {employeeDetail.leaveBalances.length ? employeeDetail.leaveBalances.map((balance) => <Box key={balance.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{balance.leaveType.replaceAll("_", " ")}</Typography><Typography sx={{ fontSize: 13, color: "#475569" }}>{balance.remainingDays} left / {balance.allocatedDays}</Typography></Box>) : <Typography sx={{ color: "#64748B", fontSize: 13 }}>No leave balances configured.</Typography>}
                </Box>                <Divider sx={{ my: 1.25 }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>Edit balance</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 90px 90px auto" }, gap: 1 }}>
                  <TextField select size="small" label="Type" value={leaveBalanceForm.leaveType} onChange={(event) => setLeaveBalanceForm({ ...leaveBalanceForm, leaveType: event.target.value })}>
                    {["CASUAL_LEAVE", "SICK_LEAVE", "EARNED_LEAVE", "UNPAID_LEAVE"].map((item) => <MenuItem key={item} value={item}>{item.replaceAll("_", " ")}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Alloc" type="number" value={leaveBalanceForm.allocatedDays} onChange={(event) => setLeaveBalanceForm({ ...leaveBalanceForm, allocatedDays: Number(event.target.value) })} />
                  <TextField size="small" label="Used" type="number" value={leaveBalanceForm.usedDays} onChange={(event) => setLeaveBalanceForm({ ...leaveBalanceForm, usedDays: Number(event.target.value) })} />
                  <Button onClick={() => saveSelectedLeaveBalance().catch((err) => toastError(err?.response?.data?.error || "Leave balance failed"))} variant="contained" sx={{ borderRadius: "8px", fontWeight: 900 }}>Save</Button>
                </Box>              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Recent attendance</Typography>
                <Box sx={{ display: "grid", gap: 0.75, maxHeight: 220, overflow: "auto" }}>
                  {employeeDetail.attendance.slice(-10).reverse().map((row) => <Box key={row.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center" }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{row.date}</Typography><Chip size="small" label={`${row.status} ${row.inTime || "--"}-${row.outTime || "--"}`} sx={{ borderRadius: "8px", fontWeight: 800 }} /></Box>)}
                  {!employeeDetail.attendance.length ? <Typography sx={{ color: "#64748B", fontSize: 13 }}>No attendance rows for {month}.</Typography> : null}
                </Box>
              </Box>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", p: 1.5 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Latest requests</Typography>
                <Box sx={{ display: "grid", gap: 0.75 }}>
                  {employeeDetail.requests.length ? employeeDetail.requests.map((request) => <Box key={`${request.type}-${request.id}`} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{request.type} - {request.title}</Typography><Chip size="small" label={request.status} sx={{ borderRadius: "8px", fontWeight: 800 }} /></Box>) : <Typography sx={{ color: "#64748B", fontSize: 13 }}>No recent requests.</Typography>}
                </Box>
              </Box>
            </>
          ) : !detailBusy ? <Typography sx={{ color: "#64748B", fontSize: 13 }}>Open an employee to load detail.</Typography> : null}
        </Box>
      </Drawer>
      <Dialog open={editEmployeeDialogOpen} onClose={() => setEditEmployeeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Employee Profile</DialogTitle>
        <Box sx={{ p: 3, pt: 1, display: "grid", gap: 2 }}>
          <TextField size="small" label="Employee ID" value={editEmployeeForm.employeeNumber} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employeeNumber: e.target.value })} fullWidth />
          <TextField size="small" label="Full name" value={editEmployeeForm.name} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, name: e.target.value })} fullWidth />
          <TextField select size="small" label="Role" value={editEmployeeForm.companyRoleId} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, companyRoleId: e.target.value })}>
            <MenuItem value="">Unassigned</MenuItem>
            {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Department" value={editEmployeeForm.departmentId} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, departmentId: e.target.value })}>
            <MenuItem value="">Unassigned</MenuItem>
            {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Shift" value={editEmployeeForm.shiftId} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, shiftId: e.target.value })}>
            <MenuItem value="">Unassigned</MenuItem>
            {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Default Office" value={editEmployeeForm.officeLocationId} onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, officeLocationId: e.target.value })}>
            <MenuItem value="">Unassigned</MenuItem>
            {offices.map((o) => <MenuItem key={o.id} value={o.id}>{o.officeName || o.id}</MenuItem>)}
          </TextField>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <Button onClick={() => setEditEmployeeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => updateEmployeeProfile().catch((err) => toastError(err?.response?.data?.error || "Failed to update profile"))} variant="contained" sx={{ fontWeight: 900 }}>Save Changes</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}







