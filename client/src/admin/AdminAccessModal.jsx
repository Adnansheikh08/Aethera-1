import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";
import Login from "./Login.jsx";

/**
 * The public header's "Are you an admin?" popup.
 *
 * Reuses Login as-is (credentials -> TOTP -> recovery codes, exactly as at
 * /admin) so there is only one sign-in flow to keep correct. Once it hands
 * back a token, this just forwards to the console instead of re-rendering the
 * CRUD screens itself.
 */
export function AdminAccessModal({ onClose }) {
  const dialogRef = useRef(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dialogRef.current?.showModal();
    document.body.classList.add("is-locked");
    return () => document.body.classList.remove("is-locked");
  }, []);

  useEffect(() => {
    if (!token) return;
    dialogRef.current?.close();
    navigate("/admin");
  }, [token, navigate]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="admin-access-modal"
      aria-label="Admin sign in"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="admin-access-modal-card">
        <button type="button" className="admin-access-modal-close" onClick={close}>
          <span aria-hidden="true">&times;</span>
          <span className="visually-hidden">Close</span>
        </button>
        <Login embedded />
      </div>
    </dialog>
  );
}

export default AdminAccessModal;
