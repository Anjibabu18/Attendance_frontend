import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { api } from '../../api/client';

export const FaceRegisterOverlay = ({ onClose }: { onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing camera...');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const init = async () => {
      try {
        setLoadingMsg('Loading Face AI Models (might take a moment)...');
        // Load models from CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        if (!isMounted) return;
        setModelsLoaded(true);
        setLoadingMsg('Starting camera...');

        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
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
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setLoadingMsg('No face detected! Please look directly at the camera and try again.');
        return;
      }

      setLoadingMsg('Saving securely...');
      const descriptorArray = Array.from(detection.descriptor);
      
      await api.post('/api/employee/face-register', { descriptor: descriptorArray });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setLoadingMsg(`Failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
        >
          <CloseRoundedIcon sx={{ width: 24, height: 24 }} />
        </button>

        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Register Face AI</h2>
          <p className="text-slate-400 text-sm mb-6">
            Position your face clearly in the frame. This data never leaves the system and is stored as a mathematical hash.
          </p>

          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black mb-6">
            {!modelsLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <AccountCircleRoundedIcon sx={{ width: 64, height: 64, mb: 2, opacity: 0.5, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <p className="text-sm px-4 text-center">{loadingMsg}</p>
              </div>
            ) : success ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400 bg-emerald-950">
                <CheckCircleRoundedIcon sx={{ width: 80, height: 80, mb: 2 }} />
                <p className="font-medium">Face Registered!</p>
              </div>
            ) : (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {modelsLoaded && !success && (
              <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 rounded-xl m-8 pointer-events-none"></div>
            )}
          </div>

          <button
            onClick={handleRegister}
            disabled={!modelsLoaded || success}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all
              ${(!modelsLoaded || success) 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'
              }`}
          >
            {success ? 'Success!' : 'Capture Face'}
          </button>
          
          {loadingMsg && modelsLoaded && !success && (
            <p className="text-xs text-amber-400 mt-4">{loadingMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};
