import { lazy, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAuth } from "../auth/auth";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const HrPage = lazy(() => import("../pages/HrPage"));
const ManagerPage = lazy(() => import("../pages/ManagerPage"));
const EmployeePage = lazy(() => import("../pages/EmployeePage"));

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
      <Box sx={{ display: "grid", justifyItems: "center", gap: 1.5 }}>
        <CircularProgress size={30} thickness={4} />
        <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>Loading workspace</Typography>
      </Box>
    </Box>
  );
}

