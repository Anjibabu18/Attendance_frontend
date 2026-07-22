import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";

export type ToastType = "success" | "error" | "info" | "warning";
export interface Toast { id: string; title?: string; message: string; type: ToastType; duration?: number; }

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

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const cfg = CFG[toast.type];
  const dur = toast.duration ?? 3000;
  const [show, setShow] = useState(false);
  const [exit, setExit] = useState(false);

  const dismiss = useCallback(() => {
    setExit(true);
    setTimeout(() => onRemove(toast.id), 360);
  }, [toast.id, onRemove]);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const t = window.setTimeout(dismiss, dur);
    return () => window.clearTimeout(t);
  }, [dur, dismiss]);

  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      p: "10px 18px 10px 12px",
      minWidth: "auto",
      maxWidth: { xs: 320, md: 400 },
      borderRadius: "9999px", // Pill shape
      background: "rgba(15,23,42,0.85)", // Deep black/slate glass
      backdropFilter: "blur(24px) saturate(200%)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15)",
      transform: show && !exit ? "translateY(0) scale(1)" : "translateY(-150%) scale(0.7)",
      opacity: show && !exit ? 1 : 0,
      transition: exit
        ? "transform 0.4s cubic-bezier(0.4,0,1,1), opacity 0.3s ease, padding 0.3s ease"
        : "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease", // Springy entrance
      cursor: "pointer",
    }} onClick={dismiss}>
      
      {/* Dynamic Icon Box */}
      <Box sx={{ 
        width: 32, height: 32, 
        borderRadius: "50%", 
        background: cfg.bg, 
        color: cfg.color, 
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 12px ${cfg.color}40`,
      }}>
        {cfg.icon}
      </Box>

      {/* Text Container */}
      <Box sx={{ display: "flex", flexDirection: "column", pr: 1, pt: 0.25 }}>
        {toast.title && (
          <Typography sx={{ fontSize: 13, fontWeight: 900, color: "white", lineHeight: 1.2 }}>
            {toast.title}
          </Typography>
        )}
        <Typography sx={{ 
          fontSize: toast.title ? 11.5 : 13, 
          fontWeight: toast.title ? 600 : 700, 
          color: toast.title ? "rgba(255,255,255,0.7)" : "white", 
          lineHeight: 1.2, 
          wordBreak: "break-word",
          letterSpacing: "-0.01em"
        }}>
          {toast.message}
        </Typography>
      </Box>
    </Box>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type, duration, title }]);
  }, []);

  const remove = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const toastSuccess = useCallback((msg: string, title?: string) => showToast(msg, "success", 3000, title), [showToast]);
  const toastError   = useCallback((msg: string, title?: string) => showToast(msg, "error",   3000, title), [showToast]);
  const toastInfo    = useCallback((msg: string, title?: string) => showToast(msg, "info",    3000, title), [showToast]);
  const toastWarning = useCallback((msg: string, title?: string) => showToast(msg, "warning", 4000, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toastSuccess, toastError, toastInfo, toastWarning }}>
      {children}
      <Box sx={{
        position: "fixed", 
        top: 24, left: 0, right: 0, 
        zIndex: 99999,
        display: "flex", flexDirection: "column", gap: 1, alignItems: "center", // Top center
        pointerEvents: "none", "& > *": { pointerEvents: "auto" },
      }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </Box>
    </ToastContext.Provider>
  );
}
