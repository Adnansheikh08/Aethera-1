import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import { beginTotpSetup, confirmTotpSetup, login, verifyTotp } from "../api/admin.js";
import { useAuth } from "./AuthContext.jsx";

/**
 * Two-step sign-in, mirroring django-two-factor-auth's flow:
 *   credentials -> pending token -> TOTP -> access + refresh tokens.
 *
 * First-time accounts land in enrolment instead of verification, because the
 * server answers SETUP_REQUIRED until a device is confirmed. There is no path
 * that skips the second factor.
 */
export default function Login() {
  const { signIn } = useAuth();
  const [stage, setStage] = useState("credentials");
  const [pendingToken, setPendingToken] = useState(null);
  const [enrolment, setEnrolment] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onCredentials = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(async () => {
      const result = await login(form.get("username"), form.get("password"));
      setPendingToken(result.pendingToken);
      setStage(result.status === "SETUP_REQUIRED" ? "enrol" : "verify");
    });
  };

  const onVerify = (event) => {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    run(async () => {
      const { accessToken, user } = await verifyTotp(pendingToken, code);
      signIn(accessToken, user);
    });
  };

  const onConfirmEnrolment = (event) => {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    run(async () => {
      const result = await confirmTotpSetup(pendingToken, code);
      // The codes are shown exactly once, so they are held until acknowledged
      // rather than signing straight in.
      setRecoveryCodes(result.recoveryCodes);
      setEnrolment({ accessToken: result.accessToken, user: result.user });
      setStage("recovery");
    });
  };

  useEffect(() => {
    if (stage !== "enrol" || enrolment) return;
    run(async () => setEnrolment(await beginTotpSetup(pendingToken)));
  }, [stage]);

  return (
    <div className="admin-auth">
      <Helmet>
        <title>Admin Sign In — Aethera</title>
        {/* An admin surface must never reach an index, unlike the public pages. */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="admin-auth-card">
        <p className="section-eyebrow">Restricted</p>
        <h1>Aethera Console</h1>

        {error && (
          <p className="admin-alert" role="alert">
            {error}
          </p>
        )}

        {stage === "credentials" && (
          <form onSubmit={onCredentials} className="admin-form">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="username" required />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Verifying…" : "Continue"}
            </button>
          </form>
        )}

        {stage === "verify" && (
          <form onSubmit={onVerify} className="admin-form">
            <p className="admin-hint">
              Enter the six-digit code from your authenticator, or one recovery code.
            </p>
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              inputMode="text"
              autoComplete="one-time-code"
              autoFocus
              required
            />
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Checking…" : "Verify"}
            </button>
          </form>
        )}

        {stage === "enrol" && (
          <form onSubmit={onConfirmEnrolment} className="admin-form">
            <p className="admin-hint">
              Two-factor authentication is required. Scan this with your authenticator app,
              then enter the code it shows.
            </p>
            {enrolment?.qrDataUrl && (
              <img className="admin-qr" src={enrolment.qrDataUrl} alt="TOTP enrolment QR code" />
            )}
            {enrolment?.secret && (
              <p className="admin-secret">
                Manual entry: <code>{enrolment.secret}</code>
              </p>
            )}
            <label htmlFor="setup-code">Code from app</label>
            <input id="setup-code" name="code" inputMode="numeric" autoComplete="off" required />
            <button type="submit" className="btn-primary" disabled={busy || !enrolment?.secret}>
              {busy ? "Confirming…" : "Confirm device"}
            </button>
          </form>
        )}

        {stage === "recovery" && (
          <div className="admin-form">
            <p className="admin-hint">
              Store these recovery codes somewhere safe. Each works once, and they will not be
              shown again.
            </p>
            <ul className="admin-recovery">
              {recoveryCodes.map((code) => (
                <li key={code}>
                  <code>{code}</code>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-primary"
              onClick={() => signIn(enrolment.accessToken, enrolment.user)}
            >
              I have saved them — continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
