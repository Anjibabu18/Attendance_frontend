import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

// P = Present, HD = Half day, L = Leave/Absent, H = Holiday
export type DayStatus = "P" | "HD" | "L" | "H" | "";

const STATUS_CFG = {
  P:  { bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", border: "#86efac", text: "#15803d", dot: "#16a34a",  label: "P" },
  HD: { bg: "linear-gradient(135deg,#fef9c3,#fde68a)", border: "#fcd34d", text: "#92400e", dot: "#f59e0b",  label: "HD" },
  H:  { bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", border: "#c4b5fd", text: "#5b21b6", dot: "#7c3aed",  label: "H" },
  L:  { bg: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "#fca5a5", text: "#991b1b", dot: "#dc2626",  label: "L" },
  "": { bg: "#ffffff",                                  border: "#e2e8f0", text: "#94a3b8", dot: "transparent", label: "" },
};

export default function MonthCalendar(props: {
  month: string;
  statusByDate: Record<string, DayStatus>;
  selectedDate?: string;
  onDayClick?: (date: string) => void;
}) {
  const first = dayjs(`${props.month}-01`);
  const daysInMonth = first.daysInMonth();
  const startDow = first.day();
  const today = dayjs().format("YYYY-MM-DD");

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: Array<{ date: string | null; status: DayStatus }> = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, status: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = first.date(d).format("YYYY-MM-DD");
    cells.push({ date, status: props.statusByDate[date] ?? "" });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, status: "" });

  return (
    <Box>
      {/* Day labels */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: { xs: 0.5, sm: 0.75 }, mb: 1 }}>
        {labels.map((l) => (
          <Typography
            key={l}
            sx={{
              fontSize: { xs: 9.5, sm: 11 },
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "text.secondary",
              opacity: 0.7,
              py: 0.5,
            }}
          >
            {l}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: { xs: 0.5, sm: 0.75 } }}>
        {cells.map((c, idx) => {
          const day = c.date ? dayjs(c.date).date() : null;
          const cfg = STATUS_CFG[c.status] ?? STATUS_CFG[""];
          const selected = !!(c.date && props.selectedDate && c.date === props.selectedDate);
          const isToday = c.date === today;
          const clickable = !!(c.date && props.onDayClick);

          return (
            <Box
              key={idx}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={() => { if (clickable) props.onDayClick!(c.date!); }}
              onKeyDown={(e) => {
                if (!clickable) return;
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onDayClick!(c.date!); }
              }}
              sx={{
                height: { xs: 48, sm: 68, md: 80 },
                borderRadius: { xs: 1.5, sm: 2.5 },
                border: selected
                  ? "2px solid #4f46e5"
                  : `1px solid ${c.date ? cfg.border : "transparent"}`,
                background: c.date
                  ? selected
                    ? "linear-gradient(135deg, #eff6ff, #e0e7ff)"
                    : cfg.bg
                  : "transparent",
                p: { xs: "5px 4px", sm: "8px 8px" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: clickable ? "pointer" : "default",
                userSelect: "none",
                position: "relative",
                overflow: "hidden",
                boxShadow: selected
                  ? "0 0 0 3px rgba(79,70,229,0.15), 0 4px 14px rgba(79,70,229,0.15)"
                  : c.date && c.status
                    ? "0 2px 8px rgba(15,23,42,0.06)"
                    : "none",
                transition: "all 0.18s cubic-bezier(0.2,0.8,0.2,1)",
                "&:hover": clickable ? {
                  transform: "translateY(-2px) scale(1.03)",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.10)",
                  borderColor: "#6366f1",
                  zIndex: 1,
                } : {},
                // Today highlight ring
                ...(isToday && !selected ? {
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    border: "2px solid rgba(99,102,241,0.5)",
                    pointerEvents: "none",
                  },
                } : {}),
              }}
            >
              {c.date ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.25 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: 10, sm: 12 },
                        fontWeight: isToday ? 900 : 700,
                        color: selected ? "#4f46e5" : isToday ? "#4f46e5" : "#475569",
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </Typography>
                    {isToday && (
                      <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#4f46e5", flexShrink: 0 }} />
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                    {c.status && (
                      <Box
                        sx={{
                          px: { xs: 0.5, sm: 0.75 },
                          py: { xs: 0.15, sm: 0.25 },
                          borderRadius: 1,
                          bgcolor: `${cfg.dot}20`,
                          border: `1px solid ${cfg.dot}40`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: 8, sm: 10, md: 11 },
                            fontWeight: 900,
                            color: cfg.text,
                            lineHeight: 1,
                          }}
                        >
                          {cfg.label}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
