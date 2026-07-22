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

export function PunchOverlay({ 
  open, 
  onClose, 
  kind 
}: { 
  open: boolean; 
  onClose: () => void; 
  kind: 'checkin' | 'checkout' 
}) {
  const { refreshData, deviceStatus, settings } = useEmployee();
  
  const [step, setStep] = useState<number>(0); 
  // 0: Location, 1: QR Scan, 2: Daily Code, 3: Selfie, 4: Success
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  
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


  // Render leaflet map when error occurs and we have location data
  useEffect(() => {
    if (!error || !location || !officeLocation || !mapContainerRef.current) return;
    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const map = L.map(mapContainerRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Ãƒâ€šÃ‚Â© OpenStreetMap' }).addTo(map);
      // Office circle
      L.circle([officeLocation.lat, officeLocation.lng], { radius: officeLocation.radius, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 2 }).addTo(map);
      L.marker([officeLocation.lat, officeLocation.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â¢ Office').addTo(map);
      // Employee position
      L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â You are here').addTo(map);
      // Fit bounds
      const bounds = L.latLngBounds([[officeLocation.lat, officeLocation.lng], [location.lat, location.lng]]);
      map.fitBounds(bounds, { padding: [40, 40] });
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [error, location, officeLocation]);

  const startFlow = async () => {
    setBusy(true);
    setError(null);
    setQrToken("");
    setQrMode("");
    setDailyCode("");
    try {
      const loc = await new Promise<{lat: number, lng: number}>((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          p => res({lat: p.coords.latitude, lng: p.coords.longitude}),
          rej, 
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
      setLocation(loc);

      const res = await api.get('/api/employee/punch/place', { params: loc });
      if (res.data.officeLocation) {
        setOfficeLocation({ lat: res.data.officeLocation.latitude, lng: res.data.officeLocation.longitude, radius: res.data.officeLocation.radiusMeters });
      }
      if (!res.data.insideRadius) {
        throw new Error(`Outside office radius (${Math.round(res.data.distanceMeters)}m)`);
      }

      if (deviceStatus && !deviceStatus.approved) {
        setStep(6);
        return;
      }

      // Check if QR is required
      if (settings?.requireQrForPunch) {
        setStep(1);
        startQrCamera();
      } else {
        setStep(3);
        startSelfieCamera();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Location verification failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && step === 0) {
      startFlow();
    }
    return () => stopCamera();
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

    if (!faceModelsLoaded) {
      setBusy(true);
      try {
        const faceapi = await import('@vladmandic/face-api');
        faceApiRef.current = faceapi;
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setFaceModelsLoaded(true);
      } catch (err: any) {
        if (err?.message?.includes('Failed to fetch dynamically imported module') || err?.message?.includes('Importing a module script failed')) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).finally(() => window.location.reload());
          } else {
            window.location.reload();
          }
          return;
        }
        setError("Failed to load Face AI Models");
      }
      setBusy(false);
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
      // Run Face Recognition on the captured canvas to ensure exact match with uploaded photo
      const faceapi = faceApiRef.current || await import('@vladmandic/face-api');
      faceApiRef.current = faceapi;
      const detection = await faceapi.detectSingleFace(c).withFaceLandmarks().withFaceDescriptor();
      
      // Now that detection is done, we can stop the camera
      stopCamera();

      if (detection) {
        const descriptorArray = Array.from(detection.descriptor);
        fd.append("faceDescriptor", JSON.stringify(descriptorArray));
      } else {
        throw new Error("No face detected! Please ensure your face is clearly visible inside the green circle.");
      }

      await api.post(`/api/employee/punch/${kind}`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      setStep(4); // Success
      await refreshData();
    } catch (e: any) {
      if (e?.message?.includes('Failed to fetch dynamically imported module') || e?.message?.includes('Importing a module script failed')) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).finally(() => window.location.reload());
        } else {
          window.location.reload();
        }
        return;
      }
      setError(e?.response?.data?.error || e.message || 'Punch failed');
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
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 420 }}>
            {!error ? (
              <>
                <CircularProgress sx={{ color: '#0052FF', mb: 3 }} size={60} thickness={4} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Verifying Location</Typography>
                <Typography sx={{ color: '#94A3B8' }}>Getting your GPS coordinates...</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#EF4444' }}>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â Location Issue</Typography>
                <Typography sx={{ color: '#94A3B8', mb: 2 }}>{error}</Typography>
                {location && officeLocation && (
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, height: 260 }}>
                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                  </Box>
                )}
                {!location && (
                  <Box sx={{ bgcolor: 'rgba(239,68,68,0.1)', borderRadius: 2, p: 2, mb: 3 }}>
                    <Typography sx={{ color: '#FCA5A5', fontSize: 14 }}>Please enable location access in your browser settings and try again.</Typography>
                  </Box>
                )}
                <Button variant="outlined" startIcon={<MyLocationIcon />} sx={{ borderColor: '#0052FF', color: '#60A5FA', mr: 1 }} onClick={startFlow}>Retry</Button>
              </>
            )}
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Scan Office QR</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 2 }}>Point your camera at the office QR code.</Typography>
            <Typography sx={{ color: '#CBD5E1', mb: 3, fontSize: 13 }}>Keep the QR flat, bright, and inside the blue frame.</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Box sx={{ flex: 1, position: 'relative', borderRadius: 4, overflow: 'hidden', border: '4px solid #0052FF', mb: 2, maxHeight: 400, maxWidth: 400, mx: 'auto', width: '100%', bgcolor: 'black' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <TextField size="small" placeholder="Paste QR token if camera cannot scan" value={manualQr} onChange={(event) => setManualQr(event.target.value)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mb: 1, input: { color: 'white' } }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button variant="outlined" sx={{ borderColor: '#60A5FA', color: '#BFDBFE' }} onClick={() => handleQrScanned(manualQr)}>Use token</Button>
              <Button variant="outlined" sx={{ borderColor: '#60A5FA', color: '#BFDBFE' }} onClick={() => qrFileInputRef.current?.click()}>Upload QR</Button>
            </Box>
            <input ref={qrFileInputRef} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (file) scanQrImageFile(file).catch((err) => setError(err?.message || 'QR image scan failed')); }} />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Take a Selfie</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 3, fontSize: 14 }}>Position your face clearly inside the green dashed circle.</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Box sx={{ flex: 1, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '6px dashed #22C55E', mb: 4, maxHeight: 400, maxWidth: 400, mx: 'auto', width: '100%', bgcolor: 'black', boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '80%', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', pointerEvents: 'none' }} />
            </Box>
            <Button variant="contained" onClick={handleCaptureAndPunch} disabled={busy} sx={{ bgcolor: '#0052FF', borderRadius: 8, py: 2, fontSize: 18, fontWeight: 700 }}>
              {busy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Capture & Punch'}
            </Button>
          </Box>
        )}

        {step === 4 && (
          <Box sx={{ m: 'auto' }}>
            <CheckCircleIcon sx={{ fontSize: 100, color: '#10B981', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Success!</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 4 }}>You have successfully clocked {kind === 'checkin' ? 'in' : 'out'} at {dayjs().format('hh:mm A')}.</Typography>
            <Button variant="contained" onClick={closeOverlay} sx={{ bgcolor: '#10B981', borderRadius: 8, py: 1.5, px: 6, fontWeight: 700 }}>
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

