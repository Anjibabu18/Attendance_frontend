export type Role = "ROLE_ADMIN" | "ROLE_HR" | "ROLE_MANAGER" | "ROLE_EMPLOYEE";

export type AuthState = {
  token: string;
  role: Role;
  name?: string;
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
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
