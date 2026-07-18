import { Alert, AppBar, Avatar, Badge, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton, LinearProgress, Menu, MenuItem, TextField, Toolbar, Tooltip, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { clearAuth, ensureLoginStartedAt, getAuth } from "../auth/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import dayjs from "dayjs";

type CompanyProfile = { groupPhotoUrl?: string | null };
type Notification = { id: number; title: string; message: string; read: boolean; createdAt: string };

export default function Layout(props: { title: string; children: React.ReactNode }) {
  const nav = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const loginStartedAtIso = ensureLoginStartedAt();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileActionsAnchor, setMobileActionsAnchor] = useState<null | HTMLElement>(null);
  const [sessionNow, setSessionNow] = useState(() => Date.now());
  const [todayPunch, setTodayPunch] = useState<{ date?: string | null; inTime: string | null; outTime: string | null } | null>(null);
  const [notificationsReady, setNotificationsReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    setBooting(true);
    api.get<CompanyProfile>("/api/company")
      .then((r) => setCompany(r.data))
      .catch(() => { });
    api.get<Notification[]>("/api/notifications")
      .then((r) => setNotifications(r.data))
      .catch(() => { })
      .finally(() => setNotificationsReady(true));
    if (auth.role === "ROLE_EMPLOYEE") {
      api.get<any>("/api/employee/punch/today")
        .then((r) => setTodayPunch(r.data))
        .catch(() => { });
    }
    const timer = window.setTimeout(() => setBooting(false), 250);
    return () => window.clearTimeout(timer);
  }, [auth?.role]);

  const { showToast } = useToast();
  const [toastedIds] = useState<Set<number>>(() => {
    try {
      const stored = sessionStorage.getItem("toasted_notifications");
      return stored ? new Set(JSON.parse(stored).map(Number)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  useEffect(() => {
    if (!auth || !notificationsReady || notifications.length === 0) return;
    let updated = false;

    notifications.forEach((n) => {
      if (!n.read && !toastedIds.has(n.id)) {
        let type: "info" | "warning" | "success" | "error" = "info";
        const lowerTitle = n.title.toLowerCase();
        const lowerMsg = n.message.toLowerCase();

        if (lowerTitle.includes("approve") || lowerTitle.includes("success") || lowerMsg.includes("approved")) {
          type = "success";
        } else if (lowerTitle.includes("reject") || lowerTitle.includes("fail") || lowerTitle.includes("error") || lowerMsg.includes("rejected")) {
          type = "error";
        } else if (lowerTitle.includes("warn") || lowerTitle.includes("late") || lowerTitle.includes("absent") || lowerMsg.includes("late")) {
          type = "warning";
        }

        showToast(n.message, type, 6000, n.title);
        toastedIds.add(n.id);
        updated = true;
      }
    });

    if (notifications.some((n) => !n.read)) {
      api.post("/api/notifications/read").catch(() => { });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    if (updated) {
      sessionStorage.setItem("toasted_notifications", JSON.stringify(Array.from(toastedIds)));
    }
  }, [notifications, toastedIds, showToast, auth, notificationsReady]);

  useEffect(() => {
    if (!auth) return;
    const interval = setInterval(() => {
      api.get<Notification[]>("/api/notifications")
        .then((r) => setNotifications(r.data))
        .catch(() => { });

      if (auth.role === "ROLE_EMPLOYEE") {
        api.get<any>("/api/employee/punch/today")
          .then((r) => setTodayPunch(r.data))
          .catch(() => { });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [auth]);

  useEffect(() => {
    const timer = window.setInterval(() => setSessionNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const navItems = [
    auth?.role === "ROLE_ADMIN" ? { label: "Admin", path: "/admin", icon: <AdminPanelSettingsIcon fontSize="small" /> } : null,
    auth?.role === "ROLE_HR" ? { label: "HR", path: "/hr", icon: <ManageSearchIcon fontSize="small" /> } : null,
    auth?.role === "ROLE_MANAGER" ? { label: "Manager", path: "/manager", icon: <ManageSearchIcon fontSize="small" /> } : null,
    auth?.role === "ROLE_EMPLOYEE" ? { label: "Employee", path: "/employee", icon: <BadgeIcon fontSize="small" /> } : null,
  ].filter(Boolean) as { label: string; path: string; icon: React.ReactNode }[];

  async function changePassword() {
    setPasswordError(null);
    setPasswordOk(null);
    try {
      await api.post("/api/account/password", { currentPassword, newPassword });
      setPasswordOk("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      setPasswordError(e?.response?.data?.error ?? e?.message ?? "Password change failed");
    }
  }

  const unread = notifications.filter((n) => !n.read).length;
  const roleLabel = auth?.role?.replace("ROLE_", "") ?? "USER";

  const loginStartedAt = loginStartedAtIso ? new Date(loginStartedAtIso).getTime() : null;
  const loginActiveSecs = loginStartedAt && Number.isFinite(loginStartedAt) ? Math.max(0, Math.floor((sessionNow - loginStartedAt) / 1000)) : 0;

  let activeSeconds = loginActiveSecs;
  let activeLabel = "Login active";
  let chipBg = "#ecfdf3";
  let chipColor = "#15803d";
  let chipBorder = "1px solid #bbf7d0";

  if (auth?.role === "ROLE_EMPLOYEE") {
    if (todayPunch) {
      const parseClock = (timeStr: string | null, date?: string | null) => {
        if (!timeStr) return null;
        const parts = timeStr.split(":");
        if (parts.length < 2) return null;
        const hrs = parseInt(parts[0], 10);
        const mins = parseInt(parts[1], 10);
        const secs = parts[2] ? parseInt(parts[2], 10) : 0;
        return dayjs(`${date || dayjs().format("YYYY-MM-DD")}T00:00:00`).hour(hrs).minute(mins).second(secs).millisecond(0);
      };

      const inTime = parseClock(todayPunch.inTime, todayPunch.date);
      let outTime = parseClock(todayPunch.outTime, todayPunch.date);
      if (inTime && outTime && outTime.isBefore(inTime)) {
        outTime = outTime.add(1, "day");
      }

      if (inTime) {
        activeLabel = "Check-in active";
        if (outTime) {
          activeSeconds = Math.max(0, outTime.diff(inTime, "second"));
          chipBg = "rgba(71,85,105,0.06)";
          chipColor = "#475569";
          chipBorder = "1px solid rgba(71,85,105,0.24)";
        } else {
          activeSeconds = Math.max(0, dayjs(sessionNow).diff(inTime, "second"));
        }
      } else {
        activeLabel = "Not Checked In";
        activeSeconds = 0;
        chipBg = "rgba(220,38,38,0.06)";
        chipColor = "#dc2626";
        chipBorder = "1px solid rgba(220,38,38,0.24)";
      }
    } else {
      activeLabel = "Not Checked In";
      activeSeconds = 0;
      chipBg = "rgba(220,38,38,0.06)";
      chipColor = "#dc2626";
      chipBorder = "1px solid rgba(220,38,38,0.24)";
    }
  }

  const activeHours = Math.floor(activeSeconds / 3600);
  const activeMinutes = Math.floor((activeSeconds % 3600) / 60);
  const activeSecs = activeSeconds % 60;
  const activeTimeText = `${String(activeHours).padStart(2, "0")}:${String(activeMinutes).padStart(2, "0")}:${String(activeSecs).padStart(2, "0")}`;
  const sidebar = (
    <Box
      sx={{
        display: "grid",
        gap: 0.75,
        p: 1.5,
        border: "1px solid rgba(226,232,240,0.7)",
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.90)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 1, pt: 0.5, pb: 1.25, display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, background: "linear-gradient(135deg, #4f46e5, #2563eb)", display: "grid", placeItems: "center", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
          <ShieldOutlinedIcon sx={{ fontSize: 17, color: "#fff" }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: "#0f172a", lineHeight: 1.1 }}>Attendance</Typography>
          <Typography sx={{ fontSize: 10, color: "text.secondary", fontWeight: 500 }}>Management Portal</Typography>
        </Box>
      </Box>

      <Typography sx={{ px: 1, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", color: "text.secondary", textTransform: "uppercase", opacity: 0.6 }}>
        Navigation
      </Typography>
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            startIcon={item.icon}
            onClick={() => {
              setMobileNavOpen(false);
              nav(item.path);
            }}
            sx={{
              justifyContent: "flex-start",
              minHeight: 44,
              borderRadius: 2.5,
              px: 1.5,
              color: active ? "#fff" : "#334155",
              background: active
                ? "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)"
                : "transparent",
              boxShadow: active ? "0 8px 20px rgba(79,70,229,0.28)" : "none",
              fontWeight: active ? 800 : 600,
              fontSize: 13.5,
              transition: "all 0.2s cubic-bezier(0.2,0.8,0.2,1)",
              "& .MuiButton-startIcon": { color: active ? "rgba(255,255,255,0.85)" : "#64748b" },
              "&:hover": {
                transform: "translateX(4px)",
                background: active
                  ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
                  : "rgba(79,70,229,0.06)",
                color: active ? "#fff" : "#4f46e5",
                "& .MuiButton-startIcon": { color: active ? "rgba(255,255,255,0.9)" : "#4f46e5" },
              },
            }}
          >
            {item.label}
          </Button>
        );
      })}

      <Divider sx={{ my: 0.5 }} />
      <Typography sx={{ px: 1, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", color: "text.secondary", textTransform: "uppercase", opacity: 0.6 }}>
        Account
      </Typography>

      {[
        { icon: <LockIcon fontSize="small" />, label: "Change Password", onClick: () => setPasswordOpen(true) },
        { icon: <NotificationsIcon fontSize="small" />, label: "Notifications", onClick: () => setNotificationsOpen(true), badge: unread },
      ].map((item) => (
        <Button
          key={item.label}
          startIcon={item.icon}
          onClick={item.onClick}
          sx={{ justifyContent: "flex-start", minHeight: 42, borderRadius: 2.5, px: 1.5, color: "#334155", fontWeight: 600, fontSize: 13.5, "&:hover": { bgcolor: "rgba(99,102,241,0.06)", color: "#4f46e5", transform: "translateX(4px)" }, transition: "all 0.2s ease" }}
        >
          {item.label}
          {item.badge ? (
            <Box sx={{ ml: "auto", width: 18, height: 18, borderRadius: "50%", bgcolor: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 900, display: "grid", placeItems: "center" }}>{item.badge}</Box>
          ) : null}
        </Button>
      ))}

      <Button
        startIcon={<LogoutIcon fontSize="small" />}
        onClick={() => {
          sessionStorage.removeItem("notifications_initialized");
          sessionStorage.removeItem("toasted_notifications");
          clearAuth();
          nav("/login");
        }}
        sx={{ justifyContent: "flex-start", minHeight: 42, borderRadius: 2.5, px: 1.5, color: "#dc2626", fontWeight: 700, fontSize: 13.5, "&:hover": { bgcolor: "rgba(220,38,38,0.06)", transform: "translateX(4px)" }, transition: "all 0.2s ease" }}
      >
        Sign Out
      </Button>
    </Box>
  );

  return (
    <div className="min-h-screen app-shell">
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          color: "text.primary",
          borderBottom: "1px solid rgba(226,232,240,0.7)",
          boxShadow: "0 4px 24px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
        }}
      >
        {booting ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        <Toolbar sx={{ minHeight: { xs: 64, md: 74 }, gap: { xs: 0.8, md: 1.15 }, py: { xs: 0.75, md: 0 }, px: { xs: 1.25, sm: 2, md: 3 } }}>
          <IconButton
            onClick={() => setMobileNavOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 }, flexGrow: 1, minWidth: 0 }}>
            <Avatar
              src={company?.groupPhotoUrl ?? undefined}
              sx={{
                width: { xs: 38, md: 44 },
                height: { xs: 38, md: 44 },
                border: "1px solid rgba(255,255,255,0.8)",
                bgcolor: "#111827",
                color: "white",
                fontWeight: 900,
                boxShadow: "0 10px 22px rgba(15,23,42,0.16)",
              }}
            >
              A
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.08, fontSize: { xs: 16, md: 18 }, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: { xs: 185, sm: 320, md: "none" } }}>
                  {props.title}
                </Typography>
                <Chip size="small" icon={<ShieldOutlinedIcon />} label={roleLabel} sx={{ display: { xs: "none", sm: "inline-flex" }, height: 24, bgcolor: "#eef2ff", color: "#1d4ed8" }} />
              </Box>
              <Typography sx={{ display: { xs: "none", sm: "block" }, fontSize: 12, color: "text.secondary", lineHeight: 1.2, mt: 0.35 }}>
                {auth?.name ? auth.name : "Attendance Management"} - {activeLabel} {activeTimeText}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "none" },
              gap: 0.5,
              flexWrap: "wrap",
              alignItems: "center",
              p: 0.4,
              border: "1px solid #e5e7eb",
              borderRadius: 1.25,
              bgcolor: "#f8fafc",
            }}
          >
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  variant={active ? "contained" : "text"}
                  onClick={() => nav(item.path)}
                  sx={{
                    minHeight: 34,
                    borderRadius: 1,
                    px: 1.4,
                    color: active ? "white" : "text.secondary",
                    bgcolor: active ? "primary.main" : "transparent",
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
          <Tooltip title="Change password">
            <IconButton onClick={() => setPasswordOpen(true)} sx={{ display: { xs: "none", md: "inline-flex" }, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", transition: "transform .18s ease, box-shadow .18s ease", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 10px 22px rgba(15,23,42,0.10)" } }}>
              <LockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Chip
            size="small"
            label={activeTimeText}
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              height: 34,
              px: 0.5,
              bgcolor: chipBg,
              color: chipColor,
              border: chipBorder,
              fontWeight: 900,
              fontVariantNumeric: "tabular-nums",
              fontFamily: '"Inter", monospace',
              fontSize: 13,
              boxShadow: `0 2px 10px ${chipColor}22`,
              letterSpacing: "0.02em",
            }}
          />
          <Tooltip title="Notifications">
            <IconButton onClick={() => setNotificationsOpen(true)} sx={{ display: { xs: "none", md: "inline-flex" }, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", transition: "transform .18s ease, box-shadow .18s ease", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 10px 22px rgba(15,23,42,0.10)" } }}>
              <Badge badgeContent={unread} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{ display: { xs: "none", md: "inline-flex" }, borderColor: "#cbd5e1", color: "text.primary", bgcolor: "#ffffff" }}
            onClick={() => {
              sessionStorage.removeItem("notifications_initialized");
              sessionStorage.removeItem("toasted_notifications");
              clearAuth();
              nav("/login");
            }}
          >
            Logout
          </Button>
          <IconButton
            onClick={(e) => setMobileActionsAnchor(e.currentTarget)}
            sx={{ display: { xs: "inline-flex", md: "none" }, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}
          >
            <Badge badgeContent={unread} color="error">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ px: { xs: 1.25, sm: 2, md: 3 }, py: { xs: 1.5, md: 3 }, position: "relative" }}>
        {/* Subtle top gradient separator */}
        <Box sx={{ position: "absolute", inset: "0 24px auto 24px", height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), rgba(15,118,110,0.18), transparent)", pointerEvents: "none" }} />
        <Box sx={{ display: "grid", gap: { xs: 2, md: 2.5 }, gridTemplateColumns: { xs: "1fr", md: "260px minmax(0,1fr)" }, alignItems: "start" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 88 }}>
            {sidebar}
          </Box>
          <Box sx={{ display: "grid", gap: { xs: 2, md: 2.5 }, minWidth: 0, animation: "attendancePageIn 0.4s cubic-bezier(0.2,0.8,0.2,1) both" }}>{props.children}</Box>
        </Box>
      </Container>

      <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <Box sx={{ width: 290, p: 2 }}>{sidebar}</Box>
      </Drawer>

      <Menu anchorEl={mobileActionsAnchor} open={Boolean(mobileActionsAnchor)} onClose={() => setMobileActionsAnchor(null)}>
        <MenuItem disabled>{activeLabel} {activeTimeText}</MenuItem>
        <MenuItem
          onClick={() => {
            setMobileActionsAnchor(null);
            setPasswordOpen(true);
          }}
        >
          Change password
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMobileActionsAnchor(null);
            setNotificationsOpen(true);
          }}
        >
          Notifications
        </MenuItem>
        <MenuItem
          onClick={() => {
            sessionStorage.removeItem("notifications_initialized");
            sessionStorage.removeItem("toasted_notifications");
            clearAuth();
            nav("/login");
          }}
        >
          Logout
        </MenuItem>
      </Menu>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>Change password</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 1 }}>
          {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
          {passwordOk ? <Alert severity="success">{passwordOk}</Alert> : null}
          <TextField label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <TextField label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordOpen(false)}>Close</Button>
          <Button variant="contained" onClick={changePassword} disabled={!currentPassword || !newPassword}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={notificationsOpen} onClose={() => setNotificationsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>Notifications</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.25, pt: 1 }}>
          {notifications.length ? (
            <Box sx={{ p: 1.5, borderRadius: 2.5, background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(37,99,235,0.04))", border: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Inbox</Typography>
              <Chip size="small" label={`${notifications.length} total`} sx={{ bgcolor: "rgba(99,102,241,0.12)", color: "#4f46e5", fontWeight: 700 }} />
            </Box>
          ) : null}
          {notifications.map((n, i) => (
            <Box
              key={n.id}
              sx={{
                p: 2, border: `1px solid ${n.read ? "rgba(226,232,240,0.8)" : "rgba(37,99,235,0.2)"}`,
                borderRadius: 2.5, bgcolor: n.read ? "#fafbfc" : "rgba(37,99,235,0.04)",
                animation: `slideUp 0.35s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.05}s both`,
                transition: "all 0.2s ease",
                "&:hover": { transform: "translateX(3px)", boxShadow: "0 4px 14px rgba(15,23,42,0.08)" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{n.title}</Typography>
                {!n.read ? <Chip size="small" label="New" sx={{ bgcolor: "rgba(37,99,235,0.1)", color: "#2563eb", fontWeight: 800 }} /> : null}
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 13, lineHeight: 1.5 }}>{n.message}</Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 11.5, fontWeight: 500 }}>{new Date(n.createdAt).toLocaleString()}</Typography>
            </Box>
          ))}
          {!notifications.length ? <Typography sx={{ color: "text.secondary", fontSize: 13 }}>No notifications yet.</Typography> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotificationsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}




