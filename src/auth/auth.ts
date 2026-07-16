export type Role = "ROLE_ADMIN" | "ROLE_HR" | "ROLE_MANAGER" | "ROLE_EMPLOYEE";

export type AuthState = {
  token: string;
  refreshToken?: string | null;
  role: Role;
  name?: string;
  loggedInAt?: string;
};

const KEY = "attendance_auth_v1";

export function getAuth(): AuthState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify({ ...state, loggedInAt: state.loggedInAt ?? new Date().toISOString() }));
}

export function ensureLoginStartedAt() {
  const auth = getAuth();
  if (!auth) return null;
  if (auth.loggedInAt) return auth.loggedInAt;
  const loggedInAt = new Date().toISOString();
  setAuth({ ...auth, loggedInAt });
  return loggedInAt;
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
