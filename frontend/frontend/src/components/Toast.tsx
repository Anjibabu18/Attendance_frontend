import { createContext, useCallback, useContext } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Box, Typography } from "@mui/material";
import { Toaster, toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastCtx {
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => void;
  toastSuccess: (message: string, title?: string) => void;
  toastError: (message: string, title?: string) => void;
  toastInfo: (message: string, title?: string) => void;
  toastWarning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const CFG: Record<ToastType, { icon: React.ReactNode; color: string; bg: string }> = {
  success: { bg: "rgba(16,185,129,0.15)", icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />, color: "#34D399" }, // Emerald neon
  error:   { bg: "rgba(239,68,68,0.15)",  icon: <ErrorOutlineIcon sx={{ fontSize: 18 }} />,       color: "#F87171" }, // Rose neon
  info:    { bg: "rgba(59,130,246,0.15)", icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />,       color: "#60A5FA" }, // Blue neon
  warning: { bg: "rgba(245,158,11,0.15)", icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,       color: "#FBBF24" }, // Amber neon
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000, title?: string) => {
    sonnerToast.custom((id) => (
      <Box sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: "10px 18px 10px 12px",
        minWidth: "auto",
        width: "100%",
        borderRadius: "9999px", // Pill shape
        background: "rgba(15,23,42,0.85)", // Deep black/slate glass
        backdropFilter: "blur(24px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
        pointerEvents: "auto",
        cursor: "pointer",
      }} onClick={() => sonnerToast.dismiss(id)}>
        
        {/* Dynamic Icon Box */}
        <Box sx={{ 
          width: 32, height: 32, 
          borderRadius: "50%", 
          background: CFG[type].bg, 
          color: CFG[type].color, 
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px ${CFG[type].color}40`,
        }}>
          {CFG[type].icon}
        </Box>

        {/* Text Container */}
        <Box sx={{ display: "flex", flexDirection: "column", pr: 1, pt: 0.25 }}>
          {title && (
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
              {title}
            </Typography>
          )}
          <Typography sx={{ 
            fontSize: title ? 11.5 : 13, 
            fontWeight: title ? 600 : 700, 
            color: title ? "rgba(255,255,255,0.7)" : "white", 
            lineHeight: 1.2, 
            wordBreak: "break-word",
            letterSpacing: "-0.01em"
          }}>
            {message}
          </Typography>
        </Box>
      </Box>
    ), { duration });
  }, []);

  const toastSuccess = useCallback((msg: string, title?: string) => showToast(msg, "success", 3000, title), [showToast]);
  const toastError   = useCallback((msg: string, title?: string) => showToast(msg, "error",   3000, title), [showToast]);
  const toastInfo    = useCallback((msg: string, title?: string) => showToast(msg, "info",    3000, title), [showToast]);
  const toastWarning = useCallback((msg: string, title?: string) => showToast(msg, "warning", 4000, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toastSuccess, toastError, toastInfo, toastWarning }}>
      {children}
      <Toaster position="top-center" offset={24} />
    </ToastContext.Provider>
  );
}
