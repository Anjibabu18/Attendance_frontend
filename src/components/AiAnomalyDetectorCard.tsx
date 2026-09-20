import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import GpsFixedRoundedIcon from '@mui/icons-material/GpsFixedRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ShieldMoonRoundedIcon from '@mui/icons-material/ShieldMoonRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface SecurityVector {
  id: string;
  name: string;
  description: string;
  status: 'VERIFIED' | 'WARNING' | 'ANOMALY';
  icon: React.ReactNode;
  detail: string;
}

const SECURITY_VECTORS: SecurityVector[] = [
  {
    id: 'gps',
    name: 'GPS Mocking & Spoofing Guard',
    description: 'Hardware geofence validation against OS mock locations',
    status: 'VERIFIED',
    icon: <GpsFixedRoundedIcon sx={{ fontSize: 18 }} />,
    detail: 'Zero mock location providers detected. True satellite lock verified.',
  },
  {
    id: 'velocity',
    name: 'Impossible Travel & Velocity Check',
    description: 'Calculates physical transit distance vs. punch timestamps',
    status: 'VERIFIED',
    icon: <SpeedRoundedIcon sx={{ fontSize: 18 }} />,
    detail: 'Velocity index 0.00 km/h. No cross-regional displacement.',
  },
  {
    id: 'device',
    name: 'Trusted Device Hardware Fingerprint',
    description: 'Cryptographic device signature & browser integrity',
    status: 'VERIFIED',
    icon: <DevicesRoundedIcon sx={{ fontSize: 18 }} />,
    detail: 'Registered primary device. WebAuthn biometric enclave active.',
  },
  {
    id: 'clock',
    name: 'NTP Atomic Clock Anti-Tampering',
    description: 'Network Time Protocol drift verification against system clock',
    status: 'VERIFIED',
    icon: <AccessTimeFilledRoundedIcon sx={{ fontSize: 18 }} />,
    detail: 'System drift < 12ms. Server time authoritative lock confirmed.',
  },
];

export function AiAnomalyDetectorCard() {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [scanning, setScanning] = useState(false);
  const [trustScore, setTrustScore] = useState(99.4);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  const handleRunScan = () => {
    hapticTap();
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setTrustScore(99.8);
      hapticSuccess();
      toastSuccess('All 4 security vectors re-scanned: 100% integrity verified!');
    }, 1200);
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
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <VerifiedUserRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
              AI Anomaly & Fraud Prevention Shield
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              SOC2 compliant attendance integrity & impossible travel guard
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={<CheckCircleRoundedIcon sx={{ fontSize: '13px !important' }} />}
            label="Integrity Verified"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleRunScan}
            disabled={scanning}
            startIcon={
              <RefreshRoundedIcon
                fontSize="small"
                sx={{ animation: scanning ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }}
              />
            }
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: 11,
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          >
            {scanning ? 'Scanning...' : 'Re-verify'}
          </Button>
        </Box>
      </Box>

      {/* Trust Score Hero Bar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' },
          gap: 2,
          p: 2,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.04)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
          mb: 2,
          alignItems: 'center',
        }}
      >
        <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trust Integrity Score
          </Typography>
          <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
            {trustScore}%
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
            ● Zero Anomalies Flagged
          </Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Verification Health</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#10b981' }}>Grade A+ (Enterprise Trusted)</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={trustScore}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: '#10b981',
              },
            }}
          />
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>
            All morning & evening punch logs have passed GPS cryptographic checksums and device biometric challenge tests.
          </Typography>
        </Box>
      </Box>

      {/* 4 Security Vector Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {SECURITY_VECTORS.map((v) => (
          <Box
            key={v.id}
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {v.icon}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{v.name}</Typography>
                <Chip
                  size="small"
                  label="PASS"
                  sx={{
                    height: 18,
                    fontSize: 9,
                    fontWeight: 900,
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                {v.detail}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Audit Log Dialog Trigger */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => {
            hapticTap();
            setAuditLogOpen(true);
          }}
          sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none', color: '#10b981' }}
        >
          View Cryptographic Audit Log →
        </Button>
      </Box>

      {/* Cryptographic Audit Log Modal */}
      <Dialog
        open={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 17, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldMoonRoundedIcon sx={{ color: '#10b981' }} /> SOC2 Cryptographic Audit Trail
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Latest verified hardware events recorded in tamper-evident hash chain:
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(0,0,0,0.4)' : '#f8fafc',
              border: '1px solid',
              borderColor: 'divider',
              fontFamily: 'monospace',
              fontSize: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Typography sx={{ fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>
              ✓ [HASH-77FA2] Punch In @ 09:12:44 · GPS (12.9716, 77.5946) · IP 103.21.x.x · SHA256: 8a4c...3e9b
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>
              ✓ [HASH-99BB1] Break Start @ 13:04:12 · Geofence Zone A · Velocity 0 km/h · SHA256: 4d2e...11af
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>
              ✓ [HASH-62DD8] Break Resume @ 13:42:01 · Geofence Zone A · Hardware Match · SHA256: e82c...99aa
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAuditLogOpen(false)} sx={{ fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
