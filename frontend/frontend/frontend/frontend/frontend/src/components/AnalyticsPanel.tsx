import { Box, Typography } from "@mui/material";
import AppCard from "./AppCard";

type Analytics = Record<string, any>;

const labels: Record<string, string> = {
  employees: "Employees",
  presentEntries: "Present",
  halfDayEntries: "Half day",
  leaveEntries: "Leave",
  lateMinutes: "Late minutes",
  overtimeMinutes: "Overtime minutes",
};

const colors: Record<string, string> = {
  employees: "#2563eb",
  presentEntries: "#16a34a",
  halfDayEntries: "#b45309",
  leaveEntries: "#dc2626",
  lateMinutes: "#7c3aed",
  overtimeMinutes: "#0f766e",
};

export default function AnalyticsPanel(props: { title: string; subtitle?: string; analytics: Analytics }) {
  const entries = Object.entries(props.analytics);
  const max = Math.max(1, ...entries.map(([, value]) => Number(value) || 0));

  return (
    <AppCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {props.title}
          </Typography>
          {props.subtitle ? (
            <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: 13 }}>{props.subtitle}</Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ mt: 2.5, display: "grid", gap: 1.2 }}>
        {entries.map(([key, raw]) => {
          const value = Number(raw) || 0;
          const color = colors[key] ?? "#2563eb";
          return (
            <Box key={key} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "150px 1fr 70px" }, gap: 1.2, alignItems: "center" }}>
              <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 800 }}>
                {labels[key] ?? key}
              </Typography>
              <Box sx={{ height: 10, borderRadius: 1, bgcolor: "#eef2f7", overflow: "hidden" }}>
                <Box sx={{ width: `${Math.max(6, (value / max) * 100)}%`, height: "100%", bgcolor: color }} />
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 950, color, textAlign: { xs: "left", sm: "right" } }}>
                {String(raw)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </AppCard>
  );
}
