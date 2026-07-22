import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import { useEffect, useMemo, useState } from "react";
import { api, apiBaseUrl } from "../api/client";
import { getAuth } from "../auth/auth";
import AppCard from "./AppCard";

type BoardRow = {
  employeeId: number;
  employeeNumber: string;
  employeeName: string;
  department: string;
  office: string;
  status: string;
  inTime: string;
  outTime: string;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
};

type Board = {
  generatedAt: string;
  summary: Record<string, number>;
  rows: BoardRow[];
  occupancy: Record<string, number>;
  alerts: Array<Record<string, any>>;
  mapPoints: Array<Record<string, any>>;
  outsideAttempts: Array<Record<string, any>>;
  timeline: Array<Record<string, any>>;
  correctionAlerts: Array<Record<string, any>>;
  suspicious: Array<Record<string, any>>;
};

type PayrollPreview = {
  month: string;
  totals: Record<string, number>;
  rows: Array<Record<string, any>>;
};

const statuses = ["ALL", "CHECKED_IN", "CHECKED_OUT", "ON_BREAK", "NOT_ARRIVED", "LATE_ALERT"];
const views = [
  { id: "live", label: "Live" },
  { id: "alerts", label: "Alerts" },
  { id: "payroll", label: "Payroll" },
];

export default function RealtimeBoard(props: { month: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [payroll, setPayroll] = useState<PayrollPreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("live");
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [office, setOffice] = useState("ALL");
  const [pushState, setPushState] = useState<"connecting" | "live" | "fallback">("connecting");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const auth = getAuth();
  const boardAllowed = auth?.role === "ROLE_ADMIN" || auth?.role === "ROLE_HR";

  async function load() {
    if (!boardAllowed) return;
    setLoading(true);
    try {
      const res = await api.get<Board>("/api/realtime/board");
      setBoard(res.data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Live board failed");
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setPushState("fallback");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPayroll() {
    if (!boardAllowed) return;
    const res = await api.get<PayrollPreview>("/api/realtime/payroll-preview", { params: { month: props.month } });
    setPayroll(res.data);
  }

  async function refreshAll() {
    if (!boardAllowed) return;
    await Promise.all([load(), loadPayroll().catch(() => { })]);
  }

  async function exportPayroll() {
    const res = await api.get<Blob>("/api/realtime/payroll.csv", { params: { month: props.month }, responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-attendance-${props.month}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!boardAllowed) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardAllowed, props.month]);

  useEffect(() => {
    const token = getAuth()?.token;
    if (!token || !boardAllowed) return;

    const events = new EventSource(`${apiBaseUrl}/api/realtime/events?token=${encodeURIComponent(token)}`);
    events.addEventListener("open", () => setPushState("live"));
    events.addEventListener("board", (event) => {
      setPushState("live");
      setBoard(JSON.parse((event as MessageEvent).data));
    });
    events.addEventListener("attendance-change", () => {
      setPushState("live");
      refreshAll();
    });
    events.addEventListener("error", () => setPushState("fallback"));
    const fallbackId = window.setInterval(() => {
      if (events.readyState !== EventSource.OPEN) load();
    }, 10000);
    return () => {
      events.close();
      window.clearInterval(fallbackId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardAllowed, props.month]);

  useEffect(() => {
    if (!board?.generatedAt) {
      setElapsedSeconds(0);
      return;
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(board.generatedAt).getTime()) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [board?.generatedAt]);

  const departments = useMemo(() => ["ALL", ...Array.from(new Set((board?.rows ?? []).map((r) => r.department)))], [board]);
  const offices = useMemo(() => ["ALL", ...Array.from(new Set((board?.rows ?? []).map((r) => r.office)))], [board]);
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (board?.rows ?? []).filter((r) => {
      const matchesStatus = status === "ALL" || r.status === status;
      const matchesDepartment = department === "ALL" || r.department === department;
      const matchesOffice = office === "ALL" || r.office === office;
      const matchesQuery =
        !q || r.employeeName.toLowerCase().includes(q) || r.employeeNumber.toLowerCase().includes(q);
      return matchesStatus && matchesDepartment && matchesOffice && matchesQuery;
    });
  }, [board, department, office, query, status]);

  const notificationItems = useMemo(
    () => [
      ...(board?.alerts ?? []).map((a) => ({ tone: "error", title: `${a.employeeName} is late`, detail: `Employee ${a.employeeNumber}` })),
      ...(board?.correctionAlerts ?? []).map((a) => ({ tone: "warning", title: String(a.type), detail: `${a.employeeName}: ${a.message}` })),
    ],
    [board],
  );
  const riskItems = useMemo(
    () => [
      ...(board?.suspicious ?? []).map((a) => ({ tone: "error", title: String(a.type), detail: `${a.employeeName}: ${a.message}` })),
      ...(board?.outsideAttempts ?? []).map((a) => ({ tone: "warning", title: String(a.type), detail: `${a.employeeName}: ${a.message}` })),
    ],
    [board],
  );

  return (
    <AppCard contentSx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
      <BoardHeader
        generatedAt={board?.generatedAt}
        loading={loading}
        pushState={pushState}
        view={view}
        onView={setView}
        onRefresh={() => refreshAll().catch(() => { })}
        onExport={() => exportPayroll().catch(() => { })}
      />
      {loading ? <LinearProgress sx={{ mt: 1.5 }} /> : null}
      {err ? <Alert severity="error" sx={{ mt: 1.5 }}>{err}</Alert> : null}

      {!boardAllowed ? (
        <EmptyState title="Realtime board unavailable for this role" detail="This board is currently available to Admin and HR accounts." />
      ) : board ? (
        <>
          <SummaryStrip summary={board.summary} />
          <FilterBar
            query={query}
            status={status}
            department={department}
            office={office}
            departments={departments}
            offices={offices}
            onQuery={setQuery}
            onStatus={setStatus}
            onDepartment={setDepartment}
            onOffice={setOffice}
          />

          {view === "live" ? (
            <LiveView board={board} rows={filteredRows} />
          ) : view === "alerts" ? (
            <AlertsView notifications={notificationItems} risks={riskItems} timeline={board.timeline} />
          ) : (
            <PayrollView payroll={payroll} onExport={() => exportPayroll().catch(() => { })} />
          )}
        </>
      ) : !loading ? (
        <EmptyState title="Realtime board unavailable" detail="Start the backend and sign in again." />
      ) : null}
    </AppCard>
  );
}

function BoardHeader(props: {
  generatedAt?: string;
  loading: boolean;
  pushState: "connecting" | "live" | "fallback";
  view: string;
  onView: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.4, gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ color: "primary.main", fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: 1 }}>
            Realtime attendance
          </Typography>
          <Chip
            size="small"
            icon={<WifiTetheringIcon />}
            color={props.pushState === "live" ? "success" : props.pushState === "fallback" ? "warning" : "default"}
            label={props.pushState === "live" ? "Live" : props.pushState === "fallback" ? "Fallback" : "Connecting"}
            sx={{ borderRadius: 1, fontWeight: 900, height: 24 }}
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 950, mt: 0.5, lineHeight: 1.2 }}>
          Operations board
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 12.5, mt: 0.4 }}>
          {props.generatedAt ? `Updated ${new Date(props.generatedAt).toLocaleTimeString()}` : "Waiting for attendance data"}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={props.view}
          onChange={(_, value) => value && props.onView(value)}
          sx={{ "& .MuiToggleButton-root": { borderRadius: 1, px: 1.6, fontWeight: 900 } }}
        >
          {views.map((v) => <ToggleButton key={v.id} value={v.id}>{v.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={props.onRefresh} disabled={props.loading}>
          Refresh
        </Button>
        <Button startIcon={<FileDownloadIcon />} variant="contained" onClick={props.onExport}>
          CSV
        </Button>
      </Box>
    </Box>
  );
}

function SummaryStrip(props: { summary: Record<string, number> }) {
  const ordered = ["employees", "checkedIn", "onBreak", "checkedOut", "absentOrNotArrived", "lateAlerts"];
  return (
    <Box sx={{ mt: 1.8, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6, 1fr)" } }}>
      {ordered.map((key) => (
        <Box key={key} sx={{ p: 1.25, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: summaryBg(key), minHeight: 78 }}>
          <Typography sx={{ fontSize: 10.5, color: "text.secondary", fontWeight: 950, textTransform: "uppercase" }}>{label(key)}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 26, fontWeight: 950, lineHeight: 1 }}>{props.summary[key] ?? 0}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function FilterBar(props: {
  query: string;
  status: string;
  department: string;
  office: string;
  departments: string[];
  offices: string[];
  onQuery: (value: string) => void;
  onStatus: (value: string) => void;
  onDepartment: (value: string) => void;
  onOffice: (value: string) => void;
}) {
  return (
    <Box sx={{ mt: 1.5, p: 1, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f8fafc", display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1.35fr repeat(3, 1fr)" } }}>
      <TextField
        size="small"
        label="Search"
        value={props.query}
        onChange={(e) => props.onQuery(e.target.value)}
        InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.8, color: "text.secondary" }} /> }}
      />
      <TextField size="small" select label="Status" value={props.status} onChange={(e) => props.onStatus(e.target.value)} InputProps={{ startAdornment: <FilterAltIcon fontSize="small" sx={{ mr: 0.8, color: "text.secondary" }} /> }}>
        {statuses.map((s) => <MenuItem key={s} value={s}>{label(s)}</MenuItem>)}
      </TextField>
      <TextField size="small" select label="Department" value={props.department} onChange={(e) => props.onDepartment(e.target.value)}>
        {props.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
      <TextField size="small" select label="Office" value={props.office} onChange={(e) => props.onOffice(e.target.value)}>
        {props.offices.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Box>
  );
}

function LiveView(props: { board: Board; rows: BoardRow[] }) {
  return (
    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.55fr) minmax(360px, 0.9fr)" } }}>
      <EmployeeRoster rows={props.rows} />
      <Box sx={{ display: "grid", gap: 1.5, alignSelf: "start" }}>
        <LiveMap points={props.board.mapPoints} occupancy={props.board.occupancy} />
        <TimelinePanel items={props.board.timeline} compact />
      </Box>
    </Box>
  );
}

function EmployeeRoster(props: { rows: BoardRow[] }) {
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden", bgcolor: "#ffffff" }}>
      <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "1.35fr 1fr 0.6fr 0.6fr 0.7fr 0.8fr", gap: 1, px: 1.25, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
        {["Employee", "Org", "In", "Out", "Worked", "State"].map((h) => <Typography key={h} sx={{ fontSize: 11, fontWeight: 950, color: "text.secondary", textTransform: "uppercase" }}>{h}</Typography>)}
      </Box>
      <Box sx={{ display: "grid", maxHeight: 520, overflow: "auto" }}>
        {props.rows.map((r) => (
          <Box key={r.employeeId} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.35fr 1fr 0.6fr 0.6fr 0.7fr 0.8fr" }, gap: 1, alignItems: "center", px: 1.25, py: 1, borderBottom: "1px solid #eef2f7" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.employeeName}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{r.employeeNumber}</Typography>
            </Box>
            <Typography sx={{ color: "text.secondary", fontSize: 12.5, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.department} | {r.office}
            </Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{r.inTime}</Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{r.outTime}</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{minutesLabel(r.workedMinutes)}</Typography>
            <Chip size="small" label={label(r.status)} color={chipColor(r.status)} sx={{ borderRadius: 1, fontWeight: 900, justifySelf: { xs: "start", md: "stretch" } }} />
          </Box>
        ))}
        {!props.rows.length ? <EmptyState title="No employees found" detail="Adjust filters to widen the roster." /> : null}
      </Box>
    </Box>
  );
}

function LiveMap(props: { points: Array<Record<string, any>>; occupancy: Record<string, number> }) {
  const pointsList = props.points || [];
  const bounds = mapBounds(pointsList);
  return (
    <Box sx={{ border: "1px solid #dbeafe", borderRadius: 1, bgcolor: "#eef6f1", minHeight: 330, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#d8e7dc 1px, transparent 1px), linear-gradient(90deg, #d8e7dc 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 24%, rgba(22,163,74,0.12), transparent 28%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.10), transparent 30%)" }} />
      <Box sx={{ position: "absolute", left: 12, right: 12, top: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, zIndex: 2 }}>
        <Typography sx={{ fontWeight: 950, fontSize: 13, display: "flex", alignItems: "center", gap: 0.8 }}>
          <MyLocationIcon fontSize="small" /> Punch locations
        </Typography>
        <Chip size="small" label={`${pointsList.length} points`} sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.78)", fontWeight: 900 }} />
      </Box>
      {pointsList.map((p, i) => {
        const x = ((Number(p.longitude) - bounds.minLng) / bounds.lngSpan) * 82 + 9;
        const y = (1 - (Number(p.latitude) - bounds.minLat) / bounds.latSpan) * 72 + 16;
        return (
          <Box key={`${p.employeeName}-${p.type}-${i}`} title={`${p.employeeName} ${p.type}`} sx={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", bgcolor: p.type === "CHECK_OUT" ? "#f97316" : "#16a34a", border: "2px solid white", boxShadow: "0 2px 10px rgba(15,23,42,0.25)", zIndex: 2 }} />
        );
      })}
      <Box sx={{ position: "absolute", left: 12, right: 12, bottom: 10, zIndex: 2, display: "grid", gap: 0.6 }}>
        <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap" }}>
          {Object.entries(props.occupancy || {}).slice(0, 4).map(([name, count]) => (
            <Chip key={name} size="small" label={`${name}: ${count}`} sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.82)", fontWeight: 800 }} />
          ))}
        </Box>
        {!pointsList.length ? <Typography sx={{ fontSize: 12, color: "text.secondary", bgcolor: "rgba(255,255,255,0.72)", px: 1, py: 0.5, borderRadius: 1 }}>No punch locations yet.</Typography> : null}
      </Box>
    </Box>
  );
}

function AlertsView(props: {
  notifications: Array<{ tone: string; title: string; detail: string }>;
  risks: Array<{ tone: string; title: string; detail: string }>;
  timeline: Array<Record<string, any>>;
}) {
  return (
    <Box sx={{ mt: 1.5, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
      <AlertStack title="Late and correction alerts" icon={<NotificationsActiveIcon fontSize="small" />} items={props.notifications} />
      <AlertStack title="Geofence and device risk" icon={<WarningAmberIcon fontSize="small" />} items={props.risks} />
      <Box sx={{ gridColumn: { xs: "auto", lg: "1 / -1" } }}>
        <TimelinePanel items={props.timeline} />
      </Box>
    </Box>
  );
}

function AlertStack(props: { title: string; icon: React.ReactNode; items: Array<{ tone: string; title: string; detail: string }> }) {
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", overflow: "hidden" }}>
      <Box sx={{ px: 1.25, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 0.8 }}>
        {props.icon}
        <Typography sx={{ fontWeight: 950, fontSize: 13 }}>{props.title}</Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 0.8, p: 1.25, maxHeight: 360, overflow: "auto" }}>
        {props.items.slice(0, 18).map((item, index) => (
          <Box key={`${item.title}-${index}`} sx={{ border: "1px solid", borderColor: item.tone === "error" ? "#fecaca" : "#fde68a", bgcolor: item.tone === "error" ? "#fff1f2" : "#fffbeb", borderRadius: 1, p: 1 }}>
            <Typography sx={{ fontWeight: 950, fontSize: 12.5 }}>{label(item.title)}</Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.2 }}>{item.detail}</Typography>
          </Box>
        ))}
        {!props.items.length ? <EmptyState title="No active alerts" detail="Attendance signals are clear." compact /> : null}
      </Box>
    </Box>
  );
}

function TimelinePanel(props: { items?: Array<Record<string, any>>; compact?: boolean }) {
  const items = props.items ?? [];
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", overflow: "hidden" }}>
      <Box sx={{ px: 1.25, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 0.8 }}>
        <TimelineIcon fontSize="small" />
        <Typography sx={{ fontWeight: 950, fontSize: 13 }}>Event timeline</Typography>
      </Box>
      <Box sx={{ display: "grid", p: 1.25, gap: 0.9, maxHeight: props.compact ? 210 : 420, overflow: "auto" }}>
        {items.slice(0, props.compact ? 8 : 24).map((x, i) => (
          <Box key={`${x.at}-${i}`} sx={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 1, alignItems: "start" }}>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 900 }}>{new Date(x.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{x.employeeName}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{label(String(x.type))}</Typography>
            </Box>
          </Box>
        ))}
        {!items.length ? <EmptyState title="No events today" detail="Punch and break events will appear here." compact /> : null}
      </Box>
    </Box>
  );
}

function PayrollView(props: { payroll: PayrollPreview | null; onExport: () => void }) {
  if (!props.payroll) return <EmptyState title="Payroll preview unavailable" detail="Refresh after attendance data loads." />;
  return (
    <Box sx={{ mt: 1.5, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#ffffff", overflow: "hidden" }}>
      <Box sx={{ px: 1.25, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 0.8 }}><TableChartIcon fontSize="small" /> Payroll preview - {props.payroll.month}</Typography>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="contained" onClick={props.onExport}>Export CSV</Button>
      </Box>
      <Box sx={{ p: 1.25, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6,1fr)" } }}>
        {Object.entries(props.payroll?.totals || {}).map(([k, v]) => <MetricBox key={k} label={label(k)} value={v as number} />)}
      </Box>
      <Divider />
      <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "1.4fr repeat(6, 0.7fr)", gap: 1, px: 1.25, py: 1, bgcolor: "#f8fafc" }}>
        {["Employee", "Present", "Half", "Leave", "Worked", "Late", "OT"].map((h) => <Typography key={h} sx={{ fontSize: 11, fontWeight: 950, color: "text.secondary", textTransform: "uppercase" }}>{h}</Typography>)}
      </Box>
      <Box sx={{ display: "grid", maxHeight: 390, overflow: "auto" }}>
        {props.payroll.rows.map((r) => (
          <Box key={r.employeeNumber} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr repeat(6, 0.7fr)" }, gap: 1, px: 1.25, py: 1, borderTop: "1px solid #eef2f7" }}>
            <Typography sx={{ fontWeight: 950, fontSize: 13 }}>{r.employeeName} <span style={{ opacity: 0.55 }}>({r.employeeNumber})</span></Typography>
            <Typography sx={{ fontSize: 12.5 }}>{r.present}</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{r.halfDay}</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{r.leave}</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{minutesLabel(Number(r.workedMinutes))}</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{r.lateMinutes}m</Typography>
            <Typography sx={{ fontSize: 12.5 }}>{r.overtimeMinutes}m</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MetricBox(props: { label: string; value: number }) {
  return (
    <Box sx={{ p: 1, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1 }}>
      <Typography sx={{ fontSize: 10.5, color: "text.secondary", fontWeight: 950, textTransform: "uppercase" }}>{props.label}</Typography>
      <Typography sx={{ mt: 0.4, fontWeight: 950, fontSize: 18 }}>{props.value}</Typography>
    </Box>
  );
}

function EmptyState(props: { title: string; detail: string; compact?: boolean }) {
  return (
    <Box sx={{ p: props.compact ? 1.2 : 2, textAlign: "center", color: "text.secondary" }}>
      <Typography sx={{ fontWeight: 950, fontSize: props.compact ? 12.5 : 14 }}>{props.title}</Typography>
      <Typography sx={{ mt: 0.3, fontSize: 12 }}>{props.detail}</Typography>
    </Box>
  );
}

function mapBounds(points: Array<Record<string, any>>) {
  const pts = points || [];
  const lats = pts.map((p) => Number(p.latitude)).filter(Number.isFinite);
  const lngs = pts.map((p) => Number(p.longitude)).filter(Number.isFinite);
  const minLat = lats.length ? Math.min(...lats) : 0;
  const maxLat = lats.length ? Math.max(...lats) : 0;
  const minLng = lngs.length ? Math.min(...lngs) : 0;
  const maxLng = lngs.length ? Math.max(...lngs) : 0;
  return { minLat, minLng, latSpan: Math.max(maxLat - minLat, 0.0001), lngSpan: Math.max(maxLng - minLng, 0.0001) };
}

function summaryBg(key: string) {
  if (key === "checkedIn") return "#ecfdf5";
  if (key === "onBreak") return "#fffbeb";
  if (key === "lateAlerts") return "#fff1f2";
  if (key === "absentOrNotArrived") return "#f8fafc";
  return "#ffffff";
}

function minutesLabel(value: number) {
  if (!value) return "0m";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function chipColor(status: string): "default" | "error" | "warning" | "success" | "info" {
  if (status === "LATE_ALERT") return "error";
  if (status === "ON_BREAK") return "warning";
  if (status === "CHECKED_IN") return "success";
  if (status === "CHECKED_OUT") return "info";
  return "default";
}
