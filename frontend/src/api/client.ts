import axios, { AxiosHeaders } from "axios";
import { clearAuth, getAuth, setAuth } from "../auth/auth";

const LAST_AUTH_ERROR_KEY = "attendance_last_auth_error_v1";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

const PRODUCTION_API_URL = "https://attendance-backend-nodejs.vercel.app";
const STALE_RENDER_API_URL = "https://attendance-backend-cquw.onrender.com";

const resolvedBaseUrl = (() => {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    const normalized = normalizeBaseUrl(fromEnv);
    return normalized === STALE_RENDER_API_URL ? PRODUCTION_API_URL : normalized;
  }

  // This fallback is only for local dev when the backend runs on your machine.
  // If you're seeing `net::ERR_CONNECTION_REFUSED` in the browser, create `frontend/.env`
  // with `VITE_API_URL=...` and restart `npm run dev`.
  // eslint-disable-next-line no-console
  if (import.meta.env.PROD) {
    return PRODUCTION_API_URL;
  }

  console.warn(
    "[api] VITE_API_URL is not set; falling back to http://localhost:3000. Create frontend/.env and restart Vite.",
  );
  return "http://localhost:3000";
})();

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 60000,
});

export const apiBaseUrl = resolvedBaseUrl;

api.interceptors.request.use((config) => {
  const auth = getAuth();
  if (auth?.token) {
    if (!config.headers) config.headers = new AxiosHeaders();
    // Axios v1 may use AxiosHeaders internally; support both shapes.
    const anyHeaders: any = config.headers as any;
    if (typeof anyHeaders.set === "function") {
      anyHeaders.set("Authorization", `Bearer ${auth.token}`);
    } else {
      anyHeaders.Authorization = `Bearer ${auth.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err?.response?.status;
    const url = err?.config?.url;
    const method = err?.config?.method;
    const isLoginRequest = url && (url.includes("/api/auth/login") || url.includes("/api/auth/refresh"));

    const hasRetried = originalRequest._retry || originalRequest.headers?.['x-retry'] === 'true';

    if (status === 401 && !isLoginRequest && !hasRetried) {
      originalRequest._retry = true;
      if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
      (originalRequest.headers as any)['x-retry'] = 'true';
      
      const auth = getAuth();
      if (auth?.refreshToken) {
        try {
          const refreshRes = await axios.post<{ token: string; refreshToken: string }>(
            `${resolvedBaseUrl}/api/auth/refresh`,
            { refreshToken: auth.refreshToken }
          );

          const newAuth = {
            ...auth,
            token: refreshRes.data.token,
            refreshToken: refreshRes.data.refreshToken,
          };
          setAuth(newAuth);

          if (!originalRequest.headers) {
            originalRequest.headers = new AxiosHeaders();
          }
          const anyHeaders: any = originalRequest.headers as any;
          if (typeof anyHeaders.set === "function") {
            anyHeaders.set("Authorization", `Bearer ${refreshRes.data.token}`);
          } else {
            anyHeaders.Authorization = `Bearer ${refreshRes.data.token}`;
          }
          return api(originalRequest);
        } catch (refreshErr) {
          clearAuth();
          window.location.href = "/login";
          return Promise.reject(refreshErr);
        }
      } else {
        clearAuth();
        window.location.href = "/login";
      }
    }

    if (status === 401 || status === 403) {
      try {
        localStorage.setItem(
          LAST_AUTH_ERROR_KEY,
          JSON.stringify({
            at: new Date().toISOString(),
            status,
            method,
            url,
            baseURL: resolvedBaseUrl,
            message: err?.response?.data?.error ?? err?.message ?? "Unauthorized",
          }),
        );
      } catch {
        // ignore storage failures
      }
      // eslint-disable-next-line no-console
      console.warn("[auth] unauthorized", { status, method, url, baseURL: resolvedBaseUrl });
    }
    const isInteractiveIdentityCheck =
      status === 401 &&
      typeof url === "string" &&
      (url.includes("/api/auth/me") || url.includes("/api/auth/login"));
    if (isInteractiveIdentityCheck) {
      clearAuth();
    }
    return Promise.reject(err);
  },
);

export function getLastAuthError(): string | null {
  try {
    return localStorage.getItem(LAST_AUTH_ERROR_KEY);
  } catch {
    return null;
  }
}

export function clearLastAuthError() {
  try {
    localStorage.removeItem(LAST_AUTH_ERROR_KEY);
  } catch {
    // ignore
  }
}

