import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import QrCodeIcon from "@mui/icons-material/QrCode";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DevicesIcon from "@mui/icons-material/Devices";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearLastAuthError, getLastAuthError } from "../api/client";
import { useToast } from "../components/Toast";
import { Role, setAuth } from "../auth/auth";

type LoginResponse = {
  token: string;
  refreshToken?: string | null;
  role: Role;
  employeeId?: number | null;
  name?: string | null;
};

const FEATURES = [
  { icon: <QrCodeIcon sx={{ fontSize: 18 }} />, label: "Office QR Verification", color: "#6366f1" },
  { icon: <FaceRetouchingNaturalIcon sx={{ fontSize: 18 }} />, label: "Face Recognition", color: "#0f766e" },
  { icon: <LocationOnIcon sx={{ fontSize: 18 }} />, label: "GPS Location Check", color: "#2563eb" },
  { icon: <DevicesIcon sx={{ fontSize: 18 }} />, label: "Device Approval", color: "#d97706" },
];

export default function LoginPage() {
  const { toastError } = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) { toastError(error); setError(null); }
  }, [error, toastError]);

  const [lastAuthError] = useState(() => {
    const raw = getLastAuthError();
    if (!raw) return null;
    try { return JSON.parse(raw) as { message?: string }; }
    catch { return { message: raw }; }
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && !loading,
    [loading, password, username],
  );

  function nextPathForRole(role: Role) {
    if (role === "ROLE_ADMIN") return "/admin";
    if (role === "ROLE_HR") return "/hr";
    if (role === "ROLE_MANAGER") return "/manager";
    return "/employee";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    clearLastAuthError();
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) { setError("Enter your username and password."); return; }
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", { username: trimmedUsername, password });
      const token = res.data.token;
      if (!token || token.split(".").length < 3) { setError("Login succeeded but backend did not return a valid JWT token."); return; }
      setAuth({ token, refreshToken: res.data.refreshToken, role: res.data.role, name: res.data.name ?? undefined, loggedInAt: new Date().toISOString() });
      nav(nextPathForRole(res.data.role), { replace: true });
    } catch (err: unknown) {
      const anyErr = err as any;
      setError(anyErr?.response?.data?.error ?? anyErr?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const styles = `
    @keyframes loginFloat  { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-12px) rotate(1deg)} 66%{transform:translateY(-6px) rotate(-1deg)} }
    @keyframes loginScan   { 0%,100%{top:6%;opacity:0.5} 50%{top:84%;opacity:1} }
    @keyframes loginOrb1   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.1)} }
    @keyframes loginOrb2   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(0.9)} }
    @keyframes loginOrb3   { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,20px) scale(1.05)} 66%{transform:translate(-10px,-10px) scale(0.95)} }
    @keyframes loginFadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes loginSlideL { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
    @keyframes loginSlideR { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
    @keyframes featurePop  { from{opacity:0;transform:translateX(-20px) scale(0.9)} to{opacity:1;transform:translateX(0) scale(1)} }
    @keyframes ringPing    { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
    @keyframes checkPop   { 0%{transform:scale(0) rotate(-45deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  `;

  return (
    <Box sx={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 1.5, md: 3 }, position: "relative", overflow: "hidden" }}>
      <style>{styles}</style>

      {/* ── ANIMATED BACKGROUND BLOBS ── */}
      <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <Box sx={{ position: "absolute", top: "-15%", left: "-10%", width: { xs: 350, md: 550 }, height: { xs: 350, md: 550 }, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", animation: "loginOrb1 8s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", bottom: "-20%", right: "-10%", width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 }, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,118,110,0.16) 0%, transparent 70%)", animation: "loginOrb2 10s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", top: "30%", right: "20%", width: { xs: 200, md: 300 }, height: { xs: 200, md: 300 }, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)", animation: "loginOrb3 12s ease-in-out infinite" }} />
        {/* grid dots */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(99,102,241,0.12) 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.6 }} />
      </Box>

      {/* ── CARD ── */}
      <Box
        sx={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: { xs: "100%", md: 960 },
          display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          borderRadius: { xs: 4, md: 5 },
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(15,23,42,0.20), 0 8px 32px rgba(15,23,42,0.08)",
          border: "1px solid rgba(255,255,255,0.6)",
          animation: "loginFadeIn 0.6s cubic-bezier(0.2,0.8,0.2,1) both",
        }}
      >
        {/* ── LEFT PANEL ── */}
        <Box
          sx={{
            position: "relative", overflow: "hidden",
            background: "linear-gradient(155deg, #0f172a 0%, #1e1b4b 40%, #14532d 100%)",
            p: { xs: 3, md: 4 },
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            minHeight: { xs: "auto", md: 600 },
            animation: "loginSlideL 0.7s cubic-bezier(0.2,0.8,0.2,1) both",
          }}
        >
          {/* Decorative blobs inside card */}
          <Box sx={{ position: "absolute", top: -80, right: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
          <Box sx={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(15,118,110,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
          <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

          {/* Logo */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: "linear-gradient(135deg, #6366f1, #2563eb)", display: "grid", placeItems: "center", boxShadow: "0 8px 20px rgba(99,102,241,0.4)" }}>
                <SecurityIcon sx={{ fontSize: 22, color: "#fff" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#fff", lineHeight: 1.1 }}>Attendance</Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Secure Portal</Typography>
              </Box>
            </Box>

            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 14, color: "#6ee7b7 !important" }} />}
              label="Enterprise-grade security"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontWeight: 700, border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", mb: 2 }}
            />

            <Typography sx={{ fontWeight: 900, fontSize: { xs: 28, md: 36 }, lineHeight: 1.1, color: "#fff", mb: 1.5 }}>
              Check in with{" "}
              <Box component="span" sx={{ background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                confidence.
              </Box>
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.65, fontSize: 14, mb: 3 }}>
              One unified platform for QR attendance, device approval, face recognition, and real-time analytics.
            </Typography>

            {/* Animated scanner box */}
            <Box sx={{ position: "relative", height: 200, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)", overflow: "hidden", mb: 3 }}>
              <Box sx={{ position: "absolute", inset: 14, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }} />
              {/* Corners */}
              {[["0%","0%","bottom","right"],["0%","auto","bottom","left"],["auto","0%","top","right"],["auto","auto","top","left"]].map(([t,l,b,r], i) => (
                <Box key={i} sx={{ position:"absolute", top:t==="auto"?undefined:14, left:l==="auto"?undefined:14, bottom:b==="top"?undefined:14, right:r==="left"?undefined:14, width:20, height:20, borderTop:`2px solid ${i<2?"rgba(99,102,241,0.8)":"transparent"}`, borderLeft:`2px solid ${i%2===0?"rgba(99,102,241,0.8)":"transparent"}`, borderBottom:`2px solid ${i>=2?"rgba(15,118,110,0.8)":"transparent"}`, borderRight:`2px solid ${i%2===1?"rgba(15,118,110,0.8)":"transparent"}` }} />
              ))}
              {/* Scan line */}
              <Box sx={{ position: "absolute", left: 22, right: 22, height: 2, background: "linear-gradient(90deg, transparent, #67e8f9, transparent)", boxShadow: "0 0 16px rgba(103,232,249,0.8), 0 0 32px rgba(103,232,249,0.4)", animation: "loginScan 2.8s ease-in-out infinite" }} />
              {/* Center face icon */}
              <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <Box sx={{ position: "relative" }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", bgcolor: "rgba(99,102,241,0.15)", display: "grid", placeItems: "center", animation: "loginFloat 5s ease-in-out infinite", backdropFilter: "blur(8px)" }}>
                    <FaceRetouchingNaturalIcon sx={{ fontSize: 38, color: "rgba(255,255,255,0.8)" }} />
                  </Box>
                  <Box sx={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.3)", animation: "ringPing 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                </Box>
              </Box>
            </Box>

            {/* Feature pills */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {FEATURES.map((f, i) => (
                <Box
                  key={f.label}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1, p: "10px 14px",
                    borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(8px)",
                    animation: `featurePop 0.5s cubic-bezier(0.2,0.8,0.2,1) ${0.1 + i * 0.08}s both`,
                    transition: "background-color 0.2s ease",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
                  }}
                >
                  <Box sx={{ color: f.color, flexShrink: 0, filter: `drop-shadow(0 2px 8px ${f.color}88)` }}>{f.icon}</Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 11.5, fontWeight: 600, lineHeight: 1.3 }}>{f.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Bottom copyright */}
          <Typography sx={{ position: "relative", zIndex: 1, mt: 3, color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500 }}>
            © 2025 Attendance System · All rights reserved
          </Typography>
        </Box>

        {/* ── RIGHT PANEL ── */}
        <Box
          sx={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            p: { xs: 3, md: 5 },
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "loginSlideR 0.7s cubic-bezier(0.2,0.8,0.2,1) both",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 28, md: 34 }, color: "#0f172a", lineHeight: 1.1 }}>
                  Welcome back
                </Typography>
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: 3,
                    background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
                    display: "grid", placeItems: "center", color: "#2563eb",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.12)",
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 14, fontWeight: 500 }}>
                Sign in with your company credentials to continue.
              </Typography>
            </Box>

            {/* Alerts */}
            {lastAuthError && (
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: 13 }}>
                Your previous session expired. Please sign in again.
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
              {/* Username */}
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  autoFocus required disabled={loading} fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      fontSize: 15,
                      transition: "all 0.25s ease",
                      ...(focused === "user" ? { boxShadow: "0 0 0 4px rgba(37,99,235,0.08)" } : {}),
                    },
                  }}
                />
              </Box>

              {/* Password */}
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  required disabled={loading} fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      fontSize: 15,
                      transition: "all 0.25s ease",
                      ...(focused === "pass" ? { boxShadow: "0 0 0 4px rgba(37,99,235,0.08)" } : {}),
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((s) => !s)}
                          sx={{ color: "text.secondary", "&:hover": { bgcolor: "rgba(37,99,235,0.06)" } }}
                        >
                          {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Submit button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? undefined : <LoginIcon />}
                disabled={!canSubmit}
                fullWidth
                sx={{
                  mt: 0.5,
                  height: 52,
                  fontWeight: 800,
                  fontSize: 15,
                  borderRadius: 3,
                  background: canSubmit
                    ? "linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #0891b2 100%)"
                    : undefined,
                  backgroundSize: "200% 200%",
                  animation: canSubmit ? "gradientRotate 4s ease infinite" : "none",
                  boxShadow: canSubmit ? "0 8px 28px rgba(37,99,235,0.35)" : "none",
                  letterSpacing: "0.02em",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    boxShadow: "0 12px 36px rgba(37,99,235,0.45)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Signing in...
                  </Box>
                ) : "Sign in to portal"}
              </Button>
            </Box>

            {/* Security badges */}
            <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(226,232,240,0.7)" }}>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, textAlign: "center", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Protected by
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, flexWrap: "wrap" }}>
                {["JWT Auth", "HTTPS", "Face ID", "Device Lock"].map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    icon={<CheckCircleIcon sx={{ fontSize: "14px !important", color: "#16a34a !important" }} />}
                    sx={{ bgcolor: "rgba(22,163,74,0.06)", color: "#15803d", border: "1px solid rgba(22,163,74,0.18)", fontWeight: 700, fontSize: 11, height: 26, "& .MuiChip-label": { pl: 0.5 } }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
