import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography, CircularProgress } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import { api } from '../../api/client';

interface Props {
  requestId: number;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function LiveVerificationOverlay({ requestId, open, onSuccess, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setSuccess(false);
      setError(null);
      setProcessing(false);
    }
  }, [open, stopCamera]);

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not access canvas context');
      setProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    const base64Data = imageDataUrl.split(',')[1];

    try {
      // Just submit the photo directly for verification without local face checks
      const result = await api.post(`/api/requests/${requestId}/verify-photo`, { photoData: base64Data });
      if (result.data?.success || result.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.data?.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed due to server error.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={processing ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Live Photo Verification
        <IconButton onClick={onClose} disabled={processing}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pb: 4 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please capture a clear photo of yourself to verify this request.
        </Typography>

        <Box sx={{ position: 'relative', width: 300, height: 300, borderRadius: '50%', overflow: 'hidden', bgcolor: 'black', border: '4px solid', borderColor: success ? 'success.main' : error ? 'error.main' : 'primary.main', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {success ? (
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 800 }}>Verified!</Typography>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
            />
          )}
          {!cameraActive && !success && (
            <Button variant="contained" onClick={startCamera} sx={{ borderRadius: '100px', px: 4 }}>
              Start Camera
            </Button>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>

        {error && (
          <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
        )}

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={!cameraActive || processing || success}
            onClick={captureAndVerify}
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CameraAltRoundedIcon />}
            sx={{ borderRadius: '12px', px: 6, py: 1.5, fontWeight: 700 }}
          >
            {processing ? 'Verifying...' : 'Capture & Verify'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
