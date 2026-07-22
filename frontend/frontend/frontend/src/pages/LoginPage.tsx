import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LanguageIcon from "@mui/icons-material/Language";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearLastAuthError, getLastAuthError } from "../api/client";
import { useToast } from "../components/Toast";
import { Role, setAuth } from "../auth/auth";
import { motion, AnimatePresence } from "framer-motion";
import { loginWithBiometric, isBiometricSupported } from "../utils/webauthn";

const MotionBox = motion.create(Box);

type LoginResponse = {
  token: string;
  refreshToken?: string | null;
  role: Role;
  employeeId?: number | null;
  name?: string | null;
};

const FEATURE_ITEMS = [
  {
    icon: <AccessTimeIcon />,
    title: "Real-time Tracking",
    detail: "Track your work hours in real-time with accurate timing",
  },
  {
    icon: <CalendarMonthIcon />,
    title: "Smart Attendance",
    detail: "Automated attendance tracking with intelligent insights",
  },
  {
    icon: <ShieldOutlinedIcon />,
    title: "Secure & Reliable",
    detail: "Your data is protected with enterprise-grade security",
  },
  {
    icon: <BarChartIcon />,
    title: "Advanced Analytics",
    detail: "Get detailed reports and insights about productivity",
  },
];

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
  const [remember, setRemember] = useState(true);
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
  const usernameLabel = 'Username or Email';

  return (
    <Box sx={{ minHeight: "100svh", bgcolor: "#f3f8ff", display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.72fr 1fr" }, overflow: "hidden" }}>
      <MotionBox
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          position: "relative",
          minHeight: { xs: 520, md: "100svh" },
          overflow: "hidden",
          color: "#fff",
          p: { xs: 3, sm: 5, md: 6 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#071a33",
          backgroundImage: `
            linear-gradient(90deg, rgba(6,22,44,0.98), rgba(9,33,64,0.82)),
            linear-gradient(120deg, rgba(37,99,235,0.22), transparent 48%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 128px),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 112px)
          `,
          "&:before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 18% 12%, rgba(96,165,250,0.18), transparent 24%), linear-gradient(135deg, transparent 0 38%, rgba(255,255,255,0.05) 38% 39%, transparent 39% 100%)",
            pointerEvents: "none",
          },
          "&:after": {
            content: '""',
            position: "absolute",
            left: "10%",
            right: "8%",
            bottom: "9%",
            height: "22%",
            borderRadius: "18px 18px 0 0",
            background: "linear-gradient(180deg, rgba(15,23,42,0.34), rgba(15,23,42,0.7))",
            boxShadow: "0 -90px 110px rgba(15,23,42,0.45)",
            pointerEvents: "none",
          },
        }}
      >
        <MotionBox initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 50, height: 50, borderRadius: "50%", border: "4px solid rgba(59,130,246,0.35)", display: "grid", placeItems: "center", color: "#60a5fa" }}>
              <CheckCircleIcon sx={{ fontSize: 31 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: 27, md: 30 }, fontWeight: 900, lineHeight: 1 }}>
                Work<Box component="span" sx={{ color: "#3b82f6" }}>Track</Box>
              </Typography>
              <Typography sx={{ mt: 0.7, color: "rgba(255,255,255,0.76)", fontSize: 14 }}>Employee Attendance System</Typography>
            </Box>
          </Box>
        </MotionBox>

        <MotionBox 
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
          sx={{ position: "relative", zIndex: 1, my: { xs: 5, md: 7 } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <Typography sx={{ fontSize: { xs: 33, md: 40 }, fontWeight: 900, letterSpacing: 0, lineHeight: 1.1, mb: 1.5 }}>Welcome Back!</Typography>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <Typography sx={{ fontSize: { xs: 23, md: 27 }, fontWeight: 850, color: "#4f8cff", mb: 3 }}>Great to see you again</Typography>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <Typography sx={{ color: "rgba(255,255,255,0.84)", fontSize: 17, lineHeight: 1.7, maxWidth: 390 }}>
              Sign in to your account and continue managing your attendance with ease.
            </Typography>
          </motion.div>

          <Box sx={{ display: "grid", gap: 2.5, mt: 6 }}>
            {FEATURE_ITEMS.map((item) => (
              <motion.div key={item.title} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 2, alignItems: "center" }}>
                  <Box sx={{ width: 54, height: 54, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "#1f6fff", boxShadow: "0 12px 26px rgba(37,99,235,0.36)", "& svg": { fontSize: 28 } }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 850, fontSize: 16 }}>{item.title}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.5, fontSize: 14 }}>{item.detail}</Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </MotionBox>

        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ maxWidth: 360, borderRadius: 3, bgcolor: "rgba(30,64,175,0.42)", border: "1px solid rgba(147,197,253,0.18)", p: 3, backdropFilter: "blur(14px)", mb: { xs: 4, md: 8 } }}>
            <Typography sx={{ fontSize: 48, lineHeight: 0.7, color: "#5b8cff", fontWeight: 900 }}>"</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.92)", fontSize: 14.5, lineHeight: 1.6, mb: 2 }}>
              WorkTrack has simplified attendance management and improved daily team visibility.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: "50%", bgcolor: "#e2e8f0", color: "#0f172a", display: "grid", placeItems: "center", fontWeight: 900 }}>RV</Box>
              <Box>
                <Typography sx={{ fontWeight: 850, fontSize: 14 }}>Rahul Verma</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: 12.5 }}>HR Manager, TechCorp</Typography>
              </Box>
            </Box>
          </Box>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: 12 }}>(c) 2026 WorkTrack. All rights reserved.</Typography>
        </MotionBox>
      </MotionBox>

      <MotionBox
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        sx={{
          minHeight: { xs: "auto", md: "100svh" },
          position: "relative",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(145deg, #ffffff 0%, #f6faff 50%, #eaf3ff 100%)",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            left: "8%",
            right: "-10%",
            bottom: -80,
            height: 220,
            borderTop: "1px solid rgba(37,99,235,0.18)",
            borderRadius: "50% 50% 0 0",
            transform: "rotate(-5deg)",
            boxShadow: "0 -12px 0 rgba(37,99,235,0.04), 0 -28px 0 rgba(37,99,235,0.035), 0 -46px 0 rgba(37,99,235,0.03), 0 -68px 0 rgba(37,99,235,0.026)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 620, display: "flex", justifyContent: "flex-end", mb: { xs: 4, md: 7 }, position: "relative", zIndex: 1 }}>
          <TextField
            select
            size="small"
            value="English"
            sx={{ minWidth: 138, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "rgba(255,255,255,0.88)", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><LanguageIcon sx={{ color: "#475569", fontSize: 21 }} /></InputAdornment> }}
            SelectProps={{ IconComponent: ExpandMoreIcon }}
          >
            <MenuItem value="English">English</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 620, position: "relative", zIndex: 1 }}>
          <MotionBox 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.3, type: "spring", stiffness: 160, damping: 22 }}
            sx={{ bgcolor: "rgba(255,255,255,0.94)", border: "1px solid rgba(226,232,240,0.95)", borderRadius: { xs: 3, md: 4 }, px: { xs: 2.4, sm: 4.5 }, py: { xs: 3.2, sm: 5 }, boxShadow: "0 32px 90px rgba(15,23,42,0.13)", backdropFilter: "blur(18px)" }}
          >
            <Box sx={{ display: "grid", placeItems: "center", mb: 2.6 }}>
              <Box sx={{ width: 118, height: 118, borderRadius: "50%", bgcolor: "#eef4ff", display: "grid", placeItems: "center", mb: 2.4 }}>
                <Box sx={{ width: 76, height: 76, borderRadius: "50%", border: "7px solid #2563eb", borderLeftColor: "#7c8cff", display: "grid", placeItems: "center", color: "#2563eb" }}>
                  <CheckCircleIcon sx={{ fontSize: 45 }} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: { xs: 29, sm: 34 }, fontWeight: 900, color: "#10204a", textAlign: "center", lineHeight: 1.1 }}>Welcome Back</Typography>
              <Typography sx={{ color: "#647196", fontSize: 16, mt: 1.3, textAlign: "center" }}>Sign in to continue to your account</Typography>
            </Box>

            {lastAuthError && (
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: 13 }}>
                Your previous session expired. Please sign in again.
              </Alert>
            )}

                        <Box sx={{ mb: 3, border: "1px solid #DBEAFE", bgcolor: "#EFF6FF", borderRadius: 2, px: 2, py: 1.5 }}>
              <Typography sx={{ color: "#1E3A8A", fontWeight: 850, fontSize: 13 }}>
                Use your assigned account. WorkTrack will open the correct dashboard automatically based on your role.
              </Typography>
            </Box>
<Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.35 }}>
              <TextField
                label={usernameLabel}
                placeholder={`Enter ${usernameLabel}`}
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
                autoFocus
                required
                disabled={loading}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: "#6b7898" }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { height: 62, borderRadius: 2, bgcolor: "#fff" } }}
              />

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 850, color: "#111d42", fontSize: 14 }}>Password</Typography>
                  <Button type="button" variant="text" size="small" onClick={() => setError("Please contact HR to reset your password.")} sx={{ minHeight: 0, p: 0, color: "#0b63ff", fontWeight: 800, "&:hover": { transform: "none", bgcolor: "transparent" } }}>Forgot Password?</Button>
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
                    startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: "#6b7898" }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { height: 62, borderRadius: 2, bgcolor: "#fff" } }}
                />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} sx={{ color: "#2563eb", "&.Mui-checked": { color: "#2563eb" } }} />}
                  label={<Typography sx={{ color: "#233052", fontSize: 14 }}>Remember me</Typography>}
                />
                {biometricSupported && (
                  <Button
                    type="button"
                    variant="text"
                    startIcon={biometricLoading ? <Box sx={{ width: 16, height: 16, border: "2px solid rgba(11,99,255,0.3)", borderTopColor: "#0b63ff", borderRadius: "50%", animation: "spin 0.8s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} /> : <FingerprintIcon />}
                    onClick={onBiometricLogin}
                    disabled={biometricLoading || loading}
                    sx={{ color: "#0b63ff", fontWeight: 800, "&:hover": { transform: "none", bgcolor: "rgba(37,99,235,0.05)" } }}
                  >
                    {biometricLoading ? "Verifying..." : "Use Biometric"}
                  </Button>
                )}
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={!canSubmit}
                fullWidth
                endIcon={!loading ? <ArrowForwardIcon /> : undefined}
                sx={{ height: 64, borderRadius: 2, fontSize: 17, fontWeight: 900, bgcolor: "#125fff", background: "linear-gradient(135deg, #4d66ff 0%, #005cff 100%)", boxShadow: "0 14px 30px rgba(0,92,255,0.28)", "&:hover": { background: "linear-gradient(135deg, #5d78ff 0%, #1268ff 100%)" } }}
              >
                {loading ? <Box sx={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "loginSpin 0.8s linear infinite" }} /> : "Sign In"}
              </Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 2, my: 3.5 }}>
              <Divider />
              <Typography sx={{ color: "#7a859f", fontSize: 14 }}>or continue with</Typography>
              <Divider />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.4 }}>
              {[
                ["G", "Google", "#4285f4"],
                ["M", "Microsoft", "#f25022"],
                ["S", "SSO", "#2563eb"],
              ].map(([mark, label, color]) => (
                <Button key={label} type="button" variant="outlined" onClick={() => setError(`${label} login is not configured yet.`)} sx={{ height: 54, borderRadius: 2, color: "#17213f", borderColor: "#d9e1ee", fontWeight: 850 }}>
                  <Box component="span" sx={{ mr: 1, width: 24, height: 24, borderRadius: label === "SSO" ? "6px" : "50%", display: "inline-grid", placeItems: "center", color: "#fff", bgcolor: color, fontSize: 13, fontWeight: 900 }}>{mark}</Box>
                  {label}
                </Button>
              ))}
            </Box>

            <Typography sx={{ color: "#6b7898", fontSize: 15, textAlign: "center", mt: 3.4 }}>
              Don&apos;t have an account? <Box component="span" sx={{ color: "#0b63ff", fontWeight: 850, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>Contact HR Department</Box>
            </Typography>
          </MotionBox>

          <MotionBox 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            sx={{ mt: 3, border: "1px solid rgba(203,213,225,0.9)", borderRadius: 3, bgcolor: "rgba(255,255,255,0.72)", px: 3, py: 2.4, display: "flex", alignItems: "center", gap: 2, boxShadow: "0 18px 44px rgba(15,23,42,0.06)" }}
          >
            <Box sx={{ width: 54, height: 54, borderRadius: "50%", bgcolor: "#edf4ff", display: "grid", placeItems: "center", color: "#2563eb", flexShrink: 0 }}>
              <SecurityOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#17213f" }}>Your security is our priority</Typography>
              <Typography sx={{ color: "#65718f", fontSize: 14, lineHeight: 1.45 }}>All data is encrypted and protected with enterprise-grade security</Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: "#64748b" }} />
          </MotionBox>
        </Box>
      </MotionBox>
    </Box>
  );
}

