import { Alert, AppBar, Avatar, Badge, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton, LinearProgress, TextField, Toolbar, Tooltip, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { clearAuth, getAuth } from "../auth/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useEffect, useState } from "react";

type CompanyProfile = { groupPhotoUrl?: string | null };
type Notification = { id: number; title: string; message: string; read: boolean; createdAt: string };

export default function Layout(props: { title: string; children: React.ReactNode }) {
  const nav = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<CompanyProfile>("/api/company").then((r) => setCompany(r.data)).catch(() => { }),
      api.get<Notification[]>("/api/notifications").then((r) => setNotifications(r.data)).catch(() => { }),
    ]).finally(() => setBooting(false));
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

  const unread = notifications.filter((n) => !n.read).length || notifications.length;
  const roleLabel = auth?.role?.replace("ROLE_", "") ?? "USER";
  const sidebar = (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        p: 1.25,
        border: "1px solid rgba(148,163,184,0.24)",
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.84)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
      }}
    >
      <Typography sx={{ px: 1, pt: 0.4, fontSize: 11, fontWeight: 950, letterSpacing: 0.6, color: "text.secondary", textTransform: "uppercase" }}>
        Workspace
      </Typography>
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Button
            key={item.path}
            startIcon={item.icon}
            variant={active ? "contained" : "text"}
            onClick={() => {
              setMobileNavOpen(false);
              nav(item.path);
            }}
            sx={{
              justifyContent: "flex-start",
              minHeight: 42,
              borderRadius: 1.3,
              px: 1.35,
              color: active ? "white" : "text.primary",
              bgcolor: active ? "primary.main" : "transparent",
            }}
          >
            {item.label}
          </Button>
        );
      })}
      <Divider sx={{ my: 0.4 }} />
      <Button startIcon={<LockIcon fontSize="small" />} onClick={() => setPasswordOpen(true)} sx={{ justifyContent: "flex-start", minHeight: 40, borderRadius: 1.2 }}>
        Password
      </Button>
      <Button startIcon={<NotificationsIcon fontSize="small" />} onClick={() => setNotificationsOpen(true)} sx={{ justifyContent: "flex-start", minHeight: 40, borderRadius: 1.2 }}>
        Notifications
      </Button>
      <Button
        startIcon={<LogoutIcon fontSize="small" />}
        onClick={() => {
          clearAuth();
          nav("/login");
        }}
        sx={{ justifyContent: "flex-start", minHeight: 40, borderRadius: 1.2 }}
      >
        Logout
      </Button>
    </Box>
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(18px)",
          color: "text.primary",
          borderBottom: "1px solid rgba(203,213,225,0.9)",
          boxShadow: "0 12px 34px rgba(15,23,42,0.08)",
        }}
      >
        {booting ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        <Toolbar sx={{ minHeight: 74, flexWrap: { xs: "wrap", md: "nowrap" }, gap: 1.15, py: { xs: 1, md: 0 } }}>
          <IconButton
            onClick={() => setMobileNavOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1, minWidth: 0 }}>
            <Avatar
              src={company?.groupPhotoUrl ?? undefined}
              sx={{
                width: 44,
                height: 44,
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
                <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.08, fontSize: 18 }}>
                  {props.title}
                </Typography>
                <Chip size="small" icon={<ShieldOutlinedIcon />} label={roleLabel} sx={{ height: 24, bgcolor: "#eef2ff", color: "#1d4ed8" }} />
              </Box>
              <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.2, mt: 0.35 }}>
                {auth?.name ? auth.name : "Attendance Management"} | Secure attendance operations
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
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
            <IconButton onClick={() => setPasswordOpen(true)} sx={{ border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}>
              <LockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton onClick={() => setNotificationsOpen(true)} sx={{ border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff" }}>
              <Badge badgeContent={unread} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{ borderColor: "#cbd5e1", color: "text.primary", bgcolor: "#ffffff" }}
            onClick={() => {
              clearAuth();
              nav("/login");
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 2.25, md: 3.5 }, position: "relative" }}>
        <Box sx={{ position: "absolute", inset: "0 24px auto 24px", height: 1, background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.22), transparent)" }} />
        <Box sx={{ display: "grid", gap: { xs: 2.25, md: 3 }, gridTemplateColumns: { xs: "1fr", md: "240px minmax(0,1fr)" }, alignItems: "start" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 96 }}>
            {sidebar}
          </Box>
          <Box sx={{ display: "grid", gap: { xs: 2.25, md: 3 }, minWidth: 0 }}>{props.children}</Box>
        </Box>
      </Container>

      <Drawer anchor="left" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <Box sx={{ width: 290, p: 2 }}>{sidebar}</Box>
      </Drawer>

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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "center", p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
              <Typography sx={{ fontWeight: 950 }}>Inbox summary</Typography>
              <Chip size="small" label={`${notifications.length} total`} color="info" />
            </Box>
          ) : null}
          {notifications.map((n) => (
            <Box key={n.id} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: n.read ? "#f9fafb" : "#eff6ff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                <Typography sx={{ fontWeight: 950 }}>{n.title}</Typography>
                {!n.read ? <Chip size="small" label="New" color="primary" /> : null}
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{n.message}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</Typography>
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
