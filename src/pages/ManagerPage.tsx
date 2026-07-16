import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import InsightsIcon from "@mui/icons-material/Insights";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import AppCard from "../components/AppCard";
import DashboardHero from "../components/DashboardHero";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";

type Employee = {
  id: number;
  employeeNumber: string;
  name: string;
  loginRole: string;
  companyRole?: { name?: string | null; photoUrl?: string | null } | null;
  assignedOfficeLocation?: { officeName?: string | null } | null;
  status?: string | null;
};

type RegularizationRequest = {
  id: number;
  employeeName: string;
  employeeNumber: string;
  date: string;
  inTime?: string | null;
  outTime?: string | null;
  reason: string;
  status: string;
  createdAt: string;
};

type WorkRequest = {
  id: number;
  employeeName: string;
  employeeNumber: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt?: string;
  remarks?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

type TeamAttendance = {
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  office?: string | null;
  todayStatus: string;
  inTime?: string | null;
  outTime?: string | null;
  presentDays: number;
  halfDayDays: number;
  leaveDays: number;
  workingDays: number;
};
type QueueItem =
  | {
      kind: "CORRECTION";
      id: number;
      employeeName: string;
      employeeNumber: string;
      title: string;
      summary: string;
      reason: string;
      createdAt: string;
      raw: RegularizationRequest;
    }
  | {
      kind: "WORK";
      id: number;
      employeeName: string;
      employeeNumber: string;
      title: string;
      summary: string;
      reason: string;
      createdAt: string;
      attachmentUrl?: string | null;
      attachmentName?: string | null;
      raw: WorkRequest;
    };

export default function ManagerPage() {
  const { toastSuccess, toastError } = useToast();
  const [team, setTeam] = useState<Employee[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<RegularizationRequest[]>([]);
  const [pendingWorkRequests, setPendingWorkRequests] = useState<WorkRequest[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendance[]>([]);
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [queueTab, setQueueTab] = useState<"ALL" | "CORRECTION" | "WORK">("ALL");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (err) {
      toastError(err);
      setErr(null);
    }
  }, [err, toastError]);

  useEffect(() => {
    if (ok) {
      toastSuccess(ok);
      setOk(null);
    }
  }, [ok, toastSuccess]);

  async function refresh() {
    const [teamRes, correctionsRes, workRes, attendanceRes] = await Promise.all([
      api.get<Employee[]>("/api/manager/team"),
      api.get<RegularizationRequest[]>("/api/manager/regularization-requests/pending"),
      api.get<WorkRequest[]>('/api/manager/work-requests/pending'),
      api.get<TeamAttendance[]>('/api/manager/team/attendance', { params: { month } }),
    ]);
    setTeam(teamRes.data);
    setPendingCorrections(correctionsRes.data);
    setPendingWorkRequests(workRes.data);
    setTeamAttendance(attendanceRes.data);
  }

  useEffect(() => {
    refresh().catch((e: any) => setErr(e?.response?.data?.error ?? "Failed to load manager dashboard"));
  }, [month]);

  async function recommendCorrection(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/manager/regularization-requests/${id}/recommend`, {
      remarks: remarks[id]?.trim() || null,
    });
    setSelectedItem(null);
    setOk("Correction recommended to HR");
    await refresh();
  }

  async function recommendWorkRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/manager/work-requests/${id}/recommend`, {
      remarks: remarks[id]?.trim() || null,
    });
    setSelectedItem(null);
    setOk("Work request recommended");
    await refresh();
  }

  async function rejectWorkRequest(id: number) {
    setErr(null);
    setOk(null);
    await api.post(`/api/manager/work-requests/${id}/reject`, {
      remarks: remarks[id]?.trim() || null,
    });
    setSelectedItem(null);
    setOk("Work request rejected");
    await refresh();
  }

  const queueItems = useMemo<QueueItem[]>(() => {
    const normalized = search.trim().toLowerCase();
    const corrections: QueueItem[] = pendingCorrections.map((request) => ({
      kind: "CORRECTION",
      id: request.id,
      employeeName: request.employeeName,
      employeeNumber: request.employeeNumber,
      title: "Attendance correction",
      summary: `${request.date} | ${request.inTime ?? "--"} -> ${request.outTime ?? "--"}`,
      reason: request.reason,
      createdAt: request.createdAt,
      raw: request,
    }));
    const work: QueueItem[] = pendingWorkRequests.map((request) => ({
      kind: "WORK",
      id: request.id,
      employeeName: request.employeeName,
      employeeNumber: request.employeeNumber,
      title: request.type.replaceAll("_", " "),
      summary: `${request.fromDate} -> ${request.toDate}`,
      reason: request.reason,
      createdAt: request.createdAt ?? "",
      attachmentUrl: request.attachmentUrl,
      attachmentName: request.attachmentName,
      raw: request,
    }));

    return [...corrections, ...work]
      .filter((item) => queueTab === "ALL" || item.kind === queueTab)
      .filter((item) => {
        if (!normalized) return true;
        return (
          item.employeeName.toLowerCase().includes(normalized) ||
          item.employeeNumber.toLowerCase().includes(normalized) ||
          item.title.toLowerCase().includes(normalized) ||
          item.summary.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [pendingCorrections, pendingWorkRequests, queueTab, search]);

  const filteredTeam = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return team;
    return team.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalized) ||
        employee.employeeNumber.toLowerCase().includes(normalized) ||
        (employee.companyRole?.name ?? "").toLowerCase().includes(normalized) ||
        (employee.assignedOfficeLocation?.officeName ?? "").toLowerCase().includes(normalized),
    );
  }, [search, team]);

  const recommendedToday = pendingCorrections.filter((item) => item.date === dayjs().format("YYYY-MM-DD")).length;
  const attendanceTotals = useMemo(() => {
    return teamAttendance.reduce((acc, row) => {
      acc.present += row.presentDays;
      acc.half += row.halfDayDays;
      acc.leave += row.leaveDays;
      acc.working += row.workingDays;
      if (row.todayStatus === "PRESENT") acc.presentToday += 1;
      if (row.todayStatus === "HALF_DAY") acc.halfToday += 1;
      if (row.todayStatus === "LEAVE" || row.todayStatus === "ABSENT") acc.outToday += 1;
      return acc;
    }, { present: 0, half: 0, leave: 0, working: 0, presentToday: 0, halfToday: 0, outToday: 0 });
  }, [teamAttendance]);

  return (
    <Layout title="Manager Dashboard">
      <Box sx={{ display: "grid", gap: 3 }}>
        {err ? <Alert severity="error">{err}</Alert> : null}
        {ok ? <Alert severity="success">{ok}</Alert> : null}

        <DashboardHero
          eyebrow="Manager workspace"
          title="Team approvals and recommendation desk"
          subtitle="Review attendance corrections, route WFH and on-duty requests, and keep HR moving with clearer context from your team."
          right={
            <Box sx={{ display: "grid", gap: 1, minWidth: { xs: "100%", lg: 280 } }}>
              <TextField
                size="small"
                label="Search team or requests"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => refresh().catch((e: any) => setErr(e?.response?.data?.error ?? "Refresh failed"))}
              >
                Refresh dashboard
              </Button>
            </Box>
          }
        />

        <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Team size" value={team.length} helper="Direct report employees" icon={<GroupsIcon />} />
          <StatCard
            label="Pending corrections"
            value={pendingCorrections.length}
            helper={`${recommendedToday} for today`}
            icon={<PendingActionsIcon />}
            accent="#d97706"
          />
          <StatCard
            label="Work requests"
            value={pendingWorkRequests.length}
            helper="WFH and on-duty queue"
            icon={<WorkHistoryIcon />}
            accent="#0e7490"
          />
          <StatCard
            label="Queue health"
            value={queueItems.length}
            helper={queueItems.length ? "Needs manager action" : "All caught up"}
            icon={<InsightsIcon />}
            accent="#7c3aed"
          />
        </Box>

        <Box className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
          <AppCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Team overview
                </Typography>
                <Typography sx={{ opacity: 0.72, mt: 0.75, fontSize: 13 }}>
                  Open an employee card to review the role, office, and assignment context behind requests.
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${filteredTeam.length} visible`}
                sx={{ borderRadius: 1, fontWeight: 900 }}
              />
            </Box>
            <Box sx={{ mt: 2.5, display: "grid", gap: 1.25 }}>
              {filteredTeam.length ? (
                filteredTeam.map((employee) => (
                  <Box
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "48px 1fr auto",
                      gap: 1.25,
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "rgba(255,255,255,0.92)",
                      cursor: "pointer",
                    }}
                  >
                    <Avatar src={employee.companyRole?.photoUrl ?? undefined} sx={{ width: 44, height: 44 }}>
                      {employee.name[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {employee.name}
                      </Typography>
                      <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                        {employee.employeeNumber} | {employee.loginRole}
                      </Typography>
                      <Typography sx={{ opacity: 0.65, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {employee.companyRole?.name ?? "Unassigned role"} | {employee.assignedOfficeLocation?.officeName ?? "Default office"}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={(employee.status ?? "ACTIVE").replaceAll("_", " ")}
                      color={employee.status === "ACTIVE" ? "success" : "default"}
                      sx={{ borderRadius: 1, fontWeight: 900 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography sx={{ opacity: 0.72, fontSize: 13 }}>No team members match this search yet.</Typography>
              )}
            </Box>
          </AppCard>

          <AppCard>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Manager approval queue
                </Typography>
                <Typography sx={{ opacity: 0.72, mt: 0.75, fontSize: 13 }}>
                  One screen for corrections and work requests, with a side drawer for comments and action.
                </Typography>
              </Box>
              <Tabs
                value={queueTab}
                onChange={(_, value) => setQueueTab(value)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{ "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 900 } }}
              >
                <Tab value="ALL" label={`All (${pendingCorrections.length + pendingWorkRequests.length})`} />
                <Tab value="CORRECTION" label={`Corrections (${pendingCorrections.length})`} />
                <Tab value="WORK" label={`Work requests (${pendingWorkRequests.length})`} />
              </Tabs>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gap: 1 }}>
              {queueItems.length ? (
                queueItems.map((item) => (
                  <Box
                    key={`${item.kind}-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "130px 180px 1fr auto" },
                      gap: 1.2,
                      alignItems: "center",
                      p: 1.25,
                      borderRadius: 1.5,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <Chip
                      size="small"
                      label={item.kind === "CORRECTION" ? "Correction" : "Work request"}
                      color={item.kind === "CORRECTION" ? "warning" : "info"}
                      sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                        {item.employeeName}
                      </Typography>
                      <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                        {item.employeeNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{item.title}</Typography>
                      <Typography sx={{ opacity: 0.72, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.summary} | {item.reason}
                      </Typography>
                    </Box>
                    <Typography sx={{ opacity: 0.6, fontSize: 12 }}>
                      {item.createdAt ? dayjs(item.createdAt).format("DD MMM, hh:mm A") : "--"}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ opacity: 0.72, fontSize: 13 }}>No requests are waiting for manager action.</Typography>
              )}
            </Box>
          </AppCard>
        </Box>

        <AppCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Team attendance</Typography>
              <Typography sx={{ opacity: 0.72, mt: 0.75, fontSize: 13 }}>Today status with monthly attendance progress.</Typography>
            </Box>
            <TextField size="small" type="month" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.25, mb: 2 }}>
            {[
              ["Present today", attendanceTotals.presentToday, "#DCFCE7", "#166534"],
              ["Half day", attendanceTotals.halfToday, "#FEF3C7", "#92400E"],
              ["Out / leave", attendanceTotals.outToday, "#FEE2E2", "#991B1B"],
              ["Month coverage", attendanceTotals.working ? `${Math.round(((attendanceTotals.present + attendanceTotals.half * 0.5) / attendanceTotals.working) * 100)}%` : "0%", "#DBEAFE", "#1D4ED8"],
            ].map(([label, value, bg, color]) => (
              <Box key={String(label)} sx={{ borderRadius: 1.5, bgcolor: String(bg), p: 1.5, border: `1px solid ${String(color)}22` }}>
                <Typography sx={{ color: String(color), fontSize: 11, fontWeight: 900 }}>{label}</Typography>
                <Typography sx={{ color: String(color), fontSize: 24, fontWeight: 950 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "grid", gap: 1 }}>
            {teamAttendance.map((row) => {
              const presentPct = row.workingDays ? Math.min(100, Math.round((row.presentDays / row.workingDays) * 100)) : 0;
              const halfPct = row.workingDays ? Math.min(100 - presentPct, Math.round((row.halfDayDays / row.workingDays) * 100)) : 0;
              const leavePct = row.workingDays ? Math.min(100 - presentPct - halfPct, Math.round((row.leaveDays / row.workingDays) * 100)) : 0;
              return (
                <Box key={row.employeeId} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 120px 140px 1.2fr" }, gap: 1.25, alignItems: "center", p: 1.25, borderRadius: 1.5, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "#fff" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{row.employeeName}</Typography>
                    <Typography sx={{ opacity: 0.7, fontSize: 12 }}>{row.employeeNumber} | {row.office || "Default office"}</Typography>
                  </Box>
                  <Chip size="small" label={row.todayStatus.replaceAll("_", " ")} color={row.todayStatus === "PRESENT" ? "success" : row.todayStatus === "HALF_DAY" ? "warning" : "error"} sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }} />
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{row.inTime ?? "--"} - {row.outTime ?? "--"}</Typography>
                  <Box>
                    <Box sx={{ height: 8, borderRadius: 99, overflow: "hidden", bgcolor: "#F1F5F9", display: "flex", mb: 0.65 }}>
                      <Box sx={{ width: `${presentPct}%`, bgcolor: "#22C55E" }} />
                      <Box sx={{ width: `${halfPct}%`, bgcolor: "#F59E0B" }} />
                      <Box sx={{ width: `${leavePct}%`, bgcolor: "#EF4444" }} />
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>P {row.presentDays} | HD {row.halfDayDays} | L {row.leaveDays} / {row.workingDays}</Typography>
                  </Box>
                </Box>
              );
            })}
            {!teamAttendance.length ? <Typography sx={{ opacity: 0.72, fontSize: 13 }}>No team attendance available.</Typography> : null}
          </Box>
        </AppCard>
        <AppCard>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Manager action notes
          </Typography>
          <Typography sx={{ opacity: 0.72, mt: 0.75, fontSize: 13 }}>
            Keep remarks short and decision-ready so HR can approve faster and payroll disputes stay lower.
          </Typography>
          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            {[
              "Recommend attendance corrections with the operational reason, not just yes or no.",
              "Use work-request comments to confirm employee availability, office absence, or client-site travel.",
              "Open team cards regularly so office assignment and role routing stay accurate before requests pile up.",
            ].map((tip) => (
              <Box
                key={tip}
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "rgba(248,250,252,0.92)",
                }}
              >
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{tip}</Typography>
              </Box>
            ))}
          </Box>
        </AppCard>
      </Box>

      <Drawer anchor="right" open={!!selectedItem} onClose={() => setSelectedItem(null)}>
        <Box sx={{ width: 390, p: 2.25, display: "grid", gap: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>
            Request detail
          </Typography>
          {selectedItem ? (
            <>
              <Chip
                size="small"
                label={selectedItem.kind === "CORRECTION" ? "Attendance correction" : "Work request"}
                color={selectedItem.kind === "CORRECTION" ? "warning" : "info"}
                sx={{ borderRadius: 1, fontWeight: 900, justifySelf: "start" }}
              />
              <Typography sx={{ fontWeight: 950 }}>
                {selectedItem.employeeName} <span style={{ opacity: 0.62 }}>({selectedItem.employeeNumber})</span>
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{selectedItem.summary}</Typography>
              <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                <b>Reason:</b> {selectedItem.reason}
              </Typography>
              {"attachmentUrl" in selectedItem && selectedItem.attachmentUrl ? (
                <Button
                  component="a"
                  href={selectedItem.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                >
                  Open attachment{selectedItem.attachmentName ? `: ${selectedItem.attachmentName}` : ""}
                </Button>
              ) : null}
              <Divider />
              <TextField
                size="small"
                label="Manager remarks"
                value={remarks[selectedItem.id] ?? ""}
                onChange={(e) => setRemarks((prev) => ({ ...prev, [selectedItem.id]: e.target.value }))}
                multiline
                minRows={3}
              />
              {selectedItem.kind === "CORRECTION" ? (
                <Button
                  variant="contained"
                  onClick={() => recommendCorrection(selectedItem.id).catch((e) => setErr(e?.response?.data?.error ?? "Recommend failed"))}
                >
                  Recommend to HR
                </Button>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => recommendWorkRequest(selectedItem.id).catch((e) => setErr(e?.response?.data?.error ?? "Recommend failed"))}
                  >
                    Recommend
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => rejectWorkRequest(selectedItem.id).catch((e) => setErr(e?.response?.data?.error ?? "Reject failed"))}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </>
          ) : null}
        </Box>
      </Drawer>

      <Drawer anchor="right" open={!!selectedEmployee} onClose={() => setSelectedEmployee(null)}>
        <Box sx={{ width: 360, p: 2.25, display: "grid", gap: 1.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>
            Team member
          </Typography>
          {selectedEmployee ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 1.2, alignItems: "center" }}>
                <Avatar src={selectedEmployee.companyRole?.photoUrl ?? undefined} sx={{ width: 56, height: 56 }}>
                  {selectedEmployee.name[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>{selectedEmployee.name}</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                    {selectedEmployee.employeeNumber} | {selectedEmployee.loginRole}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13 }}>
                <b>Company role:</b> {selectedEmployee.companyRole?.name ?? "Unassigned"}
              </Typography>
              <Typography sx={{ fontSize: 13 }}>
                <b>Office:</b> {selectedEmployee.assignedOfficeLocation?.officeName ?? "Default office"}
              </Typography>
              <Typography sx={{ fontSize: 13 }}>
                <b>Status:</b> {(selectedEmployee.status ?? "ACTIVE").replaceAll("_", " ")}
              </Typography>
            </>
          ) : null}
        </Box>
      </Drawer>
    </Layout>
  );
}



