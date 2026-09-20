import React, { useMemo } from 'react';
import { Box, Chip, LinearProgress, Tooltip, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop } from '../utils/haptics';
import { Attendance, MonthSummary } from '../types';

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  progressText: string;
}

interface AttendanceBadgesLeagueProps {
  entries?: Attendance[];
  monthSummary?: MonthSummary | null;
}

export function AttendanceBadgesLeague({ entries = [], monthSummary }: AttendanceBadgesLeagueProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const { badges, divisionLabel } = useMemo(() => {
    const presentEntries = entries.filter((e) => e.status === 'PRESENT');
    const presentCount = monthSummary?.presentDays ?? presentEntries.length;
    const onTimeEntries = presentEntries.filter((e) => (e.lateMinutes || 0) <= 0);
    const onTimeRate = presentCount > 0 ? Math.round((onTimeEntries.length / presentCount) * 100) : 0;

    // Early Bird: clocked in on time 5 days
    const earlyCount = Math.min(5, onTimeEntries.length);
    const earlyUnlocked = earlyCount >= 5;

    // Century Club: 100% on time
    const centuryUnlocked = presentCount >= 10 && onTimeRate === 100;

    // Ironclad Streak: 15 days
    const streakCount = Math.min(15, presentCount);
    const streakUnlocked = presentCount >= 15;

    // Wellness Master: healthy stamina with <= 0 unapproved heavy OT
    const heavyOt = entries.filter((e) => (e.overtimeMinutes || 0) > 90).length;
    const wellnessUnlocked = presentCount > 0 && heavyOt === 0;

    const badgeList: Badge[] = [
      {
        id: '1',
        name: 'Early Bird',
        icon: '🌅',
        color: '#f59e0b',
        desc: 'Clocked in on-time 5 days this month',
        unlocked: earlyUnlocked,
        progress: Math.min(100, Math.round((earlyCount / 5) * 100)),
        progressText: `${earlyCount}/5 days completed`,
      },
      {
        id: '2',
        name: 'Century Club',
        icon: '💯',
        color: '#10b981',
        desc: '100% On-Time arrivals this month',
        unlocked: centuryUnlocked,
        progress: onTimeRate,
        progressText: `${onTimeRate}% on-time score`,
      },
      {
        id: '3',
        name: 'Ironclad Streak',
        icon: '⚡',
        color: '#38bdf8',
        desc: '15+ working days without absence',
        unlocked: streakUnlocked,
        progress: Math.min(100, Math.round((streakCount / 15) * 100)),
        progressText: `${streakCount}/15 days streak`,
      },
      {
        id: '4',
        name: 'Wellness Master',
        icon: '🌿',
        color: '#8b5cf6',
        desc: 'Healthy daily stamina & work-life balance',
        unlocked: wellnessUnlocked,
        progress: wellnessUnlocked ? 100 : presentCount > 0 ? 75 : 20,
        progressText: wellnessUnlocked ? 'Optimal balance maintained' : presentCount > 0 ? 'Good stamina' : 'New cycle',
      },
    ];

    let div = 'Bronze Division';
    if (presentCount >= 20) div = 'Diamond Division #1';
    else if (presentCount >= 12) div = 'Gold Division #2';
    else if (presentCount >= 5) div = 'Silver Division #3';

    return { badges: badgeList, divisionLabel: div };
  }, [entries, monthSummary]);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 12px 32px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <EmojiEventsRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 16 } }}>
              Punctuality Badges &amp; League
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Gamified attendance milestones, consistency trophies &amp; status
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<WhatshotRoundedIcon sx={{ fontSize: '15px !important', color: '#f59e0b !important' }} />}
          label={divisionLabel}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: '#d97706',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        />
      </Box>

      {/* Badges Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {badges.map((b) => (
          <Box
            key={b.id}
            component={motion.div}
            whileHover={{ y: -3 }}
            onClick={hapticPop}
            sx={{
              p: 2,
              borderRadius: '16px',
              background: isDark
                ? b.unlocked
                  ? `linear-gradient(135deg, ${b.color}15 0%, rgba(15, 23, 42, 0.7) 100%)`
                  : 'rgba(255, 255, 255, 0.02)'
                : b.unlocked
                ? `linear-gradient(135deg, ${b.color}10 0%, #ffffff 100%)`
                : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: b.unlocked ? `${b.color}40` : 'divider',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Typography sx={{ fontSize: 28 }}>{b.icon}</Typography>
                <Chip
                  label={b.unlocked ? 'UNLOCKED' : `${b.progress}%`}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: 9,
                    height: 20,
                    bgcolor: b.unlocked ? `${b.color}25` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: b.unlocked ? b.color : 'text.secondary',
                    border: b.unlocked ? `1px solid ${b.color}50` : 'none',
                  }}
                />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: b.unlocked ? 'text.primary' : 'text.secondary', mb: 0.5 }}>
                {b.name}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3, mb: 2 }}>
                {b.desc}
              </Typography>
            </Box>

            <Box>
              <LinearProgress
                variant="determinate"
                value={b.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  mb: 1,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: b.color,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>
                {b.progressText}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
