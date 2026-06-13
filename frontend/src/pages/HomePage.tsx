import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LoginIcon from "@mui/icons-material/Login";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PlaceIcon from "@mui/icons-material/Place";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useNavigate } from "react-router-dom";

const roleLinks = [
  { label: "Admin", helper: "Company setup", icon: <AdminPanelSettingsIcon /> },
  { label: "HR", helper: "Approvals and reports", icon: <ManageSearchIcon /> },
  { label: "Employee", helper: "Punch and requests", icon: <BadgeIcon /> },
];

const summary = [
  { label: "Attendance", value: "Live", helper: "Daily punch status", icon: <AccessTimeIcon /> },
  { label: "Office GPS", value: "Active", helper: "Location validation", icon: <PlaceIcon /> },
  { label: "Leave", value: "Ready", helper: "HR approval flow", icon: <CalendarMonthIcon /> },
  { label: "Security", value: "Protected", helper: "JWT sign in", icon: <VerifiedUserIcon /> },
];

export default function HomePage() {
  const nav = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef3f8" }}>
      <Box component="header" sx={{ borderBottom: "1px solid #dbe3ee", bgcolor: "rgba(255,255,255,0.94)" }}>
        <Container maxWidth="xl">
          <Box sx={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: "#1d4ed8", fontWeight: 900 }}>A</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, sm: 22 }, lineHeight: 1.1, color: "#0f172a" }}>
                  Anushabazaar Technologies
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Attendance Management Dashboard
                </Typography>
              </Box>
            </Box>
            <Button variant="contained" startIcon={<LoginIcon />} onClick={() => nav("/login")}>
              Login
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.65fr" } }}>
          <Box
            sx={{
              border: "1px solid #dbe3ee",
              borderRadius: 2,
              bgcolor: "#fff",
              p: { xs: 3, md: 5 },
              boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
            }}
          >
            <Chip label="Company portal" color="primary" sx={{ borderRadius: 1.5, fontWeight: 900 }} />
            <Typography
              component="h1"
              sx={{
                mt: 2,
                maxWidth: 760,
                fontSize: { xs: 34, md: 52 },
                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: 0,
                color: "#0f172a",
              }}
            >
              Simple attendance dashboard for daily operations.
            </Typography>
            <Typography sx={{ mt: 2, maxWidth: 720, color: "#475569", fontSize: { xs: 15, md: 17 }, lineHeight: 1.7 }}>
              Manage employee punch, HR requests, office location checks, leave approvals, reports, and payroll summary from one secured portal.
            </Typography>

            <Box sx={{ mt: 4, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>
              {summary.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 1.5,
                    p: 2,
                    bgcolor: "#f8fafc",
                    minHeight: 132,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ color: "#2563eb" }}>{item.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 22, color: "#0f172a" }}>{item.value}</Typography>
                    <Typography sx={{ fontWeight: 850, color: "#334155", fontSize: 13 }}>{item.label}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.25 }}>{item.helper}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 4, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Button size="large" variant="contained" startIcon={<LoginIcon />} onClick={() => nav("/login")}>
                Open portal
              </Button>
              <Button size="large" variant="outlined" startIcon={<VerifiedUserIcon />} onClick={() => nav("/login")}>
                Secure sign in
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              border: "1px solid #dbe3ee",
              borderRadius: 2,
              bgcolor: "#fff",
              p: 3,
              boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
            }}
          >
            <Typography sx={{ fontWeight: 950, fontSize: 20, color: "#0f172a" }}>Portal Access</Typography>
            <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
              Select your role after login.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "grid", gap: 1.25 }}>
              {roleLinks.map((role) => (
                <Box
                  key={role.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "42px 1fr",
                    gap: 1.25,
                    alignItems: "center",
                    border: "1px solid #e2e8f0",
                    borderRadius: 1.5,
                    p: 1.5,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box sx={{ color: "#2563eb", display: "grid", placeItems: "center" }}>{role.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>{role.label}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 13 }}>{role.helper}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Button fullWidth size="large" variant="contained" startIcon={<LoginIcon />} sx={{ mt: 3 }} onClick={() => nav("/login")}>
              Continue to login
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
