import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticError, hapticSuccess, hapticTap } from '../utils/haptics';

interface OnSiteEmployee {
  id: string;
  name: string;
  role: string;
  zone: string;
  safe: boolean;
}

interface EvacuationRollCallModalProps {
  open: boolean;
  onClose: () => void;
  employees?: OnSiteEmployee[];
}

export function EvacuationRollCallModal({ open, onClose, employees = [] }: EvacuationRollCallModalProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess, toastWarning } = useToast();

  const [staffList, setStaffList] = useState<OnSiteEmployee[]>(employees);

  useEffect(() => {
    if (employees && employees.length > 0) {
      setStaffList(employees);
    }
  }, [employees]);

  const safeCount = staffList.filter((s) => s.safe).length;
  const totalCount = staffList.length;
  const missingCount = totalCount - safeCount;
  const safePercent = Math.round((safeCount / Math.max(1, totalCount)) * 100);

  const handleToggleSafe = (id: string) => {
    hapticTap();
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, safe: !s.safe } : s))
    );
  };

  const handleBroadcastAlert = () => {
    hapticError();
    toastWarning('🚨 Emergency evacuation broadcast sent to all on-site mobile devices!');
  };

  const handleExportRoster = () => {
    hapticSuccess();
    toastSuccess('Emergency muster roll exported for First Responders!');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDark ? '#0f172a' : '#ffffff',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        },
      }}
    >
      {/* Alert Header */}
      <DialogTitle
        sx={{
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: '#ef4444',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              animation: 'pulseRed 1.2s infinite ease-in-out',
              '@keyframes pulseRed': {
                '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' },
                '50%': { transform: 'scale(1.06)', boxShadow: '0 0 0 10px rgba(239,68,68,0)' },
              },
            }}
          >
            <WarningAmberRoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: '#ef4444' }}>
              Emergency Evacuation Roll Call
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
              Live Facility Safety & Muster Station Headcount
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Headcount Stat Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ p: 1.75, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>ON-SITE NOW</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{totalCount}</Typography>
          </Box>
          <Box sx={{ p: 1.75, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>ACCOUNTED SAFE</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{safeCount}</Typography>
          </Box>
          <Box sx={{ p: 1.75, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>UNACCOUNTED</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{missingCount}</Typography>
          </Box>
        </Box>

        {/* Evacuation Progress Meter */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Muster Station Clearance</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: safePercent === 100 ? '#10b981' : '#f59e0b' }}>
              {safePercent}% Cleared
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={safePercent}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: safePercent === 100 ? '#10b981' : '#ef4444',
              },
            }}
          />
        </Box>

        {/* Live Employee Check-Off List */}
        <Typography sx={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
          Live On-Site Personnel Roster
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 240, overflowY: 'auto' }}>
          {staffList.map((s) => (
            <Box
              key={s.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.25,
                borderRadius: '12px',
                bgcolor: s.safe
                  ? (isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.04)')
                  : (isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.04)'),
                border: '1px solid',
                borderColor: s.safe ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 800, bgcolor: s.safe ? '#10b981' : '#ef4444' }}>
                  {s.name[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{s.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {s.role} · <span style={{ color: '#0284c7' }}>{s.zone}</span>
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant={s.safe ? 'contained' : 'outlined'}
                onClick={() => handleToggleSafe(s.id)}
                sx={{
                  borderRadius: '8px',
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: 'none',
                  py: 0.4,
                  bgcolor: s.safe ? '#10b981' : 'transparent',
                  borderColor: s.safe ? '#10b981' : '#ef4444',
                  color: s.safe ? '#ffffff' : '#ef4444',
                  '&:hover': {
                    bgcolor: s.safe ? '#059669' : 'rgba(239, 68, 68, 0.08)',
                  },
                }}
              >
                {s.safe ? 'Safe ✅' : 'Mark Safe'}
              </Button>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleExportRoster}
          startIcon={<FileDownloadRoundedIcon />}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
        >
          Export Muster Roll
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleBroadcastAlert}
          startIcon={<CampaignRoundedIcon />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: '#ef4444',
            '&:hover': { bgcolor: '#dc2626' },
          }}
        >
          Broadcast Evacuation Alarm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
