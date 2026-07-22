import { Card, CardContent, type CardContentProps, type CardProps, type SxProps, type Theme } from "@mui/material";

const baseCardSx = (theme: Theme): SxProps<Theme> => ({
  border: theme.palette.mode === 'light' ? "1px solid rgba(226,232,240,0.8)" : "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px !important",
  background: theme.palette.mode === 'light' ? "rgba(255,255,255,0.98)" : "rgba(15,23,42,0.75)",
  backdropFilter: theme.palette.mode === 'dark' ? "blur(24px) saturate(180%)" : "none",
  boxShadow: theme.palette.mode === 'light' 
    ? "0 4px 20px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)"
    : "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08)",
  position: "relative",
  overflow: "hidden",
  animation: "attendanceFadeUp 0.40s cubic-bezier(0.2,0.8,0.2,1) both",
  transition:
    "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.2,0.8,0.2,1)",
  // Shimmer top bar on hover
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0) 20%, rgba(99,102,241,0.5) 50%, rgba(99,102,241,0) 80%, transparent 100%)",
    backgroundSize: "200% 100%",
    opacity: 0,
    transition: "opacity 0.3s ease",
    backgroundPosition: "-200% 0",
  },
  "&:hover": {
    borderColor: theme.palette.mode === 'light' ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.4)",
    boxShadow: theme.palette.mode === 'light' 
      ? "0 12px 40px rgba(15,23,42,0.10), 0 4px 12px rgba(99,102,241,0.08)"
      : "0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(99,102,241,0.15), inset 0 1px 1px rgba(255,255,255,0.1)",
    transform: "translateY(-2px)",
    "&::before": {
      opacity: 1,
      animation: "shimmer 1.5s ease infinite",
    },
  },
});

export default function AppCard(
  props: CardProps & { children: React.ReactNode; contentProps?: CardContentProps; contentSx?: SxProps<Theme> },
) {
  const { children, sx, contentProps, contentSx, ...rest } = props;
  const mergedSx = Array.isArray(sx) ? [(theme: Theme) => baseCardSx(theme), ...sx] : [(theme: Theme) => baseCardSx(theme), sx];

  return (
    <Card elevation={0} {...rest} sx={mergedSx}>
      <CardContent
        {...contentProps}
        sx={[
          { p: { xs: 2, sm: 2.5, md: 3 }, "&:last-child": { pb: { xs: 2, sm: 2.5, md: 3 } } },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </CardContent>
    </Card>
  );
}
