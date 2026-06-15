import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DomainIcon from "@mui/icons-material/Domain";
import GroupsIcon from "@mui/icons-material/Groups";
import Autocomplete from "@mui/material/Autocomplete";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import AnalyticsPanel from "../components/AnalyticsPanel";
import AppCard from "../components/AppCard";
import DashboardHero from "../components/DashboardHero";
import Layout from "../components/Layout";
import ProductionControls from "../components/ProductionControls";
import RealtimeBoard from "../components/RealtimeBoard";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";

type CompanyRole = { id: number; name: string; photoUrl?: string | null };
type Employee = {
  id: number;
  employeeNumber: string;
  name: string;
  loginRole: string;
  username?: string | null;
  companyRole?: CompanyRole | null;
  assignedOfficeLocation?: Exclude<OfficeLocation, null> | null;
  department?: Department | null;
  shift?: WorkShift | null;
  enabled?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "PROBATION" | "NOTICE_PERIOD" | "RESIGNED";
  profilePhotoUrl?: string | null;
  joinDate?: string | null;
  exitDate?: string | null;
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
type Holiday = { id: number; date: string; name: string };
type CompanyProfile = { groupPhotoUrl?: string | null };
type Department = { id: number; name: string };
type WorkShift = { id: number; name: string; inTime: string; outTime: string; flexible: boolean };
type AuditLog = {
  id: number;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
  createdAt: string;
};
type OfficeLocation = {
  id: number;
  officeName?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  updatedAt: string;
} | null;

export default function AdminPage() {
  const { toastSuccess, toastError } = useToast();
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings | null>(null);
  const [defaultIn, setDefaultIn] = useState("09:00");
  const [defaultOut, setDefaultOut] = useState("18:00");
  const [fullDayMinutes, setFullDayMinutes] = useState(480);
  const [halfDayMinutes, setHalfDayMinutes] = useState(240);
  const [lateGraceMinutes, setLateGraceMinutes] = useState(10);
  const [earlyLeaveGraceMinutes, setEarlyLeaveGraceMinutes] = useState(10);
  const [overtimeAfterMinutes, setOvertimeAfterMinutes] = useState(480);
  const [weekendDays, setWeekendDays] = useState<string[]>(["SUNDAY"]);
  const [lateDeductionPerMinute, setLateDeductionPerMinute] = useState(1);
  const [overtimePayPerHour, setOvertimePayPerHour] = useState(0);
  const [unpaidLeaveDailyRate, setUnpaidLeaveDailyRate] = useState(500);
  const [standardMonthlySalary, setStandardMonthlySalary] = useState(25000);
  const [requireQrForPunch, setRequireQrForPunch] = useState(false);
  const [permanentOfficeQr, setPermanentOfficeQr] = useState(false);
  const [qrTokenValidityMinutes, setQrTokenValidityMinutes] = useState(10080);
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

  const [roleName, setRoleName] = useState("");

  const [hrUsername, setHrUsername] = useState("");
  const [hrPassword, setHrPassword] = useState("");
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");

  const [empNo, setEmpNo] = useState("");
  const [empName, setEmpName] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empRoleId, setEmpRoleId] = useState<number | "">("");
  const [empOfficeId, setEmpOfficeId] = useState<number | "">("");
  const [empDepartmentId, setEmpDepartmentId] = useState<number | "">("");
  const [empShiftId, setEmpShiftId] = useState<number | "">("");

  const [holidayMonth, setHolidayMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holidayName, setHolidayName] = useState("Festival");
  const [companyPhotoUrl, setCompanyPhotoUrl] = useState<string | null>(null);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(null);
  const [officeLocations, setOfficeLocations] = useState<Exclude<OfficeLocation, null>[]>([]);
  const [officeName, setOfficeName] = useState("Main office");
  const [officeLat, setOfficeLat] = useState("16.5062");
  const [officeLng, setOfficeLng] = useState("80.6480");
  const [officeRadius, setOfficeRadius] = useState("150");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [resetPasswords, setResetPasswords] = useState<Record<number, string>>({});
  const [bulkPassword, setBulkPassword] = useState("");
  const [usernameEdits, setUsernameEdits] = useState<Record<number, string>>({});
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [bulkOfficeId, setBulkOfficeId] = useState<number | "">("");
  const [bulkDepartmentId, setBulkDepartmentId] = useState<number | "">("");
  const [bulkShiftId, setBulkShiftId] = useState<number | "">("");
  const [bulkStatus, setBulkStatus] = useState<Employee["status"] | "">("");
  const [rosterEmployeeId, setRosterEmployeeId] = useState<number | "">("");
  const [rosterShiftId, setRosterShiftId] = useState<number | "">("");
  const [rosterFrom, setRosterFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [rosterTo, setRosterTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [shiftName, setShiftName] = useState("General");
  const [shiftIn, setShiftIn] = useState("09:00");
  const [shiftOut, setShiftOut] = useState("18:00");
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [checklist, setChecklist] = useState<Record<string, any> | null>(null);
  const [adminSection, setAdminSection] = useState("live");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [auditActor, setAuditActor] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditTargetType, setAuditTargetType] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [wizardStep, setWizardStep] = useState(0);

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const roleSelectValue = empRoleId !== "" && roles.some((r) => r.id === empRoleId) ? empRoleId : "";
  const employeeOfficeSelectValue = empOfficeId !== "" && officeLocations.some((loc) => loc.id === empOfficeId) ? empOfficeId : "";
  const employeeDepartmentSelectValue = empDepartmentId !== "" && departments.some((d) => d.id === empDepartmentId) ? empDepartmentId : "";
  const employeeShiftSelectValue = empShiftId !== "" && shifts.some((s) => s.id === empShiftId) ? empShiftId : "";
  const bulkOfficeSelectValue = bulkOfficeId !== "" && officeLocations.some((loc) => loc.id === bulkOfficeId) ? bulkOfficeId : "";
  const bulkDepartmentSelectValue = bulkDepartmentId !== "" && departments.some((d) => d.id === bulkDepartmentId) ? bulkDepartmentId : "";
  const bulkShiftSelectValue = bulkShiftId !== "" && shifts.some((s) => s.id === bulkShiftId) ? bulkShiftId : "";
  const rosterEmployeeSelectValue = rosterEmployeeId !== "" && employees.some((e) => e.id === rosterEmployeeId) ? rosterEmployeeId : "";
  const rosterShiftSelectValue = rosterShiftId !== "" && shifts.some((s) => s.id === rosterShiftId) ? rosterShiftId : "";
  const filteredEmployees = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        (e.department?.name ?? "").toLowerCase().includes(q) ||
        (e.shift?.name ?? "").toLowerCase().includes(q),
    );
  }, [employeeQuery, employees]);

  async function refresh() {
    const [r, e] = await Promise.all([
      api.get<CompanyRole[]>("/api/admin/company-roles"),
      api.get<Employee[]>("/api/admin/employees"),
    ]);
    setRoles(r.data);
    setEmployees(e.data);
  }

  async function loadAuditLogs() {
    const res = await api.get<AuditLog[]>("/api/admin/audit-logs", {
      params: {
        actor: auditActor.trim() || undefined,
        action: auditAction.trim() || undefined,
        targetType: auditTargetType.trim() || undefined,
        from: auditFrom || undefined,
        to: auditTo || undefined,
      },
    });
    setAuditLogs(res.data);
  }

  async function loadOrg() {
    const [d, s, a, c] = await Promise.all([
      api.get<Department[]>("/api/admin/departments"),
      api.get<WorkShift[]>("/api/admin/shifts"),
      api.get<Record<string, any>>("/api/admin/analytics", { params: { month: holidayMonth } }),
      api.get<Record<string, any>>("/api/admin/production-checklist"),
    ]);
    setDepartments(d.data);
    setShifts(s.data);
    setAnalytics(a.data);
    setChecklist(c.data);
  }

  async function loadOfficeLocation() {
    const [active, all] = await Promise.all([
      api.get<OfficeLocation>("/api/admin/office-location/active"),
      api.get<Exclude<OfficeLocation, null>[]>("/api/admin/office-location"),
    ]);
    setOfficeLocation(active.data);
    setOfficeLocations(all.data);
    const defaultLoc = active.data ?? all.data[0];
    if (defaultLoc) {
      setOfficeName(defaultLoc.officeName ?? "Main office");
      setOfficeLat(String(defaultLoc.latitude));
      setOfficeLng(String(defaultLoc.longitude));
      setOfficeRadius(String(defaultLoc.radiusMeters));
    }
  }

  async function saveOfficeLocation() {
    setErr(null);
    setOk(null);
    const latitude = Number(officeLat);
    const longitude = Number(officeLng);
    const radiusMeters = Number(officeRadius);
    const res = await api.post<OfficeLocation>("/api/admin/office-location/active", {
      officeName: officeName.trim() || null,
      latitude,
      longitude,
      radiusMeters,
    });
    setOfficeLocation(res.data);
    await loadOfficeLocation();
    setOk("Office location saved");
  }

  async function deleteOfficeLocation(id: number) {
    setErr(null);
    setOk(null);
    try {
      await api.delete(`/api/admin/office-location/${id}`);
      await loadOfficeLocation();
      await refresh();
      setOk("Office location deleted");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Delete office failed");
    }
  }

  async function assignEmployeeOffice(employeeId: number, officeLocationId: number | "") {
    setErr(null);
    setOk(null);
    try {
      await api.post(`/api/admin/employees/${employeeId}/office-location`, {
        officeLocationId: officeLocationId === "" ? null : officeLocationId,
      });
      setOk("Employee office assignment saved");
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Assign office failed");
    }
  }

  async function assignEmployeeRole(employee: Employee, companyRoleId: number | "") {
    if (companyRoleId === "") return;
    setErr(null);
    setOk(null);
    try {
      const res = await api.post<Employee>(`/api/admin/employees/${employee.id}`, {
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        companyRoleId,
        officeLocationId: employee.assignedOfficeLocation?.id ?? null,
        departmentId: employee.department?.id ?? null,
        shiftId: employee.shift?.id ?? null,
        joinDate: employee.joinDate ?? null,
      });
      setEmployees((prev) => prev.map((item) => (item.id === employee.id ? res.data : item)));
      setSelectedEmployee((prev) => (prev?.id === employee.id ? res.data : prev));
      setOk("Employee role assigned");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Assign role failed");
    }
  }

  async function updateEmployeeOrg(
    employee: Employee,
    overrides: { companyRoleId?: number; departmentId?: number | null; shiftId?: number | null; officeLocationId?: number | null },
    successMessage: string,
  ) {
    const companyRoleId = overrides.companyRoleId ?? employee.companyRole?.id;
    if (!companyRoleId) {
      setErr("Assign a company role before updating department or shift");
      return;
    }
    setErr(null);
    setOk(null);
    try {
      const res = await api.post<Employee>(`/api/admin/employees/${employee.id}`, {
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        companyRoleId,
        officeLocationId: overrides.officeLocationId !== undefined ? overrides.officeLocationId : (employee.assignedOfficeLocation?.id ?? null),
        departmentId: overrides.departmentId !== undefined ? overrides.departmentId : (employee.department?.id ?? null),
        shiftId: overrides.shiftId !== undefined ? overrides.shiftId : (employee.shift?.id ?? null),
        joinDate: employee.joinDate ?? null,
      });
      setEmployees((prev) => prev.map((item) => (item.id === employee.id ? res.data : item)));
      setSelectedEmployee((prev) => (prev?.id === employee.id ? res.data : prev));
      setOk(successMessage);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Employee update failed");
    }
  }

  async function loadSettings() {
    const res = await api.get<AttendanceSettings>("/api/admin/settings/attendance");
    setAttendanceSettings(res.data);
    setDefaultIn(res.data.defaultInTime?.slice(0, 5) || "09:00");
    setDefaultOut(res.data.defaultOutTime?.slice(0, 5) || "18:00");
    setFullDayMinutes(res.data.fullDayMinutes ?? 480);
    setHalfDayMinutes(res.data.halfDayMinutes ?? 240);
    setLateGraceMinutes(res.data.lateGraceMinutes ?? 10);
    setEarlyLeaveGraceMinutes(res.data.earlyLeaveGraceMinutes ?? 10);
    setOvertimeAfterMinutes(res.data.overtimeAfterMinutes ?? res.data.fullDayMinutes ?? 480);
    setLateDeductionPerMinute(res.data.lateDeductionPerMinute ?? 1);
    setOvertimePayPerHour(res.data.overtimePayPerHour ?? 0);
    setUnpaidLeaveDailyRate(res.data.unpaidLeaveDailyRate ?? 500);
    setStandardMonthlySalary(res.data.standardMonthlySalary ?? 25000);
    setRequireQrForPunch(Boolean(res.data.requireQrForPunch));
    setPermanentOfficeQr(Boolean(res.data.permanentOfficeQr));
    setQrTokenValidityMinutes(res.data.qrTokenValidityMinutes ?? 10080);
    const wd = (res.data.weekendDays ?? "SUNDAY")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    setWeekendDays(wd.length ? wd : ["SUNDAY"]);
  }

  useEffect(() => {
    Promise.all([refresh(), loadSettings(), loadOfficeLocation(), loadAuditLogs(), loadOrg()]).catch((e) =>
      setErr(e?.response?.data?.error ?? "Failed to load"),
    );
  }, []);

  useEffect(() => {
    api
      .get<CompanyProfile>("/api/company")
      .then((r) => setCompanyPhotoUrl(r.data.groupPhotoUrl ?? null))
      .catch(() => { });
  }, []);

  useEffect(() => {
    api
      .get<Holiday[]>("/api/admin/holidays", { params: { month: holidayMonth } })
      .then((r) => setHolidays(r.data))
      .catch(() => { });
  }, [holidayMonth]);

  useEffect(() => {
    loadAuditLogs().catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditActor, auditAction, auditTargetType, auditFrom, auditTo]);

  function goToSection(next: string) {
    setAdminSection(next);
    const node = document.getElementById(`admin-${next}`);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const companyPhotoReady = Boolean(companyPhotoUrl);
  const companyRoleReady = roles.length > 0;
  const officeLocationReady = Boolean(officeLocation);
  const attendanceRulesReady = Boolean(attendanceSettings);
  const employeesReady = employees.length > 0;
  const hrReady = Boolean(checklist?.hrAccount ?? checklist?.HR ?? false);
  const managerReady = Boolean(checklist?.managerAccount ?? checklist?.manager ?? false);

  const wizardSteps = [
    {
      title: "Company identity",
      description: "Add your company brand and role structure so employees can be assigned properly.",
      tasks: [
        { label: "Upload a company group photo", done: companyPhotoReady, section: "company" },
        { label: "Create at least one company role", done: companyRoleReady, section: "company" },
      ],
    },
    {
      title: "Workplace rules",
      description: "Define an office geofence and attendance rules for payroll, overtime, and late tracking.",
      tasks: [
        { label: "Save an active office location", done: officeLocationReady, section: "company" },
        { label: "Save attendance defaults and payroll settings", done: attendanceRulesReady, section: "company" },
      ],
    },
    {
      title: "Manager access",
      description: "Create HR and manager accounts so approvals and recommendations can be processed.",
      tasks: [
        { label: "Create an HR login", done: hrReady, section: "company" },
        { label: "Create a manager login", done: managerReady, section: "company" },
      ],
    },
    {
      title: "Launch team",
      description: "Import employees and holidays so payroll, attendance, and face verification begin working.",
      tasks: [
        { label: "Import employee records", done: employeesReady, section: "employees" },
        { label: "Add company holidays", done: Boolean(holidays.length), section: "company" },
      ],
    },
  ];

  const payrollPreview = useMemo(() => {
    const [yearRaw, monthRaw] = holidayMonth.split("-").map(Number);
    const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();
    const monthIndex = Number.isFinite(monthRaw) ? monthRaw - 1 : new Date().getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const weekendSet = new Set(weekendDays);
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = new Date(year, monthIndex, day).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      if (!weekendSet.has(weekday)) workingDays++;
    }
    const monthlySalary = Math.max(0, Number(standardMonthlySalary) || 0);
    const perDay = workingDays > 0 ? monthlySalary / workingDays : 0;
    return { workingDays, perDay };
  }, [holidayMonth, standardMonthlySalary, weekendDays]);

  async function createCompanyRole() {
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/admin/company-roles", { name: roleName });
      setRoleName("");
      setOk("Company role created");
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Create role failed");
    }
  }

  async function uploadRolePhoto(roleId: number, file: File) {
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/api/admin/company-roles/${roleId}/photo`, fd);
      setOk("Role photo uploaded");
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Upload failed");
    }
  }

  async function createHr() {
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/admin/hr", { username: hrUsername, password: hrPassword });
      setHrUsername("");
      setHrPassword("");
      setOk("HR created");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Create HR failed");
    }
  }

  async function createManager() {
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/admin/manager", { username: managerUsername, password: managerPassword });
      setManagerUsername("");
      setManagerPassword("");
      setOk("Manager created");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Create manager failed");
    }
  }

  async function createEmployee() {
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/admin/employees", {
        employeeNumber: empNo,
        name: empName,
        username: empUsername,
        password: empPassword,
        companyRoleId: empRoleId,
        officeLocationId: empOfficeId === "" ? null : empOfficeId,
        departmentId: empDepartmentId === "" ? null : empDepartmentId,
        shiftId: empShiftId === "" ? null : empShiftId,
      });
      setEmpNo("");
      setEmpName("");
      setEmpUsername("");
      setEmpPassword("");
      setEmpRoleId("");
      setEmpOfficeId("");
      setEmpDepartmentId("");
      setEmpShiftId("");
      setOk("Employee created");
      await refresh();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Create employee failed");
    }
  }

  async function resetEmployeePassword(employeeId: number) {
    const newPassword = resetPasswords[employeeId]?.trim();
    if (!newPassword) return;
    setErr(null);
    setOk(null);
    try {
      await api.post(`/api/admin/employees/${employeeId}/password`, { newPassword });
      setResetPasswords((prev) => ({ ...prev, [employeeId]: "" }));
      setOk("Employee password reset");
      await loadAuditLogs();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Password reset failed");
    }
  }

  async function setEmployeeStatus(employeeId: number, status: Employee["status"]) {
    if (!status) return;
    setErr(null);
    setOk(null);
    await api.post(`/api/admin/employees/${employeeId}/status`, { status, exitDate: status === "RESIGNED" ? new Date().toISOString().slice(0, 10) : null });
    setOk("Employee lifecycle status updated");
    await refresh();
  }

  async function saveEmployeeUsername(employee: Employee) {
    const username = (usernameEdits[employee.id] ?? employee.username ?? "").trim();
    if (!username) {
      setErr("Username is required");
      return;
    }
    const res = await api.post<Employee>(`/api/admin/employees/${employee.id}/username`, { username });
    setEmployees((prev) => prev.map((item) => (item.id === employee.id ? res.data : item)));
    setSelectedEmployee((prev) => (prev?.id === employee.id ? res.data : prev));
    setUsernameEdits((prev) => {
      const next = { ...prev };
      delete next[employee.id];
      return next;
    });
    setOk("Employee username updated");
  }

  async function bulkResetPasswords() {
    const employeeIds = employees.map((e) => e.id);
    const res = await api.post<{ updated: number }>("/api/admin/employees/passwords/bulk-reset", { employeeIds, newPassword: bulkPassword });
    setBulkPassword("");
    setOk(`Bulk reset ${res.data.updated} employee passwords`);
    await loadAuditLogs();
  }

  async function bulkEditEmployees() {
    const res = await api.post<{ updated: number }>("/api/admin/employees/bulk-edit", {
      employeeIds: selectedEmployeeIds,
      officeLocationId: bulkOfficeId === "" ? null : bulkOfficeId,
      departmentId: bulkDepartmentId === "" ? null : bulkDepartmentId,
      shiftId: bulkShiftId === "" ? null : bulkShiftId,
      status: bulkStatus || null,
      newPassword: bulkPassword.trim() || null,
    });
    setOk(`Bulk updated ${res.data.updated} employees`);
    setBulkPassword("");
    setBulkDepartmentId("");
    await refresh();
  }

  async function assignRoster() {
    const res = await api.post<{ assignedDays: number }>("/api/admin/roster", {
      employeeId: rosterEmployeeId,
      shiftId: rosterShiftId,
      fromDate: rosterFrom,
      toDate: rosterTo,
    });
    setOk(`Roster assigned for ${res.data.assignedDays} days`);
  }

  function toggleEmployeeSelection(id: number) {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function exportEmployeeBackup() {
    const res = await api.get<Blob>("/api/admin/backup/employees.csv", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-employees-backup.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function createDepartment() {
    await api.post("/api/admin/departments", { name: departmentName });
    setDepartmentName("");
    setOk("Department created");
    await loadOrg();
  }

  async function createShift() {
    await api.post("/api/admin/shifts", {
      name: shiftName,
      inTime: `${shiftIn}:00`.slice(0, 8),
      outTime: `${shiftOut}:00`.slice(0, 8),
      flexible: false,
    });
    setShiftName("General");
    setOk("Shift created");
    await loadOrg();
  }

  async function importEmployees(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<{ created: number }>("/api/admin/employees/import", fd);
    setOk(`Imported ${res.data.created} employees`);
    await refresh();
  }

  async function setEmployeeEnabled(employeeId: number, enabled: boolean) {
    await api.post(`/api/admin/employees/${employeeId}/enabled`, { enabled });
    setOk(enabled ? "Employee enabled" : "Employee disabled");
    await refresh();
  }

  async function saveSettings() {
    setErr(null);
    setOk(null);
    try {
      const res = await api.post<AttendanceSettings>("/api/admin/settings/attendance", {
        defaultInTime: `${defaultIn}:00`.slice(0, 8),
        defaultOutTime: `${defaultOut}:00`.slice(0, 8),
        weekendDays: weekendDays.join(","),
        fullDayMinutes,
        halfDayMinutes,
        lateGraceMinutes,
        earlyLeaveGraceMinutes,
        overtimeAfterMinutes,
        lateDeductionPerMinute,
        overtimePayPerHour,
        unpaidLeaveDailyRate,
        standardMonthlySalary,
        requireQrForPunch,
        permanentOfficeQr,
        qrTokenValidityMinutes,
      });
      setAttendanceSettings(res.data);
      setOk("Attendance defaults saved");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Save settings failed");
    }
  }

  async function addHoliday() {
    setErr(null);
    setOk(null);
    try {
      await api.post("/api/admin/holidays", { date: holidayDate, name: holidayName });
      setOk("Holiday saved");
      const r = await api.get<Holiday[]>("/api/admin/holidays", { params: { month: holidayMonth } });
      setHolidays(r.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Save holiday failed");
    }
  }

  async function deleteHoliday(id: number) {
    setErr(null);
    setOk(null);
    try {
      await api.delete(`/api/admin/holidays/${id}`);
      setOk("Holiday deleted");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Delete holiday failed");
    }
  }

  async function uploadCompanyPhoto(file: File) {
    setErr(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ groupPhotoUrl: string }>("/api/admin/company/photo", fd);
      setCompanyPhotoUrl(res.data.groupPhotoUrl);
      setOk("Company group photo uploaded");
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Upload company photo failed");
    }
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="grid gap-4 md:gap-6">
        {err ? <Alert severity="error">{err}</Alert> : null}
        {ok ? <Alert severity="success">{ok}</Alert> : null}

        <DashboardHero
          eyebrow="Admin workspace"
          title="Company control room"
          subtitle="Configure users, offices, working rules, holidays, and company media from one secured operations dashboard."
          right={
            <Box sx={{ display: "grid", gap: 1, minWidth: { xs: "100%", lg: 260 } }}>
              <Button variant="contained" onClick={saveSettings}>
                Save attendance rules
              </Button>
              <Button variant="outlined" onClick={() => loadOfficeLocation().catch(() => { })}>
                Refresh offices
              </Button>
            </Box>
          }
        />

        <AppCard contentSx={{ p: 1.25 }}>
          <Tabs
            value={adminSection}
            onChange={(_, value) => goToSection(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 900 } }}
          >
            <Tab value="live" label="Live" />
            <Tab value="company" label="Company" />
            <Tab value="employees" label="Employees" />
            <Tab value="reports" label="Reports" />
            <Tab value="audit" label="Audit" />
            <Tab value="setup" label="Setup" />
          </Tabs>
        </AppCard>

        <div id="admin-setup">
          <AppCard>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Setup wizard
            </Typography>
            <Typography sx={{ opacity: 0.72, mt: 1 }}>
              Guided company onboarding for group photos, role structure, attendance rules, and manager workflows.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 2 }}>
              {wizardSteps.map((step, index) => (
                <Button
                  key={step.title}
                  size="small"
                  variant={wizardStep === index ? "contained" : "outlined"}
                  onClick={() => setWizardStep(index)}
                >
                  {index + 1}. {step.title}
                </Button>
              ))}
            </Box>
            <Box sx={{ mt: 3, p: 2, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 2, bgcolor: "rgba(248,250,252,0.9)" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                {wizardSteps[wizardStep].title}
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary" }}>
                {wizardSteps[wizardStep].description}
              </Typography>
              <Box sx={{ display: "grid", gap: 1.25, mt: 2 }}>
                {wizardSteps[wizardStep].tasks.map((task) => (
                  <Box
                    key={task.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      p: 1.25,
                      borderRadius: 2,
                      border: "1px solid rgba(15,23,42,0.08)",
                      bgcolor: "rgba(255,255,255,0.8)",
                    }}
                  >
                    <Typography sx={{ color: task.done ? "#16a34a" : undefined }}>
                      {task.done ? "✓" : "•"} {task.label}
                    </Typography>
                    <Button size="small" variant="text" onClick={() => goToSection(task.section)}>
                      {task.done ? "Review" : "Go"}
                    </Button>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 3 }}>
                <Button size="small" variant="outlined" disabled={wizardStep === 0} onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}>
                  Previous
                </Button>
                <Button size="small" variant="contained" onClick={() => setWizardStep(Math.min(wizardSteps.length - 1, wizardStep + 1))}>
                  Next
                </Button>
              </Box>
            </Box>
          </AppCard>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Company roles" value={roles.length} helper="Defined role profiles" icon={<BadgeIcon />} />
          <StatCard label="Employees" value={employees.length} helper="Active accounts in system" icon={<GroupsIcon />} accent="#0f766e" />
          <StatCard label="Holidays" value={holidays.length} helper={`Saved for ${holidayMonth}`} icon={<CalendarMonthIcon />} accent="#7c3aed" />
          <StatCard label="Offices" value={officeLocations.length} helper={weekendDays.join(", ") || "No weekend selected"} icon={<DomainIcon />} accent="#b45309" />
        </div>

        <div id="admin-live">
          <RealtimeBoard month={holidayMonth} />
        </div>

        <ProductionControls />

        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Production checklist</Typography>
              <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                {checklist
                  ? Object.entries(checklist).map(([k, v]) => (
                    <Typography key={k} sx={{ fontSize: 13 }}>
                      <b>{k}</b>:{" "}
                      <span style={{ color: v ? "#16a34a" : "#dc2626", fontWeight: 900 }}>
                        {v ? "OK" : "Missing"}
                      </span>
                    </Typography>
                  ))
                  : null}
              </Box>
            </AppCard>
          </div>
          <div className="lg:col-span-4">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Departments</Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <TextField label="Department" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} fullWidth />
                <Button variant="contained" onClick={() => createDepartment().catch((e) => setErr(e?.response?.data?.error ?? "Create department failed"))} disabled={!departmentName.trim()}>
                  Add
                </Button>
              </Box>
              <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: 13 }}>
                {departments.map((d) => d.name).join(", ") || "No departments"}
              </Typography>
            </AppCard>
          </div>
          <div className="lg:col-span-4">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Shifts</Typography>
              <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
                <TextField label="Shift name" value={shiftName} onChange={(e) => setShiftName(e.target.value)} />
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField label="In" type="time" value={shiftIn} onChange={(e) => setShiftIn(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Out" type="time" value={shiftOut} onChange={(e) => setShiftOut(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Box>
                <Button variant="contained" onClick={() => createShift().catch((e) => setErr(e?.response?.data?.error ?? "Create shift failed"))}>Add shift</Button>
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{shifts.map((s) => s.name).join(", ") || "No shifts"}</Typography>
              </Box>
            </AppCard>
          </div>
        </div>

        <Box id="admin-reports" sx={{ display: "grid", gap: 6, gridTemplateColumns: { xs: "1fr", lg: analytics ? "minmax(0,1fr) 280px" : "1fr" } }}>
          {analytics ? (
            <AnalyticsPanel
              title="Dashboard analytics"
              subtitle={`Operational summary for ${holidayMonth}`}
              analytics={analytics}
            />
          ) : null}
          <AppCard>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Bulk employee import</Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 13 }}>
              Upload CSV with employeeNumber, name, username, password, optional roleId.
            </Typography>
            <Button variant="contained" component="label" sx={{ mt: 2, width: "100%" }}>
              Upload CSV
              <input hidden type="file" accept=".csv,text/csv" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importEmployees(f).catch((err) => setErr(err?.response?.data?.error ?? "Import failed"));
              }} />
            </Button>
          </AppCard>
        </Box>

        <div id="admin-company" className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Company roles
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Create roles like Developer / Manager and optionally upload a role photo.
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                <TextField
                  label="Role name"
                  fullWidth
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
                <Button variant="contained" onClick={createCompanyRole} disabled={!roleName.trim()}>
                  Create
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {roles.map((r) => (
                  <AppCard key={r.id} contentSx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar src={r.photoUrl ?? undefined} sx={{ width: 52, height: 52 }}>
                        {r.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 950,
                            lineHeight: 1.1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name}
                        </Typography>
                        <Typography sx={{ opacity: 0.7, fontSize: 12 }}>ID: {r.id}</Typography>
                      </Box>
                      <Button variant="outlined" component="label">
                        Upload
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadRolePhoto(r.id, f);
                          }}
                        />
                      </Button>
                    </Box>
                  </AppCard>
                ))}
                {!roles.length ? (
                  <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No roles yet.</Typography>
                ) : null}
              </Box>
            </AppCard>
          </div>

          <div className="lg:col-span-6 grid gap-6">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Company group photo
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                One photo for all members. Employees will see this when a date has no daily photo.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                <Avatar src={companyPhotoUrl ?? undefined} sx={{ width: 64, height: 64 }}>
                  C
                </Avatar>
                <Button variant="outlined" component="label">
                  Upload group photo
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCompanyPhoto(f);
                    }}
                  />
                </Button>
              </Box>
            </AppCard>

            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Holidays (H)
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Add festival holidays. Holidays are purple (H) and excluded from working-day counts.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <TextField
                  label="Month"
                  type="month"
                  value={holidayMonth}
                  onChange={(e) => setHolidayMonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 220 }}
                />
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField
                    label="Date"
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField label="Name" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} />
                </Box>
                <Button variant="outlined" onClick={addHoliday} disabled={!holidayDate || !holidayName.trim()}>
                  Save holiday
                </Button>
                <Divider />
                <Box sx={{ display: "grid", gap: 1 }}>
                  {holidays
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((h) => (
                      <Box
                        key={h.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.2,
                          borderRadius: 3,
                          border: "1px solid rgba(15,23,42,0.08)",
                          background: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <Typography sx={{ fontWeight: 950, color: "secondary.main", width: 18 }}>
                          H
                        </Typography>
                        <Typography sx={{ fontWeight: 900, width: 110 }}>{h.date}</Typography>
                        <Typography sx={{ flexGrow: 1, opacity: 0.9 }}>{h.name}</Typography>
                        <Button color="error" variant="text" onClick={() => deleteHoliday(h.id)}>
                          Delete
                        </Button>
                      </Box>
                    ))}
                  {!holidays.length ? (
                    <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No holidays for this month.</Typography>
                  ) : null}
                </Box>
              </Box>
            </AppCard>
          </div>

          <div className="lg:col-span-4">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Create HR login
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                HR marks attendance and uploads daily group photos.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <TextField label="HR username" value={hrUsername} onChange={(e) => setHrUsername(e.target.value)} />
                <TextField
                  label="HR password"
                  type="password"
                  value={hrPassword}
                  onChange={(e) => setHrPassword(e.target.value)}
                />
                <Button variant="contained" onClick={createHr} disabled={!hrUsername.trim() || !hrPassword.trim()}>
                  Create HR
                </Button>
              </Box>
            </AppCard>
          </div>

          <div className="lg:col-span-4">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Create manager login
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Managers review requests and recommend attendance updates to HR.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <TextField label="Manager username" value={managerUsername} onChange={(e) => setManagerUsername(e.target.value)} />
                <TextField
                  label="Manager password"
                  type="password"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                />
                <Button variant="contained" onClick={createManager} disabled={!managerUsername.trim() || !managerPassword.trim()}>
                  Create manager
                </Button>
              </Box>
            </AppCard>
          </div>

          <div className="lg:col-span-8">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Office location (GPS radius)
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Create multiple office geofences. Employee punch uses their assigned office, with the latest office as fallback.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <TextField label="Office name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField label="Latitude" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} />
                  <TextField label="Longitude" value={officeLng} onChange={(e) => setOfficeLng(e.target.value)} />
                </Box>
                <TextField
                  label="Radius (meters)"
                  type="number"
                  value={officeRadius}
                  onChange={(e) => setOfficeRadius(e.target.value)}
                  inputProps={{ min: 1 }}
                />
                <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="contained" onClick={() => saveOfficeLocation().catch((e) => setErr(e?.response?.data?.error ?? "Save office failed"))}>
                    Save office location
                  </Button>
                  {officeLocation ? (
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                      Active: {officeLocation.latitude}, {officeLocation.longitude} | Radius: {Math.round(officeLocation.radiusMeters)}m
                    </Typography>
                  ) : (
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                      Not configured yet.
                    </Typography>
                  )}
                </Box>
                <Divider />
                <Box sx={{ display: "grid", gap: 1 }}>
                  {officeLocations.map((loc) => (
                    <Box
                      key={loc.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.2,
                        borderRadius: 3,
                        border: "1px solid rgba(15,23,42,0.08)",
                        background: "rgba(255,255,255,0.6)",
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                          {loc.officeName || `Office ${loc.id}`}
                        </Typography>
                        <Typography sx={{ opacity: 0.72, fontSize: 12 }}>
                          {loc.latitude}, {loc.longitude} | {Math.round(loc.radiusMeters)}m
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => deleteOfficeLocation(loc.id)}
                      >
                        Delete
                      </Button>
                      <Typography sx={{ opacity: 0.7, fontSize: 12 }}>ID: {loc.id}</Typography>
                    </Box>
                  ))}
                  {!officeLocations.length ? (
                    <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No office locations yet.</Typography>
                  ) : null}
                </Box>
              </Box>
            </AppCard>

            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Attendance defaults
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Admin sets default in/out time and weekly holidays (weekends). HR uses these defaults.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField
                    label="Default in time"
                    type="time"
                    value={defaultIn}
                    onChange={(e) => setDefaultIn(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Default out time"
                    type="time"
                    value={defaultOut}
                    onChange={(e) => setDefaultOut(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}>
                  <TextField
                    label="Full day minutes"
                    type="number"
                    value={fullDayMinutes}
                    onChange={(e) => setFullDayMinutes(Math.max(1, Number(e.target.value || 0)))}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="Half day minutes"
                    type="number"
                    value={halfDayMinutes}
                    onChange={(e) => setHalfDayMinutes(Math.max(1, Number(e.target.value || 0)))}
                    inputProps={{ min: 1 }}
                  />
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <TextField
                    label="Late grace minutes"
                    type="number"
                    value={lateGraceMinutes}
                    onChange={(e) => setLateGraceMinutes(Math.max(0, Number(e.target.value || 0)))}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Early leave grace"
                    type="number"
                    value={earlyLeaveGraceMinutes}
                    onChange={(e) => setEarlyLeaveGraceMinutes(Math.max(0, Number(e.target.value || 0)))}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Overtime after minutes"
                    type="number"
                    value={overtimeAfterMinutes}
                    onChange={(e) => setOvertimeAfterMinutes(Math.max(1, Number(e.target.value || 0)))}
                    inputProps={{ min: 1 }}
                  />
                </Box>
                <Typography sx={{ opacity: 0.72, fontSize: 12 }}>
                  Example: Full day <b>480</b> = 8h, Half day <b>240</b> = 4h. Grace values control late and early-leave analytics.
                </Typography>
                <Divider />
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Payroll calculation</Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 12, mt: 0.25 }}>
                    Salary is prorated automatically: monthly salary divided by working days, multiplied by payable days.
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
                  <TextField
                    label="Monthly salary"
                    type="number"
                    value={standardMonthlySalary}
                    onChange={(e) => setStandardMonthlySalary(Math.max(0, Number(e.target.value || 0)))}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Late deduction / minute"
                    type="number"
                    value={lateDeductionPerMinute}
                    onChange={(e) => setLateDeductionPerMinute(Math.max(0, Number(e.target.value || 0)))}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Overtime pay / hour"
                    type="number"
                    value={overtimePayPerHour}
                    onChange={(e) => setOvertimePayPerHour(Math.max(0, Number(e.target.value || 0)))}
                    inputProps={{ min: 0 }}
                    helperText="Keep 0 when OT is time only"
                  />
                </Box>
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                  {[
                    ["Working days", payrollPreview.workingDays],
                    ["Per day salary", `Rs ${payrollPreview.perDay.toFixed(2)}`],
                    ["Formula", `Rs ${standardMonthlySalary} / ${payrollPreview.workingDays || 0}`],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1.5, bgcolor: "#f8fafc" }}>
                      <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
                      <Typography sx={{ mt: 0.5, fontWeight: 900, color: "#0f172a" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, alignItems: "center" }}>
                  <FormControlLabel
                    control={<Switch checked={requireQrForPunch} onChange={(e) => setRequireQrForPunch(e.target.checked)} />}
                    label="Require QR for punch"
                  />
                  <FormControlLabel
                    control={<Switch checked={permanentOfficeQr} onChange={(e) => setPermanentOfficeQr(e.target.checked)} />}
                    label="Permanent office QR"
                  />
                  <TextField
                    label="QR token validity minutes"
                    type="number"
                    value={qrTokenValidityMinutes}
                    onChange={(e) => setQrTokenValidityMinutes(Math.max(1, Number(e.target.value || 0)))}
                    inputProps={{ min: 1 }}
                    disabled={permanentOfficeQr}
                  />
                </Box>
                <Autocomplete
                  multiple
                  options={["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]}
                  value={weekendDays}
                  onChange={(_, v) => setWeekendDays(v)}
                  renderInput={(params) => <TextField {...params} label="Weekly holidays (weekend days)" />}
                />
                <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="contained" onClick={saveSettings}>
                    Save defaults
                  </Button>
                  {attendanceSettings ? (
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                      Current: {attendanceSettings.defaultInTime?.slice(0, 5)} {"->"}{" "}
                      {attendanceSettings.defaultOutTime?.slice(0, 5)} (Weekend: {attendanceSettings.weekendDays}) |{" "}
                      Full: {attendanceSettings.fullDayMinutes}m, Half: {attendanceSettings.halfDayMinutes}m | Late grace:{" "}
                      {attendanceSettings.lateGraceMinutes}m, OT after: {attendanceSettings.overtimeAfterMinutes}m | QR:{" "}
                      {attendanceSettings.requireQrForPunch ? "Required" : "Optional"} | Token:{" "}
                      {attendanceSettings.permanentOfficeQr ? "Permanent" : `${attendanceSettings.qrTokenValidityMinutes}m`}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            </AppCard>
          </div>

          <div id="admin-employees" className="lg:col-span-6">
            <AppCard>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Create employee
              </Typography>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Create employee login and assign a company role.
              </Typography>
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }} className="sm:grid-cols-2">
                <TextField label="Employee number" value={empNo} onChange={(e) => setEmpNo(e.target.value)} />
                <TextField label="Employee name" value={empName} onChange={(e) => setEmpName(e.target.value)} />
                <TextField label="Login username" value={empUsername} onChange={(e) => setEmpUsername(e.target.value)} />
                <TextField
                  label="Login password"
                  type="password"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                />
                <TextField
                  select
                  label="Company role"
                  value={roleSelectValue}
                  onChange={(e) => setEmpRoleId(e.target.value === "" ? "" : Number(e.target.value))}
                  sx={{ gridColumn: "1 / -1" }}
                >
                  <MenuItem value="">Select role</MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Assigned office"
                  value={employeeOfficeSelectValue}
                  onChange={(e) => setEmpOfficeId(e.target.value === "" ? "" : Number(e.target.value))}
                  sx={{ gridColumn: "1 / -1" }}
                >
                  <MenuItem value="">Use default active office</MenuItem>
                  {officeLocations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.officeName || `Office ${loc.id}`}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Department"
                  value={employeeDepartmentSelectValue}
                  onChange={(e) => setEmpDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <MenuItem value="">No department</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Default shift"
                  value={employeeShiftSelectValue}
                  onChange={(e) => setEmpShiftId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <MenuItem value="">No default shift</MenuItem>
                  {shifts.map((shift) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.name} ({shift.inTime?.slice(0, 5)}-{shift.outTime?.slice(0, 5)})
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={createEmployee}
                  sx={{ gridColumn: "1 / -1" }}
                  disabled={
                    !empNo.trim() || !empName.trim() || !empUsername.trim() || !empPassword.trim() || empRoleId === ""
                  }
                >
                  Create employee
                </Button>
              </Box>
            </AppCard>
          </div>

          <div id="admin-employees" className="lg:col-span-12">
            <AppCard>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 2, alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Employees ({filteredEmployees.length})
                  </Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                    Quick list of employees, lifecycle status, roles, offices, and account controls.
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", gap: 1, alignItems: "center", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "180px 180px auto auto" } }}>
                  <TextField
                    size="small"
                    label="Search"
                    value={employeeQuery}
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    sx={{ width: "100%" }}
                  />
                  <TextField
                    size="small"
                    label="Bulk password"
                    type="password"
                    value={bulkPassword}
                    onChange={(e) => setBulkPassword(e.target.value)}
                    sx={{ width: "100%" }}
                  />
                  <Button variant="outlined" onClick={() => bulkResetPasswords().catch((e) => setErr(e?.response?.data?.error ?? "Bulk reset failed"))} disabled={!bulkPassword.trim() || !employees.length}>
                    Bulk reset
                  </Button>
                  <Button variant="contained" onClick={() => exportEmployeeBackup().catch((e) => setErr(e?.response?.data?.error ?? "Backup export failed"))}>
                    Backup CSV
                  </Button>
                </Box>
              </Box>
              <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                Status changes also enable/disable accounts when needed.
              </Typography>
              <Box sx={{ mt: 2, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" } }}>
                <Box sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
                  <Typography sx={{ fontWeight: 950 }}>Bulk employee edit</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.3 }}>
                    Selected employees: {selectedEmployeeIds.length}
                  </Typography>
                  <Box sx={{ mt: 1.2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(5,1fr)" } }}>
                    <TextField select label="Office" value={bulkOfficeSelectValue} onChange={(e) => setBulkOfficeId(e.target.value === "" ? "" : Number(e.target.value))}>
                      <MenuItem value="">No change</MenuItem>
                      {officeLocations.map((loc) => <MenuItem key={loc.id} value={loc.id}>{loc.officeName || `Office ${loc.id}`}</MenuItem>)}
                    </TextField>
                    <TextField select label="Department" value={bulkDepartmentSelectValue} onChange={(e) => setBulkDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}>
                      <MenuItem value="">No change</MenuItem>
                      {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                    </TextField>
                    <TextField select label="Default shift" value={bulkShiftSelectValue} onChange={(e) => setBulkShiftId(e.target.value === "" ? "" : Number(e.target.value))}>
                      <MenuItem value="">No change</MenuItem>
                      {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </TextField>
                    <TextField select label="Status" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Employee["status"] | "")}>
                      <MenuItem value="">No change</MenuItem>
                      {["ACTIVE", "PROBATION", "NOTICE_PERIOD", "INACTIVE", "RESIGNED"].map((status) => <MenuItem key={status} value={status}>{status.replaceAll("_", " ")}</MenuItem>)}
                    </TextField>
                    <Button variant="contained" onClick={() => bulkEditEmployees().catch((e) => setErr(e?.response?.data?.error ?? "Bulk edit failed"))} disabled={!selectedEmployeeIds.length}>
                      Apply bulk edit
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
                  <Typography sx={{ fontWeight: 950 }}>Shift calendar / roster</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.3 }}>
                    Assign an employee shift for one day or a date range. Employee dashboard uses this shift for countdown and attendance rules.
                  </Typography>
                  <Box sx={{ mt: 1.2, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr auto" } }}>
                    <TextField select label="Employee" value={rosterEmployeeSelectValue} onChange={(e) => setRosterEmployeeId(e.target.value === "" ? "" : Number(e.target.value))}>
                      <MenuItem value="">Select</MenuItem>
                      {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                    </TextField>
                    <TextField select label="Shift" value={rosterShiftSelectValue} onChange={(e) => setRosterShiftId(e.target.value === "" ? "" : Number(e.target.value))}>
                      <MenuItem value="">Select</MenuItem>
                      {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.inTime?.slice(0, 5)}-{s.outTime?.slice(0, 5)})</MenuItem>)}
                    </TextField>
                    <TextField label="From" type="date" value={rosterFrom} onChange={(e) => setRosterFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <TextField label="To" type="date" value={rosterTo} onChange={(e) => setRosterTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <Button variant="contained" onClick={() => assignRoster().catch((e) => setErr(e?.response?.data?.error ?? "Roster assign failed"))} disabled={rosterEmployeeId === "" || rosterShiftId === ""}>
                      Assign
                    </Button>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "grid", gap: 1.25, maxHeight: { xs: "none", xl: 720 }, overflowY: "auto", overflowX: "hidden", pr: { xl: 0.5 } }}>
                  {filteredEmployees.map((e) => {
                    const r = e.companyRole?.id ? roleById.get(e.companyRole.id) : e.companyRole;
                    const assignedOfficeId =
                      e.assignedOfficeLocation?.id && officeLocations.some((loc) => loc.id === e.assignedOfficeLocation?.id)
                        ? e.assignedOfficeLocation.id
                        : "";
                    return (
                      <Box
                        key={e.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1.25fr 1fr", xl: "1.35fr 1fr 1fr 0.8fr" },
                          gap: 1.1,
                          alignItems: "stretch",
                          p: { xs: 1.1, sm: 1.25 },
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          bgcolor: "#ffffff",
                          boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                        }}
                      >
                        <Box sx={{ display: "grid", gap: 1 }}>
                          <Box sx={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr)", gap: 1.2, alignItems: "center", minWidth: 0 }}>
                            <Avatar src={e.profilePhotoUrl ?? r?.photoUrl ?? undefined} sx={{ width: 42, height: 42 }}>{e.name[0]}</Avatar>
                            <Box sx={{ minWidth: 0, cursor: "pointer" }} onClick={() => setSelectedEmployee(e)}>
                              <Typography sx={{ fontWeight: 950, fontSize: 14, lineHeight: 1.2, wordBreak: "break-word" }}>
                                {e.name}
                              </Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.2 }}>
                                {e.employeeNumber} | #{e.id}
                              </Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.15, lineHeight: 1.25, wordBreak: "break-word" }}>
                                {e.department?.name ?? "No department"} | {e.shift?.name ?? "No default shift"}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                            <Button
                              size="small"
                              variant={selectedEmployeeIds.includes(e.id) ? "contained" : "outlined"}
                              onClick={() => toggleEmployeeSelection(e.id)}
                            >
                              {selectedEmployeeIds.includes(e.id) ? "Selected" : "Select"}
                            </Button>
                            <Chip size="small" label={(e.status ?? "ACTIVE").replaceAll("_", " ")} color={employeeStatusColor(e.status)} sx={{ borderRadius: 1, fontWeight: 900 }} />
                            <Typography sx={{ color: "text.secondary", fontSize: 11.5 }}>
                              Join {e.joinDate ?? "--"}{e.exitDate ? ` | Exit ${e.exitDate}` : ""}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "grid", gap: 0.75 }}>
                          <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Role and org</Typography>
                          <TextField
                            select
                            size="small"
                            label="Role"
                            value={e.companyRole?.id && roles.some((role) => role.id === e.companyRole?.id) ? e.companyRole.id : ""}
                            onChange={(event) => assignEmployeeRole(e, event.target.value === "" ? "" : Number(event.target.value))}
                          >
                            <MenuItem value="">Select role</MenuItem>
                            {roles.map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                {role.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            size="small"
                            label="Department"
                            value={e.department?.id && departments.some((department) => department.id === e.department?.id) ? e.department.id : ""}
                            onChange={(event) =>
                              updateEmployeeOrg(
                                e,
                                { departmentId: event.target.value === "" ? null : Number(event.target.value) },
                                "Employee department assigned",
                              )
                            }
                          >
                            <MenuItem value="">No department</MenuItem>
                            {departments.map((department) => (
                              <MenuItem key={department.id} value={department.id}>
                                {department.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            size="small"
                            label="Default shift"
                            value={e.shift?.id && shifts.some((shift) => shift.id === e.shift?.id) ? e.shift.id : ""}
                            onChange={(event) =>
                              updateEmployeeOrg(
                                e,
                                { shiftId: event.target.value === "" ? null : Number(event.target.value) },
                                "Employee default shift assigned",
                              )
                            }
                          >
                            <MenuItem value="">No default shift</MenuItem>
                            {shifts.map((shift) => (
                              <MenuItem key={shift.id} value={shift.id}>
                                {shift.name} ({shift.inTime?.slice(0, 5)}-{shift.outTime?.slice(0, 5)})
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>

                        <Box sx={{ display: "grid", gap: 0.75 }}>
                          <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Office and account</Typography>
                          <TextField
                            select
                            size="small"
                            label="Office"
                            value={assignedOfficeId}
                            onChange={(event) =>
                              assignEmployeeOffice(
                                e.id,
                                event.target.value === "" ? "" : Number(event.target.value),
                              )
                            }
                          >
                            <MenuItem value="">Default active office</MenuItem>
                            {officeLocations.map((loc) => (
                              <MenuItem key={loc.id} value={loc.id}>
                                {loc.officeName || `Office ${loc.id}`}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            label="Username"
                            value={usernameEdits[e.id] ?? e.username ?? ""}
                            onChange={(event) => setUsernameEdits((prev) => ({ ...prev, [e.id]: event.target.value }))}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                saveEmployeeUsername(e).catch((err) => setErr(err?.response?.data?.error ?? "Username update failed"));
                              }
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => saveEmployeeUsername(e).catch((err) => setErr(err?.response?.data?.error ?? "Username update failed"))}
                            disabled={(usernameEdits[e.id] ?? e.username ?? "").trim() === (e.username ?? "").trim()}
                          >
                            Save
                          </Button>
                        </Box>

                        <Box sx={{ display: "grid", gap: 0.75 }}>
                          <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Security</Typography>
                          <TextField
                            size="small"
                            label="New password"
                            type="password"
                            value={resetPasswords[e.id] ?? ""}
                            onChange={(event) => setResetPasswords((prev) => ({ ...prev, [e.id]: event.target.value }))}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => resetEmployeePassword(e.id)}
                            disabled={!resetPasswords[e.id]?.trim()}
                          >
                            Reset
                          </Button>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                              Last login: {e.lastLoginAt ? new Date(e.lastLoginAt).toLocaleDateString() : "--"}
                            </Typography>
                            <Button
                              variant="outlined"
                              color={e.enabled === false ? "success" : "error"}
                              onClick={() => setEmployeeEnabled(e.id, !(e.enabled ?? true)).catch((err) => setErr(err?.response?.data?.error ?? "Status update failed"))}
                            >
                              {e.enabled === false ? "Enable" : "Disable"}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  {!filteredEmployees.length ? (
                    <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No matching employees.</Typography>
                  ) : null}
                </Box>
              </Box>
            </AppCard>
          </div>

          <div id="admin-audit" className="lg:col-span-12">
            <AppCard>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Audit logs
                  </Typography>
                  <Typography sx={{ opacity: 0.72, fontSize: 13, mt: 0.5 }}>
                    Latest security and operational activity.
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => loadAuditLogs().catch(() => { })}>
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 170px 170px auto" }, mb: 2 }}>
                <TextField size="small" label="Actor" value={auditActor} onChange={(e) => setAuditActor(e.target.value)} />
                <TextField size="small" label="Action" value={auditAction} onChange={(e) => setAuditAction(e.target.value)} />
                <TextField size="small" label="Target" value={auditTargetType} onChange={(e) => setAuditTargetType(e.target.value)} />
                <TextField size="small" label="From" type="date" value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="To" type="date" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                <Button variant="outlined" onClick={() => { setAuditActor(""); setAuditAction(""); setAuditTargetType(""); setAuditFrom(""); setAuditTo(""); }}>
                  Clear
                </Button>
              </Box>
              <Box sx={{ display: "grid", gap: 1 }}>
                {auditLogs.slice(0, 12).map((log) => (
                  <Box key={log.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "190px 170px 1fr" }, gap: 1.5, p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}>
                    <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{new Date(log.createdAt).toLocaleString()}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{log.action}</Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                      {log.actorUsername} | {log.targetType}
                      {log.targetId ? ` #${log.targetId}` : ""} {log.details ? `| ${log.details}` : ""}
                    </Typography>
                  </Box>
                ))}
                {!auditLogs.length ? <Typography sx={{ opacity: 0.7, fontSize: 13 }}>No audit logs yet.</Typography> : null}
              </Box>
            </AppCard>
          </div>
        </div>
      </div>

      <Drawer anchor="right" open={!!selectedEmployee} onClose={() => setSelectedEmployee(null)}>
        <Box sx={{ width: 360, p: 2.25, display: "grid", gap: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>Employee detail</Typography>
          {selectedEmployee ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 1.2, alignItems: "center" }}>
                <Avatar src={selectedEmployee.profilePhotoUrl ?? selectedEmployee.companyRole?.photoUrl ?? undefined} sx={{ width: 56, height: 56 }}>{selectedEmployee.name[0]}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>{selectedEmployee.name}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                    {selectedEmployee.employeeNumber} | {selectedEmployee.companyRole?.name ?? "No role"}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13 }}><b>Status:</b> {(selectedEmployee.status ?? "ACTIVE").replaceAll("_", " ")}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Username:</b> {selectedEmployee.username ?? "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Department:</b> {selectedEmployee.department?.name ?? "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Shift:</b> {selectedEmployee.shift?.name ?? "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Office:</b> {selectedEmployee.assignedOfficeLocation?.officeName ?? "Default office"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Join date:</b> {selectedEmployee.joinDate ?? "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Exit date:</b> {selectedEmployee.exitDate ?? "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Last login:</b> {selectedEmployee.lastLoginAt ? new Date(selectedEmployee.lastLoginAt).toLocaleString() : "--"}</Typography>
              <Typography sx={{ fontSize: 13 }}><b>Last IP:</b> {selectedEmployee.lastLoginIp ?? "--"}</Typography>
            </>
          ) : null}
        </Box>
      </Drawer>
    </Layout>
  );
}

function employeeStatusColor(status: Employee["status"]): "default" | "success" | "warning" | "error" | "info" {
  if (status === "ACTIVE") return "success";
  if (status === "PROBATION") return "info";
  if (status === "NOTICE_PERIOD") return "warning";
  if (status === "RESIGNED" || status === "INACTIVE") return "error";
  return "default";
}
