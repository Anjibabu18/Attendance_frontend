import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoginIcon from "@mui/icons-material/Login";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearLastAuthError, getLastAuthError } from "../api/client";
import { useToast } from "../components/Toast";
import { Role, setAuth } from "../auth/auth";

type LoginResponse = { token: string; refreshToken?: string | null; role: Role; employeeId?: number | null; name?: string | null };

export default function LoginPage() {
  const { toastError } = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toastError(error);
      setError(null);
    }
  }, [error, toastError]);
  const [lastAuthError] = useState(() => {
    const raw = getLastAuthError();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as {
        at?: string;
        status?: number;
        method?: string;
        url?: string;
        baseURL?: string;
        message?: string;
      };
    } catch {
      return { message: raw };
    }
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && !loading,
    [loading, password, username],
  );

  function getErrorMessage(err: unknown) {
    const anyErr = err as any;
    return anyErr?.response?.data?.error ?? anyErr?.message ?? "Login failed";
  }

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
    if (!trimmedUsername || !password) {
      setError("Enter your username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", { username: trimmedUsername, password });
      const token = res.data.token;
      if (!token || token.split(".").length < 3) {
        setError("Login succeeded but backend did not return a valid JWT token.");
        return;
      }
      setAuth({ token, refreshToken: res.data.refreshToken, role: res.data.role, name: res.data.name ?? undefined, loggedInAt: new Date().toISOString() });
      nav(nextPathForRole(res.data.role), { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100svh",
        bgcolor: "#edf4f7",
        display: "grid",
        alignItems: "center",
        py: { xs: 1.5, md: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 42, height: 42, bgcolor: "#0f172a", fontWeight: 900 }}>A</Avatar>
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 20, lineHeight: 1.1 }}>Attendance</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Secure attendance portal</Typography>
            </Box>
          </Box>
          <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => nav("/")} sx={{ color: "text.primary" }}>
            Home
          </Button>
        </Box>

        <Card
          elevation={0}
          sx={{
            border: "1px solid #dfe3ea",
            borderRadius: 1.5,
            overflow: "hidden",
            boxShadow: "0 24px 70px rgba(15,23,42,0.14)",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "420px 1fr" }, minHeight: { xs: "auto", md: 560 } }}>
            <Box
              sx={{
                background: "linear-gradient(160deg, #0f172a 0%, #12343b 55%, #0f766e 130%)",
                color: "white",
                p: { xs: 2.5, md: 3 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 3,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Chip
                  icon={<SecurityIcon />}
                  label="Verified access"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.10)",
                    color: "white",
                    borderRadius: 1,
                    fontWeight: 800,
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />
                <Typography sx={{ mt: 2.5, fontWeight: 950, fontSize: { xs: 30, md: 38 }, lineHeight: 1.04 }}>
                  Check in with confidence.
                </Typography>
                <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.74)", lineHeight: 1.6, fontSize: 14 }}>
                  One clean portal for office QR, device approval, face verification, and attendance review.
                </Typography>
                <Box sx={{ mt: 3, position: "relative", height: 260, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <Box sx={{ position: "absolute", inset: 18, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 1.5 }} />
                  <Box
                    sx={{
                      position: "absolute",
                      left: 32,
                      right: 32,
                      top: 32,
                      height: 3,
                      bgcolor: "#67e8f9",
                      boxShadow: "0 0 28px rgba(103,232,249,0.9)",
                      animation: "attendanceScan 3.2s ease-in-out infinite",
                    }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <Box
                      sx={{
                        width: 128,
                        height: 128,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.18)",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "rgba(15,23,42,0.32)",
                        animation: "attendanceFloat 5s ease-in-out infinite",
                      }}
                    >
                      <LockIcon sx={{ fontSize: 48, color: "#a7f3d0" }} />
                    </Box>
                  </Box>
                  <Box sx={{ position: "absolute", left: 18, right: 18, bottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                    {[
                      ["QR", "valid"],
                      ["Face", "match"],
                      ["GPS", "inside"],
                    ].map(([value, label]) => (
                      <Box key={value} sx={{ p: 1, borderRadius: 1, bgcolor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.10)" }}>
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{value}</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: 11 }}>{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {[
                    ["Admin", "rules"],
                    ["Employee", "punch"],
                  ].map(([value, label]) => (
                    <Box
                      key={value}
                      sx={{
                        p: 1.2,
                        borderRadius: 1,
                        border: "1px solid rgba(255,255,255,0.12)",
                        bgcolor: "rgba(255,255,255,0.07)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 950, fontSize: 17, lineHeight: 1 }}>{value}</Typography>
                      <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.62)", fontSize: 12 }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 }, display: "grid", alignContent: "center" }}>
              <Box sx={{ maxWidth: 520, width: "100%", mx: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 32, lineHeight: 1.1 }}>Sign in</Typography>
                    <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14 }}>
                      Use your company username and password.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#eff6ff",
                      color: "primary.main",
                    }}
                  >
                    <LockIcon />
                  </Box>
                </Box>

                <Box component="form" onSubmit={onSubmit} sx={{ mt: 2.5, display: "grid", gap: 1.8 }}>
                  {error ? <Alert severity="error">{error}</Alert> : null}
                  {!error && lastAuthError ? (
                    <Alert severity="info" sx={{ alignItems: "center" }}>
                      Your previous session expired. Please sign in again.
                    </Alert>
                  ) : null}

                  <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    autoFocus
                    required
                    disabled={loading}
                    fullWidth
                  />
                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={loading}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            edge="end"
                            onClick={() => setShowPassword((s) => !s)}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon />}
                    disabled={!canSubmit}
                    fullWidth
                    sx={{ mt: 0.5, height: 48, fontWeight: 900 }}
                  >
                    {loading ? "Signing in..." : "Sign in to portal"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
