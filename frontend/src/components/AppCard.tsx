import { Card, CardContent, type CardContentProps, type CardProps, type SxProps, type Theme } from "@mui/material";

const baseCardSx: SxProps<Theme> = {
  border: "1px solid rgba(203,213,225,0.9)",
  borderRadius: 1,
  background: "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.96))",
  boxShadow: "0 12px 30px rgba(15,23,42,0.075)",
  position: "relative",
  overflow: "hidden",
  animation: "attendanceFadeUp .34s cubic-bezier(.2,.8,.2,1) both",
  transition: "border-color .2s ease, box-shadow .2s ease, transform .2s cubic-bezier(.2,.8,.2,1), background-color .2s ease",
  "&:hover": {
    borderColor: "#bfdbfe",
    boxShadow: "0 18px 44px rgba(15,23,42,0.105)",
    transform: "translateY(-2px)",
  },
};

export default function AppCard(
  props: CardProps & { children: React.ReactNode; contentProps?: CardContentProps; contentSx?: SxProps<Theme> },
) {
  const { children, sx, contentProps, contentSx, ...rest } = props;
  const mergedSx = Array.isArray(sx) ? [baseCardSx, ...sx] : [baseCardSx, sx];

  return (
    <Card elevation={0} {...rest} sx={mergedSx}>
      <CardContent
        {...contentProps}
        sx={[
          { p: { xs: 1.6, sm: 2.25, md: 3 }, "&:last-child": { pb: { xs: 1.6, sm: 2.25, md: 3 } } },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </CardContent>
    </Card>
  );
}
