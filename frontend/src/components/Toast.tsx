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

const CFG: Record<ToastType, { border: string; icon: React.ReactNode; color: string; progress: string; bg: string }> = {
  success: { bg: "rgba(22,163,74,0.06)", border: "rgba(22,163,74,0.28)", icon: <CheckCircleOutlineIcon sx={{ fontSize: 21 }} />, color: "#16a34a", progress: "linear-gradient(90deg,#16a34a,#10b981)" },
  error:   { bg: "rgba(220,38,38,0.06)",  border: "rgba(220,38,38,0.28)",  icon: <ErrorOutlineIcon sx={{ fontSize: 21 }} />,          color: "#dc2626", progress: "linear-gradient(90deg,#dc2626,#ef4444)" },
  info:    { bg: "rgba(37,99,235,0.06)",  border: "rgba(37,99,235,0.28)",  icon: <InfoOutlinedIcon sx={{ fontSize: 21 }} />,          color: "#2563eb", progress: "linear-gradient(90deg,#2563eb,#6366f1)" },
  warning: { bg: "rgba(180,83,9,0.06)",   border: "rgba(180,83,9,0.28)",   icon: <WarningAmberIcon sx={{ fontSize: 21 }} />,          color: "#b45309", progress: "linear-gradient(90deg,#b45309,#f59e0b)" },
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
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: 1.25,
      p: "12px 14px 14px 16px",
      minWidth: 290,
      maxWidth: 380,
      borderRadius: "14px",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(24px)",
      border: `1.5px solid ${cfg.border}`,
      boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
      overflow: "hidden",
      transform: show && !exit ? "translateX(0) scale(1)" : "translateX(110%) scale(0.92)",
      opacity: show && !exit ? 1 : 0,
      transition: exit
        ? "transform 0.36s cubic-bezier(0.4,0,1,1), opacity 0.32s ease"
        : "transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease",
      "&::before": { content:'""', position:"absolute", inset:0, background: cfg.bg, zIndex:0 },
    }}>
      {/* Left accent */}
      <Box sx={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:cfg.progress }} />
      {/* Icon */}
      <Box sx={{ flexShrink:0, color:cfg.color, mt:0.15, zIndex:1, filter:`drop-shadow(0 2px 6px ${cfg.color}55)` }}>
        {cfg.icon}
      </Box>
      {/* Text */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.25, zIndex: 1 }}>
        {toast.title && (
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "#111827", lineHeight: 1.35 }}>
            {toast.title}
          </Typography>
        )}
        <Typography sx={{ fontSize: 12.5, fontWeight: toast.title ? 500 : 700, color: toast.title ? "text.secondary" : "#111827", lineHeight: 1.4, wordBreak: "break-word" }}>
          {toast.message}
        </Typography>
      </Box>
      {/* Close */}
      <IconButton size="small" onClick={dismiss} sx={{ flexShrink:0, mt:-0.5, mr:-0.5, zIndex:1, color:"text.secondary", opacity:0.55, "&:hover":{ opacity:1, bgcolor:"rgba(0,0,0,0.06)" } }}>
        <CloseIcon sx={{ fontSize:15 }} />
      </IconButton>
      {/* Progress bar */}
      <Box sx={{
        position:"absolute", bottom:0, left:4, right:0, height:3, background:cfg.progress,
        transformOrigin:"left", opacity:0.65,
        animation:`shrink ${dur}ms linear forwards`,
        "@keyframes shrink":{ from:{ transform:"scaleX(1)" }, to:{ transform:"scaleX(0)" } },
        zIndex:1,
      }} />
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
        position:"fixed", bottom:24, right:24, zIndex:9999,
        display:"flex", flexDirection:"column", gap:1.25, alignItems:"flex-end",
        pointerEvents:"none", "& > *":{ pointerEvents:"auto" },
      }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </Box>
    </ToastContext.Provider>
  );
}
