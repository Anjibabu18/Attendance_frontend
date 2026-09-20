import React, { useState } from 'react';
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
  Tooltip,
  Typography,
} from '@mui/material';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ContactlessRoundedIcon from '@mui/icons-material/ContactlessRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import FlipCameraAndroidRoundedIcon from '@mui/icons-material/FlipCameraAndroidRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';

import { AppLogo } from './AppLogo';
import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

interface DigitalEmployeeBadgeCardProps {
  open: boolean;
  onClose: () => void;
  employeeName?: string;
  employeeCode?: string;
  roleName?: string;
  departmentName?: string;
  photoUrl?: string | null;
  bloodGroup?: string;
}

export function DigitalEmployeeBadgeCard({
  open,
  onClose,
  employeeName = 'Venkata Rao',
  employeeCode = 'EMP001',
  roleName = 'Lead Architect',
  departmentName = 'Engineering & Technology',
  photoUrl,
  bloodGroup = 'O+ Positive',
}: DigitalEmployeeBadgeCardProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    hapticPop();
    setIsFlipped((prev) => !prev);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'transparent',
          boxShadow: 'none',
          backgroundImage: 'none',
          overflow: 'visible',
        },
      }}
    >
      <Box sx={{ position: 'relative', p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Top Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -12,
            right: 8,
            zIndex: 10,
            bgcolor: isDark ? 'rgba(30,41,59,0.9)' : '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            '&:hover': { bgcolor: isDark ? 'rgba(51,65,85,1)' : '#f1f5f9' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        {/* 3D Tilt Badge Container */}
        <Tilt
          tiltMaxAngleX={12}
          tiltMaxAngleY={12}
          glareEnable={true}
          glareMaxOpacity={0.2}
          glareBorderRadius="24px"
          scale={1.02}
          transitionSpeed={500}
          style={{ width: '100%', maxWidth: 360, perspective: 1000 }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: 520,
              borderRadius: '24px',
              transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ── FRONT FACE ── */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '24px',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
                border: isDark ? '2px solid rgba(56, 189, 248, 0.3)' : '2px solid rgba(2, 132, 199, 0.2)',
                boxShadow: isDark
                  ? '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(56, 189, 248, 0.15)'
                  : '0 24px 64px rgba(15, 23, 42, 0.15), 0 0 32px rgba(2, 132, 199, 0.1)',
                overflow: 'hidden',
              }}
            >
              {/* Lanyard Hole Mock */}
              <Box
                sx={{
                  width: 48,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 1,
                }}
              />

              {/* Header: Company & Contactless NFC icon */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AppLogo size={28} />
                  <Typography sx={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em' }}>
                    WorkTrack Tech
                  </Typography>
                </Box>
                <ContactlessRoundedIcon sx={{ color: '#0284c7', fontSize: 28 }} />
              </Box>

              {/* Employee Photo with Status Ring */}
              <Box sx={{ position: 'relative', my: 1 }}>
                <Avatar
                  src={photoUrl || undefined}
                  sx={{
                    width: 110,
                    height: 110,
                    border: '4px solid',
                    borderColor: '#0284c7',
                    boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)',
                    fontWeight: 900,
                    fontSize: 36,
                    bgcolor: '#0284c7',
                  }}
                >
                  {employeeName[0]}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    border: '3px solid',
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                  }}
                />
              </Box>

              {/* Name & Title */}
              <Box sx={{ textAlign: 'center', my: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.2 }}>
                  {employeeName}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#0284c7', fontWeight: 800, mt: 0.25 }}>
                  {roleName}
                </Typography>
                <Chip
                  size="small"
                  label={departmentName}
                  sx={{
                    mt: 0.75,
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                />
              </Box>

              {/* Holographic Security Strip */}
              <Box
                sx={{
                  width: '100%',
                  py: 0.5,
                  my: 1,
                  background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%)',
                  borderRadius: '6px',
                  textAlign: 'center',
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)',
                }}
              >
                ★ Verified Digital Corporate Identity ★
              </Box>

              {/* Turnstile Access Barcode & QR */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>ID NUMBER</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                    {employeeCode}
                  </Typography>
                </Box>
                <Box sx={{ p: 0.5, bgcolor: '#ffffff', borderRadius: '8px', color: '#0f172a', display: 'grid', placeItems: 'center' }}>
                  <QrCode2RoundedIcon sx={{ fontSize: 36 }} />
                </Box>
              </Box>
            </Box>

            {/* ── BACK FACE ── */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '24px',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
                  : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '2px solid',
                borderColor: 'divider',
                transform: 'rotateY(180deg)',
                boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(15,23,42,0.15)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityRoundedIcon sx={{ color: '#10b981' }} />
                <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Access & Safety Record</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, justifyContent: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>FACILITY CLEARANCE</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>
                    Level 3 · All Floors & Tech Labs
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>BLOOD GROUP</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{bloodGroup}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>EMERGENCY CONTACT</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>+1 (555) 019-2834 (Family)</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>VALIDITY</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }}>DEC 2027 · Active Status</Typography>
                </Box>
              </Box>

              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                  Property of WorkTrack Technologies Inc. If found, please return to HQ Reception.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Tilt>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleFlip}
            startIcon={<FlipCameraAndroidRoundedIcon fontSize="small" />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#0284c7',
              '&:hover': { bgcolor: '#0369a1' },
            }}
          >
            {isFlipped ? 'Show Front' : 'Flip Badge'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
