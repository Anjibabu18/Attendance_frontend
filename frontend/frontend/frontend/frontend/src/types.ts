export type CompanyRole = { id: number; name: string; photoUrl?: string | null };
export type OfficeLocation = { id: number; officeName?: string | null; latitude: number; longitude: number; radiusMeters: number };
export type Profile = {
  employeeId: number; employeeNumber: string; name: string;
  companyRole?: CompanyRole | null;
  assignedOfficeLocation?: OfficeLocation | null;
  department?: { id: number; name: string } | null;
  shift?: { id: number; name: string; inTime: string; outTime: string; flexible: boolean } | null;
  status?: string; profilePhotoUrl?: string | null; faceRegistered?: boolean;
};
export type Attendance = {
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
export type MonthSummary = { month: string; fromDate: string; toDate: string; workingDays: number; presentDays: number; halfDayDays: number; leaveDays: number; totalWorkedMinutes: number };
export type AttendanceSettings = { defaultInTime: string; defaultOutTime: string; weekendDays: string; fullDayMinutes: number; halfDayMinutes: number; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; overtimeAfterMinutes: number; lateDeductionPerMinute: number; overtimePayPerHour: number; unpaidLeaveDailyRate: number; standardMonthlySalary: number; requireQrForPunch: boolean; permanentOfficeQr: boolean; qrTokenValidityMinutes: number };
export type Payslip = { employeeId: number; employeeName: string; employeeNumber: string; month: string; workingDays: number; presentDays: number; halfDays: number; leaveDays: number; payableDays: number; lateMinutes: number; overtimeMinutes: number; baseSalary: number; dailyRate: number; earnedSalary: number; lateDeduction: number; unpaidLeaveDeduction: number; overtimePay: number; grossPay: number; totalDeductions: number; netPay: number };
export type Holiday = { id: number; date: string; name: string };
export type DailyGroupPhoto = { id: number; date: string; photoUrl: string };
export type LeaveRequest = { id: number; fromDate: string; toDate: string; reason: string; leaveType?: string | null; mailSubject?: string | null; mailMessage?: string | null; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "CANCELLATION_REQUESTED"; createdAt: string; decidedAt?: string | null; decidedBy?: string | null; hrRemarks?: string | null };
export type RegularizationRequest = { id: number; date: string; inTime?: string | null; outTime?: string | null; reason: string; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; hrRemarks?: string | null };
export type WorkRequest = { id: number; type: "WORK_FROM_HOME" | "ON_DUTY"; fromDate: string; toDate: string; reason: string; status: "PENDING" | "MANAGER_RECOMMENDED" | "APPROVED" | "REJECTED"; createdAt?: string; remarks?: string | null; attachmentUrl?: string | null; attachmentName?: string | null };
export type CompOffRequest = { id: number; overtimeDate: string; requestedDate: string; overtimeMinutes: number; reason: string; attachmentUrl?: string | null; attachmentName?: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; hrRemarks?: string | null };
export type BreakEntry = { id: number; startTime: string; endTime?: string | null; durationMinutes?: number | null };
export type PunchPlace = { officeLocation: OfficeLocation; latitude: number; longitude: number; distanceMeters: number; allowedRadiusMeters: number; insideRadius: boolean };
export type DeviceStatus = { deviceId: string; approved: boolean; registered?: boolean };
export type LeaveBalance = { id: number; employeeId: number; employeeName: string; employeeNumber: string; leaveType: string; year: number; allocatedDays: number; usedDays: number; remainingDays: number };


