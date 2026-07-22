import { Box, Typography, type SxProps, type Theme } from "@mui/material";

export default function StatCard(props: {
  label: string;
  value: React.ReactNode;
  helper: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
  sx?: SxProps<Theme>;
}) {
  const accent = props.accent ?? "#2563eb";

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.98)",
        border: "1px solid rgba(226,232,240,0.8)",
        borderRadius: "16px",
        p: { xs: 2, md: 2.5 },
        boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
        transition: "all 0.25s cubic-bezier(0.2,0.8,0.2,1)",
        cursor: "default",
        // Gradient bottom accent bar
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}80, ${accent})`,
          borderRadius: "0 0 16px 16px",
          transform: "scaleX(0.4)",
          transformOrigin: "left",
          transition: "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)",
        },
        // Glow background blob
        "&::before": {
          content: '""',
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
          transition: "transform 0.3s ease, opacity 0.3s ease",
          opacity: 0,
          transform: "scale(0.5)",
        },
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 16px 40px rgba(15,23,42,0.10), 0 4px 12px ${accent}18`,
          borderColor: `${accent}40`,
          "&::after": { transform: "scaleX(1)" },
          "&::before": { opacity: 1, transform: "scale(1.5)" },
          "& .stat-icon-box": {
            transform: "scale(1.12) rotate(-6deg)",
            boxShadow: `0 8px 24px ${accent}30`,
          },
          "& .stat-value": {
            color: accent,
          },
        },
        ...((Array.isArray(props.sx) ? Object.assign({}, ...props.sx) : props.sx) ?? {}),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, position: "relative", zIndex: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {props.label}
          </Typography>
          <Typography
            className="stat-value"
            sx={{
              mt: 1,
              fontSize: { xs: 26, md: 32 },
              lineHeight: 1,
              fontWeight: 900,
              color: "#0f172a",
              wordBreak: "break-word",
              fontVariantNumeric: "tabular-nums",
              transition: "color 0.25s ease",
            }}
          >
            {props.value}
          </Typography>
          {/* Animated underline */}
          <Box
            sx={{
              mt: 1.25,
              width: 36,
              height: 3,
              borderRadius: 99,
              background: `linear-gradient(90deg, ${accent}60, ${accent})`,
              transition: "width 0.35s cubic-bezier(0.2,0.8,0.2,1)",
            }}
          />
        </Box>

        {props.icon && (
          <Box
            className="stat-icon-box"
            sx={{
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}10`,
              border: `1.5px solid ${accent}20`,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${accent}15`,
              transition: "transform 0.25s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.25s ease",
            }}
          >
            {props.icon}
          </Box>
        )}
      </Box>

      <Typography
        sx={{
          mt: 1.5,
          color: "text.secondary",
          fontSize: 12.5,
          lineHeight: 1.5,
          fontWeight: 500,
          position: "relative",
          zIndex: 1,
        }}
      >
        {props.helper}
      </Typography>
    </Box>
  );
}
