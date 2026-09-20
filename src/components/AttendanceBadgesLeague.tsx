import React from 'react';
import { Box, Chip, LinearProgress, Tooltip, Typography } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import MilitaryTechRoundedIcon from '@mui/icons-material/MilitaryTechRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop } from '../utils/haptics';

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

const BADGES: Badge[] = [
  { id: '1', name: 'Early Bird', icon: '🌅', color: '#f59e0b', desc: 'Clocked in before 9:15 AM 5 days in a row', unlocked: true, progress: 100, progressText: '5/5 days completed' },
  { id: '2', name: 'Century Club', icon: '💯', color: '#10b981', desc: '100% On-Time arrivals this month', unlocked: false, progress: 92, progressText: '92% on-time score' },
  { id: '3', name: 'Ironclad Streak', icon: '⚡', color: '#38bdf8', desc: '15+ consecutive working days without absence', unlocked: false, progress: 80, progressText: '12/15 days streak' },
  { id: '4', name: 'Wellness Master', icon: '🌿', color: '#8b5cf6', desc: 'Zero unapproved overtime with healthy daily stamina', unlocked: true, progress: 100, progressText: 'Optimal balance maintained' },
];

export function AttendanceBadgesLeague() {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <EmojiEventsRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              Punctuality Badges &amp; League
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Gamified attendance milestones, consistency trophies &amp; status
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<WhatshotRoundedIcon sx={{ fontSize: '15px !important', color: '#f59e0b !important' }} />}
          label="Diamond Division #3"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: '#d97706',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        />
      </Box>

      {/* Badges Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {BADGES.map((b) => (
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
                ? `linear-gradient(135deg, ${b.color}10 0%, rgba(255, 255, 255, 0.9) 100%)`
                : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${
                b.unlocked
                  ? `${b.color}50`
                  : isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.06)'
              }`,
              boxShadow: b.unlocked ? `0 8px 24px ${b.color}18` : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1.5,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: 28, lineHeight: 1 }}>{b.icon}</Typography>
                <Chip
                  label={b.unlocked ? 'UNLOCKED' : `${b.progress}%`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 900,
                    bgcolor: b.unlocked ? `${b.color}25` : 'action.hover',
                    color: b.unlocked ? b.color : 'text.disabled',
                    border: `1px solid ${b.unlocked ? `${b.color}40` : 'transparent'}`,
                  }}
                />
              </Box>

              <Typography sx={{ fontWeight: 900, fontSize: 14, color: b.unlocked ? b.color : 'text.primary' }}>
                {b.name}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5, lineHeight: 1.4 }}>
                {b.desc}
              </Typography>
            </Box>

            <Box>
              <Box sx={{ height: 6, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', mb: 0.5 }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${b.progress}%`,
                    bgcolor: b.color,
                    borderRadius: 3,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 700 }}>
                {b.progressText}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
