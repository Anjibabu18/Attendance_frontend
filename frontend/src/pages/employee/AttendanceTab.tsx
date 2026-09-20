import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from 'framer-motion';

import MonthCalendar, { DayStatus } from '../../components/MonthCalendar';
import { Attendance } from '../../types';
import { useEmployee } from './EmployeeContext';
import { useToast } from '../../components/Toast';
import { AttendanceHeatmap } from '../../components/AttendanceHeatmap';
import { HolidayOptimizerCard } from '../../components/HolidayOptimizerCard';
import { AiAnomalyDetectorCard } from '../../components/AiAnomalyDetectorCard';
import { ExecutiveTimesheetModal } from '../../components/ExecutiveTimesheetModal';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';

const MotionBox = motion.create(Box);

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

function dateKey(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '';
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

function statusTone(entry?: Attendance) {
  if (!entry) return { label: 'No entry', bg: 'action.hover', color: 'text.secondary' };
  if (entry.status === 'PRESENT') return { label: 'Present', bg: 'success.light', color: 'success.dark' };
  if (entry.status === 'HALF_DAY') return { label: 'Half day', bg: 'warning.light', color: 'warning.dark' };
  return { label: 'Leave', bg: 'error.light', color: 'error.dark' };
}

export function AttendanceTab() {
  const { profile, month, setMonth, entries, monthSummary, settings, holidays, breaks } = useEmployee();
  const { toastSuccess } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [photoViewerOpen, setPhotoViewerOpen] = useState<string | null>(null);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const isTodaySelected = selectedDate === dayjs().format('YYYY-MM-DD');

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Attendance>();
    entries.forEach((entry) => map.set(dateKey(entry.date), entry));
    return map;
  }, [entries]);

  const selectedEntry = entriesByDate.get(selectedDate);
  const holidaySet = new Set(holidays.map((h) => dateKey(h.date)));
  const weekendSet = new Set((settings?.weekendDays || 'SUNDAY').split(',').map((d) => d.trim().toUpperCase()).filter(Boolean));
  const first = dayjs(`${month}-01`);
  const today = dayjs().format('YYYY-MM-DD');
  const statusByDate: Record<string, DayStatus> = {};

  for (let d = 1; d <= first.daysInMonth(); d++) {
    const date = first.date(d).format('YYYY-MM-DD');
    const entry = entriesByDate.get(date);
    const isWeekend = weekendSet.has(first.date(d).format('dddd').toUpperCase());
    if (holidaySet.has(date) || isWeekend) statusByDate[date] = 'H';
    else if (entry) statusByDate[date] = entry.status === 'PRESENT' ? 'P' : entry.status === 'HALF_DAY' ? 'HD' : 'L';
    else statusByDate[date] = date <= today ? 'L' : '';
  }

  const handlePrevMonth = () => setMonth(dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM'));
  const handleNextMonth = () => setMonth(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'));
  const selectedTone = statusTone(selectedEntry);
  const requiredMinutes = settings?.fullDayMinutes || 0;
  const workedPercent = requiredMinutes ? Math.min(100, Math.round(((selectedEntry?.workedMinutes || 0) / requiredMinutes) * 100)) : 0;
  const todayBreak = isTodaySelected ? breaks[0] : null;

  // #3 My Attendance Report Card metrics
  const totalLateMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.lateMinutes || 0), 0), [entries]);
  const totalOvertimeMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.overtimeMinutes || 0), 0), [entries]);
  const totalWorkedMinutes = useMemo(() => entries.reduce((acc, e) => acc + (e.workedMinutes || 0), 0), [entries]);

  const attendancePct = useMemo(() => {
    return monthSummary?.workingDays ? Math.round((monthSummary.presentDays / monthSummary.workingDays) * 100) : 0;
  }, [monthSummary]);

  const punctualityScore = useMemo(() => {
    if (!monthSummary?.presentDays) return 100;
    const avgLate = totalLateMinutes / monthSummary.presentDays;
    return Math.max(0, Math.round(100 - avgLate * 2));
  }, [monthSummary, totalLateMinutes]);

  const grade = useMemo(() => {
    if (attendancePct >= 95 && punctualityScore >= 90) return 'A+';
    if (attendancePct >= 85) return 'A';
    if (attendancePct >= 75) return 'B';
    if (attendancePct >= 60) return 'C';
    return 'D';
  }, [attendancePct, punctualityScore]);

  // #23 Share Report
  const shareText = `📊 My Attendance Report — ${dayjs(`${month}-01`).format('MMMM YYYY')}\n` +
    `👤 ${profile?.name || 'Employee'} (${profile?.employeeNumber || ''})\n` +
    `⭐ Grade: ${grade} (${attendancePct}% Attendance)\n` +
    `📅 Present: ${monthSummary?.presentDays || 0} / ${monthSummary?.workingDays || 0} days\n` +
    `⏱️ Total Worked: ${(totalWorkedMinutes / 60).toFixed(1)}h\n` +
    `⏰ Late Minutes: ${totalLateMinutes}m\n` +
    `⚡ Overtime: ${totalOvertimeMinutes}m`;

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(shareText);
    toastSuccess('Report summary copied to clipboard!');
  };

  const summaryCards = [
    { label: 'Working days', value: monthSummary?.workingDays || 0 },
    { label: 'Present', value: monthSummary?.presentDays || 0 },
    { label: 'Half days', value: monthSummary?.halfDayDays || 0 },
    { label: 'Leave', value: monthSummary?.leaveDays || 0 },
  ];

  return (
    <MotionBox initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {summaryCards.map((item) => (
          <Box key={item.label} sx={{ ...cardSx, p: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 13 }}>{item.label}</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 26, mt: 0.5 }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── Report Card & Share Bar (#3 & #23) ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, p: 1.5, ...cardSx }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Scorecard Grade: ${grade}`}
            color={grade.startsWith('A') ? 'success' : 'warning'}
            sx={{ fontWeight: 900, borderRadius: '8px' }}
          />
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 700 }}>
            {attendancePct}% Attendance · {punctualityScore}% Punctuality
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setScorecardOpen(true)}
            startIcon={<AssessmentRoundedIcon />}
            sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
          >
            Report Card
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setTimesheetModalOpen(true)}
            startIcon={<PictureAsPdfRoundedIcon />}
            sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
          >
            Timesheet PDF
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleShareWhatsApp}
            startIcon={<WhatsAppIcon />}
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' }, borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}
          >
            Share on WhatsApp
          </Button>
        </Box>
      </Box>

      {/* ── Visual Activity Heatmap ── */}
      <AttendanceHeatmap
        entries={entries}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekendDays={settings?.weekendDays}
      />

      {/* ── AI Bridge Leave & Holiday Optimizer ── */}
      <HolidayOptimizerCard
        holidays={holidays}
      />

      {/* ── AI Anomaly & Fraud Prevention Shield ── */}
      <AiAnomalyDetectorCard />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 0.82fr' }, gap: 2.5, alignItems: 'start' }}>
        <Box sx={{ ...cardSx, p: { xs: 1.5, sm: 2.25 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton size="small" onClick={handlePrevMonth} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{first.format('MMMM YYYY')}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Tap any date for punch details</Typography>
            </Box>
            <IconButton size="small" onClick={handleNextMonth} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}><ArrowForwardIosIcon fontSize="small" /></IconButton>
          </Box>

          <MonthCalendar month={month} statusByDate={statusByDate} selectedDate={selectedDate} onDayClick={setSelectedDate} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {[
              ['P', 'success.light', 'success.dark', 'Present'],
              ['HD', 'warning.light', 'warning.dark', 'Half day'],
              ['L', 'error.light', 'error.dark', 'Leave/Absent'],
              ['H', 'info.light', 'info.dark', 'Holiday/Weekend'],
            ].map(([code, bg, color, label]) => (
              <Chip key={code} size="small" label={`${code} ${label}`} sx={{ bgcolor: bg, color, borderRadius: '8px', fontWeight: 800 }} />
            ))}
          </Box>
        </Box>

        <AnimatePresence mode="wait">
          <MotionBox key={selectedDate} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} sx={{ ...cardSx, p: 2.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                <Box sx={{ width: 42, height: 42, borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.dark', display: 'grid', placeItems: 'center' }}>
                  <EventNoteRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{dayjs(selectedDate).format('dddd')}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{dayjs(selectedDate).format('DD MMMM YYYY')}</Typography>
                </Box>
              </Box>
              <Chip label={selectedTone.label} sx={{ bgcolor: selectedTone.bg, color: selectedTone.color, fontWeight: 900, borderRadius: '8px' }} />
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 13 }}>Worked progress</Typography>
                <Typography sx={{ fontWeight: 900 }}>{minutesLabel(selectedEntry?.workedMinutes)}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={workedPercent} sx={{ height: 8, borderRadius: '8px', bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
              <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.75 }}>Target {requiredMinutes ? minutesLabel(requiredMinutes) : '--'}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1 }}>
              {[
                { label: 'Punch in', value: timeLabel(selectedEntry?.inTime), icon: <LoginRoundedIcon />, color: 'success.main', photo: selectedEntry?.checkInPhotoUrl },
                { label: 'Break out', value: todayBreak?.startTime ? timeLabel(todayBreak.startTime) : '--:--', icon: <FreeBreakfastRoundedIcon />, color: 'warning.main' },
                { label: 'Break in', value: todayBreak?.endTime ? timeLabel(todayBreak.endTime) : '--:--', icon: <TimerRoundedIcon />, color: 'primary.main' },
                { label: 'Punch out', value: timeLabel(selectedEntry?.outTime), icon: <LogoutRoundedIcon />, color: 'error.main', photo: selectedEntry?.checkOutPhotoUrl },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                  <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                  <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 13, flex: 1 }}>{item.label}</Typography>
                  <Typography sx={{ fontWeight: 900 }}>{item.value}</Typography>
                  {item.photo && (
                    <Box component="img" src={item.photo} onClick={() => setPhotoViewerOpen(item.photo as string)} sx={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover', ml: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} />
                  )}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}>
              <Box sx={{ bgcolor: 'background.default', borderRadius: '8px', p: 1.5 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>Late</Typography>
                <Typography sx={{ fontWeight: 900 }}>{minutesLabel(selectedEntry?.lateMinutes)}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'background.default', borderRadius: '8px', p: 1.5 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>Overtime</Typography>
                <Typography sx={{ fontWeight: 900 }}>{minutesLabel(selectedEntry?.overtimeMinutes)}</Typography>
              </Box>
            </Box>
          </MotionBox>
        </AnimatePresence>
      </Box>
      <Dialog open={!!photoViewerOpen} onClose={() => setPhotoViewerOpen(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', backgroundImage: 'none' } }}>
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton onClick={() => setPhotoViewerOpen(null)} sx={{ position: 'absolute', top: -40, right: 0, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}><CloseRoundedIcon /></IconButton>
          <Box component="img" src={photoViewerOpen || ''} sx={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 2, boxShadow: 24, objectFit: 'contain' }} />
        </Box>
      </Dialog>

      {/* ── Scorecard Dialog Modal (#3 & #23) ── */}
      <Dialog open={scorecardOpen} onClose={() => setScorecardOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentRoundedIcon sx={{ color: 'primary.main' }} /> Monthly Attendance Scorecard
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <Box sx={{ textAlign: 'center', p: 2, borderRadius: '12px', bgcolor: grade.startsWith('A') ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: '1px solid', borderColor: grade.startsWith('A') ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              Performance Grade
            </Typography>
            <Typography sx={{ fontSize: 44, fontWeight: 900, color: grade.startsWith('A') ? '#16a34a' : '#d97706', lineHeight: 1.1 }}>
              {grade}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.5, color: 'text.secondary' }}>
              {attendancePct >= 85 ? 'Outstanding consistency! Keep it up 🚀' : 'Good work, aim for higher on-time attendance!'}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Attendance %</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: 'primary.main' }}>{attendancePct}%</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Punctuality</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{punctualityScore}%</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Total Worked</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{(totalWorkedMinutes / 60).toFixed(1)}h</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'action.hover', textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Overtime</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{minutesLabel(totalOvertimeMinutes)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button startIcon={<ContentCopyRoundedIcon />} onClick={handleCopyReport} size="small" sx={{ fontWeight: 800 }}>
            Copy Summary
          </Button>
          <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={handleShareWhatsApp} size="small" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' }, fontWeight: 800 }}>
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Official Executive Timesheet Modal ── */}
      <ExecutiveTimesheetModal
        open={timesheetModalOpen}
        onClose={() => setTimesheetModalOpen(false)}
        employeeName={profile?.name || 'Employee'}
        employeeCode={profile?.employeeNumber || 'EMP001'}
        department={profile?.department?.name || 'Engineering & Technology'}
        month={first.format('MMMM YYYY')}
        totalWorkedHours={`${((monthSummary?.totalWorkedMinutes ?? totalWorkedMinutes) / 60).toFixed(1)} hrs`}
        presentDays={monthSummary?.presentDays ?? 21}
        leaveDays={monthSummary?.leaveDays ?? 1}
        overtimeHours={minutesLabel(totalOvertimeMinutes)}
      />
    </MotionBox>
  );
}





