import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import WeekendRoundedIcon from '@mui/icons-material/WeekendRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { Profile } from '../types';
import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface WeeklyRosterCardProps {
  profile?: Profile | null;
  weekendDays?: string;
}

export function WeeklyRosterCard({ profile, weekendDays = 'SUNDAY' }: WeeklyRosterCardProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedShiftDay, setSelectedShiftDay] = useState<string>('');
  const [targetColleague, setTargetColleague] = useState('EMP002 - Priya Sharma');
  const [swapReason, setSwapReason] = useState('Personal scheduling conflict');
  const [swapSubmitted, setSwapSubmitted] = useState(false);

  const weekendSet = new Set(
    weekendDays
      .split(',')
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean)
  );

  const startOfWeek = dayjs().startOf('week').add(1, 'day'); // Start Monday

  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const current = startOfWeek.add(offset, 'day');
    const dayStr = current.format('YYYY-MM-DD');
    const isToday = dayStr === dayjs().format('YYYY-MM-DD');
    const dayName = current.format('ddd').toUpperCase();
    const isWeekend = weekendSet.has(dayName) || dayName === 'SUN';

    const defaultIn = profile?.shift?.inTime?.slice(0, 5) || '09:00';
    const defaultOut = profile?.shift?.outTime?.slice(0, 5) || '18:00';

    return {
      date: dayStr,
      dayNum: current.format('D'),
      dayName: current.format('ddd'),
      isToday,
      isWeekend,
      time: isWeekend ? 'Rest Day' : `${defaultIn} – ${defaultOut}`,
      type: isWeekend ? 'Off' : offset === 4 ? 'WFH Friendly' : 'Main Office',
    };
  });

  const handleSwapSubmit = () => {
    hapticSuccess();
    toastSuccess(`Shift swap request for ${selectedShiftDay} sent to manager for approval!`);
    setSwapModalOpen(false);
    setSwapSubmitted(true);
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 12px 32px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
              color: isDark ? '#38bdf8' : '#2563eb',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CalendarViewWeekRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              Weekly Work Schedule & Roster
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Shift assignments for {startOfWeek.format('MMM D')} – {startOfWeek.add(6, 'day').format('MMM D, YYYY')}
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<SwapHorizRoundedIcon />}
          onClick={() => {
            setSelectedShiftDay(days.find((d) => !d.isWeekend)?.date || days[0].date);
            setSwapModalOpen(true);
          }}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 12,
            borderColor: 'divider',
          }}
        >
          Request Shift Swap
        </Button>
      </Box>

      {/* 7-Day Schedule Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(7, 1fr)',
          },
          gap: 1.2,
        }}
      >
        {days.map((item) => (
          <Box
            key={item.date}
            component={motion.div}
            whileHover={{ y: -2 }}
            sx={{
              p: 1.5,
              borderRadius: '14px',
              bgcolor: item.isToday
                ? isDark
                  ? 'rgba(56, 189, 248, 0.14)'
                  : 'rgba(37, 99, 235, 0.08)'
                : item.isWeekend
                ? isDark
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.02)'
                : isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${
                item.isToday
                  ? isDark
                    ? 'rgba(56, 189, 248, 0.35)'
                    : 'rgba(37, 99, 235, 0.3)'
                  : 'divider'
              }`,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
              position: 'relative',
            }}
          >
            {item.isToday && (
              <Chip
                label="TODAY"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  height: 18,
                  fontSize: 9,
                  fontWeight: 900,
                  bgcolor: isDark ? '#38bdf8' : '#2563eb',
                  color: '#fff',
                }}
              />
            )}

            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                {item.dayName}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>
                {item.dayNum}
              </Typography>
            </Box>

            <Box sx={{ mt: 'auto' }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: item.isWeekend ? 'inherit' : 'monospace',
                  color: item.isWeekend ? 'text.disabled' : 'text.primary',
                }}
              >
                {item.time}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                {item.isWeekend ? (
                  <WeekendRoundedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                ) : item.type.includes('WFH') ? (
                  <HomeWorkRoundedIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                ) : (
                  <LocationOnRoundedIcon sx={{ fontSize: 13, color: '#10b981' }} />
                )}
                <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>
                  {item.type}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Shift Swap Dialog */}
      <Dialog
        open={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Request Shift Swap / Coverage</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            select
            label="Your Shift to Swap"
            value={selectedShiftDay}
            onChange={(e) => setSelectedShiftDay(e.target.value)}
            fullWidth
            size="small"
          >
            {days.filter((d) => !d.isWeekend).map((d) => (
              <MenuItem key={d.date} value={d.date}>
                {d.dayName}, {d.date} ({d.time})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Target Colleague / Coverage"
            value={targetColleague}
            onChange={(e) => setTargetColleague(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="EMP002 - Priya Sharma">EMP002 - Priya Sharma</MenuItem>
            <MenuItem value="EMP003 - Rahul Verma">EMP003 - Rahul Verma</MenuItem>
            <MenuItem value="EMP004 - Anita Patel">EMP004 - Anita Patel</MenuItem>
          </TextField>

          <TextField
            label="Reason for Shift Swap"
            multiline
            rows={3}
            value={swapReason}
            onChange={(e) => setSwapReason(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSwapModalOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSwapSubmit}
            sx={{ fontWeight: 800, borderRadius: '10px', textTransform: 'none' }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
