import { lazy, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAuth } from "../auth/auth";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const lazyWithDelay = (factory: () => Promise<any>, ms: number = 2000) => lazy(() => Promise.all([factory(), delay(ms)]).then(([moduleExports]) => moduleExports));

const LoginPage = lazyWithDelay(() => import("../pages/LoginPage"));
const AdminPage = lazyWithDelay(() => import("../pages/AdminPage"));
const HrPage = lazyWithDelay(() => import("../pages/HrPage"));
const ManagerPage = lazyWithDelay(() => import("../pages/ManagerPage"));
const EmployeePage = lazyWithDelay(() => import("../pages/EmployeePage"));

function AuthedRedirect() {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role === "ROLE_ADMIN") return <Navigate to="/admin" replace />;
  if (auth.role === "ROLE_HR") return <Navigate to="/hr" replace />;
  if (auth.role === "ROLE_MANAGER") return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

function RequireRole(props: { role: string | string[]; children: JSX.Element }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(props.role) ? props.role : [props.role];
  if (!allowed.includes(auth.role)) return <Navigate to="/" replace />;
  return props.children;
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<AuthedRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireRole role="ROLE_ADMIN">
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/hr"
          element={
            <RequireRole role="ROLE_HR">
              <HrPage />
            </RequireRole>
          }
        />
        <Route
          path="/manager"
          element={
            <RequireRole role="ROLE_MANAGER">
              <ManagerPage />
            </RequireRole>
          }
        />
        <Route
          path="/employee"
          element={
            <RequireRole role="ROLE_EMPLOYEE">
              <EmployeePage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function RouteLoading() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default" }}>
      <Box sx={{ display: "grid", justifyItems: "center", gap: 3 }}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <Box sx={{ width: 64, height: 64, borderRadius: "25%", border: "4px solid", borderColor: "primary.main", borderTopColor: "transparent" }} />
        </motion.div>
        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "text.primary", letterSpacing: 1 }}>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ATTENDANCE AI
          </motion.span>
        </Typography>
      </Box>
    </Box>
  );
}

