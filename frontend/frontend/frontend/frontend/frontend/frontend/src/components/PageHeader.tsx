import { Box, Typography } from "@mui/material";

export default function PageHeader(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Box>
        {props.eyebrow ? (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.6,
              borderRadius: 1.5,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontSize: 12,
              fontWeight: 900,
              color: "text.secondary",
              mb: 1.5,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
            {props.eyebrow}
          </Box>
        ) : null}
        <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: 0 }}>
          {props.title}
        </Typography>
        {props.subtitle ? (
          <Typography sx={{ color: "text.secondary", mt: 0.5, maxWidth: 780, fontSize: 14 }}>{props.subtitle}</Typography>
        ) : null}
      </Box>
      {props.right ? <Box sx={{ flexShrink: 0 }}>{props.right}</Box> : null}
    </Box>
  );
}
