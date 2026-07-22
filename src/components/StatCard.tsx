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
        background: (theme) => theme.palette.mode === 'light' ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.6)",
        backdropFilter: "blur(20px) saturate(160%)",
        border: (theme) => theme.palette.mode === 'light' ? "1px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        p: { xs: 2.5, md: 3 },
        boxShadow: (theme) => theme.palette.mode === 'light' 
          ? "0 10px 30px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)" 
          : "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "default",
        animation: "fadeSlideUp 0.5s ease backwards",
        
        // Gradient bottom accent bar
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          borderRadius: "0 0 20px 20px",
          transform: "scaleX(0.2)",
          opacity: 0,
          transformOrigin: "center",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s",
        },
        
        // Glow background blob
        "&::before": {
          content: '""',
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}1A 0%, transparent 70%)`,
          transition: "transform 0.4s ease, opacity 0.4s ease",
          opacity: 0,
          transform: "scale(0.3)",
        },
        
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.palette.mode === 'light' 
            ? `0 20px 40px rgba(15,23,42,0.08), 0 4px 12px ${accent}20`
            : `0 20px 40px rgba(0,0,0,0.6), 0 4px 12px ${accent}30`,
          borderColor: `${accent}40`,
          "&::after": { transform: "scaleX(1)", opacity: 1 },
          "&::before": { opacity: 1, transform: "scale(1.5)" },
          "& .stat-icon-box": {
            transform: "scale(1.1) rotate(-4deg)",
            boxShadow: `0 12px 28px ${accent}40`,
            bgcolor: `${accent}15`,
          },
          "& .stat-value": {
            color: accent,
          },
        },
        ...((Array.isArray(props.sx) ? Object.assign({}, ...props.sx) : props.sx) ?? {}),
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, position: "relative", zIndex: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {props.label}
          </Typography>
          <Typography
            className="stat-value"
            sx={{
              mt: 1.25,
              fontSize: { xs: 30, md: 38 },
              lineHeight: 1,
              fontWeight: 900,
              color: (theme) => theme.palette.mode === 'light' ? "#0f172a" : "#f8fafc",
              wordBreak: "break-word",
              fontVariantNumeric: "tabular-nums",
              transition: "color 0.3s ease",
            }}
          >
            {props.value}
          </Typography>
        </Box>

        {props.icon && (
          <Box
            className="stat-icon-box"
            sx={{
              width: { xs: 44, md: 52 },
              height: { xs: 44, md: 52 },
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}0A`,
              border: `1px solid ${accent}25`,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${accent}10`,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {props.icon}
          </Box>
        )}
      </Box>

      <Typography
        sx={{
          mt: 2,
          color: "text.secondary",
          fontSize: 13,
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
