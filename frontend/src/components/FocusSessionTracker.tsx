import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

export function FocusSessionTracker() {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess, toastInfo } = useToast();

  const [sessionLengthMin, setSessionLengthMin] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      setIsActive(false);
      setCompletedSessions((prev) => prev + 1);
      hapticSuccess();
      toastSuccess('🎯 Great work! Deep work focus session completed.');
      setSecondsRemaining(sessionLengthMin * 60);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, sessionLengthMin]);

  const handleSelectLength = (mins: number) => {
    hapticTap();
    setIsActive(false);
    setSessionLengthMin(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleTogglePlay = () => {
    hapticPop();
    if (!isActive) {
      toastInfo(`Starting ${sessionLengthMin}m Deep Work session. Slack presence synced.`);
    }
    setIsActive((prev) => !prev);
  };

  const handleReset = () => {
    hapticTap();
    setIsActive(false);
    setSecondsRemaining(sessionLengthMin * 60);
  };

  const progress = Math.round(
    ((sessionLengthMin * 60 - secondsRemaining) / (sessionLengthMin * 60)) * 100
  );

  const displayMinutes = Math.floor(secondsRemaining / 60);
  const displaySeconds = secondsRemaining % 60;
  const formattedTime = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

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
              bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CenterFocusStrongRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
              Deep Work & Focus Productivity Meter
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              Track distraction-free sprint sessions during your shift
            </Typography>
          </Box>
        </Box>

        <Chip
          size="small"
          label={isActive ? '🔥 In Deep Focus (DND)' : 'Ready to Sprint'}
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: isActive ? 'rgba(236, 72, 153, 0.15)' : 'action.hover',
            color: isActive ? '#ec4899' : 'text.secondary',
            border: isActive ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid transparent',
          }}
        />
      </Box>

      {/* Timer & Controls Display */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' },
          gap: 2,
          p: 2,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.04)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
          mb: 2,
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 900, fontFamily: 'monospace', color: '#3b82f6', letterSpacing: '-0.03em' }}>
            {formattedTime}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleTogglePlay}
              sx={{
                bgcolor: '#3b82f6',
                color: '#ffffff',
                '&:hover': { bgcolor: '#2563eb' },
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              {isActive ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
            </IconButton>
            <IconButton
              onClick={handleReset}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: 'text.secondary',
              }}
            >
              <RestartAltRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Interval preset buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
          {[25, 45, 60].map((mins) => (
            <Button
              key={mins}
              size="small"
              variant={sessionLengthMin === mins ? 'contained' : 'outlined'}
              onClick={() => handleSelectLength(mins)}
              sx={{
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: 11,
                py: 0.5,
                bgcolor: sessionLengthMin === mins ? '#3b82f6' : 'transparent',
                borderColor: sessionLengthMin === mins ? '#3b82f6' : 'divider',
              }}
            >
              {mins}m Sprint
            </Button>
          ))}
        </Box>
      </Box>

      {/* Daily Ratio Breakdown */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>TODAY'S DEEP WORK</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#3b82f6' }}>
              {(completedSessions * 0.5).toFixed(1)} hrs ({completedSessions} sprints)
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>MEETINGS / SYNC</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>1.2 hrs</Typography>
          </Box>
        </Box>

        <Chip
          size="small"
          icon={<DoneAllRoundedIcon sx={{ fontSize: '13px !important' }} />}
          label="Optimal Focus Achieved"
          sx={{
            fontWeight: 800,
            fontSize: 10,
            bgcolor: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
          }}
        />
      </Box>
    </Box>
  );
}
