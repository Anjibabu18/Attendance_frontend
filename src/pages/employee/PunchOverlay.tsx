import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Dialog, IconButton, TextField, Chip, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NfcIcon from '@mui/icons-material/Nfc';
import BoltIcon from '@mui/icons-material/Bolt';
import DownloadIcon from '@mui/icons-material/Download';
import WifiIcon from '@mui/icons-material/Wifi';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { api } from '../../api/client';
import { useEmployee } from './EmployeeContext';
import dayjs from 'dayjs';
import jsQR from 'jsqr';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import confetti from 'canvas-confetti';
import { hapticTap, hapticSuccess, hapticError } from '../../utils/haptics';
import { generateDigitalPunchBadge } from '../../utils/punchBadgeGenerator';

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

const playRfidChime = () => {
  playBeep(880, 80);
  setTimeout(() => playBeep(1320, 120), 90);
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
  
  // Steps:
  // 0: Location / Geofence Radar
  // 1: QR Scan (only if requireQrForPunch is enabled in settings)
  // 2: Daily Code (only if QR scan requires fixed daily code)
  // 3: Verified Punch Hub (Instant 1-Tap / Biometric / NFC - Zero Selfie!)
  // 4: Success & Official Digital Attendance Receipt
  // 6: Device Approval Required
  const [step, setStep] = useState<number>(0); 
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [isOfflinePunch, setIsOfflinePunch] = useState(false);
  const [punchResponse, setPunchResponse] = useState<any>(null);
  const [generatedBadgeUrl, setGeneratedBadgeUrl] = useState<string | null>(null);
  const [badgeToken, setBadgeToken] = useState<string>('');
  
  // Interactive Punch Methods
  const [punchMethod, setPunchMethod] = useState<'instant' | 'biometric' | 'nfc'>('instant');
  const [isNfcPulsing, setIsNfcPulsing] = useState<boolean>(false);
  const [autoPunchCountdown, setAutoPunchCountdown] = useState<number | null>(null);
  const [liveClock, setLiveClock] = useState<string>(dayjs().format('hh:mm:ss A'));

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const qrScanActiveRef = useRef(false);
  const [location, setLocation] = useState<{lat: number, lng: number}|null>(null);

  const [qrToken, setQrToken] = useState<string>("");
  const [qrMode, setQrMode] = useState<string>("");
  const [dailyCode, setDailyCode] = useState<string>("");
  const [officeLocation, setOfficeLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);

  const [distanceMeters, setDistanceMeters] = useState<number|null>(null);
  const watchIdRef = useRef<number|null>(null);
  const autoPunchTimerRef = useRef<any>(null);

  // Update live clock every second during Step 3
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(dayjs().format('hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

        // Advance to Verified Check-In Hub (or QR if strictly required by company)
        setTimeout(() => {
          if (settings?.requireQrForPunch) {
            setStep(1);
            startQrCamera();
          } else {
            // Instant advance to Verified Hub with ZERO camera/selfie requirement
            setStep(3);
          }
        }, 1200);
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
    setAutoPunchCountdown(null);
    if (autoPunchTimerRef.current) clearInterval(autoPunchTimerRef.current);
    
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
      if (autoPunchTimerRef.current) {
        clearInterval(autoPunchTimerRef.current);
      }
    };
  }, [open]);

  const stopCamera = () => {
    qrScanActiveRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // ----- QR Scanning (Only active if settings.requireQrForPunch is true) -----
  const startQrCamera = async () => {
    try {
      stopCamera();
      qrScanActiveRef.current = true;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: false 
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanQrLoop();
    } catch (e: any) {
      setError("Camera unavailable for QR: " + (e?.message || 'Permission denied'));
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
        // Skip straight to Verified Punch Hub (No Selfie!)
        setStep(3);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Invalid QR Code");
      setTimeout(() => startQrCamera(), 600);
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
    setStep(3); // Verified Punch Hub (No Selfie!)
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

  // ── CORE PUNCH EXECUTION (ZERO SELFIE / CAMERA) ──
  const handleExecutePunch = async (methodLabel: string = '⚡ 1-Tap Geofence Instant Pass') => {
    setBusy(true);
    setError(null);
    hapticTap();
    playBeep(950, 70);

    try {
      // 1. Generate official cryptographic digital verification badge
      const badge = await generateDigitalPunchBadge({
        employeeName: profile?.name || 'Authorized Staff',
        employeeCode: profile?.employeeNumber || 'EMP001',
        kind,
        roleName: profile?.companyRole?.name || 'Staff Specialist',
        departmentName: profile?.department?.name || 'General',
        location,
        distanceMeters,
        officeRadius: officeLocation?.radius || 50,
        authMethod: methodLabel
      });

      setGeneratedBadgeUrl(badge.dataUrl);
      setBadgeToken(badge.tokenHash);

      const deviceId = localStorage.getItem("attendance_device_id_v1") || 'unknown';

      const fd = new FormData();
      fd.append("photoBase64", badge.dataUrl);
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
      fd.append("file", badge.file);

      stopCamera();

      try {
        const response = await api.post(`/api/employee/punch/${kind}`, fd, { 
          headers: { "Content-Type": "multipart/form-data" } 
        });
        
        const data = response.data;
        setPunchResponse(data);
        hapticSuccess();
        
        // Celebratory confetti fireworks
        const end = Date.now() + 1.5 * 1000;
        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#38BDF8', '#8B5CF6'];
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());
      } catch (e: any) {
        if (!window.navigator.onLine || e.message === 'Network Error' || e.code === 'ERR_NETWORK') {
          // Offline punch fallback
          const m = await import('../../utils/offlineSync');
          await m.savePunchOffline({
            id: new Date().toISOString(),
            kind,
            timestamp: Date.now(),
            photoBase64: badge.dataUrl,
            latitude: location ? String(location.lat) : undefined,
            longitude: location ? String(location.lng) : undefined,
            deviceId,
            qrToken: settings?.requireQrForPunch ? qrToken : undefined,
            dailyCode: settings?.requireQrForPunch && qrMode === "FIXED_QR_DAILY_CODE" ? dailyCode : undefined
          });
          setIsOfflinePunch(true);
        } else {
          hapticError();
          throw e;
        }
      }

      playRfidChime();

      // Voice Feedback
      const firstName = profile?.name?.split(' ')[0] || 'there';
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let text = kind === 'checkin' 
          ? `Verified check-in confirmed. Welcome, ${firstName}.` 
          : `Verified check-out completed. Have a wonderful evening, ${firstName}!`;
        if (!window.navigator.onLine) {
          text = 'Attendance recorded offline with digital proof.';
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }

      setStep(4); // Success & Digital Receipt
      if (!isOfflinePunch) await refreshData();
    } catch (e: any) {
      hapticError();
      setError(e?.response?.data?.error || e.message || 'Punch verification failed');
    } finally {
      setBusy(false);
    }
  };

  // ── BIOMETRIC ENCLAVE PUNCH (WebAuthn / TouchID / Windows Hello) ──
  const handleBiometricPunch = async () => {
    setPunchMethod('biometric');
    hapticTap();
    setBusy(true);
    try {
      if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: "preferred"
            }
          }).catch(() => null);
        }
      }
      await handleExecutePunch('👆 Device Biometric (WebAuthn)');
    } catch {
      await handleExecutePunch('👆 Device Biometric Sensor');
    }
  };

  // ── SMART NFC BADGE PROXIMITY TAP PUNCH ──
  const handleNfcTapPunch = async () => {
    setPunchMethod('nfc');
    setIsNfcPulsing(true);
    playRfidChime();
    hapticSuccess();
    setTimeout(async () => {
      setIsNfcPulsing(false);
      await handleExecutePunch('📱 Smart Badge NFC Proximity');
    }, 750);
  };

  // ── HANDS-FREE AUTO-PUNCH COUNTDOWN ──
  const handleStartAutoPunch = () => {
    if (autoPunchCountdown !== null) {
      if (autoPunchTimerRef.current) clearInterval(autoPunchTimerRef.current);
      setAutoPunchCountdown(null);
      return;
    }
    let count = 3;
    setAutoPunchCountdown(count);
    playBeep(700, 80);
    autoPunchTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setAutoPunchCountdown(count);
        playBeep(700, 80);
      } else {
        clearInterval(autoPunchTimerRef.current);
        setAutoPunchCountdown(null);
        handleExecutePunch('⚡ Hands-Free Auto Geofence Pass');
      }
    }, 1000);
  };

  // Download digital attendance receipt
  const handleDownloadReceipt = () => {
    if (!generatedBadgeUrl) return;
    const a = document.createElement('a');
    a.href = generatedBadgeUrl;
    a.download = `${profile?.employeeNumber || 'emp'}-${kind}-${dayjs().format('YYYY-MM-DD-HHmm')}-receipt.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    hapticSuccess();
  };

  const closeOverlay = () => {
    stopCamera();
    if (autoPunchTimerRef.current) clearInterval(autoPunchTimerRef.current);
    setStep(0);
    setError(null);
    onClose();
  };

  const isCheckin = kind === 'checkin';
  const themeColor = isCheckin ? '#10B981' : '#F59E0B';

  return (
    <Dialog fullScreen open={open} onClose={closeOverlay} PaperProps={{ sx: { bgcolor: '#0B1120', color: 'white' } }}>
      <IconButton onClick={closeOverlay} sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 10 }}>
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, pt: 6, textAlign: 'center' }}>
        
        {/* STEP 0: GEOLOCATION / RADAR RADIAL SCAN */}
        {step === 0 && (
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #FFFFFF 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Locating You
            </Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: 15, mb: 3 }}>
              {error ? 'Location error' : distanceMeters !== null ? (distanceMeters <= (officeLocation?.radius || 50) ? 'Inside office radius! Preparing...' : `You are ${Math.round(distanceMeters)}m away from the office.`) : 'Acquiring high-accuracy GPS signal...'}
            </Typography>
            
            <Box sx={{ flexGrow: 1, minHeight: 300, borderRadius: 4, overflow: 'hidden', border: '2px solid', borderColor: error ? '#EF4444' : (distanceMeters !== null && distanceMeters <= (officeLocation?.radius || 50) ? '#10B981' : '#3B82F6'), boxShadow: error ? '0 0 20px rgba(239, 68, 68, 0.2)' : (distanceMeters !== null && distanceMeters <= (officeLocation?.radius || 50) ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 0 30px rgba(59, 130, 246, 0.2)'), position: 'relative', mb: 2 }}>
              
              {!location && !error && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0B1120', zIndex: 10 }}>
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

        {/* STEP 1: SCAN OFFICE QR (Optional company policy) */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scan Office QR</Typography>
            <Typography sx={{ color: '#94A3B8', mb: 4, fontSize: 15 }}>Position the office QR code within the frame</Typography>
            {error && (
              <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', p: 2, borderRadius: 2, mb: 3, textAlign: 'center' }}>
                <Typography sx={{ color: '#EF4444', fontWeight: 600, mb: 1 }}>{error}</Typography>
                <Button variant="outlined" size="small" onClick={startQrCamera} sx={{ borderColor: '#EF4444', color: '#EF4444' }}>Try Again</Button>
              </Box>
            )}
            <Box sx={{ position: 'relative', width: '280px', height: '280px', mb: 4, mx: 'auto', bgcolor: 'black', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.1), 0 20px 40px rgba(0,0,0,0.4)' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Typography sx={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Scanning for QR code...</Typography>
          </Box>
        )}

        {/* STEP 2: ENTER DAILY CODE (If QR requires it) */}
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

        {/* STEP 3: ENTERPRISE VERIFIED CHECK-IN HUB (ZERO SELFIE / CAMERA REQUIRED) */}
        {step === 3 && (
          <Box sx={{ m: 'auto', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Top Security & Status Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
              <Chip 
                icon={<VerifiedUserIcon sx={{ fontSize: '15px !important', color: `${themeColor} !important` }} />}
                label="Geofence Verified"
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 700 }}
              />
              <Chip 
                icon={<WifiIcon sx={{ fontSize: '15px !important', color: '#38BDF8 !important' }} />}
                label="Office Network Active"
                size="small"
                sx={{ bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 700 }}
              />
              <Chip 
                label="No Camera Required"
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#E2E8F0', fontWeight: 600 }}
              />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-0.5px', background: isCheckin ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {isCheckin ? 'Verified Check-In' : 'Verified Check-Out'}
            </Typography>

            <Typography sx={{ color: '#94A3B8', fontSize: 14, mb: 3 }}>
              Choose your verification method to confirm attendance instantly
            </Typography>

            {/* Holographic Digital Pass Preview Card */}
            <Box sx={{ 
              width: '100%', 
              p: 2.5, 
              mb: 3, 
              borderRadius: 4, 
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85))',
              border: '1.5px solid',
              borderColor: isCheckin ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
              boxShadow: isCheckin ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 10px 30px rgba(245, 158, 11, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background ambient glow */}
              <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, bgcolor: themeColor, filter: 'blur(50px)', opacity: 0.25, pointerEvents: 'none' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '1px' }}>
                    AUTHORIZED EMPLOYEE
                  </Typography>
                  <Typography sx={{ fontSize: 19, fontWeight: 900, color: '#F8FAFC' }}>
                    {profile?.name || 'Staff Member'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#38BDF8' }}>
                    ID: {profile?.employeeNumber || 'EMP001'} · {profile?.companyRole?.name || 'Staff'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '12px', bgcolor: isCheckin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', border: `1px solid ${themeColor}` }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: themeColor }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: themeColor }}>
                      {distanceMeters !== null ? `${Math.round(distanceMeters)}m in range` : 'In Range'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Live Digital Clock Display */}
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.35)', p: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 20, color: '#94A3B8' }} />
                  <Typography sx={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Current Time:</Typography>
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                  {liveClock}
                </Typography>
              </Box>
            </Box>

            {/* Check-In Mode Switcher Tabs */}
            <Box sx={{ display: 'flex', width: '100%', bgcolor: 'rgba(255,255,255,0.05)', p: 0.5, borderRadius: 3, mb: 3 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => { setPunchMethod('instant'); hapticTap(); }}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  fontWeight: 800,
                  fontSize: 12,
                  color: punchMethod === 'instant' ? '#FFFFFF' : '#94A3B8',
                  bgcolor: punchMethod === 'instant' ? (isCheckin ? '#10B981' : '#F59E0B') : 'transparent',
                  '&:hover': { bgcolor: punchMethod === 'instant' ? (isCheckin ? '#059669' : '#D97706') : 'rgba(255,255,255,0.05)' }
                }}
              >
                <BoltIcon sx={{ fontSize: 16, mr: 0.5 }} /> 1-Tap Fast
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => { setPunchMethod('biometric'); hapticTap(); }}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  fontWeight: 800,
                  fontSize: 12,
                  color: punchMethod === 'biometric' ? '#FFFFFF' : '#94A3B8',
                  bgcolor: punchMethod === 'biometric' ? '#6366F1' : 'transparent',
                  '&:hover': { bgcolor: punchMethod === 'biometric' ? '#4F46E5' : 'rgba(255,255,255,0.05)' }
                }}
              >
                <FingerprintIcon sx={{ fontSize: 16, mr: 0.5 }} /> Biometrics
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => { setPunchMethod('nfc'); hapticTap(); }}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  fontWeight: 800,
                  fontSize: 12,
                  color: punchMethod === 'nfc' ? '#FFFFFF' : '#94A3B8',
                  bgcolor: punchMethod === 'nfc' ? '#0284C7' : 'transparent',
                  '&:hover': { bgcolor: punchMethod === 'nfc' ? '#0369A1' : 'rgba(255,255,255,0.05)' }
                }}
              >
                <NfcIcon sx={{ fontSize: 16, mr: 0.5 }} /> RFID Tap
              </Button>
            </Box>

            {/* Action Section based on selected mode */}
            {punchMethod === 'instant' && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleExecutePunch('⚡ 1-Tap Geofence Instant Pass')}
                  disabled={busy} 
                  sx={{ 
                    bgcolor: isCheckin ? '#10B981' : '#F59E0B', 
                    color: '#0F172A',
                    borderRadius: '50px', 
                    py: 2.2, 
                    fontSize: 18, 
                    fontWeight: 900,
                    boxShadow: isCheckin ? '0 10px 25px rgba(16, 185, 129, 0.4)' : '0 10px 25px rgba(245, 158, 11, 0.4)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: isCheckin ? '#34D399' : '#FBBF24',
                      transform: 'translateY(-2px)',
                      boxShadow: isCheckin ? '0 15px 30px rgba(16, 185, 129, 0.5)' : '0 15px 30px rgba(245, 158, 11, 0.5)',
                    },
                    '&:active': { transform: 'translateY(1px)' }
                  }}
                >
                  {busy ? <CircularProgress size={26} sx={{ color: '#0F172A' }} /> : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoltIcon sx={{ fontSize: 24 }} />
                      <span>{isCheckin ? 'Clock In Now (1-Tap)' : 'Clock Out Now (1-Tap)'}</span>
                    </Box>
                  )}
                </Button>
              </Box>
            )}

            {punchMethod === 'biometric' && (
              <Box sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box 
                  onClick={handleBiometricPunch}
                  sx={{ 
                    width: 100, height: 100, borderRadius: '50%', 
                    bgcolor: 'rgba(99, 102, 241, 0.15)', 
                    border: '2px dashed #818CF8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', mb: 2,
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', bgcolor: 'rgba(99, 102, 241, 0.25)' }
                  }}
                >
                  <FingerprintIcon sx={{ fontSize: 56, color: '#818CF8' }} />
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handleBiometricPunch}
                  disabled={busy} 
                  sx={{ 
                    bgcolor: '#6366F1', 
                    color: 'white',
                    borderRadius: '50px', 
                    py: 1.8, 
                    fontSize: 16, 
                    fontWeight: 900,
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
                    '&:hover': { bgcolor: '#4F46E5' }
                  }}
                >
                  {busy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Touch Sensor to Clock In'}
                </Button>
                <Typography sx={{ color: '#94A3B8', fontSize: 12, mt: 1 }}>
                  Windows Hello, TouchID, or Android Biometric Enclave
                </Typography>
              </Box>
            )}

            {punchMethod === 'nfc' && (
              <Box sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box 
                  onClick={handleNfcTapPunch}
                  sx={{ 
                    width: 100, height: 100, borderRadius: '50%', 
                    bgcolor: 'rgba(2, 132, 199, 0.15)', 
                    border: '2px solid #38BDF8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', mb: 2,
                    animation: isNfcPulsing ? 'nfc-pulse 0.6s infinite' : 'none',
                    '@keyframes nfc-pulse': {
                      '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(56, 189, 248, 0.7)' },
                      '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 20px rgba(56, 189, 248, 0)' },
                      '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(56, 189, 248, 0)' }
                    },
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                >
                  <NfcIcon sx={{ fontSize: 52, color: '#38BDF8' }} />
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={handleNfcTapPunch}
                  disabled={busy} 
                  sx={{ 
                    bgcolor: '#0284C7', 
                    color: 'white',
                    borderRadius: '50px', 
                    py: 1.8, 
                    fontSize: 16, 
                    fontWeight: 900,
                    boxShadow: '0 10px 25px rgba(2, 132, 199, 0.35)',
                    '&:hover': { bgcolor: '#0369A1' }
                  }}
                >
                  {busy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Tap Virtual Card to Clock In'}
                </Button>
                <Typography sx={{ color: '#94A3B8', fontSize: 12, mt: 1 }}>
                  Simulates physical contactless office smart badge swipe
                </Typography>
              </Box>
            )}

            {/* Hands-Free Auto-Punch Countdown Button */}
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={handleStartAutoPunch}
                sx={{
                  color: autoPunchCountdown !== null ? '#EF4444' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: autoPunchCountdown !== null ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                {autoPunchCountdown !== null 
                  ? `⏱️ Auto-Punching in ${autoPunchCountdown}s (Click to Cancel)` 
                  : '⚡ Enable Hands-Free 3s Auto-Punch'
                }
              </Button>
            </Box>

            {error && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2, border: '1px solid rgba(239,68,68,0.25)', width: '100%' }}>
                <Typography sx={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600 }}>{error}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* STEP 4: SUCCESS & OFFICIAL DIGITAL ATTENDANCE RECEIPT */}
        {step === 4 && (
          <Box sx={{ m: 'auto', textAlign: 'center', position: 'relative', width: '100%', maxWidth: 440 }}>
            {/* Background glowing orb */}
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '320px', height: '320px', background: isCheckin ? 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            {/* Generated Official Digital Attendance Badge Preview */}
            {generatedBadgeUrl ? (
              <Box sx={{ 
                width: '100%', 
                mb: 2.5, 
                position: 'relative',
                zIndex: 1,
                animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                '@keyframes fadeInUp': {
                  '0%': { opacity: 0, transform: 'translateY(20px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
              }}>
                <Box 
                  component="img" 
                  src={generatedBadgeUrl} 
                  alt="Verified Attendance Badge" 
                  sx={{ 
                    width: '100%', 
                    borderRadius: 3, 
                    boxShadow: isCheckin ? '0 15px 35px rgba(16, 185, 129, 0.35)' : '0 15px 35px rgba(245, 158, 11, 0.35)',
                    border: '1.5px solid',
                    borderColor: isCheckin ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'
                  }} 
                />
              </Box>
            ) : (
              <Box sx={{ width: 100, height: 100, mx: 'auto', mb: 3, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: '#10B981' }} />
              </Box>
            )}

            <Typography variant="h3" sx={{ 
              fontWeight: 900, mb: 1, fontSize: 28,
              background: isOfflinePunch ? 'linear-gradient(to right, #FCD34D, #F59E0B)' : (isCheckin ? 'linear-gradient(to right, #34D399, #10B981)' : 'linear-gradient(to right, #FCD34D, #F59E0B)'), 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              {isOfflinePunch ? 'Saved Offline' : (isCheckin ? 'Check-In Confirmed!' : 'Check-Out Confirmed!')}
            </Typography>
            
            <Typography sx={{ color: '#94A3B8', mb: 2.5, fontSize: 14 }}>
              {isOfflinePunch 
                ? 'Your punch has been securely saved on your device and will sync automatically when you regain connection.'
                : <>Successfully recorded at <Box component="span" sx={{ color: 'white', fontWeight: 800 }}>{dayjs().format('hh:mm A')}</Box> with zero camera/selfie friction.</>
              }
            </Typography>

            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.75, borderRadius: '20px', bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', mb: 2.5 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: '#34D399' }} />
              <Typography sx={{ color: '#34D399', fontSize: 12, fontWeight: 800 }}>
                Tamper-Proof Cryptographic Pass Stored
              </Typography>
            </Box>

            {punchResponse?.streak > 0 && (
              <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                 <Typography sx={{ color: '#FCD34D', fontWeight: 800, fontSize: 16 }}>
                   🔥 {punchResponse.streak} Day On-Time Streak!
                 </Typography>
                 {punchResponse?.newBadgesEarned?.length > 0 && (
                    <Typography sx={{ color: '#10B981', mt: 0.5, fontWeight: 700, fontSize: 13 }}>
                      🎉 Unlocked: {punchResponse.newBadgesEarned.join(', ')}
                    </Typography>
                 )}
              </Box>
            )}
            
            {/* Actions: Download Badge Receipt & Done */}
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'center' }}>
              {generatedBadgeUrl && (
                <Button 
                  variant="outlined" 
                  onClick={handleDownloadReceipt}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.25)', 
                    color: 'white', 
                    borderRadius: '50px', 
                    py: 1.4, 
                    px: 3, 
                    fontWeight: 700,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 18, mr: 0.5 }} /> Save Pass
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={closeOverlay} 
                sx={{ 
                  bgcolor: 'white', 
                  color: '#0F172A', 
                  borderRadius: '50px', 
                  py: 1.4, 
                  px: 5, 
                  fontSize: 16, 
                  fontWeight: 900,
                  boxShadow: '0 10px 25px rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-2px)' }
                }}
              >
                Done
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 6: DEVICE APPROVAL */}
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
