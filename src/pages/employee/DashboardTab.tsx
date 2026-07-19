import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import WorkHistoryRoundedIcon from '@mui/icons-material/WorkHistoryRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

import { api } from '../../api/client';
import { Attendance } from '../../types';
import { useEmployee } from './EmployeeContext';
import { PunchOverlay } from './PunchOverlay';
import { useThemeContext } from '../../theme/ThemeContext';

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
function CircularProgress({ progress, size = 220, strokeWidth = 14, children }: {
  progress: number; size?: number; strokeWidth?: number; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22c55e" />
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

export function DashboardTab() {
  const { profile, todayEntry, settings, monthSummary, entries, leaveBalances, activeBreak, breaks, fetchBreaks, month, deviceStatus, refreshData } = useEmployee();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [punchOpen, setPunchOpen] = useState(false);
  const [punchKind, setPunchKind] = useState<'checkin' | 'checkout'>('checkin');
  const [breakBusy, setBreakBusy] = useState(false);
  const [breakError, setBreakError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streaks, setStreaks] = useState<{ currentStreak: number; longestStreak: number; punctualityScore: number; badges: string[]; totalOnTime: number; totalDays: number } | null>(null);

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
  const progress = targetMinutes ? Math.min(100, Math.round((elapsedSeconds / 60 / targetMinutes) * 100)) : 0;
  const recentEntries = useMemo(() => [...entries].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 5), [entries]);

  const clockedIn = !!todayEntry?.inTime && !todayEntry?.outTime;
  const completed = !!todayEntry?.outTime;
  const greetingName = profile?.name?.split(' ')[0] || 'there';
  const { h, m, s } = secondsLabel(elapsedSeconds);

  const statCards = [
    { label: 'This month', value: `${monthSummary?.presentDays || 0}/${monthSummary?.workingDays || 0}`, helper: 'Present days', icon: <CalendarTodayRoundedIcon />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
                TODAY SHIFT
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 34 }, lineHeight: 1.1, color: '#f8fafc' }}>
                Good day, {greetingName}
              </Typography>
              <Typography sx={{ color: 'rgba(148,163,184,0.8)', mt: 0.5, fontSize: 13 }}>
                {dayjs().format('dddd, DD MMMM YYYY')}
              </Typography>
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

          {/* Status indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
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

          {/* Circular timer + buttons row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>

            {/* Circular progress ring */}
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <CircularProgress progress={progress} size={190} strokeWidth={13}>
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
                      <Typography sx={{ color: 'rgba(148,163,184,0.6)', fontSize: 11, mt: 0.5, fontWeight: 600 }}>
                        {progress}% of target
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
                  <Typography sx={{ color: '#38bdf8', fontSize: 12, fontWeight: 800 }}>{progress}%</Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #38bdf8, #818cf8, #22c55e)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </Box>
              </Box>

              {/* Today's punch times */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {[
                  { label: 'In', value: timeLabel(todayEntry?.inTime), color: '#22c55e' },
                  { label: 'Out', value: timeLabel(todayEntry?.outTime), color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '12px', p: 1.25, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 17, color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {!todayEntry?.inTime ? (
                  <MotionButton
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => openPunch('checkin')}
                    variant="contained"
                    startIcon={<LoginRoundedIcon />}
                    sx={{ bgcolor: '#22c55e', color: 'white', borderRadius: '12px', py: 1.4, fontWeight: 900, fontSize: 15, boxShadow: '0 8px 20px rgba(34,197,94,0.4)', '&:hover': { bgcolor: '#16a34a' } }}
                  >
                    Punch In
                  </MotionButton>
                ) : !todayEntry.outTime ? (
                  <MotionButton
                    whileTap={{ scale: 0.97 }}
                    onClick={() => openPunch('checkout')}
                    variant="contained"
                    startIcon={<LogoutRoundedIcon />}
                    sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '12px', py: 1.4, fontWeight: 900, fontSize: 15, boxShadow: '0 8px 20px rgba(239,68,68,0.4)', '&:hover': { bgcolor: '#dc2626' } }}
                  >
                    Punch Out
                  </MotionButton>
                ) : (
                  <Button disabled variant="contained" sx={{ borderRadius: '12px', py: 1.4, fontWeight: 900 }}>Completed ✓</Button>
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
                  </Box>
                </MotionBox>
              );
            }) : <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No attendance entries for this month yet.</Typography>}
          </Box>
        </Box>
      </MotionBox>

      <PunchOverlay open={punchOpen} onClose={() => setPunchOpen(false)} kind={punchKind} />
    </MotionBox>
  );
}
