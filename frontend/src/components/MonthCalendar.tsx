import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

// P = Present, HD = Half day, L = Leave/Absent, H = Holiday
export type DayStatus = "P" | "HD" | "L" | "H" | "";

export default function MonthCalendar(props: {
  month: string; // YYYY-MM
  statusByDate: Record<string, DayStatus>; // YYYY-MM-DD => P/HD/L/H
  selectedDate?: string; // YYYY-MM-DD
  onDayClick?: (date: string) => void;
}) {
  const first = dayjs(`${props.month}-01`);
  const daysInMonth = first.daysInMonth();
  const startDow = first.day(); // 0=Sun

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: Array<{ date: string | null; status: DayStatus }> = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, status: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = first.date(d).format("YYYY-MM-DD");
    const status = props.statusByDate[date] ?? "";
    cells.push({ date, status });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, status: "" });

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: { xs: 0.35, sm: 0.75 }, mb: 1 }}>
        {labels.map((l) => (
          <Typography
            key={l}
            sx={{
              fontSize: { xs: 10, sm: 12 },
              opacity: 0.72,
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            {l}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: { xs: 0.35, sm: 0.75 } }}>
        {cells.map((c, idx) => {
          const day = c.date ? dayjs(c.date).date() : "";
          const bg =
            c.status === "P"
              ? "#ecfdf3"
              : c.status === "HD"
                ? "#fffaeb"
              : c.status === "H"
                ? "#eef2ff"
              : c.status === "L"
                ? "#fef3f2"
                : "#ffffff";
          const border =
            c.status === "P"
              ? "1px solid #bbf7d0"
              : c.status === "HD"
                ? "1px solid #fedf89"
              : c.status === "H"
                ? "1px solid #c7d2fe"
              : c.status === "L"
                ? "1px solid #fecaca"
                : "1px solid #e5e7eb";
          const letterColor =
            c.status === "P"
              ? "success.main"
              : c.status === "HD"
                ? "warning.main"
              : c.status === "H"
                ? "secondary.main"
              : c.status === "L"
                  ? "error.main"
                  : "text.secondary";
          const selected = !!(c.date && props.selectedDate && c.date === props.selectedDate);
          return (
            <Box
              key={idx}
              role={c.date && props.onDayClick ? "button" : undefined}
              tabIndex={c.date && props.onDayClick ? 0 : undefined}
              onClick={() => {
                if (c.date && props.onDayClick) props.onDayClick(c.date);
              }}
              onKeyDown={(event) => {
                if (!c.date || !props.onDayClick) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onDayClick(c.date);
                }
              }}
              sx={{
                height: { xs: 44, sm: 62, md: 74 },
                borderRadius: { xs: 1, sm: 2 },
                border,
                background: bg,
                p: { xs: 0.55, sm: 1 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                outline: selected ? "2px solid #2563eb" : "none",
                outlineOffset: selected ? 1 : 0,
                cursor: c.date && props.onDayClick ? "pointer" : "default",
                userSelect: "none",
                boxShadow: "none",
                transition: "border-color 120ms ease, background-color 120ms ease",
                "&:hover":
                  c.date && props.onDayClick
                    ? { borderColor: "#2563eb" }
                    : undefined,
              }}
            >
              <Typography sx={{ fontSize: { xs: 10, sm: 12 }, fontWeight: 900, opacity: 0.86 }}>{day}</Typography>
              <Typography sx={{ fontSize: { xs: 12, sm: 16, md: 18 }, fontWeight: 900, textAlign: "right", color: letterColor }}>
                {c.date ? c.status : ""}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
