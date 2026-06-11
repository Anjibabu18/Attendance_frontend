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
        border: "1px solid rgba(203,213,225,0.95)",
        borderRadius: 1.5,
        background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
        boxShadow: "0 22px 60px rgba(15,23,42,0.12)",
        overflow: "hidden",
        position: "relative",
        "&:before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: "linear-gradient(180deg, #2563eb, #0f766e)",
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: props.right ? "minmax(0,1fr) auto" : "1fr" },
          alignItems: "center",
          px: { xs: 2.5, md: 4 },
          py: { xs: 2.5, md: 3.5 },
          borderBottom: props.children ? "1px solid #edf1f7" : "none",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.13), rgba(15,118,110,0.08) 42%, rgba(255,255,255,0.78) 78%)",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Chip
            size="small"
            label={props.eyebrow}
            sx={{
              bgcolor: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 900,
              textTransform: "uppercase",
              borderRadius: 1,
              height: 26,
            }}
          />
          <Typography sx={{ mt: 0.8, fontSize: { xs: 27, md: 36 }, lineHeight: 1.06, fontWeight: 950 }}>
            {props.title}
          </Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 760, fontSize: 15, lineHeight: 1.65 }}>
            {props.subtitle}
          </Typography>
        </Box>
        {props.right ? <Box sx={{ justifySelf: { xs: "stretch", lg: "end" } }}>{props.right}</Box> : null}
      </Box>
      {props.children ? <Box sx={{ px: { xs: 2.5, md: 4 }, py: 2.25, bgcolor: "#fbfdff" }}>{props.children}</Box> : null}
    </Box>
  );
}
