import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import AppCard from "./AppCard";

export default function ProductionControls() {
  const { toastSuccess, toastError } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [backup, setBackup] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [qrOfficeId, setQrOfficeId] = useState("");
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrDailyCode, setQrDailyCode] = useState<string | null>(null);
  const [qrMode, setQrMode] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [policyName, setPolicyName] = useState("Production policy");

  async function load() {
    setErr(null);
    const [d, e, s, b] = await Promise.allSettled([
      api.get<any[]>("/api/admin/production/devices"),
      api.get<any[]>("/api/admin/production/exceptions"),
      api.get<any[]>("/api/admin/production/sessions"),
      api.get<any>("/api/admin/production/backup"),
    ]);
    if (d.status === "fulfilled") setDevices(d.value.data);
    else {
      setDevices([]);
      setErr(d.reason?.response?.data?.error ?? d.reason?.message ?? "Failed to load device approvals");
    }
    if (e.status === "fulfilled") setExceptions(e.value.data);
    else setExceptions([]);
    if (s.status === "fulfilled") setSessions(s.value.data);
    else setSessions([]);
    if (b.status === "fulfilled") setBackup(b.value.data);
    else setBackup(null);

    // Load latest QR token (if any) so it remains visible after page refresh
    try {
      await loadLatestQr(qrOfficeId || undefined);
    } catch (err) {
      // ignore if none or server error
      // eslint-disable-next-line no-console
      console.warn("Failed to load latest QR", err);
    }
  }

  async function loadLatestQr(officeId?: string) {
    const qs = officeId ? `?officeId=${encodeURIComponent(String(officeId))}` : "";
    try {
      const qrRes = await api.get<any>(`/api/admin/production/qr/latestToken${qs}`);
      setErr(null);
      if (qrRes.data && qrRes.data.token) {
        setQrToken(qrRes.data.token);
        setQrDailyCode(qrRes.data.dailyCode || null);
        setQrMode(qrRes.data.mode || null);
        setQrExpiresAt(qrRes.data.expiresAt || null);
        const image = await api.get<Blob>(`/api/admin/production/qr/${encodeURIComponent(qrRes.data.token)}.png`, { responseType: "blob" });
        if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
        setQrImageUrl(URL.createObjectURL(image.data));
      } else {
        setQrToken(null);
        setQrDailyCode(null);
        setQrMode(null);
        setQrExpiresAt(null);
        if (qrImageUrl) {
          URL.revokeObjectURL(qrImageUrl);
          setQrImageUrl(null);
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "Failed to load latest QR";
      setErr(`Load latest QR failed: ${msg}`);
      setQrToken(null);
      setQrDailyCode(null);
      setQrMode(null);
      setQrExpiresAt(null);
      // fallback to localStorage cached token
      try {
        const key = `attendance_latest_qr_${officeId || 'global'}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.token) {
            setQrToken(parsed.token);
            setQrDailyCode(parsed.dailyCode || null);
            setQrMode(parsed.mode || null);
            setQrExpiresAt(parsed.expiresAt || null);
            // Use public QR image service as a fallback so admin sees the QR image without backend image fetch
            setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(parsed.token)}`);
            setErr(null);
            return;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  async function createQr() {
    try {
      const res = await api.post<any>("/api/admin/production/qr", { officeId: Number(qrOfficeId) });
      setQrToken(res.data.token);
      setQrDailyCode(res.data.dailyCode || null);
      setQrMode(res.data.mode || null);
      setQrExpiresAt(res.data.expiresAt || null);
      const image = await api.get<Blob>(`/api/admin/production/qr/${encodeURIComponent(res.data.token)}.png`, { responseType: "blob" });
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(URL.createObjectURL(image.data));
      // save latest token to localStorage as fallback for UI refresh/debugging
      try {
        const key = `attendance_latest_qr_${qrOfficeId || 'global'}`;
        localStorage.setItem(key, JSON.stringify({ token: res.data.token, dailyCode: res.data.dailyCode, mode: res.data.mode, expiresAt: res.data.expiresAt, createdAt: new Date().toISOString() }));
      } catch {
        // ignore storage errors
      }
      toastSuccess("Office QR generated successfully!");
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "QR generation failed";
      setErr(msg);
      toastError(msg);
    }
  }

  async function snapshotPolicy() {
    try {
      await api.post("/api/admin/production/policies", { versionName: policyName });
      setPolicyName("Production policy");
      toastSuccess("Policy snapshot created!");
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "Policy snapshot failed";
      setErr(msg);
      toastError(msg);
    }
  }

  async function approveDevice(id: number, approved: boolean) {
    setErr(null);
    try {
      await api.post(`/api/admin/production/devices/${id}/approval`, { approved });
      toastSuccess(approved ? "Device approved successfully!" : "Device approval revoked.");
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "Device approval update failed";
      setErr(msg);
      toastError(msg);
      throw e;
    }
  }

  useEffect(() => {
    load().catch(() => { });
  }, []);

  useEffect(() => {
    // When the admin changes the Office ID input, show the most recent QR for that office
    if (!qrOfficeId || !qrOfficeId.trim()) return;
    loadLatestQr(qrOfficeId).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrOfficeId]);

  const sortedDevices = [...devices].sort((a, b) => {
    if (a.approved !== b.approved) return a.approved ? 1 : -1;
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });

  return (
    <AppCard>
      {err ? (
        <Box sx={{ mb: 2, p: 1.2, borderRadius: 1, border: "1px solid #fecaca", bgcolor: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 700 }}>
          {err}
        </Box>
      ) : null}
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography sx={{ color: "primary.main", fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1 }}>
            Security operations
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>Production controls</Typography>
          <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: 13 }}>
            Devices, QR tokens, exceptions, sessions, policy snapshots, backup status, and security operations.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => load().catch(() => { })}>Refresh</Button>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(4,1fr)" } }}>
        <Mini title="Devices pending/total" value={`${devices.filter((d) => !d.approved).length}/${devices.length}`} />
        <Mini title="Open exceptions" value={exceptions.length} />
        <Mini title="Recent sessions" value={sessions.length} />
        <Mini title="Backup snapshot" value={backup ? `${backup.employees} employees` : "--"} />
      </Box>
      <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Box sx={{ p: 1.6, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
          <Typography sx={{ fontWeight: 900 }}>Fixed office QR</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.4 }}>
            With Permanent office QR enabled, print this QR once. The QR image stays same; today's server code changes daily.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField label="Office ID" value={qrOfficeId} onChange={(e) => setQrOfficeId(e.target.value)} fullWidth />
            <Button variant="contained" onClick={() => createQr().catch(() => { })} disabled={!qrOfficeId}>Generate</Button>
          </Box>
          {qrToken ? (
            <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
              <Box
                component="img"
                alt="Office QR"
                src={qrImageUrl ?? ""}
                sx={{ width: 180, height: 180, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "white" }}
              />
              <Typography sx={{ fontSize: 12, wordBreak: "break-all" }}>Printed QR token: <b>{qrToken}</b></Typography>
              <Typography sx={{ fontSize: 12 }}>
                Mode: <b>{qrMode === "FIXED_QR_DAILY_CODE" ? "Fixed QR + daily code" : "Rotating token"}</b>
              </Typography>
              {qrDailyCode ? (
                <Typography sx={{ fontSize: 12 }}>Today's code: <b>{qrDailyCode}</b></Typography>
              ) : null}
              {qrExpiresAt ? (
                <Typography sx={{ fontSize: 12 }}>Valid until: <b>{new Date(qrExpiresAt).toLocaleString()}</b></Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>
        <Box sx={{ p: 1.6, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
          <Typography sx={{ fontWeight: 900 }}>Policy versioning</Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField label="Policy name" value={policyName} onChange={(e) => setPolicyName(e.target.value)} fullWidth />
            <Button variant="contained" onClick={() => snapshotPolicy().catch(() => { })}>Snapshot</Button>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: 2, p: 1.6, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
        <Typography sx={{ fontWeight: 900 }}>Device approvals</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.4 }}>
          Approve only company-owned or verified employee devices. Punch is blocked until approval is active.
        </Typography>
        <Box sx={{ display: "grid", gap: 1, mt: 1.5, maxHeight: 450, overflowY: "auto", pr: 0.5 }}>
          {sortedDevices.map((d) => (
            <Box
              key={d.id}
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                alignItems: "center",
                p: 1.25,
                border: "1px solid #e5e7eb",
                borderRadius: 1,
                bgcolor: "white",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                  {d.username} | {d.label || "Unlabelled device"} | {d.approved ? "Approved" : "Pending"}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12, wordBreak: "break-all" }}>
                  {d.deviceId}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" disabled={d.approved} onClick={() => approveDevice(d.id, true).catch(() => { })}>
                  Approve
                </Button>
                <Button variant="outlined" disabled={!d.approved} onClick={() => approveDevice(d.id, false).catch(() => { })}>
                  Revoke
                </Button>
              </Box>
            </Box>
          ))}
          {!sortedDevices.length ? <Typography sx={{ color: "text.secondary", fontSize: 13 }}>No registered devices yet.</Typography> : null}
        </Box>
      </Box>
    </AppCard>
  );
}

function Mini(props: { title: string; value: string | number }) {
  return (
    <Box sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 900, color: "text.secondary", textTransform: "uppercase" }}>{props.title}</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 24, fontWeight: 950 }}>{props.value}</Typography>
    </Box>
  );
}
