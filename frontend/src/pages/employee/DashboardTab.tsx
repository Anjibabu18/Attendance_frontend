import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import WorkHistoryRoundedIcon from '@mui/icons-material/WorkHistoryRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import NightlightRoundedIcon from '@mui/icons-material/NightlightRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import dayjs from 'dayjs';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

import { api } from '../../api/client';
import { Attendance } from '../../types';
import { useEmployee } from './EmployeeContext';
import { PunchOverlay } from './PunchOverlay';
import { LiveGeofenceRadar } from '../../components/LiveGeofenceRadar';
import { SmartAttendanceInsights } from '../../components/SmartAttendanceInsights';
import { WeeklyRosterCard } from '../../components/WeeklyRosterCard';
import { OfficeFloorMap } from '../../components/OfficeFloorMap';
import { AttendanceBadgesLeague } from '../../components/AttendanceBadgesLeague';
import { SmartCommuteWidget } from '../../components/SmartCommuteWidget';
import { SlackPresenceSyncCard } from '../../components/SlackPresenceSyncCard';
import { PeerKudosWall } from '../../components/PeerKudosWall';
import { VoicePunchAssistant } from '../../components/VoicePunchAssistant';
import { useThemeContext } from '../../theme/ThemeContext';
import { useToast } from '../../components/Toast';
import { scheduleEveningPunchOutReminder, triggerDirectNotification } from '../../utils/pushNotifications';
import { hapticPop, hapticSuccess, hapticTap } from '../../utils/haptics';

const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
};

function dateKey(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
}

function parseTimeValue(value?: string | null) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const timeOnly = /^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed);
  const normalized = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
  const parsed = timeOnly ? dayjs(`2000-01-01T${normalized}`) : dayjs(trimmed);
  return parsed.isValid() ? parsed : null;
}

function SlideToPunchButton({ type, onTrigger, urgent }: { type: 'in' | 'out', onTrigger: () => void, urgent?: boolean }) {
  const isDark = useThemeContext().mode === 'dark';
  const bg = type === 'in' ? '#22c55e' : '#ef4444';
  const containerRef = React.useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const handleDragEnd = (event: any, info: any) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const threshold = containerWidth * 0.65; // 65% across to trigger
    
    if (info.offset.x >= threshold) {
      hapticSuccess();
      onTrigger();
      // Snap back instantly so it's ready when the modal closes
      controls.start({ x: 0, transition: { duration: 0 } });
    } else {
      hapticPop();
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '56px',
        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        boxShadow: urgent ? `0 0 25px ${bg}60, inset 0 2px 4px rgba(0,0,0,0.1)` : `inset 0 2px 4px rgba(0,0,0,0.1)`,
        border: urgent ? `2px solid ${bg}` : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        animation: urgent ? 'pulse-border 2s infinite' : 'none',
        '@keyframes pulse-border': {
          '0%': { boxShadow: `0 0 10px ${bg}40, inset 0 2px 4px rgba(0,0,0,0.1)` },
          '50%': { boxShadow: `0 0 35px ${bg}80, inset 0 2px 4px rgba(0,0,0,0.1)` },
          '100%': { boxShadow: `0 0 10px ${bg}40, inset 0 2px 4px rgba(0,0,0,0.1)` }
        }
      }}
    >
      <Typography sx={{ 
        position: 'absolute', width: '100%', textAlign: 'center', 
        fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
        zIndex: 0, pointerEvents: 'none', userSelect: 'none',
        pl: 5 // offset for the knob
      }}>
        SLIDE TO PUNCH {type === 'in' ? 'IN' : 'OUT'} &gt;&gt;
      </Typography>

      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragSnapToOrigin={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ zIndex: 1, position: 'absolute' }}
      >
        <Box sx={{
          width: '56px', height: '56px', borderRadius: '28px',
          bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          boxShadow: urgent ? `0 0 20px ${bg}` : `0 4px 15px ${bg}60`, 
          cursor: 'grab', '&:active': { cursor: 'grabbing' },
          animation: urgent ? 'pulse-knob 2s infinite' : 'none',
          '@keyframes pulse-knob': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' }
          }
        }}>
          {type === 'in' ? <LoginRoundedIcon /> : <LogoutRoundedIcon />}
        </Box>
      </motion.div>
    </Box>
  );
}

function timeLabel(value?: string | null) {
  const parsed = parseTimeValue(value);
  return parsed ? parsed.format('hh:mm A') : '--:--';
}
function minutesLabel(minutes?: number | null) {
  const total = Math.max(0, minutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function secondsLabel(seconds: number) {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s };
}

function sessionDateTime(entry: Attendance, timeValue?: string | null) {
  const parsedTime = parseTimeValue(timeValue);
  if (!parsedTime) return null;
  const date = dateKey(entry.date);
  const parsed = dayjs(`${date}T${parsedTime.format('HH:mm:ss')}`);
  return parsed.isValid() ? parsed : null;
}

// Circular progress ring SVG component
function CircularProgress({ progress, size = 220, strokeWidth = 14, isOvertime = false, children }: {
  progress: number; size?: number; strokeWidth?: number; isOvertime?: boolean; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isOvertime ? "#f59e0b" : "#38bdf8"} />
            <stop offset="50%" stopColor={isOvertime ? "#f97316" : "#818cf8"} />
            <stop offset="100%" stopColor={isOvertime ? "#ef4444" : "#22c55e"} />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          filter="url(#ring-glow)"
        />
      </svg>
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {children}
      </Box>
    </Box>
  );
}

function HeroClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
        {dayjs(time).format('dddd, DD MMMM YYYY')}
      </Typography>
      <Typography sx={{ fontWeight: 900, fontSize: { xs: 32, md: 48 }, lineHeight: 1.1, color: '#f8fafc', mb: 0.5, letterSpacing: '-0.02em' }}>
        {dayjs(time).format('hh:mm:ss A')}
      </Typography>
    </>
  );
}

export function DashboardTab() {
  const {
    profile, todayEntry, settings, monthSummary, entries, leaveBalances,
    activeBreak, breaks, fetchBreaks, month, deviceStatus, refreshData,
    payslip, refreshToday, refreshRequests
  } = useEmployee();
  const { toastSuccess, toastError } = useToast();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [punchOpen, setPunchOpen] = useState(false);
  const [punchKind, setPunchKind] = useState<'checkin' | 'checkout'>('checkin');
  const [breakBusy, setBreakBusy] = useState(false);
  const [breakError, setBreakError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streaks, setStreaks] = useState<{ currentStreak: number; longestStreak: number; punctualityScore: number; badges: string[]; totalOnTime: number; totalDays: number } | null>(null);

  // #6 Quick Leave for Today
  const [quickLeaveOpen, setQuickLeaveOpen] = useState(false);
  const [quickLeaveType, setQuickLeaveType] = useState('CASUAL_LEAVE');
  const [quickLeaveReason, setQuickLeaveReason] = useState('Personal work');
  const [quickLeaveBusy, setQuickLeaveBusy] = useState(false);

  const handleApplyQuickLeave = async () => {
    setQuickLeaveBusy(true);
    try {
      const todayStr = dayjs().format('YYYY-MM-DD');
      await api.post('/api/employee/leave-requests', {
        fromDate: todayStr,
        toDate: todayStr,
        leaveType: quickLeaveType,
        reason: quickLeaveReason.trim() || 'Quick leave applied for today',
        mailSubject: `Leave request for today (${todayStr})`,
        mailMessage: quickLeaveReason.trim() || 'Quick leave applied for today',
      });
      toastSuccess('Quick leave submitted for today!');
      setQuickLeaveOpen(false);
      await refreshRequests();
    } catch (err: any) {
      toastError(err?.response?.data?.error || 'Failed to submit quick leave');
    } finally {
      setQuickLeaveBusy(false);
    }
  };

  // #20 Auto-refresh on focus
  useEffect(() => {
    const onFocus = () => { refreshToday(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshToday]);

  // #2 Evening Punch-Out Reminder
  useEffect(() => {
    if (!todayEntry?.inTime || todayEntry?.outTime) return;
    const expectedOut = settings?.defaultOutTime?.slice(0, 5) || '18:00';
    const timerId = scheduleEveningPunchOutReminder(expectedOut, profile?.name);
    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [todayEntry, settings, profile]);

  const handleTestEveningNotification = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      if (res !== 'granted') {
        toastError('Please allow notifications in browser permissions.');
        return;
      }
    }
    const fired = triggerDirectNotification(
      '🔔 Evening Punch-Out Reminder',
      `Hi ${profile?.name?.split(' ')[0] || 'there'}! It's almost time to leave. Don't forget to clock out!`
    );
    if (fired) {
      toastSuccess('Notification fired! Check your screen/banner.');
    } else {
      toastSuccess('Reminder active! Notification will appear at expected out time.');
    }
  };

  useEffect(() => {
    api.get('/api/employee/streaks').then(r => setStreaks(r.data)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!todayEntry?.inTime) { setElapsedSeconds(0); return; }
    const updateTimer = () => {
      const inDateTime = sessionDateTime(todayEntry, todayEntry.inTime);
      if (!inDateTime) return;
      const outDateTime = sessionDateTime(todayEntry, todayEntry.outTime);
      const endMs = outDateTime ? outDateTime.valueOf() : Date.now();
      const breakMs = breaks.reduce((sum, item) => {
        const start = item.startTime ? dayjs(item.startTime).valueOf() : 0;
        const end = item.endTime ? dayjs(item.endTime).valueOf() : endMs;
        return sum + Math.max(0, end - start);
      }, 0);
      setElapsedSeconds(Math.max(0, Math.floor((endMs - inDateTime.valueOf() - breakMs) / 1000)));
    };
    updateTimer();
    if (!todayEntry.outTime) {
      const interval = window.setInterval(updateTimer, 1000);
      return () => window.clearInterval(interval);
    }
  }, [todayEntry, breaks]);


  const openPunch = (kind: 'checkin' | 'checkout') => { setPunchKind(kind); setPunchOpen(true); };

  const runBreakAction = async (endpoint: string) => {
    setBreakBusy(true); setBreakError(null);
    try { await api.post(endpoint); await fetchBreaks(); }
    catch (err: any) { setBreakError(err?.response?.data?.error || 'Break action failed.'); }
    finally { setBreakBusy(false); }
  };

  const totalOvertime = entries.reduce((sum, item) => sum + (item.overtimeMinutes || 0), 0);
  const totalLate = entries.reduce((sum, item) => sum + (item.lateMinutes || 0), 0);
  const totalLeaveBalance = leaveBalances.reduce((sum, item) => sum + (item.remainingDays || 0), 0);
  const targetMinutes = settings?.fullDayMinutes || 480;
  const rawProgress = targetMinutes ? Math.round((elapsedSeconds / 60 / targetMinutes) * 100) : 0;
  const progress = Math.min(100, rawProgress);
  const isOvertime = rawProgress > 100;
  const overtimeSeconds = isOvertime ? elapsedSeconds - (targetMinutes * 60) : 0;
  const ot = secondsLabel(overtimeSeconds);
  const recentEntries = useMemo(() => [...entries].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 5), [entries]);

  // #7 Weekly trend (last 7 working days)
  const weeklyTrend = useMemo(() => {
    return [...entries]
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
      .slice(0, 7)
      .reverse()
      .map((e) => ({ date: e.date, day: dayjs(e.date).format('ddd'), worked: e.workedMinutes ?? 0, status: e.status }));
  }, [entries]);
  const maxWorkedInWeek = useMemo(() => Math.max(...weeklyTrend.map((d) => d.worked), targetMinutes), [weeklyTrend, targetMinutes]);

  // #4 Salary Preview
  const salaryPreview = useMemo(() => {
    if (!payslip) return null;
    return payslip;
  }, [payslip]);

  // #8 Attendance Rank — attendance % compared to full attendance
  const attendancePct = monthSummary && monthSummary.workingDays > 0
    ? Math.round((monthSummary.presentDays / monthSummary.workingDays) * 100)
    : null;
  const rankLabel = attendancePct != null
    ? attendancePct >= 95 ? '🏆 Top 5%' : attendancePct >= 85 ? '⭐ Top 15%' : attendancePct >= 75 ? '✅ Good' : '⚠️ Needs Improvement'
    : null;

  const clockedIn = !!todayEntry?.inTime && !todayEntry?.outTime;
  const completed = !!todayEntry?.outTime;
  const greetingName = profile?.name?.split(' ')[0] || 'there';
  const { h, m, s } = secondsLabel(elapsedSeconds);

  const hour = new Date().getHours();
  let dynamicGreeting = 'Good evening 🌙';
  if (hour < 12) dynamicGreeting = 'Good morning ☕';
  else if (hour < 17) dynamicGreeting = 'Good afternoon ☀️';

  const shiftInTime = profile?.shift?.inTime?.slice(0, 5) || settings?.defaultInTime?.slice(0, 5) || '09:00';
  const shiftOutTime = profile?.shift?.outTime?.slice(0, 5) || settings?.defaultOutTime?.slice(0, 5) || '18:00';

  const shiftRemainingText = useMemo(() => {
    if (!todayEntry?.inTime || todayEntry?.outTime) return null;
    const inMoment = parseTimeValue(todayEntry.inTime);
    if (!inMoment) return null;
    const targetEnd = inMoment.add(targetMinutes || 480, 'minute');
    const now = dayjs();
    const diffSec = targetEnd.diff(now, 'second');
    if (diffSec <= 0) return null;
    const remH = Math.floor(diffSec / 3600);
    const remM = Math.floor((diffSec % 3600) / 60);
    return `${remH > 0 ? `${remH}h ` : ''}${remM}m left · Target ~${targetEnd.format('hh:mm A')}`;
  }, [todayEntry, targetMinutes, elapsedSeconds]);

  const daysRemaining = useMemo(() => {
    const end = dayjs(`${month}-01`).endOf('month');
    return Math.max(0, end.diff(dayjs(), 'day'));
  }, [month]);

  const statCards = [
    { label: 'This month', value: `${monthSummary?.presentDays || 0}/${monthSummary?.workingDays || 0}`, helper: `Present days · ${daysRemaining}d left`, icon: <CalendarTodayRoundedIcon />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Worked', value: minutesLabel(monthSummary?.totalWorkedMinutes), helper: dayjs(`${month}-01`).format('MMM YYYY'), icon: <WorkHistoryRoundedIcon />, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
    { label: 'Overtime', value: minutesLabel(totalOvertime), helper: 'Approved payroll input', icon: <TrendingUpRoundedIcon />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Leave balance', value: `${totalLeaveBalance}d`, helper: `${leaveBalances.length} leave types`, icon: <WalletRoundedIcon />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ];

  const glassCard = {
    background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
    borderRadius: '24px',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(15,23,42,0.06)',
    transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: isDark ? '0 20px 48px rgba(56,189,248,0.12)' : '0 20px 48px rgba(37,99,235,0.1)',
    },
  };

  return (
    <MotionBox variants={containerVariants} initial="hidden" animate="visible" sx={{ display: 'grid', gap: 2.5 }}>

      {/* ── Device Not Registered Banner ── */}
      {!deviceStatus?.registered && (
        <MotionBox
          variants={itemVariants}
          component={motion.div}
          animate={{ borderColor: ['#ef4444', '#f97316', '#ef4444'] }}
          transition={{ duration: 2, repeat: Infinity }}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(249,115,22,0.08) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            display: 'flex', flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between', gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 950, color: '#ef4444', fontSize: { xs: 18, md: 22 }, mb: 0.5 }}>
              🔐 Device Not Registered
            </Typography>
            <Typography sx={{ color: isDark ? '#fca5a5' : '#7f1d1d', fontSize: 14, maxWidth: 500 }}>
              Register this device to enable Punch In/Out. Pending admin approval.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="large"
            sx={{ fontWeight: 900, py: 1.5, px: 4, borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
            onClick={async () => {
              const deviceId = localStorage.getItem('attendance_device_id_v1') || 'unknown';
              let label = navigator.userAgent;
              if (label.includes('iPhone')) label = 'Apple iPhone';
              else if (label.includes('Android')) label = 'Android Phone';
              else if (label.includes('Windows')) label = 'Windows PC';
              else if (label.includes('Mac')) label = 'Macbook';
              else label = 'Mobile Device';
              try {
                await api.post('/api/account/devices/register', { deviceId, label });
                alert('Device registered! Awaiting Admin approval.');
                await refreshData();
              } catch (e: any) { alert(e.response?.data?.error || e.message); }
            }}
          >
            Register This Device
          </Button>
        </MotionBox>
      )}

      {/* ── Hero Shift Card ── */}
      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.6fr' }, gap: 2.5 }}>

        {/* Left: Main shift card */}
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} glareEnable={true} glareMaxOpacity={0.12} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{
          ...glassCard,
          background: isDark
            ? 'linear-gradient(135deg, #0f2040 0%, #0a1628 100%)'
            : 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          p: { xs: 2.5, md: 3.5 },
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow orbs */}
          <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
            <Box>
              <HeroClock />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: 18, md: 20 }, fontWeight: 600 }}>
                  {dynamicGreeting}, {greetingName}
                </Typography>
                {rankLabel && (
                  <Chip
                    label={rankLabel}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: 11,
                      bgcolor: 'rgba(255,255,255,0.18)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.28)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                )}
              </Box>

              {/* Shift Countdown Pill */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {clockedIn ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '20px',
                      background: isOvertime
                        ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)'
                        : 'linear-gradient(90deg, rgba(56, 189, 248, 0.25) 0%, rgba(34, 197, 94, 0.25) 100%)',
                      border: `1px solid ${isOvertime ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.4)'}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: isOvertime ? '#f59e0b' : '#38bdf8',
                        boxShadow: isOvertime ? '0 0 8px #f59e0b' : '0 0 8px #38bdf8',
                      }}
                    />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: 12 }}>
                      {isOvertime
                        ? `Overtime Active: +${ot.h}h ${ot.m}m ⚡`
                        : shiftRemainingText || 'Shift in progress'}
                    </Typography>
                  </Box>
                ) : completed ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '20px',
                      bgcolor: 'rgba(255,255,255,0.14)',
                      border: '1px solid rgba(255,255,255,0.22)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#93c5fd' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: 12 }}>
                      Shift Complete · {minutesLabel(todayEntry?.workedMinutes)}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '20px',
                      bgcolor: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <AccessTimeRoundedIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: 12 }}>
                      Shift: {shiftInTime} – {shiftOutTime}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box
              component={motion.div}
              animate={clockedIn ? { boxShadow: ['0 0 0 0 rgba(34,197,94,0.4)', '0 0 0 12px rgba(34,197,94,0)', '0 0 0 0 rgba(34,197,94,0)'] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              sx={{ borderRadius: '50%' }}
            >
              <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 56, height: 56, border: '3px solid rgba(255,255,255,0.2)' }} />
            </Box>
          </Box>

          {/* Status indicator & Quick Leave action */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component={motion.div}
                animate={{ scale: clockedIn ? [1, 1.3, 1] : 1, opacity: clockedIn ? [0.7, 1, 0.7] : 1 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: clockedIn ? '#22c55e' : completed ? '#93c5fd' : '#64748b' }}
              />
              <Typography sx={{ fontWeight: 800, color: '#f8fafc', fontSize: 15 }}>
                {clockedIn ? `Clocked in at ${timeLabel(todayEntry?.inTime)}` : completed ? `Shift completed · In: ${timeLabel(todayEntry?.inTime)}` : 'Not clocked in'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VoicePunchAssistant
                onTriggerPunch={(kind) => openPunch(kind === 'in' ? 'checkin' : 'checkout')}
                onTriggerBreak={() => runBreakAction(activeBreak ? '/api/employee/breaks/end' : '/api/employee/breaks/start')}
                onOpenKiosk={() => { window.location.href = '/kiosk'; }}
              />
              {!clockedIn && !completed && (
                <MotionButton
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setQuickLeaveOpen(true)}
                  size="small"
                  startIcon={<FlashOnRoundedIcon sx={{ fontSize: '15px !important' }} />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.14)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: 12,
                    px: 1.5,
                    py: 0.5,
                    border: '1px solid rgba(255,255,255,0.22)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                    textTransform: 'none',
                  }}
                >
                  Quick Leave Today
                </MotionButton>
              )}
            </Box>
          </Box>

          {/* Circular timer + buttons row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>

            {/* Circular progress ring */}
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <CircularProgress progress={progress} size={190} strokeWidth={13} isOvertime={isOvertime}>
                <Box sx={{ textAlign: 'center' }}>
                  {todayEntry?.inTime ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.3 }}>
                        <Typography
                          component={motion.div}
                          key={h}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          sx={{ fontWeight: 900, fontSize: 32, fontFamily: 'monospace', color: '#f8fafc', lineHeight: 1 }}
                        >
                          {String(h).padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 20, fontWeight: 700 }}>h</Typography>
                        <Typography
                          component={motion.div}
                          key={m}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          sx={{ fontWeight: 900, fontSize: 32, fontFamily: 'monospace', color: '#f8fafc', lineHeight: 1 }}
                        >
                          {String(m).padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 20, fontWeight: 700 }}>m</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.3 }}>
                        <Typography
                          component={motion.div}
                          key={s}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          sx={{ fontWeight: 900, fontSize: 20, fontFamily: 'monospace', color: '#38bdf8', lineHeight: 1.2 }}
                        >
                          {String(s).padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>s</Typography>
                      </Box>
                      <Typography sx={{ color: isOvertime ? '#f59e0b' : 'rgba(148,163,184,0.6)', fontSize: 11, mt: 0.5, fontWeight: 600 }}>
                        {isOvertime ? `Overtime: ${ot.h}h ${ot.m}m` : `${progress}% of target`}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ fontWeight: 900, fontSize: 28, color: '#64748b', fontFamily: 'monospace' }}>--:--</Typography>
                      <Typography sx={{ color: 'rgba(148,163,184,0.5)', fontSize: 11, mt: 0.5 }}>Not started</Typography>
                    </>
                  )}
                </Box>
              </CircularProgress>
            </Box>

            {/* Right side: target info + buttons */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Target progress bar */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ color: 'rgba(148,163,184,0.7)', fontSize: 12, fontWeight: 700 }}>
                    Target: {targetMinutes ? minutesLabel(targetMinutes) : '--'}
                  </Typography>
                  <Typography sx={{ color: isOvertime ? '#f59e0b' : '#38bdf8', fontSize: 12, fontWeight: 800 }}>
                    {isOvertime ? `${rawProgress}% (OT)` : `${progress}%`}
                  </Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 3, background: isOvertime ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #818cf8, #22c55e)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </Box>
              </Box>

              {/* Today's punch times & OT */}
              <Box sx={{ display: 'grid', gridTemplateColumns: isOvertime ? '1fr 1fr 1fr' : '1fr 1fr', gap: 1 }}>
                {[
                  { label: 'In', value: timeLabel(todayEntry?.inTime), color: '#22c55e' },
                  { label: 'Out', value: timeLabel(todayEntry?.outTime), color: '#ef4444' },
                  ...(isOvertime ? [{ label: 'OT', value: `${ot.h}h ${ot.m}m`, color: '#f59e0b' }] : []),
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '12px', p: 1.25, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 17, color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {!todayEntry?.inTime ? (
                  <SlideToPunchButton type="in" onTrigger={() => openPunch('checkin')} />
                ) : !todayEntry.outTime ? (
                  <SlideToPunchButton type="out" onTrigger={() => openPunch('checkout')} urgent={progress >= 95} />
                ) : (
                  <Button disabled variant="contained" sx={{ borderRadius: '28px', py: 1.6, fontWeight: 900, width: '100%', fontSize: 16 }}>Completed 🎉</Button>
                )}

                {activeBreak ? (
                  <MotionButton
                    whileTap={{ scale: 0.97 }}
                    onClick={() => runBreakAction('/api/employee/breaks/end')}
                    disabled={breakBusy}
                    variant="contained"
                    startIcon={<PlayArrowRoundedIcon />}
                    sx={{ bgcolor: '#f59e0b', color: 'white', borderRadius: '12px', py: 1.4, fontWeight: 900, boxShadow: '0 8px 20px rgba(245,158,11,0.4)', '&:hover': { bgcolor: '#d97706' } }}
                  >
                    Resume
                  </MotionButton>
                ) : (
                  <MotionButton
                    whileTap={clockedIn ? { scale: 0.97 } : {}}
                    onClick={() => runBreakAction('/api/employee/breaks/start')}
                    disabled={breakBusy || !clockedIn}
                    variant="contained"
                    startIcon={<FreeBreakfastRoundedIcon />}
                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', borderRadius: '12px', py: 1.4, fontWeight: 900, border: '1px solid rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' } }}
                  >
                    Break
                  </MotionButton>
                )}
              </Box>

              {breakError && <Alert severity="warning" sx={{ borderRadius: '10px', py: 0.5 }}>{breakError}</Alert>}
            </Box>
          </Box>
        </Box>
        </Tilt>

        {/* Right: Today Details card */}
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} glareEnable={true} glareMaxOpacity={0.1} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ ...glassCard, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Today Details</Typography>

          {[
            { label: 'Punch In', value: timeLabel(todayEntry?.inTime), color: '#22c55e', icon: '🟢' },
            { label: 'Punch Out', value: timeLabel(todayEntry?.outTime), color: '#ef4444', icon: '🔴' },
            { label: 'Late', value: minutesLabel(todayEntry?.lateMinutes), color: '#f59e0b', icon: '⏰' },
            { label: 'Overtime', value: minutesLabel(todayEntry?.overtimeMinutes), color: '#818cf8', icon: '⚡' },
          ].map(({ label, value, color, icon }, i) => (
            <MotionBox
              key={label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                p: 1.5, borderRadius: '12px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 16 }}>{icon}</Typography>
                <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 13 }}>{label}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: 15, color, fontFamily: 'monospace' }}>{value}</Typography>
            </MotionBox>
          ))}

          {/* Break status */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px', mt: 'auto',
            background: activeBreak ? 'rgba(245,158,11,0.12)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
            border: `1px solid ${activeBreak ? 'rgba(245,158,11,0.3)' : 'transparent'}`,
          }}>
            <AccessTimeRoundedIcon sx={{ color: activeBreak ? '#f59e0b' : 'text.disabled', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: activeBreak ? '#f59e0b' : 'text.secondary' }}>
              {activeBreak ? 'Break is currently active' : 'No active break'}
            </Typography>
          </Box>
        </Box>
        </Tilt>
      </MotionBox>

      {/* ── Live Office Geofence Radar ── */}
      <MotionBox variants={itemVariants}>
        <LiveGeofenceRadar assignedOffice={profile?.assignedOfficeLocation} />
      </MotionBox>

      {/* ── Smart Commute & Transit Assistant ── */}
      <MotionBox variants={itemVariants}>
        <SmartCommuteWidget
          officeName={profile?.assignedOfficeLocation?.officeName || 'HQ Tech Park, Tower A'}
          shiftStartTime={settings?.defaultInTime || '09:00 AM'}
        />
      </MotionBox>

      {/* ── TODAY'S WORK CARD (appears after check-in) ── */}
      {todayEntry?.inTime && (
        <MotionBox
          variants={itemVariants}
          sx={{
            borderRadius: '20px',
            p: { xs: 2, md: 2.5 },
            background: isDark
              ? 'linear-gradient(135deg, rgba(15,40,80,0.85) 0%, rgba(10,22,50,0.95) 100%)'
              : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: `1px solid ${isDark ? 'rgba(56,189,248,0.18)' : 'rgba(37,99,235,0.12)'}`,
            boxShadow: isDark ? '0 8px 32px rgba(56,189,248,0.08)' : '0 8px 32px rgba(37,99,235,0.07)',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {todayEntry.outTime ? (
                <CheckCircleRoundedIcon sx={{ color: '#22c55e', fontSize: 28 }} />
              ) : (
                <TimerRoundedIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
              )}
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 16, md: 18 } }}>
                  {todayEntry.outTime ? 'Shift Completed ✅' : "Today's Work in Progress"}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                  {dayjs().format('dddd, DD MMM YYYY')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {(todayEntry.lateMinutes ?? 0) > 0 && (
                <Chip
                  size="small"
                  icon={<WarningAmberRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label={`Late ${minutesLabel(todayEntry.lateMinutes)}`}
                  sx={{ fontWeight: 900, fontSize: 11, bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}
                />
              )}
              {isOvertime && (
                <Chip
                  size="small"
                  label={`OT +${ot.h}h ${ot.m}m`}
                  sx={{ fontWeight: 900, fontSize: 11, bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}
                />
              )}
            </Box>
          </Box>

          {/* Progress bar */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary' }}>
                {!todayEntry.outTime ? `Working: ${h}h ${m}m ${s}s` : `Worked: ${minutesLabel(todayEntry.workedMinutes)}`}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: isOvertime ? '#22c55e' : '#38bdf8' }}>
                {isOvertime ? '100% + Overtime' : `${progress}% of ${minutesLabel(targetMinutes)}`}
              </Typography>
            </Box>
            <Box sx={{ height: 10, borderRadius: 5, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#e0f2fe', overflow: 'hidden', position: 'relative' }}>
              <MotionBox
                component="div"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                sx={{
                  height: '100%', borderRadius: 5,
                  background: isOvertime
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : progress >= 75
                    ? 'linear-gradient(90deg, #38bdf8, #22c55e)'
                    : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600 }}>In: {timeLabel(todayEntry.inTime)}</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 600 }}>
                Target: {settings?.defaultOutTime?.substring(0,5) ?? '--:--'}
              </Typography>
            </Box>
          </Box>

          {/* Stats grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25, mb: 2 }}>
            {[
              {
                icon: <WbSunnyRoundedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />,
                label: 'In Time',
                value: timeLabel(todayEntry.inTime),
                color: '#22c55e',
              },
              {
                icon: <NightlightRoundedIcon sx={{ fontSize: 18, color: '#818cf8' }} />,
                label: todayEntry.outTime ? 'Out Time' : 'Expected Out',
                value: todayEntry.outTime
                  ? timeLabel(todayEntry.outTime)
                  : settings?.defaultOutTime?.substring(0, 5) ?? '--:--',
                color: todayEntry.outTime ? '#ef4444' : '#64748b',
              },
              {
                icon: <TimerRoundedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />,
                label: todayEntry.outTime ? 'Total Worked' : 'Worked So Far',
                value: todayEntry.outTime ? minutesLabel(todayEntry.workedMinutes) : `${h}h ${m}m`,
                color: '#38bdf8',
              },
            ].map((item, i) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.5, borderRadius: '14px', textAlign: 'center',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.1)'}`,
                }}
              >
                {item.icon}
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 14, md: 16 }, color: item.color, fontFamily: 'monospace', lineHeight: 1.2, mt: 0.5 }}>{item.value}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 700, mt: 0.25 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Remaining time / done message */}
          {!todayEntry.outTime ? (
            (() => {
              const outTimeStr = settings?.defaultOutTime?.substring(0, 5) ?? '18:00';
              const expectedOutDt = dayjs(`${dayjs().format('YYYY-MM-DD')}T${outTimeStr}`);
              const now = dayjs();
              const remainingMin = expectedOutDt.diff(now, 'minute');
              const isEvening = now.hour() >= 17; // after 5 PM
              const isNearEnd = remainingMin > 0 && remainingMin <= 60;

              if (remainingMin <= 0) {
                return (
                  <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleRoundedIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#16a34a' }}>Full day target reached! You can punch out anytime. 🎉</Typography>
                  </Box>
                );
              }

              return (
                <Box sx={{
                  p: 1.5, borderRadius: '12px',
                  bgcolor: isEvening ? 'rgba(245,158,11,0.1)' : 'rgba(56,189,248,0.08)',
                  border: `1px solid ${isEvening ? 'rgba(245,158,11,0.25)' : 'rgba(56,189,248,0.15)'}`,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  {isEvening
                    ? <NightlightRoundedIcon sx={{ color: '#d97706', fontSize: 18 }} />
                    : <TimerRoundedIcon sx={{ color: '#38bdf8', fontSize: 18 }} />}
                  <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: isEvening ? '#92400e' : 'text.secondary' }}>
                    {isNearEnd
                      ? `⏰ Almost time to leave — ${remainingMin}m remaining to expected checkout (${outTimeStr})`
                      : isEvening
                      ? `🌙 Evening check — ${Math.floor(remainingMin / 60)}h ${remainingMin % 60}m to expected out (${outTimeStr})`
                      : `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}m remaining to reach target (${outTimeStr})`
                    }
                  </Typography>
                </Box>
              );
            })()
          ) : (
            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <CheckCircleRoundedIcon sx={{ color: '#22c55e' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: '#15803d' }}>Shift complete! Great work today 🎉</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                  {timeLabel(todayEntry.inTime)} → {timeLabel(todayEntry.outTime)} · {minutesLabel(todayEntry.workedMinutes)} worked
                  {(todayEntry.lateMinutes ?? 0) > 0 ? ` · Late ${minutesLabel(todayEntry.lateMinutes)}` : ''}
                  {(todayEntry.overtimeMinutes ?? 0) > 0 ? ` · OT ${minutesLabel(todayEntry.overtimeMinutes)}` : ''}
                </Typography>
              </Box>
            </Box>
          )}

          {/* #2 Evening Punch-Out Reminder interactive control */}
          {!todayEntry.outTime && (
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 1, mt: 1.5, pt: 1.5,
              borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<NotificationsActiveRoundedIcon sx={{ fontSize: '15px !important', color: '#f59e0b !important' }} />}
                  label={`Evening Reminder: ${settings?.defaultOutTime?.slice(0, 5) || '18:00'}`}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: 11, bgcolor: 'rgba(245,158,11,0.12)', color: '#d97706' }}
                />
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                  Active · Browser will alert you when shift ends
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={handleTestEveningNotification}
                sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none', color: '#38bdf8' }}
              >
                Test Alert 🔔
              </Button>
            </Box>
          )}
        </MotionBox>
      )}

      {/* ── Weekly Work Schedule & Roster ── */}
      <MotionBox variants={itemVariants}>
        <WeeklyRosterCard profile={profile} weekendDays={settings?.weekendDays} />
      </MotionBox>

      {/* ── WorkTrack Intelligence & Wellness ── */}
      <MotionBox variants={itemVariants}>
        <SmartAttendanceInsights
          entries={entries}
          monthSummary={monthSummary}
          settings={settings}
        />
      </MotionBox>

      {/* ── Gamified Badges & Division League ── */}
      <MotionBox variants={itemVariants}>
        <AttendanceBadgesLeague />
      </MotionBox>

      {/* ── Stat Cards ── */}
      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {statCards.map((item, i) => (
          <Tilt key={item.label} tiltMaxAngleX={8} tiltMaxAngleY={8} glareEnable={true} glareMaxOpacity={0.1} glareBorderRadius="16px" scale={1.03} transitionSpeed={400} style={{ display: 'flex', flexDirection: 'column' }}>
          <MotionBox
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            sx={{ ...glassCard, p: 2, cursor: 'default' }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                {item.icon}
              </Box>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, md: 28 }, color: item.color, lineHeight: 1 }}>{item.value}</Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: 12, mt: 0.5, fontWeight: 600 }}>{item.helper}</Typography>
          </MotionBox>
          </Tilt>
        ))}
      </MotionBox>

      {/* ── Insights: Weekly Work Trend & Salary Preview ── */}
      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: payslip ? '1.1fr 0.9fr' : '1fr' }, gap: 2.5 }}>

        {/* Weekly Work Trend (#7) */}
        <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable={true} glareMaxOpacity={0.06} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ ...glassCard, p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpRoundedIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
                <Typography sx={{ fontWeight: 900, fontSize: 17 }}>Weekly Work Trend</Typography>
              </Box>
              <Chip
                label={`Target: ${minutesLabel(targetMinutes)}/day`}
                size="small"
                sx={{ fontWeight: 700, fontSize: 11, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
              />
            </Box>

            {weeklyTrend.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 3, textAlign: 'center' }}>
                No recent work history to chart yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 1, height: 130, pt: 1, px: 1 }}>
                {weeklyTrend.map((d) => {
                  const heightPct = Math.min(100, Math.round((d.worked / (maxWorkedInWeek || 480)) * 100));
                  const isTargetMet = d.worked >= targetMinutes;
                  const barColor = isTargetMet ? '#22c55e' : d.worked > 0 ? '#38bdf8' : 'rgba(148,163,184,0.3)';
                  return (
                    <Box key={d.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                        {d.worked ? `${Math.round(d.worked / 60)}h` : '-'}
                      </Typography>
                      <Box sx={{ width: '100%', maxWidth: 32, flex: 1, display: 'flex', alignItems: 'flex-end', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: '6px', p: '2px' }}>
                        <MotionBox
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(10, heightPct)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          sx={{
                            width: '100%',
                            bgcolor: barColor,
                            borderRadius: '4px',
                            boxShadow: isTargetMet ? '0 2px 8px rgba(34,197,94,0.35)' : undefined,
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, mt: 0.75, color: d.date === dayjs().format('YYYY-MM-DD') ? '#38bdf8' : 'text.secondary' }}>
                        {d.day}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Tilt>

        {/* Salary Preview (#4) */}
        {payslip && (
          <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} glareEnable={true} glareMaxOpacity={0.06} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ ...glassCard, p: 2.5, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WalletRoundedIcon sx={{ color: '#22c55e', fontSize: 22 }} />
                  <Typography sx={{ fontWeight: 900, fontSize: 17 }}>My Salary Preview</Typography>
                </Box>
                <Chip
                  label={dayjs(`${month}-01`).format('MMM YYYY')}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: 11, bgcolor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}
                />
              </Box>

              {/* Net Pay Highlight */}
              <Box sx={{
                p: 2, borderRadius: '14px', textAlign: 'center', mb: 2,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.06) 100%)'
                  : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid rgba(34,197,94,0.25)',
              }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: isDark ? '#86efac' : '#047857', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estimated Net Pay
                </Typography>
                <Typography sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 900, color: '#16a34a', fontFamily: 'monospace', my: 0.5 }}>
                  ₹{(payslip.netPay ?? 0).toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                  Based on {monthSummary?.presentDays || 0} present days this month
                </Typography>
              </Box>

              {/* Breakdown 3-col */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Base Pay</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 900, color: 'text.primary', mt: 0.25 }}>₹{(payslip.baseSalary ?? 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>OT Pay</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#22c55e', mt: 0.25 }}>+₹{(payslip.overtimePay ?? 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)', textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Deductions</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#ef4444', mt: 0.25 }}>-₹{(payslip.totalDeductions ?? 0).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          </Tilt>
        )}
      </MotionBox>

      {/* ── Bottom Row ── */}
      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: streaks ? '1fr 1fr 1.1fr' : '1fr 1.1fr' }, gap: 2.5 }}>

        {/* Leave Balances */}
        <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.08} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ ...glassCard, p: 2.5, height: '100%' }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Leave Balances</Typography>
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {leaveBalances.length ? leaveBalances.slice(0, 4).map((item, i) => {
              const percent = item.allocatedDays ? Math.min(100, Math.round((item.remainingDays / item.allocatedDays) * 100)) : 0;
              const barColor = percent > 60 ? '#22c55e' : percent > 30 ? '#f59e0b' : '#ef4444';
              return (
                <MotionBox
                  key={item.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  sx={{ p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{item.leaveType.replaceAll('_', ' ')}</Typography>
                    <Typography sx={{ fontWeight: 900, color: barColor, fontSize: 14 }}>{item.remainingDays}d</Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 3, background: barColor }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.07 }}
                    />
                  </Box>
                  <Typography sx={{ color: 'text.disabled', fontSize: 11, mt: 0.5, fontWeight: 600 }}>{item.usedDays} used of {item.allocatedDays}</Typography>
                </MotionBox>
              );
            }) : <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No leave balances assigned yet.</Typography>}
          </Box>
        </Box>
        </Tilt>

        {/* Streaks & Badges */}
        {streaks && (
          <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} glareEnable={true} glareMaxOpacity={0.08} glareBorderRadius="16px" scale={1.01} transitionSpeed={500} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <MotionBox
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            sx={{ ...glassCard, p: 2.5, height: '100%' }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Streaks & Badges</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
              {[
                { emoji: '🔥', value: streaks.currentStreak, label: 'Day Streak', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)' },
                { emoji: '🏆', value: streaks.longestStreak, label: 'Best Streak', color: '#38bdf8', border: 'rgba(56,189,248,0.3)', bg: 'rgba(56,189,248,0.08)' },
                { emoji: '🎯', value: `${streaks.punctualityScore}%`, label: 'On-Time Rate', color: '#22c55e', border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.08)' },
              ].map((item, i) => (
                <MotionBox
                  key={item.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                  whileHover={{ scale: 1.05 }}
                  sx={{ textAlign: 'center', p: 1.5, borderRadius: '14px', border: `1px solid ${item.border}`, background: item.bg }}
                >
                  <Typography sx={{ fontSize: 30 }}>{item.emoji}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 22, color: item.color, lineHeight: 1.2 }}>{item.value}</Typography>
                  <Typography sx={{ color: item.color, fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{item.label}</Typography>
                </MotionBox>
              ))}
            </Box>
            {streaks.badges.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {streaks.badges.map((badge, i) => (
                  <MotionBox
                    key={badge}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                  >
                    <Chip label={badge} size="small" sx={{ borderRadius: '8px', fontWeight: 800, fontSize: 12, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', border: '1px solid', borderColor: 'divider' }} />
                  </MotionBox>
                ))}
              </Box>
            )}
          </MotionBox>
          </Tilt>
        )}

        {/* Recent Attendance */}
        <Box sx={{ ...glassCard, p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Recent Attendance</Typography>
            <Chip label={`Late ${minutesLabel(totalLate)}`} size="small" sx={{ fontWeight: 800, fontSize: 11, bgcolor: totalLate > 0 ? 'rgba(239,68,68,0.1)' : 'action.hover', color: totalLate > 0 ? '#ef4444' : 'text.secondary' }} />
          </Box>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {recentEntries.length ? recentEntries.map((item, i) => {
              const statusColor = item.status === 'PRESENT' ? '#22c55e' : item.status === 'HALF_DAY' ? '#f59e0b' : '#ef4444';
              const statusBg = item.status === 'PRESENT' ? 'rgba(34,197,94,0.1)' : item.status === 'HALF_DAY' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
              return (
                <MotionBox
                  key={item.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    cursor: 'default',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{dayjs(item.date).format('ddd, DD MMM')}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12, fontFamily: 'monospace' }}>
                      {timeLabel(item.inTime)} → {timeLabel(item.outTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: '6px', bgcolor: statusBg }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 11, color: statusColor }}>{item.status.replace('_', ' ')}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 13, color: 'text.secondary' }}>{minutesLabel(item.workedMinutes)}</Typography>
                    {(item.overtimeMinutes ?? 0) > 0 && (
                      <Typography sx={{ fontWeight: 900, fontSize: 11, color: '#f59e0b' }}>OT: {minutesLabel(item.overtimeMinutes)}</Typography>
                    )}
                  </Box>
                </MotionBox>
              );
            }) : <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No attendance entries for this month yet.</Typography>}
          </Box>
        </Box>
      </MotionBox>

      {/* ── Live Office Seating & Team Presence Map ── */}
      <MotionBox variants={itemVariants}>
        <OfficeFloorMap />
      </MotionBox>

      {/* ── Slack & Teams Auto-Presence Sync ── */}
      <MotionBox variants={itemVariants}>
        <SlackPresenceSyncCard
          isPunchedIn={!!todayEntry?.inTime && !todayEntry?.outTime}
          isOnBreak={!!activeBreak}
        />
      </MotionBox>

      {/* ── Team Recognition & Shift Kudos Wall ── */}
      <MotionBox variants={itemVariants}>
        <PeerKudosWall />
      </MotionBox>

      {/* ── Quick Leave Dialog Modal (#6) ── */}
      <Dialog
        open={quickLeaveOpen}
        onClose={() => !quickLeaveBusy && setQuickLeaveOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            background: isDark ? 'rgba(15,23,42,0.96)' : '#ffffff',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 18, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlashOnRoundedIcon sx={{ color: '#f59e0b' }} /> Quick Leave for Today
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Apply for leave today (<b>{dayjs().format('ddd, DD MMM YYYY')}</b>):
          </Typography>
          <TextField
            select
            label="Leave Type"
            size="small"
            value={quickLeaveType}
            onChange={(e) => setQuickLeaveType(e.target.value)}
            fullWidth
          >
            {leaveBalances.length ? (
              leaveBalances.map((lb) => (
                <MenuItem key={lb.id} value={lb.leaveType}>
                  {lb.leaveType.replaceAll('_', ' ')} ({lb.remainingDays}d remaining)
                </MenuItem>
              ))
            ) : (
              <MenuItem value="CASUAL_LEAVE">Casual Leave</MenuItem>
            )}
          </TextField>
          <TextField
            label="Reason"
            size="small"
            value={quickLeaveReason}
            onChange={(e) => setQuickLeaveReason(e.target.value)}
            placeholder="e.g. Urgent personal work / Not feeling well"
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQuickLeaveOpen(false)} disabled={quickLeaveBusy} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyQuickLeave}
            disabled={quickLeaveBusy}
            sx={{
              fontWeight: 900,
              borderRadius: '12px',
              px: 2.5,
              bgcolor: '#f59e0b',
              '&:hover': { bgcolor: '#d97706' },
            }}
          >
            {quickLeaveBusy ? 'Submitting...' : 'Apply Leave'}
          </Button>
        </DialogActions>
      </Dialog>

      <PunchOverlay open={punchOpen} onClose={() => setPunchOpen(false)} kind={punchKind} />
    </MotionBox>
  );
}
