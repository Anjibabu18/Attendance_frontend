import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { AppLogo } from '../components/AppLogo';
import { useToast } from '../components/Toast';
import { hapticError, hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

export default function KioskPage() {
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pin, setPin] = useState('');
  const [punchMode, setPunchMode] = useState<'in' | 'out'>('in');
  const [scanning, setScanning] = useState(false);
  const [confirmedEmployee, setConfirmedEmployee] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebCam setup for kiosk
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        // Fallback gracefully if camera is blocked/unavailable
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleKeyPress = (num: string) => {
    hapticTap();
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    hapticPop();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    hapticPop();
    setPin('');
  };

  const handleExecutePunch = () => {
    if (!pin.trim()) {
      hapticError();
      toastError('Please enter your Employee ID or PIN');
      return;
    }

    setScanning(true);
    hapticTap();

    setTimeout(() => {
      setScanning(false);
      hapticSuccess();
      const name = pin === '1234' || pin === '001' ? 'Venkata Rao (EMP001)' : `Employee (${pin})`;
      setConfirmedEmployee(name);
      toastSuccess(`Punch ${punchMode.toUpperCase()} verified successfully!`);
      setPin('');

      setTimeout(() => {
        setConfirmedEmployee(null);
      }, 4000);
    }, 1400);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#060b17',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background glow effects */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: '20%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          right: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <AppLogo size={42} animated={true} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>
              WorkTrack Kiosk
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Reception Entrance Check-In Station
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: { xs: 20, md: 28 }, fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8' }}>
            {dayjs(currentTime).format('hh:mm:ss A')}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
            {dayjs(currentTime).format('dddd, MMMM D, YYYY')}
          </Typography>
        </Box>
      </Box>

      {/* Main Kiosk Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            alignItems: 'center',
          }}
        >
          {/* Left Column: Live Camera & Scanner */}
          <Box
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Mode Selector */}
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                p: 0.75,
                borderRadius: '16px',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                mb: 3,
              }}
            >
              <Button
                variant={punchMode === 'in' ? 'contained' : 'text'}
                startIcon={<LoginRoundedIcon />}
                onClick={() => setPunchMode('in')}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 900,
                  bgcolor: punchMode === 'in' ? '#22c55e' : 'transparent',
                  color: '#fff',
                  '&:hover': { bgcolor: punchMode === 'in' ? '#16a34a' : 'rgba(255,255,255,0.05)' },
                }}
              >
                Punch IN
              </Button>
              <Button
                variant={punchMode === 'out' ? 'contained' : 'text'}
                startIcon={<LogoutRoundedIcon />}
                onClick={() => setPunchMode('out')}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 900,
                  bgcolor: punchMode === 'out' ? '#ef4444' : 'transparent',
                  color: '#fff',
                  '&:hover': { bgcolor: punchMode === 'out' ? '#dc2626' : 'rgba(255,255,255,0.05)' },
                }}
              >
                Punch OUT
              </Button>
            </Box>

            {/* Video Feed Box */}
            <Box
              sx={{
                width: '100%',
                height: 280,
                borderRadius: '20px',
                bgcolor: '#000',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: scanning
                  ? '#38bdf8'
                  : punchMode === 'in'
                  ? 'rgba(34, 197, 94, 0.4)'
                  : 'rgba(239, 68, 68, 0.4)',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Scanning Target Reticle Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 24,
                  border: '2px dashed rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                }}
              />

              {scanning && (
                <motion.div
                  animate={{ y: [0, 240, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: '#38bdf8',
                    boxShadow: '0 0 16px #38bdf8',
                  }}
                />
              )}

              {/* Verified Splash Overlay */}
              <AnimatePresence>
                {confirmedEmployee && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(16, 185, 129, 0.95)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      p: 3,
                      textAlign: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 64, color: '#fff' }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 22, color: '#fff' }}>
                      PUNCH {punchMode.toUpperCase()} CONFIRMED
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#ecfdf5' }}>
                      {confirmedEmployee}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#d1fae5' }}>
                      {dayjs().format('hh:mm A')} · Onsite Kiosk Verified
                    </Typography>
                  </Box>
                )}
              </AnimatePresence>
            </Box>

            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2, textAlign: 'center' }}>
              Position your face in the box and enter your 4-digit PIN on the right.
            </Typography>
          </Box>

          {/* Right Column: Touch PIN Keypad */}
          <Box
            sx={{
              p: 3.5,
              borderRadius: '24px',
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            {/* PIN Display */}
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 64,
              }}
            >
              <Typography
                sx={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '0.3em',
                  color: pin ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {pin ? pin.split('').map(() => '●').join('') : 'ENTER PIN'}
              </Typography>
            </Box>

            {/* Keypad Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <Button
                  key={n}
                  onClick={() => handleKeyPress(n)}
                  sx={{
                    height: 64,
                    borderRadius: '16px',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: 24,
                    fontWeight: 900,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                    '&:active': { transform: 'scale(0.95)' },
                  }}
                >
                  {n}
                </Button>
              ))}

              <Button
                onClick={handleClear}
                sx={{
                  height: 64,
                  borderRadius: '16px',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'text.secondary',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                CLEAR
              </Button>

              <Button
                onClick={() => handleKeyPress('0')}
                sx={{
                  height: 64,
                  borderRadius: '16px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                0
              </Button>

              <Button
                onClick={handleBackspace}
                sx={{
                  height: 64,
                  borderRadius: '16px',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'text.secondary',
                }}
              >
                <BackspaceRoundedIcon />
              </Button>
            </Box>

            {/* Execute Button */}
            <Button
              variant="contained"
              size="large"
              disabled={scanning || !pin}
              onClick={handleExecutePunch}
              sx={{
                height: 60,
                borderRadius: '16px',
                fontSize: 18,
                fontWeight: 900,
                bgcolor: punchMode === 'in' ? '#22c55e' : '#ef4444',
                '&:hover': { bgcolor: punchMode === 'in' ? '#16a34a' : '#dc2626' },
                boxShadow: punchMode === 'in' ? '0 8px 30px rgba(34, 197, 94, 0.4)' : '0 8px 30px rgba(239, 68, 68, 0.4)',
              }}
            >
              {scanning ? 'Verifying Face & PIN...' : `CONFIRM PUNCH ${punchMode.toUpperCase()}`}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
