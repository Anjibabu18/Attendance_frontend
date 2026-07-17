import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Dialog, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOffRoundedIcon from '@mui/icons-material/LocationOffRounded';
import { api } from '../../api/client';
import { useEmployee } from './EmployeeContext';
import dayjs from 'dayjs';
import jsQR from 'jsqr';
import 'leaflet/dist/leaflet.css';
import { FaceRegisterOverlay } from './FaceRegisterOverlay';
import { detectReliableFace, loadFaceModels } from '../../utils/faceDetection';

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
  // 0: Location, 1: QR Scan, 3: Selfie, 4: Success, 5: Face Registration
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [faceRegisteredThisSession, setFaceRegisteredThisSession] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const qrScanActiveRef = useRef(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<{lat: number, lng: number}|null>(null);

  const [qrToken, setQrToken] = useState<string>("");
  const [manualQr, setManualQr] = useState<string>("");
  const [qrMode, setQrMode] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const faceReady = Boolean(profile?.faceRegistered || faceRegisteredThisSession);
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
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(map);
      // Office circle
      L.circle([officeLocation.lat, officeLocation.lng], { radius: officeLocation.radius, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 2 }).addTo(map);
      L.marker([officeLocation.lat, officeLocation.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('Office').addTo(map);
      // Employee position
      L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('You are here').addTo(map);
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
    setShowFaceRegister(false);
    try {
      const loc = await new Promise<{lat: number, lng: number}>((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          p => res({lat: p.coords.latitude, lng: p.coords.longitude}),
          rej, 
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
      setLocation(loc);

      const res = await api.get('/api/employee/punch/place', { params: { latitude: loc.lat, longitude: loc.lng } });
      if (res.data.officeLocation) {
        setOfficeLocation({ lat: res.data.officeLocation.latitude, lng: res.data.officeLocation.longitude, radius: res.data.officeLocation.radiusMeters });
      }
      if (!res.data.insideRadius) {
        throw new Error(`Outside office radius (${Math.round(res.data.distanceMeters)}m)`);
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
      setQrMode(res.data.mode || "PERMANENT_OFFICE_QR_AUTO_CODE");
      setStep(3);
      startSelfieCamera();
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

  // ----- Selfie -----
  const startSelfieCamera = async (skipFaceCheck = false) => {
    if (!skipFaceCheck && !faceReady) {
      stopCamera();
      setStep(5);
      setError(null);
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
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
        await loadFaceModels(faceapi);
        setFaceModelsLoaded(true);
      } catch (err) {
        setError("Failed to load Face AI Models");
      }
      setBusy(false);
    }
  };

  const handleCaptureAndPunch = async () => {
    const v = videoRef.current;
    if (!v) return;
    setBusy(true);
    setError(null);
    try {
      const c = document.createElement('canvas');
      c.width = v.videoWidth; 
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error("Cannot capture");
      ctx.drawImage(v, 0, 0);
      const blob = await new Promise<Blob|null>(r => c.toBlob(r, 'image/jpeg', 0.9));
      if (!blob) throw new Error("Cannot capture");

      const file = new File([blob], `${kind}.jpg`, { type: 'image/jpeg' });
      stopCamera();

      if (deviceStatus && !deviceStatus.approved) {
        throw new Error("Device not approved. Register device first.");
      }
      const deviceId = localStorage.getItem("attendance_device_id_v1") || 'unknown';

      const fd = new FormData();
      if (location) {
        fd.append("latitude", String(location.lat));
        fd.append("longitude", String(location.lng));
      }
      fd.append("deviceId", deviceId);
      if (settings?.requireQrForPunch) {
        fd.append("qrToken", qrToken);
      }
      fd.append("file", file);

      setBusy(true);
      // Run Face Recognition
      const faceapi = faceApiRef.current || await import('@vladmandic/face-api');
      faceApiRef.current = faceapi;
      const detection = await detectReliableFace(faceapi, v);
      if (detection) {
        const descriptorArray = Array.from(detection.descriptor);
        fd.append("faceDescriptor", JSON.stringify(descriptorArray));
      } else {
        throw new Error("No face detected. Move the phone slightly away, keep your full face in frame, and try again.");
      }

      await api.post(`/api/employee/punch/${kind}`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      setStep(4); // Success
      await refreshData();
    } catch (e: any) {
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, color: '#EF4444' }}>
                  <LocationOffRoundedIcon sx={{ fontSize: 28, mr: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>Location Issue</Typography>
                </Box>
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

        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Take a Selfie</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Box sx={{ flex: 1, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '4px solid #0052FF', mb: 4, maxHeight: 400, maxWidth: 400, mx: 'auto', width: '100%', bgcolor: 'black' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Button variant="contained" onClick={handleCaptureAndPunch} disabled={busy} sx={{ bgcolor: '#0052FF', borderRadius: 8, py: 2, fontSize: 18, fontWeight: 700 }}>
              {busy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Capture & Punch'}
            </Button>
          </Box>
        )}

        {step === 5 && (
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 420 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Register Face AI First</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 3 }}>Your attendance punch requires face verification. Register your face once, then continue this punch.</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Button variant="contained" onClick={() => setShowFaceRegister(true)} sx={{ bgcolor: '#0052FF', borderRadius: 8, py: 1.7, px: 4, fontWeight: 800, width: '100%', mb: 1.5 }}>
              Register Face AI
            </Button>
            <Button variant="outlined" onClick={closeOverlay} sx={{ borderColor: '#475569', color: '#CBD5E1', borderRadius: 8, py: 1.4, width: '100%' }}>
              Cancel Punch
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
      </Box>
      {showFaceRegister && (
        <FaceRegisterOverlay
          onClose={() => setShowFaceRegister(false)}
          onRegistered={() => {
            setFaceRegisteredThisSession(true);
            setShowFaceRegister(false);
            void refreshData();
            setStep(3);
            setTimeout(() => startSelfieCamera(true), 250);
          }}
        />
      )}
    </Dialog>
  );
}




