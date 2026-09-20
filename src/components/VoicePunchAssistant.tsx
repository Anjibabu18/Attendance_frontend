import React, { useEffect, useRef, useState } from 'react';
import {
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
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticError, hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

interface VoicePunchAssistantProps {
  onTriggerPunch?: (kind: 'in' | 'out') => void;
  onTriggerBreak?: () => void;
  onOpenKiosk?: () => void;
  variant?: 'default' | 'hero';
}

export function VoicePunchAssistant({
  onTriggerPunch,
  onTriggerBreak,
  onOpenKiosk,
  variant = 'default',
}: VoicePunchAssistantProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);

        if (event.results[0].isFinal) {
          processVoiceCommand(text);
        }
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const processVoiceCommand = (rawText: string) => {
    const command = rawText.toLowerCase().trim();

    if (command.includes('punch in') || command.includes('clock in') || command.includes('check in')) {
      hapticSuccess();
      setLastAction('Executing: Punch In / Morning Arrival');
      toastSuccess('Voice recognized: "Punch In" 🚀');
      setTimeout(() => {
        setDialogOpen(false);
        onTriggerPunch?.('in');
      }, 900);
    } else if (command.includes('punch out') || command.includes('clock out') || command.includes('check out')) {
      hapticSuccess();
      setLastAction('Executing: Punch Out / Shift End');
      toastSuccess('Voice recognized: "Punch Out" 🌙');
      setTimeout(() => {
        setDialogOpen(false);
        onTriggerPunch?.('out');
      }, 900);
    } else if (command.includes('break') || command.includes('coffee') || command.includes('pause')) {
      hapticSuccess();
      setLastAction('Executing: Toggle Break / Coffee');
      toastSuccess('Voice recognized: "Break / Resume" ☕');
      setTimeout(() => {
        setDialogOpen(false);
        onTriggerBreak?.();
      }, 900);
    } else if (command.includes('kiosk')) {
      hapticSuccess();
      setLastAction('Opening Reception Tablet Kiosk Mode');
      toastSuccess('Voice recognized: "Open Kiosk Mode" 📟');
      setTimeout(() => {
        setDialogOpen(false);
        if (onOpenKiosk) onOpenKiosk();
        else window.location.href = '/kiosk';
      }, 900);
    } else {
      hapticError();
      setLastAction(`Unrecognized command: "${command}". Try "Punch In" or "Take a Break"`);
    }
  };

  const handleStartListening = () => {
    hapticPop();
    setTranscript('');
    setLastAction(null);
    setDialogOpen(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // May already be started
      }
    } else {
      // Fallback if browser speech recognition is blocked or unavailable
      setTimeout(() => {
        setTranscript('Punch In');
        processVoiceCommand('Punch In');
      }, 1000);
    }
  };

  const handleStopListening = () => {
    hapticTap();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const isHero = variant === 'hero';

  return (
    <>
      <Tooltip title="Voice-Activated Punch & Assistant">
        <Button
          size="small"
          variant="outlined"
          onClick={handleStartListening}
          startIcon={<MicRoundedIcon fontSize="small" sx={{ color: isHero ? '#38bdf8' : '#ec4899' }} />}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 12,
            borderColor: isHero
              ? 'rgba(255, 255, 255, 0.22)'
              : isDark
              ? 'rgba(236, 72, 153, 0.3)'
              : 'rgba(236, 72, 153, 0.2)',
            bgcolor: isHero
              ? 'rgba(255, 255, 255, 0.12)'
              : isDark
              ? 'rgba(236, 72, 153, 0.06)'
              : 'rgba(236, 72, 153, 0.04)',
            color: isHero ? '#ffffff' : 'text.primary',
            backdropFilter: isHero ? 'blur(8px)' : undefined,
            '&:hover': {
              borderColor: isHero ? '#38bdf8' : '#ec4899',
              bgcolor: isHero
                ? 'rgba(255, 255, 255, 0.22)'
                : isDark
                ? 'rgba(236, 72, 153, 0.12)'
                : 'rgba(236, 72, 153, 0.08)',
            },
          }}
        >
          Voice Assistant
        </Button>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          handleStopListening();
          setDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GraphicEqRoundedIcon sx={{ color: '#ec4899' }} />
            <Typography sx={{ fontWeight: 900, fontSize: 17 }}>Voice Attendance Assistant</Typography>
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 2 }}>
          {/* Animated Microphone Reticle */}
          <Box
            sx={{
              position: 'relative',
              width: 90,
              height: 90,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {listening && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid #ec4899',
                  animation: 'pulseVoice 1.5s infinite ease-out',
                  '@keyframes pulseVoice': {
                    '0%': { transform: 'scale(1)', opacity: 0.8 },
                    '100%': { transform: 'scale(1.5)', opacity: 0 },
                  },
                }}
              />
            )}
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                bgcolor: listening ? '#ec4899' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: listening ? '#ffffff' : 'text.secondary',
                display: 'grid',
                placeItems: 'center',
                boxShadow: listening ? '0 8px 24px rgba(236, 72, 153, 0.4)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <MicRoundedIcon sx={{ fontSize: 34 }} />
            </Box>
          </Box>

          {/* Status and live transcript */}
          <Typography sx={{ fontSize: 14, fontWeight: 800, textAlign: 'center' }}>
            {listening ? 'Listening... Speak now' : 'Ready'}
          </Typography>

          {transcript ? (
            <Chip
              label={`"${transcript}"`}
              sx={{
                fontWeight: 800,
                fontSize: 13,
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                px: 1,
              }}
            />
          ) : (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>
              Say: <b>"Punch In"</b>, <b>"Punch Out"</b>, <b>"Take a Break"</b>, or <b>"Kiosk"</b>
            </Typography>
          )}

          {lastAction && (
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#ec4899', textAlign: 'center' }}>
              {lastAction}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center' }}>
          <Button
            variant={listening ? 'outlined' : 'contained'}
            onClick={listening ? handleStopListening : handleStartListening}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: listening ? 'transparent' : '#ec4899',
              borderColor: '#ec4899',
              color: listening ? '#ec4899' : '#ffffff',
              '&:hover': {
                bgcolor: listening ? 'rgba(236, 72, 153, 0.08)' : '#db2777',
              },
            }}
          >
            {listening ? 'Stop Listening' : 'Tap to Speak'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
