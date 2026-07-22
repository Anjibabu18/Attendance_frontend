import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Dialog, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { api } from '../../api/client';
import { useEmployee } from './EmployeeContext';
import dayjs from 'dayjs';
import jsQR from 'jsqr';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import { hapticTap, hapticSuccess, hapticError, hapticPop } from '../../utils/haptics';

const playBeep = (freq = 800, duration = 150) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
  } catch (e) {
    console.warn("Audio not supported or blocked", e);
  }
};

export function PunchOverlay({ 
  open, 
  onClose, 
  kind 
}: { 
  open: boolean; 
  onClose: () => void; 
  kind: 'checkin' | 'checkout' 
}) {
  const { refreshData, deviceStatus, settings, profile } = useEmployee();
  
  const [step, setStep] = useState<number>(0); 
  // 0: Location, 1: QR Scan, 2: Daily Code, 3: Selfie, 4: Success
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [isOfflinePunch, setIsOfflinePunch] = useState(false);
  const [punchResponse, setPunchResponse] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const qrScanActiveRef = useRef(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<{lat: number, lng: number}|null>(null);

  const [qrToken, setQrToken] = useState<string>("");
  const [manualQr, setManualQr] = useState<string>("");
  const [qrMode, setQrMode] = useState<string>("");
  const [dailyCode, setDailyCode] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const faceApiRef = useRef<any>(null);


  const [distanceMeters, setDistanceMeters] = useState<number|null>(null);
  const watchIdRef = useRef<number|null>(null);

  // Component to auto-center the map when location changes
  const MapCenterer = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => { map.setView(center, 18, { animate: true }); }, [center, map]);
    return null;
  };

  const checkLocationOnServer = async (loc: { lat: number, lng: number }) => {
    try {
      const res = await api.get('/api/employee/punch/place', { params: loc });
      if (res.data.officeLocation) {
        setOfficeLocation({ 
          lat: res.data.officeLocation.latitude, 
          lng: res.data.officeLocation.longitude, 
          radius: res.data.officeLocation.radiusMeters 
        });
      }
      setDistanceMeters(res.data.distanceMeters);
      
      if (res.data.insideRadius) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        if (deviceStatus && !deviceStatus.approved) {
          setStep(6);
          return;
        }

        // Advance step with a slight delay to let user see the green map pulse
        setTimeout(() => {
          if (settings?.requireQrForPunch) {
            setStep(1);
            startQrCamera();
          } else {
            setStep(3);
            startSelfieCamera();
          }
        }, 1500);
      } else {
        setError(`Outside office radius (${Math.round(res.data.distanceMeters)}m)`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Location verification failed');
    }
  };

  const startFlow = () => {
    setBusy(true);
    setError(null);
    setQrToken("");
    setQrMode("");
    setDailyCode("");
    
    // Fallback if browser doesn't support geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setBusy(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLocation(loc);
        checkLocationOnServer(loc).finally(() => setBusy(false));
      },
      (e) => {
        setError(`Location access error: ${e.message}`);
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (open && step === 0) {
      startFlow();
    }
    return () => {
      stopCamera();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [open]);

  // Ensure video element receives the stream even if it remounts during step transitions
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  const stopCamera = () => {
    qrScanActiveRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // ----- QR Scanning -----
  const startQrCamera = async () => {
    try {
      stopCamera();
      qrScanActiveRef.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanQrLoop();
    } catch (e: any) {
      setError("Camera unavailable for QR");
    }
  };

  const scanQrLoop = () => {
    if (!videoRef.current || !qrScanActiveRef.current) return;
    const v = videoRef.current;
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "attemptBoth" });
        if (code) {
          playBeep(900, 100);
          handleQrScanned(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(scanQrLoop);
  };

  const extractQrToken = (value: string) => {
    const raw = value.trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      return parsed.searchParams.get('punchQr') || parsed.searchParams.get('qrToken') || parsed.searchParams.get('token') || raw;
    } catch {
      const match = raw.match(/(?:punchQr|qrToken|token)=([^&\s]+)/i);
      return match ? decodeURIComponent(match[1]) : raw;
    }
  };

  const handleQrScanned = async (value: string) => {
    const token = extractQrToken(value);
    if (!token) {
      setError("QR code is empty");
      return;
    }
    stopCamera();
    setBusy(true);
    try {
      const res = await api.get('/api/employee/punch/qr', { params: { token } });
      setQrToken(token);
      if (res.data.mode === "FIXED_QR_DAILY_CODE") {
        setQrMode("FIXED_QR_DAILY_CODE");
        setStep(2);
      } else {
        setStep(3);
        startSelfieCamera();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Invalid QR Code");
      setTimeout(() => startQrCamera(), 500);
    } finally {
      setBusy(false);
    }
  };

  const scanQrImageFile = async (file: File) => {
    setError(null);
    const image = new Image();
    image.src = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Cannot read QR image"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot scan QR image");
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(image.src);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "attemptBoth" });
    if (!code) throw new Error("No QR found in image");
    await handleQrScanned(code.data);
  };

  const handleDailyCodeSubmit = () => {
    if (dailyCode.length < 4) {
      setError("Please enter the 4-digit code");
      return;
    }
    setError(null);
    setStep(3);
    startSelfieCamera();
  };

  // ----- Selfie -----
  const startSelfieCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError("Camera unavailable for selfie");
    }
  };

  const registerDevice = async () => {
    setBusy(true);
    try {
      const deviceId = localStorage.getItem("attendance_device_id_v1") || 'unknown';
      const label = window.navigator.userAgent;
      await api.post('/api/account/devices/register', { deviceId, label });
      await refreshData();
      startFlow();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCaptureAndPunch = async () => {
    const v = videoRef.current;
    if (!v) return;
    setBusy(true);
    setError(null);
    hapticTap();
    try {
      for (let attempt = 0; attempt < 20; attempt++) {
        if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) break;
        await new Promise(r => setTimeout(r, 150));
      }
      if (v.videoWidth === 0 || v.videoHeight === 0) {
        throw new Error("Camera frame is not ready. Please wait a second and try again.");
      }
      
      const c = document.createElement('canvas');
      c.width = v.videoWidth; 
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error("Cannot capture");
      ctx.drawImage(v, 0, 0);
      const blob = await new Promise<Blob|null>(r => c.toBlob(r, 'image/jpeg', 0.8));
      if (!blob) throw new Error("Cannot capture");
      const dataUrl = c.toDataURL('image/jpeg', 0.8);

      const file = new File([blob], `${kind}.jpg`, { type: 'image/jpeg' });
      
      const deviceId = localStorage.getItem("attendance_device_id_v1") || 'unknown';

      const fd = new FormData();
      fd.append("photoBase64", dataUrl);
      if (location) {
        fd.append("latitude", String(location.lat));
        fd.append("longitude", String(location.lng));
      }
      fd.append("deviceId", deviceId);
      if (settings?.requireQrForPunch) {
        fd.append("qrToken", qrToken);
        if (qrMode === "FIXED_QR_DAILY_CODE") {
          fd.append("dailyCode", dailyCode);
        }
      }
      fd.append("file", file);

      setBusy(true);
      
      // Stop the camera since we've captured the photo
      stopCamera();

      try {
        const response = await api.post(`/api/employee/punch/${kind}`, fd, { 
          headers: { "Content-Type": "multipart/form-data" } 
        });
        
        const data = response.data;
        setPunchResponse(data);
        hapticSuccess();
        
        if (data.isNewStreak || (data.newBadgesEarned && data.newBadgesEarned.length > 0)) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#3B82F6', '#F59E0B']
          });
        }
      } catch (e: any) {
        if (!window.navigator.onLine || e.message === 'Network Error' || e.code === 'ERR_NETWORK') {
          // Save offline
          const m = await import('../../utils/offlineSync');
          await m.savePunchOffline({
            id: new Date().toISOString(),
            kind,
            timestamp: Date.now(),
            photoBase64: dataUrl,
            latitude: location ? String(location.lat) : undefined,
            longitude: location ? String(location.lng) : undefined,
            deviceId,
            qrToken: settings?.requireQrForPunch ? qrToken : undefined,
            dailyCode: settings?.requireQrForPunch && qrMode === "FIXED_QR_DAILY_CODE" ? dailyCode : undefined
          });
          setIsOfflinePunch(true);
        } else {
          hapticError();
          throw e; // Rethrow actual API errors (like invalid QR code)
        }
      }

      playBeep(1000, 100);
      setTimeout(() => playBeep(1200, 150), 150);

      // Voice Feedback
      const firstName = profile?.name?.split(' ')[0] || 'there';
      if ('speechSynthesis' in window) {
        // Cancel any pending speech so it plays instantly
        window.speechSynthesis.cancel();
        
        let text = kind === 'checkin' 
          ? `Punch in successful. Welcome, ${firstName}.` 
          : `Checkout recorded. Have a great evening, ${firstName}!`;
          
        if (!window.navigator.onLine) {
          text = 'Punch saved offline.';
        }
          
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        // Optionally find a premium voice if available, but default is fine
        window.speechSynthesis.speak(utterance);
      }

      setStep(4); // Success
      if (!isOfflinePunch) await refreshData();
    } catch (e: any) {
      if (e?.message?.includes('Failed to fetch dynamically imported module') || e?.message?.includes('Importing a module script failed')) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).finally(() => window.location.reload());
        } else {
          window.location.reload();
        }
        return;
      }
      hapticError();
      setError(e?.response?.data?.error || e.message || 'Punch failed');
      startSelfieCamera();
    } finally {
      setBusy(false);
    }
  };

  const closeOverlay = () => {
    stopCamera();
    setStep(0);
    setError(null);
    onClose();
  };

  return (
    <Dialog fullScreen open={open} onClose={closeOverlay} PaperProps={{ sx: { bgcolor: '#0F172A', color: 'white' } }}>
      <IconButton onClick={closeOverlay} sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 10 }}>
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, pt: 8, textAlign: 'center' }}>
        
        {step === 0 && (
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #FFFFFF 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Locating You
            </Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: 15, mb: 3 }}>
              {error ? 'Location error' : distanceMeters !== null ? (distanceMeters <= (officeLocation?.radius || 50) ? 'Inside office radius! Preparing...' : `You are ${Math.round(distanceMeters)}m away from the office.`) : 'Acquiring high-accuracy GPS signal...'}
            </Typography>
            
            <Box sx={{ flexGrow: 1, minHeight: 300, borderRadius: 4, overflow: 'hidden', border: '2px solid', borderColor: error ? '#EF4444' : (distanceMeters !== null && distanceMeters <= (officeLocation?.radius || 50) ? '#10B981' : '#3B82F6'), boxShadow: error ? '0 0 20px rgba(239, 68, 68, 0.2)' : (distanceMeters !== null && distanceMeters <= (officeLocation?.radius || 50) ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(59, 130, 246, 0.2)'), position: 'relative', mb: 2 }}>
              
              {!location && !error && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0F172A', zIndex: 10 }}>
                   <CircularProgress sx={{ color: '#3B82F6' }} />
                </Box>
              )}

              {location && (
                <MapContainer center={[location.lat, location.lng]} zoom={18} zoomControl={false} scrollWheelZoom={false} dragging={false} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <MapCenterer center={[location.lat, location.lng]} />
                  
                  {officeLocation && (
                    <>
                      <Circle 
                        center={[officeLocation.lat, officeLocation.lng]} 
                        radius={officeLocation.radius} 
                        pathOptions={{ 
                          color: (distanceMeters !== null && distanceMeters <= officeLocation.radius) ? '#10B981' : '#3B82F6', 
                          fillColor: (distanceMeters !== null && distanceMeters <= officeLocation.radius) ? '#10B981' : '#3B82F6', 
                          fillOpacity: 0.15, 
                          weight: 2 
                        }} 
                      />
                      <Marker position={[officeLocation.lat, officeLocation.lng]} icon={L.divIcon({ className: '', html: '<div style="background:rgba(255,255,255,0.2);width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>', iconSize: [12,12] })} />
                    </>
                  )}
                  
                  <Marker 
                    position={[location.lat, location.lng]} 
                    icon={L.divIcon({ 
                      className: '', 
                      html: `<div style="position:relative;width:16px;height:16px;">
                               <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;border:2px solid white;z-index:2;"></div>
                               <div style="position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;background:rgba(59,130,246,0.4);border-radius:50%;animation:pulse 1.5s infinite;z-index:1;"></div>
                             </div>`, 
                      iconSize: [16,16] 
                    })} 
                  />
                </MapContainer>
              )}
            </Box>

            {error && (
              <Box sx={{ mt: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', p: 2, borderRadius: 2 }}>
                <Typography sx={{ color: '#FCA5A5', fontSize: 14 }}>{error}</Typography>
                <Button variant="outlined" size="small" onClick={startFlow} sx={{ mt: 1, borderColor: '#EF4444', color: '#EF4444' }}>Retry</Button>
              </Box>
            )}
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scan Office QR</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 4, fontSize: 15 }}>Position the QR code within the frame</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', p: 1, borderRadius: 2 }}>{error}</Typography>}
            <Box sx={{ 
              position: 'relative', 
              width: '280px', 
              height: '280px', 
              mb: 4, 
              mx: 'auto', 
              bgcolor: 'black',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.1), 0 20px 40px rgba(0,0,0,0.4)',
              '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                border: '2px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '24px',
                zIndex: 2,
                pointerEvents: 'none'
              }
            }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Corner Markers */}
              <Box sx={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderTop: '4px solid #3B82F6', borderLeft: '4px solid #3B82F6', borderTopLeftRadius: 12, zIndex: 3 }} />
              <Box sx={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderTop: '4px solid #3B82F6', borderRight: '4px solid #3B82F6', borderTopRightRadius: 12, zIndex: 3 }} />
              <Box sx={{ position: 'absolute', bottom: 16, left: 16, width: 40, height: 40, borderBottom: '4px solid #3B82F6', borderLeft: '4px solid #3B82F6', borderBottomLeftRadius: 12, zIndex: 3 }} />
              <Box sx={{ position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderBottom: '4px solid #3B82F6', borderRight: '4px solid #3B82F6', borderBottomRightRadius: 12, zIndex: 3 }} />
              
              {/* Scanning Animation Line */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
                boxShadow: '0 0 10px #3B82F6',
                zIndex: 4,
                animation: 'scan 2s linear infinite',
                '@keyframes scan': {
                  '0%': { transform: 'translateY(16px)' },
                  '50%': { transform: 'translateY(260px)' },
                  '100%': { transform: 'translateY(16px)' }
                }
              }} />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '100%', maxWidth: '280px' }}>
               <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6', animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%': { opacity: 0.4 }, '50%': { opacity: 1 }, '100%': { opacity: 0.4 } } }} />
               <Typography sx={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Scanning for QR code...</Typography>
            </Box>
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ m: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Enter Daily Code</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 4 }}>Please enter the 4-digit code shown on the office board.</Typography>
            <TextField 
              autoFocus
              variant="outlined"
              placeholder="0000"
              value={dailyCode}
              onChange={(e) => setDailyCode(e.target.value)}
              inputProps={{ style: { textAlign: 'center', fontSize: 32, letterSpacing: 8, color: 'white' }, maxLength: 4 }}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mb: 4, width: '200px' }}
            />
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Button variant="contained" onClick={handleDailyCodeSubmit} sx={{ bgcolor: '#0052FF', borderRadius: 8, py: 2, px: 6, fontSize: 18, fontWeight: 700, width: '100%' }}>
              Continue
            </Button>
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Take a Selfie</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 4, fontSize: 15 }}>Center your face within the circle</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', p: 1, borderRadius: 2 }}>{error}</Typography>}
            
            <Box sx={{ 
              position: 'relative', 
              width: '280px', 
              height: '280px', 
              mb: 5, 
              mx: 'auto', 
              borderRadius: '50%',
              bgcolor: 'black',
              padding: '6px',
              background: 'linear-gradient(45deg, #10B981, #3B82F6)',
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
              animation: 'spin-bg 4s linear infinite',
              '@keyframes spin-bg': {
                '0%': { filter: 'hue-rotate(0deg)' },
                '100%': { filter: 'hue-rotate(360deg)' }
              }
            }}>
              <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative', bgcolor: '#0F172A' }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                
                {/* Scanning overlay effect */}
                <Box sx={{ 
                  position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.3) 10%, transparent 20%)',
                  animation: 'radar 3s linear infinite',
                  pointerEvents: 'none',
                  '@keyframes radar': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              onClick={handleCaptureAndPunch} 
              disabled={busy} 
              sx={{ 
                bgcolor: 'white', 
                color: '#0F172A',
                borderRadius: '50px', 
                py: 2, 
                px: 6,
                fontSize: 18, 
                fontWeight: 800,
                boxShadow: '0 10px 25px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s',
                width: '100%',
                maxWidth: '280px',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 30px rgba(255, 255, 255, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(1px)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {busy ? <CircularProgress size={26} sx={{ color: '#0F172A' }} /> : 'Capture & Punch'}
            </Button>
          </Box>
        )}

        {step === 4 && (
          <Box sx={{ m: 'auto', textAlign: 'center', position: 'relative' }}>
            {/* Background glowing orb */}
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            <Box sx={{ 
              width: 150, height: 150, mx: 'auto', mb: 5, mt: 2,
              borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              '@keyframes bounceIn': { 
                '0%': { transform: 'scale(0)', opacity: 0 }, 
                '60%': { transform: 'scale(1.1)', opacity: 1 },
                '100%': { transform: 'scale(1)', opacity: 1 } 
              }
            }}>
              {/* Expanding success wave */}
              <Box sx={{ position: 'absolute', inset: -20, border: '4px solid #10B981', borderRadius: '50%', animation: 'success-wave 1.5s ease-out forwards', '@keyframes success-wave': { '0%': { transform: 'scale(0.8)', opacity: 0.8 }, '100%': { transform: 'scale(1.6)', opacity: 0 } } }} />
              
              {/* Outer decorative dashed ring */}
              <Box sx={{ position: 'absolute', inset: -10, border: '3px dashed rgba(16, 185, 129, 0.4)', borderRadius: '50%', animation: 'spin-slow 15s linear infinite' }} />
              
              {/* Inner glowing circle */}
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.4)' }} />
              
              <CheckCircleIcon sx={{ fontSize: 80, color: '#10B981', zIndex: 2, filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.8))' }} />
            </Box>

            <Typography variant="h2" sx={{ 
              fontWeight: 900, mb: 2, 
              background: isOfflinePunch ? 'linear-gradient(to right, #FCD34D, #F59E0B, #D97706)' : 'linear-gradient(to right, #34D399, #10B981, #059669)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'fadeInUp 0.6s ease-out 0.3s both',
              '@keyframes fadeInUp': { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } }
            }}>
              {isOfflinePunch ? 'Saved Offline' : 'Success!'}
            </Typography>
            
            <Typography sx={{ 
              color: '#94A3B8', mb: 3, fontSize: 17,
              animation: 'fadeInUp 0.6s ease-out 0.4s both'
            }}>
              {isOfflinePunch 
                ? 'Your punch has been securely saved on your device and will sync automatically when you regain connection.'
                : <>You are successfully clocked {kind === 'checkin' ? 'in' : 'out'} at <Box component="span" sx={{ color: 'white', fontWeight: 800 }}>{dayjs().format('hh:mm A')}</Box>.</>
              }
            </Typography>

            {punchResponse?.streak > 0 && (
              <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.3)', animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
                 <Typography sx={{ color: '#FCD34D', fontWeight: 800, fontSize: 20 }}>
                   🔥 {punchResponse.streak} Day On-Time Streak!
                 </Typography>
                 {punchResponse?.newBadgesEarned?.length > 0 && (
                    <Typography sx={{ color: '#10B981', mt: 1, fontWeight: 700 }}>
                      🎉 Unlocked: {punchResponse.newBadgesEarned.join(', ')}
                    </Typography>
                 )}
              </Box>
            )}
            
            <Button variant="contained" onClick={closeOverlay} sx={{ 
              bgcolor: 'white', color: '#0F172A', borderRadius: '50px', py: 1.8, px: 8, fontSize: 18, fontWeight: 800, letterSpacing: '0.5px',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeInUp 0.6s ease-out 0.5s both',
              '&:hover': { 
                bgcolor: '#F8FAFC', 
                transform: 'translateY(-4px) scale(1.02)', 
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4)' 
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              }
            }}>
              Done
            </Button>
          </Box>
        )}

        {step === 6 && (
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 420 }}>
            {deviceStatus?.registered ? (
              <>
                <CircularProgress sx={{ color: '#F59E0B', mb: 3 }} size={60} thickness={4} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#F59E0B' }}>Pending Approval</Typography>
                <Typography sx={{ color: '#94A3B8', mb: 2 }}>Your device has been submitted for approval. Please wait for an Admin/HR to approve it.</Typography>
                <Button variant="outlined" onClick={startFlow} sx={{ borderColor: '#60A5FA', color: '#BFDBFE' }}>Check Again</Button>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#EF4444' }}>Unrecognized Device</Typography>
                <Typography sx={{ color: '#94A3B8', mb: 2 }}>You are trying to punch in from a new device that is not bound to your account.</Typography>
                {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
                <Button variant="contained" onClick={registerDevice} disabled={busy} sx={{ bgcolor: '#0052FF', borderRadius: 8, py: 1.5, px: 6, fontWeight: 700 }}>
                  {busy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Register This Device'}
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

