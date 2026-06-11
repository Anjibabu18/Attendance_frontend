import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BadgeIcon from "@mui/icons-material/Badge";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LoginIcon from "@mui/icons-material/Login";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearLastAuthError, getLastAuthError } from "../api/client";
import { Role, setAuth } from "../auth/auth";

type LoginResponse = { token: string; role: Role; employeeId?: number | null; name?: string | null };

const features = [
  { icon: <LocationOnIcon fontSize="small" />, title: "Office geofence", text: "GPS-based punch validation" },
  { icon: <FactCheckIcon fontSize="small" />, title: "HR approval", text: "Attendance and leave review" },
  { icon: <BadgeIcon fontSize="small" />, title: "Employee reports", text: "Monthly status and analytics" },
];

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      setAuth({ token, role: res.data.role, name: res.data.name ?? undefined });
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
        bgcolor: "#f4f7fb",
        display: "grid",
        alignItems: "start",
        py: { xs: 1.5, md: 2.5 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 42, height: 42, bgcolor: "#111827", fontWeight: 900 }}>A</Avatar>
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 20, lineHeight: 1.1 }}>Attendance</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Secure workforce operations</Typography>
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
            borderRadius: 1,
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "390px 1fr" }, minHeight: { xs: "auto", md: 560 } }}>
            <Box
              sx={{
                bgcolor: "#0f172a",
                color: "white",
                p: { xs: 2.5, md: 3 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2.5,
              }}
            >
              <Box>
                <Chip
                  icon={<SecurityIcon />}
                  label="Secure workspace"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.10)",
                    color: "white",
                    borderRadius: 1,
                    fontWeight: 800,
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />
                <Typography sx={{ mt: 2.5, fontWeight: 950, fontSize: { xs: 30, md: 36 }, lineHeight: 1.05 }}>
                  Production attendance command center.
                </Typography>
                <Typography sx={{ mt: 1.25, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, fontSize: 13.5 }}>
                  Role-based login for Admin, HR, and employees with geofence punch, leave workflow, monthly analytics, and export-ready reports.
                </Typography>
                <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {[
                    ["JWT", "Token security"],
                    ["GPS", "Office radius"],
                    ["CSV", "Monthly export"],
                    ["P/HD/L", "Calendar state"],
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
                      <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1 }}>{value}</Typography>
                      <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.62)", fontSize: 12 }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: { xs: "none", md: "grid" }, gap: 1 }}>
                {features.map((item) => (
                  <Box
                    key={item.title}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "34px 1fr",
                      gap: 1.25,
                      alignItems: "center",
                      p: 1.1,
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <Box sx={{ display: "grid", placeItems: "center", color: "#93c5fd" }}>{item.icon}</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{item.title}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: 12 }}>{item.text}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 }, display: "grid", alignContent: "center" }}>
              <Box sx={{ maxWidth: 520, width: "100%", mx: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 32, lineHeight: 1.1 }}>Sign in</Typography>
                    <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14 }}>
                      Enter your assigned credentials to open the correct dashboard.
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

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Access policy</Typography>
                  <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 13 }}>
                    Admin credentials must be created from backend environment variables in production. The app clears invalid sessions automatically.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
