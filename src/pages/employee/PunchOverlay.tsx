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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number}|null>(null);

  const [qrToken, setQrToken] = useState<string>("");
  const [qrMode, setQrMode] = useState<string>("");
  const [dailyCode, setDailyCode] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);


  // Render leaflet map when error occurs and we have location data
  useEffect(() => {
    if (!error || !location || !officeLocation || !mapContainerRef.current) return;
    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const map = L.map(mapContainerRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'Â© OpenStreetMap' }).addTo(map);
      // Office circle
      L.circle([officeLocation.lat, officeLocation.lng], { radius: officeLocation.radius, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 2 }).addTo(map);
      L.marker([officeLocation.lat, officeLocation.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('ðŸ¢ Office').addTo(map);
      // Employee position
      L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>', iconSize: [14,14] }) }).bindPopup('ðŸ“ You are here').addTo(map);
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // ----- QR Scanning -----
  const startQrCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
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
    if (!videoRef.current || step !== 1) return;
    const v = videoRef.current;
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
        if (code) {
          handleQrScanned(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(scanQrLoop);
  };

  const handleQrScanned = async (token: string) => {
    stopCamera();
    setBusy(true);
    try {
      const res = await api.get('/api/employee/punch/qr', { params: { token } });
      setQrToken(token);
      if (res.data.mode === "FIXED_QR_DAILY_CODE") {
        setQrMode("FIXED_QR_DAILY_CODE");
        setStep(2); // Ask for daily code
      } else {
        setStep(3); // Go directly to selfie
        startSelfieCamera();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Invalid QR Code");
    } finally {
      setBusy(false);
    }
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
        if (qrMode === "FIXED_QR_DAILY_CODE") {
          fd.append("dailyCode", dailyCode);
        }
      }
      fd.append("file", file);

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
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#EF4444' }}>ðŸ“ Location Issue</Typography>
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
            <Typography sx={{ color: '#94A3B8', mb: 4 }}>Point your camera at the office QR code.</Typography>
            {error && <Typography sx={{ color: '#EF4444', mb: 2 }}>{error}</Typography>}
            <Box sx={{ flex: 1, position: 'relative', borderRadius: 4, overflow: 'hidden', border: '4px solid #0052FF', mb: 4, maxHeight: 400, maxWidth: 400, mx: 'auto', width: '100%', bgcolor: 'black' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
    </Dialog>
  );
}
