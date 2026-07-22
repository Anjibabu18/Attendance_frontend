import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { enablePushNotifications } from '../../utils/pushNotifications';

interface PermissionOnboardingOverlayProps {
  onClose: () => void;
}

export default function PermissionOnboardingOverlay({ onClose }: PermissionOnboardingOverlayProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      // Prompt Push Notifications
      await enablePushNotifications().catch(() => {});

      // Prompt Camera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).catch(() => null);
        if (stream) {
          // Immediately stop all tracks so camera light turns off
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (e) {
      console.error("Error during permission request:", e);
    } finally {
      localStorage.setItem('app_permissions_requested', 'true');
      setLoading(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('app_permissions_requested', 'true');
    onClose();
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        position: 'fixed', inset: 0, zIndex: 1200,
        bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        sx={{
          bgcolor: 'background.paper', borderRadius: '16px', p: 3,
          width: '100%', maxWidth: 400, position: 'relative',
          border: '1px solid', borderColor: 'divider', boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }}
      >
        <IconButton onClick={handleDismiss} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CloseRoundedIcon />
        </IconButton>

        <Box sx={{ textAlign: 'center', mb: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CameraAltRoundedIcon fontSize="large" />
            </Box>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'secondary.main', color: 'secondary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <NotificationsActiveRoundedIcon fontSize="large" />
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: 24, mb: 1 }}>App Setup</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            VD Attendance requires Camera access for face verification and Push Notifications so you never miss an update or approval.
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          onClick={handleAllow}
          sx={{ borderRadius: '12px', py: 1.5, fontWeight: 900, fontSize: 16, textTransform: 'none' }}
        >
          {loading ? 'Requesting...' : 'Allow Permissions'}
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={handleDismiss}
          sx={{ mt: 1, borderRadius: '12px', color: 'text.secondary', textTransform: 'none', fontWeight: 700 }}
        >
          Maybe Later
        </Button>
      </Box>
    </Box>
  );
}
