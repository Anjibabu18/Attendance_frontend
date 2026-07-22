import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearLastAuthError, getLastAuthError } from "../api/client";
import { useToast } from "../components/Toast";
import { Role, setAuth } from "../auth/auth";
import { motion } from "framer-motion";
import { loginWithBiometric, isBiometricSupported } from "../utils/webauthn";

const MotionBox = motion.create(Box);

type LoginResponse = {
  token: string;
  refreshToken?: string | null;
  role: Role;
  employeeId?: number | null;
  name?: string | null;
};

export default function LoginPage() {
  const { toastError } = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastAuthError] = useState(() => {
    const raw = getLastAuthError();
    if (!raw) return null;
    try { return JSON.parse(raw) as { message?: string }; }
    catch { return { message: raw }; }
  });
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const biometricSupported = isBiometricSupported();

  async function onBiometricLogin() {
    if (!username.trim()) {
      setError("Please enter your Employee ID or Email first.");
      return;
    }
    setBiometricLoading(true);
    setError(null);
    clearLastAuthError();
    try {
      const data = await loginWithBiometric(username);
      const token = data.token;
      if (!token || token.split(".").length < 3) { setError("Biometric login failed: no valid token."); return; }
      setAuth({ token, refreshToken: data.refreshToken, role: data.role as Role, name: data.name ?? undefined, loggedInAt: new Date().toISOString() });
      nav(nextPathForRole(data.role as Role), { replace: true });
    } catch (err: unknown) {
      const anyErr = err as any;
      setError(anyErr?.response?.data?.error ?? anyErr?.message ?? "Biometric login failed. Try again.");
    } finally {
      setBiometricLoading(false);
    }
  }

  useEffect(() => {
    if (error) { toastError(error); setError(null); }
  }, [error, toastError]);

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

  return (
    <Box sx={{ minHeight: "100svh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.48fr 1fr" }, overflow: "hidden" }}>
      
      {/* ── Left Brand Panel ── */}
      <MotionBox
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0a1628 0%, #0f2547 40%, #1a3a6a 100%)",
          color: "#fff",
          p: 6,
          "&::before": {
            content: '""', position: "absolute", inset: 0,
            background: "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(99,102,241,0.12), transparent 50%)",
            pointerEvents: "none",
          },
        }}
      >
        {/* Decorative grid */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 80px)", pointerEvents: "none" }} />
        
        {/* Floating orb */}
        <Box
          component={motion.div}
          animate={{ y: [0, -15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          sx={{ position: "absolute", top: "15%", right: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }}
        />
        
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 320 }}>
          {/* Logo */}
          <MotionBox
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
            sx={{ mb: 4 }}
          >
            <Box sx={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid rgba(59,130,246,0.4)", display: "grid", placeItems: "center", mx: "auto", mb: 3, bgcolor: "rgba(59,130,246,0.08)" }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "#60a5fa" }} />
            </Box>
            <Typography sx={{ fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>
              Work<Box component="span" sx={{ color: "#60a5fa" }}>Track</Box>
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, mt: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Attendance System
            </Typography>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Typography sx={{ fontSize: 22, fontWeight: 800, mb: 1.5, lineHeight: 1.3 }}>
              Manage your team's
              <br />
              attendance effortlessly
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
              Punch in, track hours, manage leaves — all from one secure platform.
            </Typography>
          </MotionBox>
        </Box>

        {/* Bottom copyright */}
        <Typography sx={{ position: "absolute", bottom: 24, color: "rgba(255,255,255,0.3)", fontSize: 11, zIndex: 1 }}>
          © 2026 VD Attendance
        </Typography>
      </MotionBox>

      {/* ── Right Login Form ── */}
      <MotionBox
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 5 },
          py: { xs: 5, md: 6 },
          background: "linear-gradient(170deg, #ffffff 0%, #f8faff 60%, #f0f4ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative arc */}
        <Box sx={{ position: "absolute", right: -80, bottom: -80, width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(37,99,235,0.08)", pointerEvents: "none" }} />

        <Box sx={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.5, mb: 5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(37,99,235,0.3)", display: "grid", placeItems: "center", color: "#2563eb" }}>
              <CheckCircleIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 900 }}>
              Work<Box component="span" sx={{ color: "#2563eb" }}>Track</Box>
            </Typography>
          </Box>

          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            sx={{ mb: 4 }}
          >
            <Typography sx={{ fontSize: { xs: 28, sm: 32 }, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
              Welcome back
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: 15, mt: 1 }}>
              Sign in to your account to continue
            </Typography>
          </MotionBox>

          {lastAuthError && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontSize: 13 }}>
              Your previous session expired. Please sign in again.
            </Alert>
          )}

          {/* Login Form */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            sx={{
              bgcolor: "#fff",
              border: "1px solid #e8edf5",
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              boxShadow: "0 8px 40px rgba(15,23,42,0.06)",
            }}
          >
            <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
              <TextField
                label="Username or Email"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
                autoFocus
                required
                disabled={loading}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: "#94a3b8" }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { height: 56, borderRadius: 2, bgcolor: "#fafbfd" } }}
              />

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
                  <Typography sx={{ fontWeight: 700, color: "#334155", fontSize: 14 }}>Password</Typography>
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => setError("Please contact HR to reset your password.")}
                    sx={{ minHeight: 0, p: 0, color: "#2563eb", fontWeight: 700, fontSize: 13, "&:hover": { transform: "none", bgcolor: "transparent" } }}
                  >
                    Forgot?
                  </Button>
                </Box>
                <TextField
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  required
                  disabled={loading}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: "#94a3b8" }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { height: 56, borderRadius: 2, bgcolor: "#fafbfd" } }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={!canSubmit}
                fullWidth
                endIcon={!loading ? <ArrowForwardIcon /> : undefined}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  fontSize: 16,
                  fontWeight: 800,
                  bgcolor: "#2563eb",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                  textTransform: "none",
                  "&:hover": { background: "linear-gradient(135deg, #4f8cff 0%, #3b82f6 100%)" },
                }}
              >
                {loading ? <Box sx={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "loginSpin 0.8s linear infinite", "@keyframes loginSpin": { to: { transform: "rotate(360deg)" } } }} /> : "Sign In"}
              </Button>

              {biometricSupported && (
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={biometricLoading ? <Box sx={{ width: 16, height: 16, border: "2px solid rgba(37,99,235,0.3)", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} /> : <FingerprintIcon />}
                  onClick={onBiometricLogin}
                  disabled={biometricLoading || loading}
                  fullWidth
                  sx={{
                    height: 50,
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                    color: "#334155",
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": { borderColor: "#2563eb", bgcolor: "rgba(37,99,235,0.04)" },
                  }}
                >
                  {biometricLoading ? "Verifying..." : "Sign in with Biometric"}
                </Button>
              )}
            </Box>
          </MotionBox>
        </Box>
      </MotionBox>
    </Box>
  );
}
