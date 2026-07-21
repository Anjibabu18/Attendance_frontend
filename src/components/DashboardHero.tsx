import { Box, Chip, Typography } from "@mui/material";

export default function DashboardHero(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        borderRadius: 1.5,
        p: '2px', // Space for gradient border
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.5), rgba(16, 185, 129, 0.4), rgba(139, 92, 246, 0.4))',
        backgroundSize: '200% 200%',
        animation: 'rotateMesh 10s ease infinite, fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        boxShadow: (theme) => theme.palette.mode === 'light' ? "0 20px 40px rgba(37,99,235,0.06), 0 1px 3px rgba(0,0,0,0.05)" : "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
      }}
    >
      <Box
        sx={{
          borderRadius: 1.4,
          background: (theme) => theme.palette.mode === 'light' ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.75)",
          backdropFilter: "blur(24px) saturate(180%)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 2 },
            gridTemplateColumns: { xs: "1fr", lg: props.right ? "minmax(0,1fr) auto" : "1fr" },
            alignItems: "center",
            px: { xs: 1.5, sm: 2.25, md: 3 },
            py: { xs: 1.75, md: 2.25 },
            borderBottom: props.children ? "1px solid rgba(203,213,225,0.4)" : "none",
            background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.02) 46%, transparent 100%)",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              label={props.eyebrow}
              sx={{
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                color: "#ffffff",
                fontWeight: 900,
                textTransform: "uppercase",
                borderRadius: 1.5,
                height: 26,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
            />
            <Typography sx={{ mt: 1, fontSize: { xs: 26, sm: 30, md: 36 }, lineHeight: 1.1, fontWeight: 900, background: "linear-gradient(90deg, #0f172a, #334155)", WebkitBackgroundClip: "text", WebkitTextFillColor: (theme) => theme.palette.mode === 'light' ? "transparent" : "#fff" }}>
              {props.title}
            </Typography>
            <Typography sx={{ mt: 0.75, color: "text.secondary", maxWidth: 760, fontSize: { xs: 13, md: 15 }, lineHeight: { xs: 1.45, md: 1.55 } }}>
              {props.subtitle}
            </Typography>
          </Box>
          {props.right ? <Box sx={{ justifySelf: { xs: "stretch", lg: "end" } }}>{props.right}</Box> : null}
        </Box>
        {props.children ? <Box sx={{ px: { xs: 1.5, sm: 2.25, md: 3 }, py: { xs: 1.25, md: 1.75 }, background: (theme) => theme.palette.mode === 'light' ? "rgba(248, 250, 252, 0.6)" : "transparent" }}>{props.children}</Box> : null}
      </Box>
    </Box>
  );
}
