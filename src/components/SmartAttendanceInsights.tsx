import React, { useMemo } from 'react';
import { Box, Chip, LinearProgress, Tooltip, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { Attendance, AttendanceSettings, MonthSummary } from '../types';
import { useThemeContext } from '../theme/ThemeContext';

interface SmartAttendanceInsightsProps {
  entries: Attendance[];
  monthSummary?: MonthSummary | null;
  settings?: AttendanceSettings | null;
}

export function SmartAttendanceInsights({
  entries,
  monthSummary,
  settings,
}: SmartAttendanceInsightsProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  // Compute 7-day trailing stats
  const recentStats = useMemo(() => {
    const today = dayjs();
    const last7Days = entries.filter((e) => {
      const diff = today.diff(dayjs(e.date), 'day');
      return diff >= 0 && diff <= 7;
    });

    const totalMinutes = last7Days.reduce((acc, e) => acc + (e.workedMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const lateDays = last7Days.filter((e) => (e.lateMinutes || 0) > 0).length;
    const hasShifts = last7Days.length > 0;
    const onTimeRate = hasShifts ? Math.round(((last7Days.length - lateDays) / last7Days.length) * 100) : 0;

    // Fatigue / Load Status
    const weeklyHoursNum = parseFloat(totalHours);
    let fatigueStatus = 'Fresh / Rested 🌱';
    let fatigueColor = '#10b981';
    let fatiguePercent = 25;

    if (!hasShifts) {
      fatigueStatus = 'Fresh / Rested 🌱';
      fatigueColor = '#10b981';
      fatiguePercent = 25;
    } else if (weeklyHoursNum >= 45) {
      fatigueStatus = 'High Workload Warning ⚠️';
      fatigueColor = '#f43f5e';
      fatiguePercent = 95;
    } else if (weeklyHoursNum >= 38) {
      fatigueStatus = 'Productive & Steady ⚡';
      fatigueColor = '#38bdf8';
      fatiguePercent = 80;
    } else if (weeklyHoursNum < 20) {
      fatigueStatus = 'Light Load 🧘';
      fatigueColor = '#818cf8';
      fatiguePercent = 40;
    }

    // Overtime Projection
    const totalOTMinutes = entries.reduce((acc, e) => acc + (e.overtimeMinutes || 0), 0);
    const otHours = Math.round(totalOTMinutes / 60);
    const hourlyRate = settings?.overtimePayPerHour || 150;
    const projectedBonus = otHours * hourlyRate;

    return {
      totalHours,
      onTimeRate,
      fatigueStatus,
      fatigueColor,
      fatiguePercent,
      otHours,
      projectedBonus,
    };
  }, [entries, settings]);

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '20px',
        background: isDark
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(15, 23, 42, 0.7) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(255, 255, 255, 0.9) 100%)',
        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.15)'}`,
        boxShadow: isDark
          ? '0 16px 40px rgba(0, 0, 0, 0.35)'
          : '0 12px 32px rgba(15, 23, 42, 0.05)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AutoAwesomeRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.1 }}>
              WorkTrack Intelligence & Wellness
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              AI summary of attendance rhythm, stamina & payroll projections
            </Typography>
          </Box>
        </Box>

        <Chip
          label="Live Analytics"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
            color: isDark ? '#38bdf8' : '#2563eb',
            border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
          }}
        />
      </Box>

      {/* 3 Analytics Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {/* Card 1: 7-Day Rhythm */}
        <Box
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUpRoundedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              7-Day Punctuality
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#38bdf8' }}>
            {recentStats.totalHours === '0.0' ? 'No shifts yet' : `${recentStats.onTimeRate}% On-Time`}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
            {recentStats.totalHours === '0.0' ? '0 hrs worked over last 7 days' : `${recentStats.totalHours} hrs worked over last 7 days`}
          </Typography>
        </Box>

        {/* Card 2: Fatigue & Balance */}
        <Box
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HealthAndSafetyRoundedIcon sx={{ fontSize: 18, color: recentStats.fatigueColor }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Workload Health
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 900, color: recentStats.fatigueColor }}>
            {recentStats.fatigueStatus}
          </Typography>
          <Box sx={{ mt: 1.2, width: '100%' }}>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${recentStats.fatiguePercent}%`,
                  bgcolor: recentStats.fatigueColor,
                  borderRadius: 3,
                  transition: 'width 0.8s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Card 3: Overtime & Bonus Projected */}
        <Box
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PaymentsRoundedIcon sx={{ fontSize: 18, color: '#22c55e' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Overtime Bonus
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>
            +{recentStats.otHours}h OT
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
            ~₹{recentStats.projectedBonus.toLocaleString('en-IN')} projected payroll input
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
