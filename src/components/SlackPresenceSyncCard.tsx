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

  // Compute live presence status based on attendance
  const liveStatus = isOnBreak
    ? { text: '☕ Coffee / Meal Break', subtext: 'Auto-clears when punch resumes', color: '#f59e0b' }
    : isPunchedIn
    ? { text: '🟢 Working On-Site · Desk E-01', subtext: 'Synced via WorkTrack hardware badge', color: '#10b981' }
    : { text: '🌙 Out of Office · Do Not Disturb', subtext: 'Shift ended · Notifications muted', color: '#94a3b8' };

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
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
              Slack & Teams Auto-Presence Sync
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
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
          border: '1px solid',
          borderColor: 'divider',
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
          <Typography sx={{ fontSize: 16, fontWeight: 900, color: liveStatus.color }}>
            {customStatus.trim() ? `💬 ${customStatus}` : liveStatus.text}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
            {liveStatus.subtext}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label="Slack"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: slackEnabled ? '#4a154b1a' : 'action.hover',
              color: slackEnabled ? '#e01e5a' : 'text.disabled',
              border: slackEnabled ? '1px solid #4a154b33' : '1px solid transparent',
            }}
          />
          <Chip
            size="small"
            label="MS Teams"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: teamsEnabled ? '#6264a71a' : 'action.hover',
              color: teamsEnabled ? '#6264a7' : 'text.disabled',
              border: teamsEnabled ? '1px solid #6264a733' : '1px solid transparent',
            }}
          />
        </Box>
      </Box>

      {/* Override custom message & ping action */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
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
            fontSize: 12,
            px: 2,
            whiteSpace: 'nowrap',
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          {syncing ? 'Broadcasting...' : 'Broadcast'}
        </Button>
      </Box>

      {/* Auto DND Toggle & App switches */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsOffRoundedIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
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
