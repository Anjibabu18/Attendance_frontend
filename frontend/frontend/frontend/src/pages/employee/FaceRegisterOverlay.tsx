import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { api } from '../../api/client';
import { detectReliableFace, loadFaceModels } from '../../utils/faceDetection';

export const FaceRegisterOverlay = ({ onClose, onRegistered }: { onClose: () => void; onRegistered?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceApiRef = useRef<any>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing camera...');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const init = async () => {
      try {
        setLoadingMsg('Loading Face AI Models (might take a moment)...');
        // Load models from CDN only when the employee opens Face AI setup.
        const faceapi = await import('@vladmandic/face-api');
        faceApiRef.current = faceapi;
        await loadFaceModels(faceapi);

        if (!isMounted) return;
        setModelsLoaded(true);
        setLoadingMsg('Starting camera...');

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } } });
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (err: any) {
        if (isMounted) setLoadingMsg(`Error: ${err.message}`);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleRegister = async () => {
    if (!modelsLoaded || !videoRef.current) return;
    setLoadingMsg('Analyzing face...');
    try {
      const faceapi = faceApiRef.current || await import('@vladmandic/face-api');
      faceApiRef.current = faceapi;
      const detection = await detectReliableFace(faceapi, videoRef.current);

      if (!detection) {
        setLoadingMsg('No face detected. Move the phone slightly away, keep your full face inside the dotted box, and try again.');
        return;
      }

      setLoadingMsg('Saving securely...');
      const descriptorArray = Array.from(detection.descriptor);
      
      await api.post('/api/employee/face-register', { descriptor: descriptorArray });
      setSuccess(true);
      onRegistered?.();
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setLoadingMsg(`Failed: ${err.message}`);
    }
  };

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ bgcolor: 'background.paper', width: '100%', maxWidth: 384, borderRadius: 4, overflow: 'hidden', boxShadow: 24, position: 'relative', border: '1px solid', borderColor: 'divider' }}>
        <IconButton 
          onClick={onClose}
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
        >
          <CloseRoundedIcon sx={{ width: 24, height: 24 }} />
        </IconButton>

        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Register Face AI</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 3 }}>
            Keep your full face inside the dotted box, hold the phone slightly away, and use good light. Only the mathematical face descriptor is stored.
          </Typography>

          <Box sx={{ position: 'relative', aspectRatio: '3/4', width: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'black', mb: 3 }}>
            {!modelsLoaded ? (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                <AccountCircleRoundedIcon sx={{ width: 64, height: 64, mb: 2, opacity: 0.5, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <Typography sx={{ fontSize: 14, px: 2, textAlign: 'center' }}>{loadingMsg}</Typography>
              </Box>
            ) : success ? (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'success.light', bgcolor: 'success.dark' }}>
                <CheckCircleRoundedIcon sx={{ width: 80, height: 80, mb: 2 }} />
                <Typography sx={{ fontWeight: 500 }}>Face Registered!</Typography>
              </Box>
            ) : (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {modelsLoaded && !success && (
              <Box sx={{ position: 'absolute', inset: 0, border: '2px dashed', borderColor: 'success.main', opacity: 0.5, borderRadius: 3, m: 4, pointerEvents: 'none' }}></Box>
            )}
          </Box>

          <Button
            onClick={handleRegister}
            disabled={!modelsLoaded || success}
            variant="contained"
            sx={{
              width: '100%', py: 2, borderRadius: 3, fontWeight: 700, fontSize: 16,
              bgcolor: (!modelsLoaded || success) ? 'action.disabledBackground' : 'success.main',
              color: (!modelsLoaded || success) ? 'text.disabled' : 'success.contrastText',
              '&:hover': { bgcolor: 'success.light' },
            }}
          >
            {success ? 'Success!' : 'Capture Face'}
          </Button>
          
          {loadingMsg && modelsLoaded && !success && (
            <Typography sx={{ fontSize: 12, color: 'warning.main', mt: 2 }}>{loadingMsg}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

