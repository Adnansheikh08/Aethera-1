import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { api, refresh, withRefresh } from "../api/admin.js";

/**
 * Holds the admin session.
 *
 * The access token lives in this provider's state and nowhere else — not
 * localStorage, not sessionStorage — so an XSS payload cannot read it. Survival
 * across a page reload comes from the httpOnly refresh cookie instead: on mount
 * we try /auth/refresh, and a valid cookie silently restores the session.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // Distinguishes "still checking the refresh cookie" from "definitely signed
  // out", so the login form does not flash before a valid session restores.
  const [restoring, setRestoring] = useState(true);

  // withRefresh needs the current token at call time, not the value captured
  // when the callback was created.
  const tokenRef = useRef(null);
  tokenRef.current = token;

  const signOut = useCallback(async ({ notifyServer = true } = {}) => {
    if (notifyServer && tokenRef.current) {
      // Best-effort: revoking server-side is desirable but must not block the
      // local sign-out, or a network failure would trap the user signed in.
      try {
        await api.logout()(tokenRef.current);
      } catch {
        /* ignore */
      }
    }
    setToken(null);
    setUser(null);
  }, []);

  const signIn = useCallback((accessToken, nextUser) => {
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  /** Runs an api.* call with the live token, refreshing once on expiry. */
  const call = useCallback(
    (thunk) =>
      withRefresh(thunk, {
        token: tokenRef.current,
        setToken,
        onExpired: () => signOut({ notifyServer: false }),
      }),
    [signOut],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { accessToken } = await refresh();
        const { user: me } = await api.me()(accessToken);
        if (!cancelled) {
          setToken(accessToken);
          setUser(me);
        }
      } catch {
        // No cookie, or it expired — the login screen is the correct outcome.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, restoring, signIn, signOut, call }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
