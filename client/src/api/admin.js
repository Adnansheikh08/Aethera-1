import { request, ApiError } from "./client.js";

/**
 * Admin API surface, replacing the Django admin site.
 *
 * Auth endpoints live under /api/auth; everything else sits behind the
 * obfuscated admin mount (server config.adminUrlPath) and requires an access
 * token that is only issued after TOTP succeeds.
 */
const ADMIN = `/${import.meta.env.VITE_ADMIN_API_PATH ?? "portal-admin-8f2e9a7c"}`;

/* -- unauthenticated auth handshake ------------------------------------- */

export const login = (username, password) =>
  request("/auth/login", { method: "POST", body: { username, password } });

export const verifyTotp = (pendingToken, code) =>
  request("/auth/totp/verify", { method: "POST", body: { pendingToken, code } });

export const beginTotpSetup = (pendingToken) =>
  request("/auth/totp/setup", { method: "POST", body: { pendingToken } });

export const confirmTotpSetup = (pendingToken, code) =>
  request("/auth/totp/confirm", { method: "POST", body: { pendingToken, code } });

export const refresh = () => request("/auth/refresh", { method: "POST" });

export const acceptInvite = (token, password) =>
  request("/auth/invite/accept", { method: "POST", body: { token, password } });

/* -- authenticated calls ------------------------------------------------ */

/**
 * Wraps a call so an expired access token is refreshed once and the call
 * retried, instead of bouncing the user to the login screen mid-session.
 * Django's session cookie renewed itself; short-lived JWTs need this explicitly.
 */
export async function withRefresh(call, { token, setToken, onExpired }) {
  try {
    return await call(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    let fresh;
    try {
      ({ accessToken: fresh } = await refresh());
    } catch {
      onExpired?.();
      throw new ApiError("Your session expired. Sign in again.", 401);
    }
    setToken?.(fresh);
    return call(fresh);
  }
}

const authed = (path, options = {}) => (token) => request(path, { ...options, token });

export const api = {
  logout: () => authed("/auth/logout", { method: "POST" }),
  me: () => authed("/auth/me"),

  stats: () => authed(`${ADMIN}/stats`),
  auditLog: (limit = 100) => authed(`${ADMIN}/audit-log?limit=${limit}`),
  transactions: () => authed(`${ADMIN}/transactions`),
  erasureRequests: () => authed(`${ADMIN}/erasure-requests`),

  admins: () => authed(`${ADMIN}/admins`),
  inviteAdmin: (body) => authed(`${ADMIN}/admins/invite`, { method: "POST", body }),
  setAdminPermissions: (id, permissions) =>
    authed(`${ADMIN}/admins/${id}/permissions`, { method: "PATCH", body: { permissions } }),
  setAdminStatus: (id, is_active) =>
    authed(`${ADMIN}/admins/${id}/status`, { method: "PATCH", body: { is_active } }),
  changePassword: (currentPassword, newPassword) =>
    authed("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),

  leads: ({ status, limit = 50, skip = 0 } = {}) => {
    const q = new URLSearchParams({ limit: String(limit), skip: String(skip) });
    if (status) q.set("status", status);
    return authed(`${ADMIN}/leads?${q}`);
  },
  lead: (id) => authed(`${ADMIN}/leads/${id}`),
  setLeadStatus: (id, status) =>
    authed(`${ADMIN}/leads/${id}/status`, { method: "PATCH", body: { status } }),

  list: (resource) => authed(`${ADMIN}/${resource}?limit=200`),
  create: (resource, body) => authed(`${ADMIN}/${resource}`, { method: "POST", body }),
  update: (resource, id, body) =>
    authed(`${ADMIN}/${resource}/${id}`, { method: "PUT", body }),
  remove: (resource, id) => authed(`${ADMIN}/${resource}/${id}`, { method: "DELETE" }),
};
