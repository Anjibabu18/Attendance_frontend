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
import { motion } from 'framer-motion';

import { api } from '../../api/client';
import { Attendance } from '../../types';
import { useEmployee } from './EmployeeContext';
import { PunchOverlay } from './PunchOverlay';

const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

const cardSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 18px 44px rgba(15, 23, 42, 0.09)',
    borderColor: 'primary.light',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
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
  return `${h}h ${m}m ${s}s`;
}

function sessionDateTime(entry: Attendance, timeValue?: string | null) {
  const parsedTime = parseTimeValue(timeValue);
  if (!parsedTime) return null;
  const date = dateKey(entry.date);
  const parsed = dayjs(`${date}T${parsedTime.format('HH:mm:ss')}`);
  return parsed.isValid() ? parsed : null;
}
export function DashboardTab() {
  const { profile, todayEntry, settings, monthSummary, entries, leaveBalances, activeBreak, breaks, fetchBreaks, month } = useEmployee();
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
    if (!todayEntry?.inTime) {
      setElapsedSeconds(0);
      return;
    }

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

  const openPunch = (kind: 'checkin' | 'checkout') => {
    setPunchKind(kind);
    setPunchOpen(true);
  };

  const runBreakAction = async (endpoint: string) => {
    setBreakBusy(true);
    setBreakError(null);
    try {
      await api.post(endpoint);
      await fetchBreaks();
    } catch (err: any) {
      setBreakError(err?.response?.data?.error || 'Break action failed. Please try again.');
    } finally {
      setBreakBusy(false);
    }
  };

  const totalOvertime = entries.reduce((sum, item) => sum + (item.overtimeMinutes || 0), 0);
  const totalLate = entries.reduce((sum, item) => sum + (item.lateMinutes || 0), 0);
  const totalLeaveBalance = leaveBalances.reduce((sum, item) => sum + (item.remainingDays || 0), 0);
  const targetMinutes = settings?.fullDayMinutes || 0;
  const progress = targetMinutes ? Math.min(100, Math.round((elapsedSeconds / 60 / targetMinutes) * 100)) : 0;
  const recentEntries = useMemo(() => [...entries].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 5), [entries]);

  const clockedIn = !!todayEntry?.inTime && !todayEntry?.outTime;
  const completed = !!todayEntry?.outTime;
  const greetingName = profile?.name?.split(' ')[0] || 'there';

  const stats = [
    { label: 'This month', value: `${monthSummary?.presentDays || 0}/${monthSummary?.workingDays || 0}`, helper: 'Present days', icon: <CalendarTodayRoundedIcon /> },
    { label: 'Worked', value: minutesLabel(monthSummary?.totalWorkedMinutes), helper: dayjs(`${month}-01`).format('MMM YYYY'), icon: <WorkHistoryRoundedIcon /> },
    { label: 'Overtime', value: minutesLabel(totalOvertime), helper: 'Approved payroll input', icon: <TrendingUpRoundedIcon /> },
    { label: 'Leave balance', value: `${totalLeaveBalance}d`, helper: `${leaveBalances.length} leave types`, icon: <WalletRoundedIcon /> },
  ];

  return (
    <MotionBox variants={containerVariants} initial="hidden" animate="visible" sx={{ display: 'grid', gap: 2.5 }}>
      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.65fr' }, gap: 2.5 }}>
        <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, bgcolor: 'primary.dark', color: 'white', borderColor: 'primary.dark' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ color: 'primary.light', fontWeight: 800, fontSize: 13, mb: 0.75 }}>TODAY SHIFT</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 26, md: 36 }, lineHeight: 1.05 }}>Good day, {greetingName}</Typography>
              <Typography sx={{ color: 'primary.light', mt: 1 }}>{dayjs().format('dddd, DD MMMM YYYY')}</Typography>
            </Box>
            <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 54, height: 54, border: '3px solid rgba(255,255,255,0.28)' }} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 2, alignItems: 'end' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: clockedIn ? '#22C55E' : completed ? '#93C5FD' : '#CBD5E1' }} />
                <Typography sx={{ fontWeight: 800 }}>
                  {clockedIn ? `Clocked in at ${timeLabel(todayEntry?.inTime)}` : completed ? 'Shift completed' : 'Not clocked in'}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 38, sm: 48 }, fontFamily: 'monospace', letterSpacing: 0, lineHeight: 1 }}>
                {todayEntry?.inTime ? secondsLabel(elapsedSeconds) : '0h 0m 0s'}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', '& .MuiLinearProgress-bar': { bgcolor: 'primary.light' } }} />
                <Typography sx={{ mt: 0.75, color: 'primary.light', fontSize: 13 }}>Target {targetMinutes ? minutesLabel(targetMinutes) : '--'} - {progress}% complete</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '150px 150px' }, gap: 1 }}>
              {!todayEntry?.inTime ? (
                <MotionButton whileTap={{ scale: 0.98 }} onClick={() => openPunch('checkin')} variant="contained" startIcon={<LoginRoundedIcon />} sx={{ bgcolor: '#22C55E', color: 'white', borderRadius: '8px', py: 1.35, textTransform: 'none', fontWeight: 900, '&:hover': { bgcolor: '#16A34A' } }}>
                  Punch In
                </MotionButton>
              ) : !todayEntry.outTime ? (
                <MotionButton whileTap={{ scale: 0.98 }} onClick={() => openPunch('checkout')} variant="contained" startIcon={<LogoutRoundedIcon />} sx={{ bgcolor: '#EF4444', color: 'white', borderRadius: '8px', py: 1.35, textTransform: 'none', fontWeight: 900, '&:hover': { bgcolor: '#DC2626' } }}>
                  Punch Out
                </MotionButton>
              ) : (
                <Button disabled variant="contained" sx={{ borderRadius: '8px', py: 1.35, textTransform: 'none', fontWeight: 900 }}>Completed</Button>
              )}

              {activeBreak ? (
                <MotionButton whileTap={{ scale: 0.98 }} onClick={() => runBreakAction('/api/employee/breaks/end')} disabled={breakBusy} variant="contained" startIcon={<PlayArrowRoundedIcon />} sx={{ bgcolor: '#F59E0B', color: 'white', borderRadius: '8px', py: 1.35, textTransform: 'none', fontWeight: 900, '&:hover': { bgcolor: '#D97706' } }}>
                  Resume
                </MotionButton>
              ) : (
                <MotionButton whileTap={clockedIn ? { scale: 0.98 } : {}} onClick={() => runBreakAction('/api/employee/breaks/start')} disabled={breakBusy || !clockedIn} variant="contained" startIcon={<FreeBreakfastRoundedIcon />} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', borderRadius: '8px', py: 1.35, textTransform: 'none', fontWeight: 900, '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.55)' } }}>
                  Break
                </MotionButton>
              )}
            </Box>
          </Box>
          {breakError && <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>{breakError}</Alert>}
        </Box>

        <Box sx={{ ...cardSx, p: 2.25, display: 'grid', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Today details</Typography>
          {[
            ['Punch in', timeLabel(todayEntry?.inTime)],
            ['Punch out', timeLabel(todayEntry?.outTime)],
            ['Late', minutesLabel(todayEntry?.lateMinutes)],
            ['Overtime', minutesLabel(todayEntry?.overtimeMinutes)],
          ].map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 13 }}>{label}</Typography>
              <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
            </Box>
          ))}
          <Chip icon={<AccessTimeRoundedIcon />} label={activeBreak ? 'Break is active' : 'No active break'} sx={{ justifyContent: 'flex-start', bgcolor: activeBreak ? 'warning.light' : 'action.hover', color: activeBreak ? 'warning.dark' : 'text.secondary', fontWeight: 800, borderRadius: '8px' }} />
        </Box>
      </MotionBox>

      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {stats.map((item) => (
          <Box key={item.label} sx={{ ...cardSx, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 13 }}>{item.label}</Typography>
              <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 24 } }}>{item.value}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>{item.helper}</Typography>
          </Box>
        ))}
      </MotionBox>

      <MotionBox variants={itemVariants} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2.5 }}>
        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Leave balances</Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {leaveBalances.length ? leaveBalances.slice(0, 4).map((item) => {
              const percent = item.allocatedDays ? Math.min(100, Math.round((item.remainingDays / item.allocatedDays) * 100)) : 0;
              return (
                <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>{item.leaveType.replaceAll('_', ' ')}</Typography>
                    <Typography sx={{ fontWeight: 900, color: item.remainingDays > 0 ? 'success.main' : 'error.main' }}>{item.remainingDays}d</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={percent} sx={{ height: 7, borderRadius: '8px', bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
                  <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.75 }}>{item.usedDays} used of {item.allocatedDays}</Typography>
                </Box>
              );
            }) : <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No leave balances assigned yet.</Typography>}
          </Box>
        </Box>

        {/* Streaks & Badges Card */}
        {streaks && (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            sx={{ ...cardSx, p: 2.25 }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Streaks & Badges</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
              <Box sx={{ bgcolor: 'warning.main', opacity: 0.1, position: 'absolute', inset: 0, borderRadius: '8px' }} />
              <Box sx={{ position: 'relative', bgcolor: 'transparent', borderRadius: '8px', p: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'warning.light' }}>
                <Typography sx={{ fontSize: 28 }}>🔥</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: 'warning.dark' }}>{streaks.currentStreak}</Typography>
                <Typography sx={{ color: 'warning.main', fontSize: 12, fontWeight: 700 }}>Day Streak</Typography>
              </Box>
              <Box sx={{ position: 'relative', bgcolor: 'transparent', borderRadius: '8px', p: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'primary.light' }}>
                <Typography sx={{ fontSize: 28 }}>🏆</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: 'primary.dark' }}>{streaks.longestStreak}</Typography>
                <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 700 }}>Best Streak</Typography>
              </Box>
              <Box sx={{ position: 'relative', bgcolor: 'transparent', borderRadius: '8px', p: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'success.light' }}>
                <Typography sx={{ fontSize: 28 }}>🎯</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: 'success.dark' }}>{streaks.punctualityScore}%</Typography>
                <Typography sx={{ color: 'success.main', fontSize: 12, fontWeight: 700 }}>On-Time Rate</Typography>
              </Box>
            </Box>
            {streaks.badges.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {streaks.badges.map(badge => (
                  <Chip key={badge} label={badge} size="small" sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 800, fontSize: 13 }} />
                ))}
              </Box>
            )}
          </MotionBox>
        )}

        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Recent attendance</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>Late {minutesLabel(totalLate)}</Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {recentEntries.length ? recentEntries.map((item) => (
              <Box key={item.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{dayjs(item.date).format('ddd, DD MMM')}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{timeLabel(item.inTime)} to {timeLabel(item.outTime)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { sm: 'flex-end' } }}>
                  <Chip size="small" label={item.status.replace('_', ' ')} sx={{ borderRadius: '8px', fontWeight: 800, bgcolor: item.status === 'PRESENT' ? 'success.light' : item.status === 'HALF_DAY' ? 'warning.light' : 'error.light', color: item.status === 'PRESENT' ? 'success.dark' : item.status === 'HALF_DAY' ? 'warning.dark' : 'error.dark' }} />
                  <Typography sx={{ fontWeight: 900, minWidth: 58, textAlign: 'right' }}>{minutesLabel(item.workedMinutes)}</Typography>
                </Box>
              </Box>
            )) : <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No attendance entries for this month yet.</Typography>}
          </Box>
        </Box>
      </MotionBox>

      <PunchOverlay open={punchOpen} onClose={() => setPunchOpen(false)} kind={punchKind} />
    </MotionBox>
  );
}






