import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import AppCard from "./AppCard";

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
    <AppCard
      contentSx={{ p: { xs: 1.5, md: 2.25 }, "&:last-child": { pb: { xs: 1.5, md: 2.25 } } }}
      sx={[
        {
          "&:after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            bgcolor: accent,
            opacity: 0.9,
          },
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {props.label}
          </Typography>
          <Typography sx={{ mt: 0.9, fontSize: { xs: 25, md: 30 }, lineHeight: 1, fontWeight: 950, color: accent, wordBreak: "break-word" }}>
            {props.value}
          </Typography>
          <Box sx={{ mt: 1, width: 44, height: 3, borderRadius: 99, bgcolor: accent }} />
        </Box>
        {props.icon ? (
          <Box
            sx={{
              width: { xs: 36, md: 42 },
              height: { xs: 36, md: 42 },
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}16`,
              border: `1px solid ${accent}26`,
              boxShadow: `0 10px 22px ${accent}18`,
              flexShrink: 0,
              transition: "transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease",
              ".MuiCard-root:hover &": {
                transform: "scale(1.06) rotate(-2deg)",
                boxShadow: `0 14px 30px ${accent}24`,
              },
            }}
          >
            {props.icon}
          </Box>
        ) : null}
      </Box>
      <Typography sx={{ mt: 1.2, color: "text.secondary", fontSize: 13, lineHeight: 1.45 }}>{props.helper}</Typography>
    </AppCard>
  );
}
