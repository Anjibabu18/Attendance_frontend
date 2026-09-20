import React, { useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import { AnimatePresence, motion } from 'framer-motion';

import { useToast } from './Toast';
import { hapticSuccess, hapticWarning } from '../utils/haptics';

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);
  const { toastSuccess, toastWarning } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      hapticSuccess();
      toastSuccess('Connection restored! Synchronized attendance offline queue.');
      const timer = setTimeout(() => setJustReconnected(false), 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      hapticWarning();
      toastWarning('Network offline! Local punch caching enabled.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toastSuccess, toastWarning]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <Box
          component={motion.div}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1,
            borderRadius: '24px',
            bgcolor: 'rgba(245, 158, 11, 0.95)',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <WifiOffRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
            Offline Mode Active · Offline Punch Queue Enabled
          </Typography>
        </Box>
      )}

      {isOnline && justReconnected && (
        <Box
          component={motion.div}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1,
            borderRadius: '24px',
            bgcolor: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <CloudDoneRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
            Online · Attendance Queue Synchronized
          </Typography>
        </Box>
      )}
    </AnimatePresence>
  );
}
