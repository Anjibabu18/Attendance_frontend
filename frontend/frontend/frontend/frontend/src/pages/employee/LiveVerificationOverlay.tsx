import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography, CircularProgress } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import * as faceapi from '@vladmandic/face-api';
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
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load Face AI models.');
      }
    };
    if (open) {
      loadModels();
    }
  }, [open]);

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
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (open && modelsLoaded && !cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, modelsLoaded, cameraActive, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setProcessing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        throw new Error('No face detected. Please ensure your face is clearly visible.');
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) throw new Error('Failed to generate image blob');

      const formData = new FormData();
      formData.append('faceDescriptor', JSON.stringify(Array.from(detection.descriptor)));
      formData.append('file', blob, 'live-verify.jpg');

      await api.post(`/api/employee/live-verify/${requestId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => {
        stopCamera();
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Verification failed');
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'background.paper', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 20 }}>Live Verification Required</Typography>
        <IconButton onClick={() => { stopCamera(); onClose(); }} disabled={processing || success}><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        {!modelsLoaded && !error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2 }}>
            <CircularProgress />
            <Typography>Loading Face AI Engine...</Typography>
          </Box>
        )}
        
        {modelsLoaded && (
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, borderRadius: '12px', overflow: 'hidden', bgcolor: 'black', aspectRatio: '3/4' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {processing && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }}>
                <CircularProgress color="primary" />
              </Box>
            )}

            {success && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(76, 175, 80, 0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                <Typography sx={{ fontWeight: 900, fontSize: 24 }}>Verified!</Typography>
              </Box>
            )}
          </Box>
        )}

        {error && <Typography color="error" sx={{ fontWeight: 600, textAlign: 'center' }}>{error}</Typography>}
        
        {modelsLoaded && !success && (
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            startIcon={<CameraAltRoundedIcon />} 
            onClick={handleCapture} 
            disabled={processing || !cameraActive}
            sx={{ fontWeight: 900, borderRadius: '12px', px: 4, py: 1.5, mt: 1 }}
          >
            Verify Face
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
