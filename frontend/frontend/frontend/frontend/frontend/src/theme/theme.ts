import { createTheme, alpha, ThemeOptions } from "@mui/material";

export const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // LIGHT MODE
          primary:   { main: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
          secondary: { main: "#0f766e", dark: "#0d6660", light: "#14b8a6" },
          info:      { main: "#6366f1" },
          success:   { main: "#16a34a", light: "#22c55e" },
          error:     { main: "#dc2626", light: "#ef4444" },
          warning:   { main: "#d97706", light: "#f59e0b" },
          background: {
            default: "#f0f4ff",
            paper:   "#ffffff",
          },
          text: {
            primary:   "#0f172a",
            secondary: "#64748b",
          },
          divider: 'rgba(226,232,240,0.6)',
        }
      : {
          // DARK MODE
          primary:   { main: "#3b82f6", dark: "#2563eb", light: "#60a5fa" },
          secondary: { main: "#14b8a6", dark: "#0f766e", light: "#5eead4" },
          info:      { main: "#818cf8" },
          success:   { main: "#22c55e", light: "#4ade80" },
          error:     { main: "#ef4444", light: "#f87171" },
          warning:   { main: "#f59e0b", light: "#fbbf24" },
          background: {
            default: "#0B1120", // Deep modern dark
            paper:   "#1E293B", // Slightly lighter for cards
          },
          text: {
            primary:   "#f8fafc",
            secondary: "#94a3b8",
          },
          divider: 'rgba(255,255,255,0.1)',
        }),
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter","Aptos","Segoe UI",system-ui,sans-serif',
    h4: { fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontWeight: 800, letterSpacing: -0.2 },
    h6: { fontWeight: 800, letterSpacing: -0.1 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        body: {
          minHeight: "100vh",
          textRendering: "geometricPrecision",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          minHeight: 38,
          fontWeight: 700,
          letterSpacing: "0.01em",
          transition:
            "transform 0.2s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
          "&:hover": { transform: "translateY(-1.5px)" },
          "&:active": { transform: "translateY(1px)" },
        },
        contained: {
          boxShadow: "none",
          background: mode === 'light' ? "linear-gradient(150deg, #3b82f6 0%, #2563eb 100%)" : "linear-gradient(150deg, #60a5fa 0%, #3b82f6 100%)",
          color: '#ffffff',
          "&:hover": {
            boxShadow: mode === 'light' ? "0 8px 24px rgba(37,99,235,0.28)" : "0 8px 24px rgba(59,130,246,0.25)",
            background: mode === 'light' ? "linear-gradient(150deg, #60a5fa 0%, #3b82f6 100%)" : "linear-gradient(150deg, #93c5fd 0%, #60a5fa 100%)",
          },
          "&:disabled": { opacity: 0.55 },
        },
        outlined: {
          borderColor: mode === 'light' ? "#cbd5e1" : "rgba(255,255,255,0.15)",
          backgroundColor: mode === 'light' ? "rgba(255,255,255,0.85)" : "rgba(30,41,59,0.85)",
          backdropFilter: "blur(8px)",
          color: mode === 'light' ? '#0f172a' : '#f8fafc',
          "&:hover": {
            borderColor: mode === 'light' ? "#94a3b8" : "rgba(255,255,255,0.3)",
            backgroundColor: mode === 'light' ? "#f8fafc" : "#334155",
            boxShadow: mode === 'light' ? "0 4px 14px rgba(15,23,42,0.08)" : "0 4px 14px rgba(0,0,0,0.4)",
          },
        },
        text: {
          "&:hover": { backgroundColor: mode === 'light' ? "rgba(37,99,235,0.06)" : "rgba(96,165,250,0.1)" },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 12,
          transition: "all 0.2s ease",
          "&:hover": { filter: "brightness(0.95)" },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: mode === 'light' ? "rgba(255,255,255,0.9)" : "rgba(30,41,59,0.5)",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === 'light' ? "#2563eb" : "#3b82f6",
            borderWidth: 2,
            boxShadow: mode === 'light' ? "0 0 0 3px rgba(37,99,235,0.10)" : "0 0 0 3px rgba(59,130,246,0.15)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === 'light' ? "#94a3b8" : "#94a3b8",
          },
          "&.Mui-focused": {
            background: mode === 'light' ? "#ffffff" : "#1e293b",
          },
        },
        notchedOutline: {
          borderColor: mode === 'light' ? "#dde3ee" : "rgba(255,255,255,0.15)",
          transition: "border-color 0.2s ease",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 13.5 },
      },
    },

    MuiTextField: {
      defaultProps: { size: "small" },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: mode === 'light' ? "0 4px 20px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)" : "0 4px 20px rgba(0,0,0,0.4)",
        },
        elevation2: {
          boxShadow: mode === 'light' ? "0 8px 32px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.05)" : "0 8px 32px rgba(0,0,0,0.6)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
          "&:hover": { backgroundColor: mode === 'light' ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.04)" },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: mode === 'light' ? "rgba(226,232,240,0.7)" : "rgba(255,255,255,0.1)" },
        head: { fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? "#0f172a" : "#cbd5e1",
          color: mode === 'light' ? "#fff" : "#0f172a",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        },
        arrow: { color: mode === 'light' ? "#0f172a" : "#cbd5e1" },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 13.5,
          border: `1px solid ${mode === 'light' ? alpha("#94a3b8", 0.22) : alpha("#fff", 0.1)}`,
          backdropFilter: "blur(8px)",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: mode === 'light' ? "1px solid rgba(226,232,240,0.7)" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: mode === 'light' ? "0 32px 80px rgba(15,23,42,0.20), 0 8px 24px rgba(15,23,42,0.10)" : "0 32px 80px rgba(0,0,0,0.8)",
          backdropFilter: "blur(24px)",
          overflow: "hidden",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? "rgba(15,23,42,0.5)" : "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 800, fontSize: 18 },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: mode === 'light' ? "rgba(226,232,240,0.6)" : "rgba(255,255,255,0.1)" },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, backgroundColor: mode === 'light' ? "rgba(226,232,240,0.6)" : "rgba(255,255,255,0.1)" },
        bar: { borderRadius: 99 },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: mode === 'light' ? "1px solid rgba(226,232,240,0.8)" : "1px solid rgba(255,255,255,0.15)",
          boxShadow: mode === 'light' ? "0 16px 48px rgba(15,23,42,0.14)" : "0 16px 48px rgba(0,0,0,0.6)",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 6px",
          fontWeight: 600,
          "&:hover": { backgroundColor: mode === 'light' ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.06)" },
          "&.Mui-selected": {
            backgroundColor: mode === 'light' ? "rgba(37,99,235,0.08)" : "rgba(59,130,246,0.15)",
            "&:hover": { backgroundColor: mode === 'light' ? "rgba(37,99,235,0.12)" : "rgba(59,130,246,0.25)" },
          },
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 800 },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: mode === 'light' ? "1px solid rgba(226,232,240,0.6)" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: mode === 'light' ? "8px 0 32px rgba(15,23,42,0.10)" : "8px 0 32px rgba(0,0,0,0.5)",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 800,
          fontSize: 10,
        },
      },
    },
  },
});
