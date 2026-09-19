import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { VDLogo } from "../components/VDLogo";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const MotionBox = motion.create(Box);

export default function HomePage() {
  const nav = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8faff", color: "#0f172a", overflow: "hidden" }}>
      {/* ── Splash Screen ── */}
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
            {/* Ambient orbs */}
            {[
              { left: "-10%", top: "5%", color: "rgba(56,189,248,0.18)", size: "55vw", delay: 0 },
              { right: "-10%", bottom: "5%", color: "rgba(192,132,252,0.18)", size: "45vw", delay: 1.5 },
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

            {/* Spinning ring */}
            <Box
              component={motion.div}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              sx={{
                position: "absolute",
                width: 300, height: 300, borderRadius: "50%",
                border: "1px solid rgba(56,189,248,0.15)",
                borderTop: "2px solid rgba(56,189,248,0.5)",
                pointerEvents: "none",
              }}
            />

            {/* VD Logo */}
            <Box
              component={motion.div}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              sx={{ position: "relative", zIndex: 2, mb: 3 }}
            >
              <VDLogo size={160} />
            </Box>

            {/* WorkTrack name */}
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

            {/* Tagline */}
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

            {/* Animated dots */}
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
          </Box>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <Box
        component="header"
        sx={{
          position: "sticky", top: 0, zIndex: 10,
          borderBottom: "1px solid rgba(203,213,225,0.6)",
          bgcolor: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: "50%", border: "3px solid rgba(37,99,235,0.2)", display: "grid", placeItems: "center", color: "#2563eb" }}>
                <CheckCircleIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: 22, lineHeight: 1 }}>
                Work<Box component="span" sx={{ color: "#2563eb" }}>Track</Box>
              </Typography>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => nav("/login")}
              sx={{
                height: 42, borderRadius: 2, px: 3,
                fontWeight: 800, textTransform: "none",
                bgcolor: "#2563eb",
                boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Hero Section ── */}
      <Box sx={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0a1628 0%, #0f2547 35%, #162d50 100%)",
        color: "#fff",
      }}>
        {/* Background grid */}
        <Box sx={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "linear-gradient(180deg, black, transparent 90%)", pointerEvents: "none" }} />

        {/* Glow */}
        <Box sx={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 10, md: 16 }, textAlign: "center" }}>
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 36, sm: 48, md: 60 },
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                maxWidth: 700,
                mx: "auto",
              }}
            >
              Smart attendance
              <br />
              <Box component="span" sx={{
                background: "linear-gradient(135deg, #60a5fa, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                made simple
              </Box>
            </Typography>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Typography sx={{
              fontSize: { xs: 16, md: 18 },
              color: "rgba(255,255,255,0.6)",
              maxWidth: 520,
              mx: "auto",
              mt: 3,
              lineHeight: 1.7,
            }}>
              Track punches, manage leaves, and generate reports — all from one secure portal for your entire organization.
            </Typography>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            sx={{ mt: 5, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}
          >
            <Button
              size="large"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => nav("/login")}
              sx={{
                height: 54, px: 4, borderRadius: 2,
                fontSize: 16, fontWeight: 800, textTransform: "none",
                bgcolor: "#fff", color: "#0f172a",
                boxShadow: "0 10px 30px rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Get Started
            </Button>
          </MotionBox>

          {/* Stats */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            sx={{
              mt: 8,
              display: "flex",
              justifyContent: "center",
              gap: { xs: 4, sm: 8 },
              flexWrap: "wrap",
            }}
          >
            {[
              ["QR + GPS", "Verification"],
              ["Real-time", "Tracking"],
              ["Multi-role", "Access"],
            ].map(([value, label]) => (
              <Box key={label} sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{value}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, mt: 0.3 }}>{label}</Typography>
              </Box>
            ))}
          </MotionBox>
        </Container>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8", fontSize: 13 }}>
        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
          © 2026 WorkTrack. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
