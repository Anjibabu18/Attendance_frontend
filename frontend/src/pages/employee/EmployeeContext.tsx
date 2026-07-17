import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import dayjs from 'dayjs';
import {
  Profile, Attendance, MonthSummary, AttendanceSettings, Holiday,
  DailyGroupPhoto, LeaveRequest, RegularizationRequest, WorkRequest,
  CompOffRequest, BreakEntry, Payslip, DeviceStatus, LeaveBalance
} from '../../types';

interface EmployeeContextType {
  profile: Profile | null;
  month: string;
  setMonth: (m: string) => void;
  entries: Attendance[];
  monthSummary: MonthSummary | null;
  settings: AttendanceSettings | null;
  holidays: Holiday[];
  dailyPhotos: DailyGroupPhoto[];
  leaveRequests: LeaveRequest[];
  regularizationRequests: RegularizationRequest[];
  workRequests: WorkRequest[];
  compOffRequests: CompOffRequest[];
  breaks: BreakEntry[];
  activeBreak: BreakEntry | null;
  todayEntry: Attendance | null;
  deviceStatus: DeviceStatus | null;
  payslip: Payslip | null;
  leaveBalances: LeaveBalance[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshToday: () => Promise<void>;
  fetchBreaks: () => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [entries, setEntries] = useState<Attendance[]>([]);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dailyPhotos, setDailyPhotos] = useState<DailyGroupPhoto[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  const [breaks, setBreaks] = useState<BreakEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<Attendance | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeBreak = useMemo(() => breaks.find(b => !b.endTime) || null, [breaks]);

  const getDeviceId = () => {
    let id = localStorage.getItem("attendance_device_id_v1");
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("attendance_device_id_v1", id);
    }
    return id;
  };

  const refreshToday = async () => {
    try {
      const [todayRes, breaksRes] = await Promise.allSettled([
        api.get<Attendance | null>('/api/employee/punch/today'),
        api.get<BreakEntry[]>('/api/employee/breaks/today')
      ]);
      if (todayRes.status === 'fulfilled') setTodayEntry(todayRes.value.data);
      if (breaksRes.status === 'fulfilled') setBreaks(breaksRes.value.data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshRequests = async () => {
    try {
      const [lr, rr, wr, cr] = await Promise.all([
        api.get<LeaveRequest[]>('/api/employee/leave-requests'),
        api.get<RegularizationRequest[]>('/api/employee/regularization-requests'),
        api.get<WorkRequest[]>('/api/employee/work-requests'),
        api.get<CompOffRequest[]>('/api/employee/comp-off-requests')
      ]);
      setLeaveRequests(lr.data);
      setRegularizationRequests(rr.data);
      setWorkRequests(wr.data);
      setCompOffRequests(cr.data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    const year = dayjs(`${month}-01`).year();

    const requests = await Promise.allSettled([
      api.get<Profile>('/api/employee/profile'),
      api.get<Attendance[]>('/api/employee/attendance', { params: { month } }),
      api.get<MonthSummary>('/api/employee/attendance/summary', { params: { month } }),
      api.get<AttendanceSettings>('/api/settings/attendance'),
      api.get<Holiday[]>('/api/holidays', { params: { month } }),
      api.get<DailyGroupPhoto[]>('/api/daily-group-photos', { params: { month } }),
      api.get<Payslip>('/api/employee/attendance/payslip', { params: { month } }),
      api.get<DeviceStatus>('/api/account/devices/current', { params: { deviceId: getDeviceId() } }),
      api.get<LeaveBalance[]>('/api/employee/leave-balances', { params: { year } })
    ]);

    const [prof, att, sum, set, hol, dPhotos, ps, dev, balances] = requests;
    const errors = requests
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason?.response?.data?.error || result.reason?.message || 'Request failed');

    if (prof.status === 'fulfilled') setProfile(prof.value.data);
    if (att.status === 'fulfilled') setEntries(att.value.data);
    if (sum.status === 'fulfilled') setMonthSummary(sum.value.data);
    if (set.status === 'fulfilled') setSettings(set.value.data);
    if (hol.status === 'fulfilled') setHolidays(hol.value.data);
    if (dPhotos.status === 'fulfilled') setDailyPhotos(dPhotos.value.data);
    setPayslip(ps.status === 'fulfilled' ? ps.value.data : null);
    setDeviceStatus(dev.status === 'fulfilled' ? dev.value.data : null);
    setLeaveBalances(balances.status === 'fulfilled' ? balances.value.data : []);

    if (errors.length && prof.status !== 'fulfilled' && att.status !== 'fulfilled') {
      setError(errors[0]);
    }
    setLoading(false);
    void Promise.allSettled([refreshToday(), refreshRequests()]);
  };

  useEffect(() => {
    refreshData();
  }, [month]);

  return (
    <EmployeeContext.Provider value={{
      profile, month, setMonth, entries, monthSummary, settings, holidays,
      dailyPhotos, leaveRequests, regularizationRequests, workRequests,
      compOffRequests, breaks, activeBreak, todayEntry, deviceStatus, payslip, leaveBalances,
      loading, error, refreshData, refreshToday, fetchBreaks: refreshToday, refreshRequests
    }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}



