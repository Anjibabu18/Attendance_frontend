import { lazy, Suspense } from "react";
import { GlobalLoader } from "../components/GlobalLoader";
import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAuth } from "../auth/auth";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const HrPage = lazy(() => import("../pages/HrPage"));
const ManagerPage = lazy(() => import("../pages/ManagerPage"));
const EmployeePage = lazy(() => import("../pages/EmployeePage"));
const KioskPage = lazy(() => import("../pages/KioskPage"));

// Preload the target route chunk in background so navigation is instant
if (typeof window !== "undefined") {
  const preloadRoutes = () => {
    const auth = getAuth();
    if (auth?.role === "ROLE_EMPLOYEE") import("../pages/EmployeePage");
    else if (auth?.role === "ROLE_HR") import("../pages/HrPage");
    else if (auth?.role === "ROLE_ADMIN") import("../pages/AdminPage");
    else if (auth?.role === "ROLE_MANAGER") import("../pages/ManagerPage");
    else import("../pages/LoginPage");
  };
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(preloadRoutes, { timeout: 800 });
  } else {
    setTimeout(preloadRoutes, 200);
  }
}

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
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function RouteLoading() {
  return <GlobalLoader message="Loading workspace..." />;
}

