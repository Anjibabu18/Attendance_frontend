import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LoginIcon from "@mui/icons-material/Login";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";

const modules = [
  { label: "Admin", value: "Rules, offices, roles", icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { label: "HR", value: "Attendance review", icon: <ManageSearchIcon fontSize="small" /> },
  { label: "Employee", value: "Self service", icon: <BadgeIcon fontSize="small" /> },
  { label: "Security", value: "JWT + lockout", icon: <SecurityIcon fontSize="small" /> },
];

const rows = [
  ["Office geofence", "Location-wise assignment with GPS radius", "Active"],
  ["Attendance analytics", "Late, early-leave, overtime, P/HD/L", "Live"],
  ["Leave workflow", "Employee request and HR approval", "Ready"],
  ["Daily media", "Selfie punch and group photo evidence", "Ready"],
];

export default function HomePage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Container maxWidth="xl">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar sx={{ width: 44, height: 44, bgcolor: "#111827", fontWeight: 900, boxShadow: "0 10px 22px rgba(15,23,42,0.16)" }}>A</Avatar>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-lg font-extrabold text-slate-950">Attendance</div>
                <div className="truncate text-xs font-semibold text-slate-500">Production Management System</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="text" onClick={() => nav("/login")} sx={{ color: "#111827" }}>
                Login
              </Button>
              <Button variant="contained" startIcon={<LoginIcon />} onClick={() => nav("/login")}>
                Open portal
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Workspace</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                    Company attendance operations
                  </Typography>
                </div>
                <Chip size="small" label="PROD" sx={{ fontWeight: 900, borderRadius: 1.5 }} />
              </div>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "grid", gap: 1 }}>
                {modules.map((m) => (
                  <Box
                    key={m.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr",
                      gap: 1.25,
                      alignItems: "center",
                      p: 1.25,
                      borderRadius: 1,
                      border: "1px solid #e5e7eb",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{m.icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850, fontSize: 13 }}>{m.label}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{m.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Button fullWidth variant="contained" startIcon={<LoginIcon />} sx={{ mt: 2 }} onClick={() => nav("/login")}>
                Continue to login
              </Button>
            </aside>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_44px_rgba(15,23,42,0.08)]">
              <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
                <div className="p-6 md:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      icon={<LocationOnIcon />}
                      label="Location-wise punch"
                      size="small"
                      sx={{ borderRadius: 1.5, fontWeight: 800 }}
                    />
                    <Chip
                      icon={<AnalyticsIcon />}
                      label="Advanced analytics"
                      size="small"
                      sx={{ borderRadius: 1.5, fontWeight: 800 }}
                    />
                    <Chip
                      icon={<CalendarMonthIcon />}
                      label="Monthly reporting"
                      size="small"
                      sx={{ borderRadius: 1.5, fontWeight: 800 }}
                    />
                  </div>

                  <Typography
                    component="h1"
                    sx={{
                      mt: 3,
                      maxWidth: 760,
                      fontWeight: 900,
                      fontSize: { xs: 34, md: 52 },
                      lineHeight: 1.08,
                      letterSpacing: 0,
                    }}
                  >
                    Attendance control for offices, HR teams, and employees.
                  </Typography>
                  <Typography sx={{ mt: 2, maxWidth: 760, color: "text.secondary", fontSize: 16, lineHeight: 1.75 }}>
                    A secure operational dashboard for employee punch, office geofencing, HR attendance review,
                    leave approvals, overtime, late marks, holidays, and evidence photos.
                  </Typography>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["P / HD / L", "Daily status"],
                      ["GPS", "Office validation"],
                      ["OT", "Overtime tracking"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <div className="text-2xl font-extrabold text-slate-950">{value}</div>
                        <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button size="large" variant="contained" startIcon={<LoginIcon />} onClick={() => nav("/login")}>
                      Open portal
                    </Button>
                    <Button size="large" variant="outlined" startIcon={<SecurityIcon />} onClick={() => nav("/login")}>
                      Secure sign in
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/80 p-5 xl:border-l xl:border-t-0">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Typography sx={{ fontWeight: 900 }}>System Snapshot</Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Current platform coverage</Typography>
                      </div>
                      <Chip size="small" label="ONLINE" color="success" sx={{ borderRadius: 1.5, fontWeight: 900 }} />
                    </div>
                    <Box sx={{ mt: 2, display: "grid", gap: 1.25 }}>
                      {rows.map(([name, desc, state], idx) => (
                        <Box key={name}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-extrabold text-slate-900">{name}</div>
                              <div className="truncate text-xs text-slate-500">{desc}</div>
                            </div>
                            <Chip size="small" label={state} sx={{ borderRadius: 1.5, fontWeight: 800 }} />
                          </div>
                          <LinearProgress
                            variant="determinate"
                            value={[95, 88, 82, 78][idx]}
                            sx={{ mt: 1, height: 6, borderRadius: 1, bgcolor: "#e5e7eb" }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
