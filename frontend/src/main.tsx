import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { alpha, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "./styles/tailwind.css";
import App from "./router/App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb", dark: "#1d4ed8" },
    info: { main: "#0891b2" },
    secondary: { main: "#0f766e" },
    success: { main: "#16a34a" },
    error: { main: "#dc2626" },
    warning: { main: "#b45309" },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#667085",
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter","Aptos","Segoe UI",system-ui,sans-serif',
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontWeight: 800, letterSpacing: 0 },
    h6: { fontWeight: 800, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: "100vh",
          backgroundColor: "#eef4f8",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 16,
          boxShadow: "none",
          minHeight: 38,
          fontWeight: 800,
          transition: "transform .15s ease, box-shadow .15s ease, background-color .15s ease",
          "&:active": {
            transform: "translateY(1px)",
          },
        },
        contained: {
          boxShadow: "none",
          background: "linear-gradient(180deg, #2f6df2, #2563eb)",
          "&:hover": {
            boxShadow: "0 8px 18px rgba(37,99,235,0.22)",
          },
        },
        outlined: {
          borderColor: "#cbd5e1",
          backgroundColor: "#ffffff",
          "&:hover": {
            borderColor: "#94a3b8",
            backgroundColor: "#f8fafc",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 800,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          background: "#ffffff",
          transition: "border-color .15s ease, box-shadow .15s ease",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
            boxShadow: "0 0 0 3px rgba(37,99,235,0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94a3b8",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#111827",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${alpha("#94a3b8", 0.28)}`,
          fontWeight: 700,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
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
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
