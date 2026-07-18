import { alpha, ThemeOptions } from "@mui/material";

export const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary:   { main: "#0F172A", dark: "#020617", light: "#334155" }, // Sleek dark primary
          secondary: { main: "#3B82F6", dark: "#2563EB", light: "#60A5FA" }, // Vibrant blue secondary
          info:      { main: "#6366F1" }, // Indigo
          success:   { main: "#10B981", light: "#34D399" }, // Emerald
          error:     { main: "#EF4444", light: "#F87171" }, // Rose
          warning:   { main: "#F59E0B", light: "#FBBF24" }, // Amber
          background: {
            default: "transparent", // Background handled by index.css gradient
            paper:   "rgba(255, 255, 255, 0.65)", // Glass card
          },
          text: {
            primary:   "#0F172A",
            secondary: "#475569",
          },
          divider: 'rgba(15, 23, 42, 0.08)',
        }
      : {
          primary:   { main: "#F8FAFC", dark: "#E2E8F0", light: "#FFFFFF" },
          secondary: { main: "#38BDF8", dark: "#0284C7", light: "#7DD3FC" }, // Electric blue
          info:      { main: "#818CF8" },
          success:   { main: "#34D399", light: "#6EE7B7" },
          error:     { main: "#F87171", light: "#FCA5A5" },
          warning:   { main: "#FBBF24", light: "#FCD34D" },
          background: {
            default: "transparent",
            paper:   "rgba(10, 14, 28, 0.45)", // Deeper, more translucent dark glass
          },
          text: {
            primary:   "#F8FAFC",
            secondary: "#94A3B8",
          },
          divider: 'rgba(255, 255, 255, 0.08)',
        }),
  },
  shape: { borderRadius: 24 }, // Extra rounded for premium feel
  typography: {
    fontFamily: '"Outfit", "Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        body: {
          margin: 0,
          minHeight: "100vh",
          textRendering: "geometricPrecision",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backdropFilter: 'blur(32px) saturate(140%)',
          WebkitBackdropFilter: 'blur(32px) saturate(140%)',
          border: theme.palette.mode === 'light' 
            ? `1px solid ${theme.palette.divider}` 
            : `1px solid rgba(255,255,255,0.06)`,
          borderTop: theme.palette.mode === 'light' 
            ? `1px solid ${theme.palette.divider}` 
            : `1px solid rgba(255,255,255,0.12)`,
          boxShadow: theme.palette.mode === 'light' 
            ? '0 8px 32px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.02)'
            : '0 12px 40px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shape buttons
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: ({ theme }) => ({
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
            transform: 'translateY(-2px)',
          },
        }),
        outlined: ({ theme }) => ({
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          overflow: 'hidden',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 32,
          padding: 8,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            transform: 'translateY(-2px)',
          }
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});
