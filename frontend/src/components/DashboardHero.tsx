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
        borderRadius: 1.25,
        background: "#ffffff",
        boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
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
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: { xs: "1fr", lg: props.right ? "minmax(0,1fr) auto" : "1fr" },
          alignItems: "center",
          px: { xs: 1.5, sm: 2.25, md: 3 },
          py: { xs: 1.75, md: 2.25 },
          borderBottom: props.children ? "1px solid #edf1f7" : "none",
          background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(15,118,110,0.04) 46%, rgba(255,255,255,0.92) 100%)",
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
          <Typography sx={{ mt: 0.7, fontSize: { xs: 23, sm: 27, md: 32 }, lineHeight: 1.08, fontWeight: 950 }}>
            {props.title}
          </Typography>
          <Typography sx={{ mt: 0.75, color: "text.secondary", maxWidth: 760, fontSize: { xs: 13, md: 14 }, lineHeight: { xs: 1.45, md: 1.55 } }}>
            {props.subtitle}
          </Typography>
        </Box>
        {props.right ? <Box sx={{ justifySelf: { xs: "stretch", lg: "end" } }}>{props.right}</Box> : null}
      </Box>
      {props.children ? <Box sx={{ px: { xs: 1.5, sm: 2.25, md: 3 }, py: { xs: 1.25, md: 1.75 }, bgcolor: "#fbfdff" }}>{props.children}</Box> : null}
    </Box>
  );
}
