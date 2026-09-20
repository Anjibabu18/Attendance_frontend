import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

interface SlackPresenceSyncCardProps {
  isPunchedIn?: boolean;
  isOnBreak?: boolean;
}

export function SlackPresenceSyncCard({
  isPunchedIn = true,
  isOnBreak = false,
}: SlackPresenceSyncCardProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [slackEnabled, setSlackEnabled] = useState(true);
  const [teamsEnabled, setTeamsEnabled] = useState(true);
  const [autoDnd, setAutoDnd] = useState(true);
  const [customStatus, setCustomStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Compute live presence status based on attendance with high contrast colors
  const liveStatus = isOnBreak
    ? {
        text: '☕ Coffee / Meal Break',
        subtext: 'Auto-clears when punch resumes',
        color: isDark ? '#fbbf24' : '#b45309',
        badgeBg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
      }
    : isPunchedIn
    ? {
        text: '🟢 Working On-Site · Active Shift',
        subtext: 'Synced via WorkTrack hardware badge',
        color: isDark ? '#34d399' : '#047857',
        badgeBg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
      }
    : {
        text: '🌙 Out of Office · Do Not Disturb',
        subtext: 'Shift ended · Notifications muted',
        color: isDark ? '#e2e8f0' : '#1e293b',
        badgeBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
      };

  const handleTestSync = () => {
    hapticTap();
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      hapticSuccess();
      toastSuccess(
        `Synced presence to Slack & Teams: "${customStatus.trim() || liveStatus.text}"`
      );
    }, 800);
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Slack &amp; Teams Auto-Presence Sync
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              Reflect your punch state directly to corporate chat
            </Typography>
          </Box>
        </Box>

        <Chip
          size="small"
          icon={<SyncAltRoundedIcon sx={{ fontSize: '13px !important' }} />}
          label="Live Sync Active"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: 'rgba(99, 102, 241, 0.12)',
            color: '#6366f1',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        />
      </Box>

      {/* Live Presence Preview Box */}
      <Box
        sx={{
          p: 2,
          borderRadius: '16px',
          bgcolor: liveStatus.badgeBg,
          border: '1px solid',
          borderColor: liveStatus.border,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
            Current Broadcast Status
          </Typography>
          <Typography sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 900, color: liveStatus.color, letterSpacing: '-0.01em' }}>
            {customStatus.trim() ? `💬 ${customStatus}` : liveStatus.text}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.25, fontWeight: 600 }}>
            {liveStatus.subtext}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label="Slack"
            onClick={() => { hapticPop(); setSlackEnabled(!slackEnabled); }}
            sx={{
              fontWeight: 800,
              fontSize: 11,
              cursor: 'pointer',
              bgcolor: slackEnabled ? '#4a154b1a' : 'action.hover',
              color: slackEnabled ? '#4a154b' : 'text.disabled',
              border: slackEnabled ? '1px solid #4a154b44' : '1px solid transparent',
              '&:hover': { bgcolor: '#4a154b2a' },
            }}
          />
          <Chip
            size="small"
            label="MS Teams"
            onClick={() => { hapticPop(); setTeamsEnabled(!teamsEnabled); }}
            sx={{
              fontWeight: 800,
              fontSize: 11,
              cursor: 'pointer',
              bgcolor: teamsEnabled ? '#6264a71a' : 'action.hover',
              color: teamsEnabled ? '#4f52b2' : 'text.disabled',
              border: teamsEnabled ? '1px solid #6264a744' : '1px solid transparent',
              '&:hover': { bgcolor: '#6264a72a' },
            }}
          />
        </Box>
      </Box>

      {/* Override custom message & ping action */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          size="small"
          placeholder="Override custom status (e.g. In deep focus / Client workshop)"
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: 13,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleTestSync}
          disabled={syncing}
          startIcon={<SendRoundedIcon fontSize="small" />}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 13,
            py: { xs: 1.25, sm: 1 },
            px: 2.5,
            width: { xs: '100%', sm: 'auto' },
            whiteSpace: 'nowrap',
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          {syncing ? 'Broadcasting...' : 'Broadcast'}
        </Button>
      </Box>

      {/* Auto DND Toggle & App switches */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsOffRoundedIcon sx={{ fontSize: 17, color: '#f59e0b' }} />
          <Typography sx={{ fontSize: { xs: 11.5, sm: 12.5 }, fontWeight: 700, color: 'text.primary' }}>
            Auto-Mute Notifications after Shift Punch-Out
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={autoDnd}
          onChange={(e) => {
            hapticPop();
            setAutoDnd(e.target.checked);
          }}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#6366f1',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              bgcolor: '#6366f1',
            },
          }}
        />
      </Box>
    </Box>
  );
}
