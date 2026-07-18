import React, { useState, useEffect } from "react";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BadgeIcon from "@mui/icons-material/Badge";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import LoginIcon from "@mui/icons-material/Login";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PlaceIcon from "@mui/icons-material/Place";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { VDLogo } from "../components/VDLogo";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion.create(Box);

const metricCards = [
  { label: "Live Attendance", value: "98%", helper: "Today coverage", icon: <AccessTimeIcon />, color: "#2563eb" },
  { label: "Open Requests", value: "24", helper: "Leave and regularization", icon: <CalendarMonthIcon />, color: "#7c3aed" },
  { label: "Payroll Ready", value: "86%", helper: "Monthly validation", icon: <BarChartIcon />, color: "#059669" },
  { label: "Security Checks", value: "Active", helper: "QR, device, GPS", icon: <ShieldOutlinedIcon />, color: "#f59e0b" },
];

const roleLinks = [
  { label: "Admin Console", helper: "Company setup, users, holidays, policies", icon: <AdminPanelSettingsIcon />, accent: "#2563eb" },
  { label: "HR Workspace", helper: "Approvals, attendance edits, reports, payroll", icon: <ManageSearchIcon />, accent: "#7c3aed" },
  { label: "Manager View", helper: "Team attendance and request recommendations", icon: <GroupsIcon />, accent: "#0f766e" },
  { label: "Employee App", helper: "Punch, leave, payslip, notifications", icon: <BadgeIcon />, accent: "#ea580c" },
];

const workflow = [
  { title: "Punch captured", detail: "QR, GPS, device, and selfie checks are recorded in one attendance entry." },
  { title: "Exceptions flagged", detail: "Missing checkout and late regularization items surface for HR review." },
  { title: "Approvals synced", detail: "Leave and regularization decisions update balances and attendance records." },
  { title: "Payroll locked", detail: "Reports and payroll export are locked after monthly verification." },
];

const activity = [
  { name: "Morning punch window", meta: "237 employees checked in", status: "On track" },
  { name: "Leave approvals", meta: "8 requests awaiting HR", status: "Review" },
  { name: "Missing checkout scan", meta: "3 exceptions created", status: "Action" },
  { name: "July payroll", meta: "Draft register generated", status: "Ready" },
];

function LogoMark() {
  return (
    <Box sx={{ width: 46, height: 46, borderRadius: "50%", border: "4px solid rgba(37,99,235,0.2)", display: "grid", placeItems: "center", color: "#2563eb", bgcolor: "#eff6ff" }}>
      <CheckCircleIcon sx={{ fontSize: 28 }} />
    </Box>
  );
}

export default function HomePage() {
  const nav = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f8ff", color: "#0f172a", overflow: "hidden" }}>
      <AnimatePresence>
        {showSplash && (
          <Box
            component={motion.div}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(14px)" }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            sx={{
              position: "fixed", inset: 0, zIndex: 99999,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              background: "radial-gradient(ellipse at 50% 35%, #0f2548 0%, #05080f 100%)",
            }}
          >
            {/* === Ambient orbs === */}
            {[
              { left: "-10%", top: "5%", color: "rgba(56,189,248,0.18)", size: "55vw", delay: 0 },
              { right: "-10%", bottom: "5%", color: "rgba(192,132,252,0.18)", size: "45vw", delay: 1.5 },
              { left: "30%", top: "60%", color: "rgba(99,102,241,0.12)", size: "35vw", delay: 0.8 },
            ].map((orb, i) => (
              <Box
                key={i}
                component={motion.div}
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
                sx={{
                  position: "absolute",
                  width: orb.size, height: orb.size,
                  maxWidth: 600, maxHeight: 600,
                  background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                  borderRadius: "50%", pointerEvents: "none",
                  left: (orb as any).left, right: (orb as any).right,
                  top: (orb as any).top, bottom: (orb as any).bottom,
                }}
              />
            ))}

            {/* === Slow spinning outer ring === */}
            <Box
              component={motion.div}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              sx={{
                position: "absolute",
                width: 340, height: 340, borderRadius: "50%",
                border: "1px solid rgba(56,189,248,0.15)",
                borderTop: "2px solid rgba(56,189,248,0.5)",
                pointerEvents: "none",
              }}
            />
            <Box
              component={motion.div}
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              sx={{
                position: "absolute",
                width: 260, height: 260, borderRadius: "50%",
                border: "1px dashed rgba(192,132,252,0.2)",
                pointerEvents: "none",
              }}
            />

            {/* === VD Logo with spring entrance === */}
            <Box
              component={motion.div}
              initial={{ scale: 0.2, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              sx={{ position: "relative", zIndex: 2, mb: 3 }}
            >
              <VDLogo size={160} />
            </Box>

            {/* === WorkTrack name === */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: "easeOut" }}
              sx={{ position: "relative", zIndex: 2, textAlign: "center", mb: 0.5 }}
            >
              <Typography sx={{
                fontSize: { xs: 38, sm: 54, md: 68 },
                fontWeight: 900, lineHeight: 1,
                letterSpacing: "-0.04em",
                fontFamily: '"Georgia", serif',
                color: "#f8fafc",
              }}>
                Work<Box component="span" sx={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Track</Box>
              </Typography>
            </Box>

            {/* === Tagline === */}
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.8 }}
              sx={{ position: "relative", zIndex: 2, textAlign: "center", mb: 5 }}
            >
              <Typography sx={{
                color: "#64748b", fontSize: { xs: 13, sm: 15 },
                fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
              }}>
                Attendance Intelligence Platform
              </Typography>
            </Box>

            {/* === Animated dots === */}
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              sx={{ position: "relative", zIndex: 2, display: "flex", gap: 1.5 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  component={motion.div}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                  sx={{
                    width: 8, height: 8, borderRadius: "50%",
                    backgroundColor: ["#38bdf8", "#818cf8", "#c084fc", "#818cf8", "#38bdf8"][i],
                  }}
                />
              ))}
            </Box>

            {/* === Corner decorative lines === */}
            {["top left", "top right", "bottom left", "bottom right"].map((corner, i) => {
              const [v, h] = corner.split(" ");
              return (
                <Box
                  key={i}
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  sx={{
                    position: "absolute",
                    [v]: 24, [h]: 24,
                    width: 40, height: 40,
                    borderTop: v === "top" ? "2px solid rgba(56,189,248,0.5)" : "none",
                    borderBottom: v === "bottom" ? "2px solid rgba(192,132,252,0.5)" : "none",
                    borderLeft: h === "left" ? "2px solid rgba(56,189,248,0.5)" : "none",
                    borderRight: h === "right" ? "2px solid rgba(192,132,252,0.5)" : "none",
                    borderRadius: `${v === "top" && h === "left" ? "6px 0 0 0" : v === "top" && h === "right" ? "0 6px 0 0" : v === "bottom" && h === "left" ? "0 0 0 6px" : "0 0 6px 0"}`,
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </Box>
        )}
      </AnimatePresence>


      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid rgba(203,213,225,0.75)",
          bgcolor: "rgba(255,255,255,0.84)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ minHeight: 78, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <LogoMark />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, fontSize: { xs: 22, sm: 26 }, lineHeight: 1 }}>
                  Work<Box component="span" sx={{ color: "#2563eb" }}>Track</Box>
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 750 }}>Attendance operations dashboard</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Button variant="outlined" startIcon={<VerifiedUserIcon />} onClick={() => nav("/login")} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                Secure Login
              </Button>
              <Button variant="contained" startIcon={<LoginIcon />} onClick={() => nav("/login")}>
                Open Portal
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          position: "relative",
          background: "linear-gradient(135deg, #ffffff 0%, #eef6ff 52%, #ddecff 100%)",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
            maskImage: "linear-gradient(180deg, black, transparent 88%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: "relative", py: { xs: 4, md: 7 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.02fr 0.98fr" }, gap: { xs: 4, lg: 5 }, alignItems: "center" }}>
            <Box>
              <Chip label="Node + Express attendance system" color="primary" sx={{ borderRadius: 2, height: 34, fontWeight: 900, mb: 2.2 }} />
              <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 52, lg: 66 }, lineHeight: 1.02, fontWeight: 950, letterSpacing: 0, maxWidth: 760 }}>
                A smarter home for daily attendance operations.
              </Typography>
              <Typography sx={{ mt: 2.5, color: "#52627d", maxWidth: 680, fontSize: { xs: 16, md: 18 }, lineHeight: 1.75 }}>
                Track punches, approvals, leave balances, manager teams, payroll locks, and reports from a single secure portal built for Admin, HR, Managers, and Employees.
              </Typography>
              <Box sx={{ mt: 4, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button size="large" variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => nav("/login")} sx={{ minHeight: 52, px: 3 }}>
                  Continue to Dashboard
                </Button>
                <Button size="large" variant="outlined" startIcon={<ShieldOutlinedIcon />} onClick={() => nav("/login")} sx={{ minHeight: 52, px: 3 }}>
                  Security Portal
                </Button>
              </Box>
              <Box sx={{ mt: 4, display: "flex", gap: { xs: 2, sm: 4 }, flexWrap: "wrap" }}>
                {[
                  ["4", "Role workspaces"],
                  ["24/7", "Live access"],
                  ["CSV/PDF", "Reports export"],
                ].map(([value, label]) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#10204a" }}>{value}</Typography>
                    <Typography sx={{ color: "#64748b", fontWeight: 750, fontSize: 13 }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", inset: { xs: 16, md: -18 }, borderRadius: 5, bgcolor: "rgba(37,99,235,0.12)", filter: "blur(42px)" }} />
              <Box sx={{ position: "relative", borderRadius: { xs: 3, md: 4 }, bgcolor: "#0b1730", color: "#fff", p: { xs: 2.2, sm: 3 }, boxShadow: "0 32px 90px rgba(15,23,42,0.28)", border: "1px solid rgba(148,163,184,0.22)", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 10%, rgba(59,130,246,0.32), transparent 28%), linear-gradient(135deg, transparent, rgba(255,255,255,0.06))", pointerEvents: "none" }} />
                <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.4 }}>
                  <Box>
                    <Typography sx={{ color: "#93c5fd", fontWeight: 850, fontSize: 13 }}>Live Command Center</Typography>
                    <Typography sx={{ fontSize: 24, fontWeight: 950 }}>Today Overview</Typography>
                  </Box>
                  <Chip label="Online" sx={{ bgcolor: "rgba(34,197,94,0.14)", color: "#86efac", border: "1px solid rgba(134,239,172,0.25)", fontWeight: 900 }} />
                </Box>

                <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
                  {metricCards.map((item) => (
                    <Box key={item.label} sx={{ bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.4 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: `${item.color}22`, color: item.color }}>{item.icon}</Box>
                        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 800 }}>{item.helper}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 28, fontWeight: 950 }}>{item.value}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 750, fontSize: 13 }}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ position: "relative", bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2.5, p: 2.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 900 }}>Payroll Readiness</Typography>
                    <Typography sx={{ color: "#bfdbfe", fontWeight: 900 }}>86%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={86} sx={{ height: 10, borderRadius: 99, bgcolor: "rgba(255,255,255,0.12)", "& .MuiLinearProgress-bar": { bgcolor: "#3b82f6" } }} />
                  <Box sx={{ mt: 2, display: "grid", gap: 1.1 }}>
                    {activity.map((item) => (
                      <Box key={item.name} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center", py: 0.8 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 850, fontSize: 14 }}>{item.name}</Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 12.5 }}>{item.meta}</Typography>
                        </Box>
                        <Chip label={item.status} size="small" sx={{ bgcolor: "rgba(147,197,253,0.12)", color: "#bfdbfe", fontWeight: 850 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 0.72fr" }, gap: 3 }}>
          <Box sx={{ border: "1px solid #dbe4f0", borderRadius: 3, bgcolor: "#fff", p: { xs: 2.3, md: 3 }, boxShadow: "0 18px 50px rgba(15,23,42,0.06)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 26, fontWeight: 950 }}>Choose your workspace</Typography>
                <Typography sx={{ color: "#64748b", mt: 0.5 }}>Each role opens the same secure login, then routes to the correct dashboard.</Typography>
              </Box>
              <Button variant="contained" onClick={() => nav("/login")} endIcon={<ArrowForwardIcon />}>Sign in</Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.6 }}>
              {roleLinks.map((role) => (
                <Box key={role.label} sx={{ border: "1px solid #e2e8f0", borderRadius: 2.2, p: 2.2, bgcolor: "#fbfdff", display: "grid", gridTemplateColumns: "54px 1fr auto", gap: 1.5, alignItems: "center", transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease", cursor: "pointer", "&:hover": { transform: "translateY(-2px)", borderColor: role.accent, boxShadow: "0 14px 34px rgba(15,23,42,0.08)" } }} onClick={() => nav("/login")}>
                  <Box sx={{ width: 54, height: 54, borderRadius: 2.2, display: "grid", placeItems: "center", bgcolor: `${role.accent}14`, color: role.accent, "& svg": { fontSize: 29 } }}>{role.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 950, color: "#10204a" }}>{role.label}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.45 }}>{role.helper}</Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ color: "#94a3b8" }} />
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ border: "1px solid #dbe4f0", borderRadius: 3, bgcolor: "#fff", p: { xs: 2.3, md: 3 }, boxShadow: "0 18px 50px rgba(15,23,42,0.06)" }}>
            <Typography sx={{ fontSize: 24, fontWeight: 950 }}>Attendance workflow</Typography>
            <Typography sx={{ color: "#64748b", mt: 0.5, mb: 2.5 }}>From punch to payroll, the system keeps every handoff visible.</Typography>
            <Box sx={{ display: "grid", gap: 0 }}>
              {workflow.map((item, index) => (
                <Box key={item.title} sx={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 1.5, pb: index === workflow.length - 1 ? 0 : 2.5, position: "relative" }}>
                  {index < workflow.length - 1 && <Box sx={{ position: "absolute", left: 16, top: 34, bottom: 4, width: 2, bgcolor: "#dbeafe" }} />}
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#2563eb", color: "#fff", fontWeight: 950, zIndex: 1 }}>{index + 1}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: "#10204a" }}>{item.title}</Typography>
                    <Typography sx={{ color: "#64748b", fontSize: 13.5, lineHeight: 1.55, mt: 0.3 }}>{item.detail}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <MotionBox initial={{ opacity: 0, y: 18 }} whileHover={{ y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} sx={{ mt: 3, border: "1px solid #dbe4f0", borderRadius: 3, bgcolor: "#10204a", color: "#fff", p: { xs: 2.5, md: 3.5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto" }, gap: 2, alignItems: "center", boxShadow: "0 22px 60px rgba(15,23,42,0.16)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "#2563eb", width: 54, height: 54 }}><NotificationsActiveIcon /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: { xs: 20, md: 24 } }}>Ready to manage today&apos;s attendance?</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)", mt: 0.4 }}>Open the portal to review punches, requests, reports, and payroll locks.</Typography>
            </Box>
          </Box>
          <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={() => nav("/login")} sx={{ bgcolor: "#fff", color: "#10204a", minHeight: 52, "&:hover": { bgcolor: "#eaf2ff" } }}>
            Launch Portal
          </Button>
        </MotionBox>
      </Container>
    </Box>
  );
}


