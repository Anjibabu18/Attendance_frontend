import React, { useMemo, useState } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { Attendance } from '../types';
import { useThemeContext } from '../theme/ThemeContext';
import { hapticTap } from '../utils/haptics';

interface AttendanceHeatmapProps {
  entries: Attendance[];
  month: string; // 'YYYY-MM'
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
  weekendDays?: string;
}

export function AttendanceHeatmap({
  entries,
  month,
  onSelectDate,
  selectedDate,
  weekendDays = 'SUNDAY',
}: AttendanceHeatmapProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const weekendSet = useMemo(() => {
    return new Set(
      weekendDays
        .split(',')
        .map((d) => d.trim().toUpperCase())
        .filter(Boolean)
    );
  }, [weekendDays]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Attendance>();
    entries.forEach((e) => {
      if (e.date) {
        map.set(dayjs(e.date).format('YYYY-MM-DD'), e);
      }
    });
    return map;
  }, [entries]);

  const daysInMonth = useMemo(() => {
    const first = dayjs(`${month}-01`);
    const count = first.daysInMonth();
    const today = dayjs().format('YYYY-MM-DD');

    const list = [];
    for (let d = 1; d <= count; d++) {
      const dateObj = first.date(d);
      const dateStr = dateObj.format('YYYY-MM-DD');
      const isWeekend = weekendSet.has(dateObj.format('dddd').toUpperCase());
      const isFuture = dateStr > today;
      const isToday = dateStr === today;
      const entry = entriesByDate.get(dateStr);
      const workedMins = entry?.workedMinutes || 0;

      list.push({
        date: dateStr,
        dayNum: d,
        dayName: dateObj.format('ddd'),
        isWeekend,
        isFuture,
        isToday,
        entry,
        workedMins,
      });
    }
    return list;
  }, [month, entriesByDate, weekendSet]);

  // Overall metrics for heatmap
  const totalMinutes = useMemo(
    () => entries.reduce((acc, e) => acc + (e.workedMinutes || 0), 0),
    [entries]
  );
  const presentDays = useMemo(
    () => entries.filter((e) => e.status === 'PRESENT').length,
    [entries]
  );
  const avgHoursPerDay = presentDays > 0 ? (totalMinutes / 60 / presentDays).toFixed(1) : '0';

  const getHeatColor = (item: (typeof daysInMonth)[0]) => {
    if (item.isFuture) {
      return isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    }
    if (item.isWeekend) {
      return isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    }
    if (!item.entry) {
      return isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.12)';
    }
    if (item.entry.status === 'LEAVE') {
      return isDark ? 'rgba(244, 63, 94, 0.7)' : 'rgba(244, 63, 94, 0.6)';
    }
    if (item.entry.status === 'HALF_DAY') {
      return '#f59e0b';
    }

    const hours = (item.workedMins || 0) / 60;
    if (hours >= 8.5) return '#059669'; // High overtime / high productivity
    if (hours >= 7.5) return '#10b981'; // Full day target
    if (hours >= 5.0) return '#34d399'; // Moderate
    return '#6ee7b7'; // Partial
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark
          ? '0 12px 32px rgba(0,0,0,0.3)'
          : '0 12px 32px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Title & Month Stats */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
            Productivity & Attendance Heatmap
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Daily work intensity & presence pattern for {dayjs(`${month}-01`).format('MMMM YYYY')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${(totalMinutes / 60).toFixed(1)}h Worked`}
            size="small"
            sx={{ fontWeight: 800, bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
          />
          <Chip
            label={`Avg ${avgHoursPerDay}h / day`}
            size="small"
            sx={{ fontWeight: 800, bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)', color: isDark ? '#38bdf8' : '#2563eb' }}
          />
        </Box>
      </Box>

      {/* Heatmap Squares Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(7, 1fr)',
            sm: 'repeat(10, 1fr)',
            md: 'repeat(16, 1fr)',
          },
          gap: 1,
          mb: 2,
        }}
      >
        {daysInMonth.map((item) => {
          const isSelected = selectedDate === item.date;
          const heatColor = getHeatColor(item);
          const hours = (item.workedMins / 60).toFixed(1);

          let tooltipText = `${dayjs(item.date).format('ddd, MMM D, YYYY')}`;
          if (item.isWeekend) {
            tooltipText += ` · Weekend`;
          } else if (item.isFuture) {
            tooltipText += ` · Upcoming`;
          } else if (item.entry) {
            tooltipText += ` · ${item.entry.status} (${hours}h worked)`;
            if (item.entry.inTime) tooltipText += ` · In: ${item.entry.inTime}`;
            if (item.entry.outTime) tooltipText += ` · Out: ${item.entry.outTime}`;
          } else {
            tooltipText += ` · Absent / No Punch Record`;
          }

          return (
            <Tooltip key={item.date} title={tooltipText} arrow placement="top">
              <Box
                component={motion.div}
                whileHover={{ scale: 1.18, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  hapticTap();
                  onSelectDate?.(item.date);
                }}
                sx={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  bgcolor: heatColor,
                  border: isSelected
                    ? `2px solid ${isDark ? '#38bdf8' : '#2563eb'}`
                    : item.isToday
                    ? `2px dashed ${isDark ? '#f59e0b' : '#d97706'}`
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: isSelected
                    ? `0 0 12px ${isDark ? '#38bdf8' : '#2563eb'}`
                    : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: item.isWeekend || item.isFuture
                      ? 'text.disabled'
                      : isDark
                      ? '#ffffff'
                      : '#0f172a',
                    userSelect: 'none',
                  }}
                >
                  {item.dayNum}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Legend & Help */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
          Click any day square to inspect full punch logs & biometric verification.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: isDark ? 'rgba(244,63,94,0.7)' : 'rgba(244,63,94,0.6)' }} />
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>Leave/Absent</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#f59e0b' }} />
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>Half Day</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#34d399' }} />
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>6-8h</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: '#10b981' }} />
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>8h+ On-Target</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
