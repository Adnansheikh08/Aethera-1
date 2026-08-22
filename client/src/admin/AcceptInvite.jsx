import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { acceptInvite } from "../api/admin.js";

/**
 * Public page for redeeming an admin invite link (see
 * server/src/services/adminInviteService.js). Sets the invitee's password;
 * they then sign in normally at /admin, including 2FA enrolment.
 */
export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await acceptInvite(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-auth">
      <Helmet>
        <title>Accept invite — Aethera</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="admin-auth-card">
        <p className="section-eyebrow">Restricted</p>
        <h1>Accept admin invite</h1>

        {!token && (
          <p className="admin-alert" role="alert">
            This link is missing its invite token.
          </p>
        )}

        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}

        {done ? (
          <div className="admin-form">
            <p className="admin-hint">Your password is set. Sign in to continue.</p>
            <button type="button" className="btn-primary" onClick={() => navigate("/admin")}>
              Go to sign in
            </button>
          </div>
        ) : (
          token && (
            <form onSubmit={onSubmit} className="admin-form">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                minLength={12}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                minLength={12}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Setting password…" : "Set password"}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
