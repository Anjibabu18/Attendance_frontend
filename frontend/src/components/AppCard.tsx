import { Card, CardContent, type CardContentProps, type CardProps, type SxProps, type Theme } from "@mui/material";

const baseCardSx: SxProps<Theme> = {
  border: "1px solid rgba(203,213,225,0.9)",
  borderRadius: 1,
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))",
  boxShadow: "0 10px 28px rgba(15,23,42,0.07)",
  position: "relative",
  overflow: "hidden",
  transition: "border-color .16s ease, box-shadow .16s ease, transform .16s ease",
  "&:hover": {
    borderColor: "#cbd5e1",
    boxShadow: "0 16px 38px rgba(15,23,42,0.10)",
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
          { p: { xs: 2.25, md: 3 }, "&:last-child": { pb: { xs: 2.25, md: 3 } } },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </CardContent>
    </Card>
  );
}
