import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { alpha, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "./styles/tailwind.css";
import App from "./router/App";
import { ToastProvider } from "./components/Toast";

const theme = createTheme({
  palette: {
    mode: "light",
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
          background: "linear-gradient(150deg, #3b82f6 0%, #2563eb 100%)",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(37,99,235,0.28)",
            background: "linear-gradient(150deg, #60a5fa 0%, #3b82f6 100%)",
          },
          "&:disabled": { opacity: 0.55 },
        },
        outlined: {
          borderColor: "#cbd5e1",
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          "&:hover": {
            borderColor: "#94a3b8",
            backgroundColor: "#f8fafc",
            boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
          },
        },
        text: {
          "&:hover": { backgroundColor: "rgba(37,99,235,0.06)" },
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
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
            borderWidth: 2,
            boxShadow: "0 0 0 3px rgba(37,99,235,0.10)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94a3b8",
          },
          "&.Mui-focused": {
            background: "#ffffff",
          },
        },
        notchedOutline: {
          borderColor: "#dde3ee",
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
          boxShadow: "0 4px 20px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)",
        },
        elevation2: {
          boxShadow: "0 8px 32px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.05)",
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
          "&:hover": { backgroundColor: "rgba(99,102,241,0.04)" },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: "rgba(226,232,240,0.7)" },
        head: { fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0f172a",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        },
        arrow: { color: "#0f172a" },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 13.5,
          border: `1px solid ${alpha("#94a3b8", 0.22)}`,
          backdropFilter: "blur(8px)",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: "1px solid rgba(226,232,240,0.7)",
          boxShadow: "0 32px 80px rgba(15,23,42,0.20), 0 8px 24px rgba(15,23,42,0.10)",
          backdropFilter: "blur(24px)",
          overflow: "hidden",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15,23,42,0.5)",
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
        root: { borderColor: "rgba(226,232,240,0.6)" },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, backgroundColor: "rgba(226,232,240,0.6)" },
        bar: { borderRadius: 99 },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 16px 48px rgba(15,23,42,0.14)",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 6px",
          fontWeight: 600,
          "&:hover": { backgroundColor: "rgba(99,102,241,0.06)" },
          "&.Mui-selected": {
            backgroundColor: "rgba(37,99,235,0.08)",
            "&:hover": { backgroundColor: "rgba(37,99,235,0.12)" },
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
          borderRight: "1px solid rgba(226,232,240,0.6)",
          boxShadow: "8px 0 32px rgba(15,23,42,0.10)",
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
