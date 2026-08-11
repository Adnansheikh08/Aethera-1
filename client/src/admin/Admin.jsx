import { useState } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { useAuth } from "./AuthContext.jsx";
import { useAdminData } from "./useAdminData.js";
import Login from "./Login.jsx";
import { api } from "../api/admin.js";

/**
 * The admin surface (replacing Django's admin site) lives at /admin in the SPA.
 * The API behind it sits at the obfuscated mount, and every call needs a token
 * that only exists after TOTP — so /admin/* is the only client route that
 * renders any of this.
 */

/** Full-screen login when there is no session. */
function AdminGate({ children }) {
  const { token, restoring } = useAuth();

  if (restoring) {
    return (
      <div className="admin-frame">
        <p className="admin-loading">Restoring session…</p>
      </div>
    );
  }
  if (!token) return <Login />;
  return children;
}

function AdminHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <Link to="/admin" className="admin-brand">
          Aethera<span className="orange-char">.</span>
          <span className="admin-brand-suffix">Console</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/leads">Leads</NavLink>
          <NavLink to="/admin/services">Services</NavLink>
          <NavLink to="/admin/portfolio">Portfolio</NavLink>
          <NavLink to="/admin/case-studies">Case studies</NavLink>
          <NavLink to="/admin/transactions">Transactions</NavLink>
          <NavLink to="/admin/erasures">Erasures</NavLink>
          <NavLink to="/admin/audit">Audit log</NavLink>
        </nav>

        <div className="admin-session">
          <span className="admin-username">{user?.username}</span>
          <button type="button" className="btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

/** Shared loading / error shell so the pages do not repeat it. */
function Panel({ title, error, loading, children }) {
  if (error) {
    return (
      <p className="admin-alert" role="alert">
        {error}
      </p>
    );
  }
  if (loading) return <p className="admin-loading">Loading {title.toLowerCase()}…</p>;
  return children;
}

/* -- Dashboard ------------------------------------------------------------ */

function Dashboard() {
  const { data } = useAdminData(() => api.stats());
  return (
    <section>
      <h1>Dashboard</h1>
      <Panel title="statistics" loading={!data}>
        {data && (
          <ul className="admin-stat-grid">
            <li>
              <strong>{data.services}</strong>
              <span>Active services</span>
            </li>
            <li>
              <strong>{data.portfolio_items}</strong>
              <span>Published portfolio</span>
            </li>
            <li>
              <strong>{data.case_studies}</strong>
              <span>Published case studies</span>
            </li>
            <li>
              <strong>{data.leads}</strong>
              <span>Total leads</span>
            </li>
            <li>
              <strong>{data.new_leads}</strong>
              <span>New leads</span>
            </li>
            <li>
              <strong>{data.transactions}</strong>
              <span>Transactions</span>
            </li>
            <li>
              <strong>{data.completed_erasures}</strong>
              <span>Completed erasures</span>
            </li>
          </ul>
        )}
      </Panel>
    </section>
  );
}

/* -- Generic CRUD ---------------------------------------------------------- */

const RESOURCES = {
  services: {
    singular: "service",
    fields: [
      ["title", "text", { required: true }],
      ["slug", "text", { required: true, pattern: "[a-z0-9-]+", title: "Lowercase kebab-case" }],
      ["short_description", "textarea", { required: true }],
      ["description", "textarea", { required: true }],
      ["icon", "text"],
      ["is_active", "checkbox", { label: "Active" }],
    ],
  },
  portfolio: {
    singular: "portfolio item",
    fields: [
      ["service", "service-ref", { required: true, label: "Service" }],
      ["title", "text", { required: true }],
      ["slug", "text", { required: true, pattern: "[a-z0-9-]+", title: "Lowercase kebab-case" }],
      ["description", "textarea", { required: true }],
      ["project_url", "url", { label: "Project URL (optional)" }],
      ["is_published", "checkbox", { label: "Published" }],
    ],
  },
  "case-studies": {
    singular: "case study",
    fields: [
      ["service", "service-ref", { required: true, label: "Service" }],
      ["client_name", "text", { required: true }],
      ["slug", "text", { required: true, pattern: "[a-z0-9-]+", title: "Lowercase kebab-case" }],
      ["challenge", "textarea", { required: true }],
      ["result", "textarea", { required: true }],
      ["metrics", "text", { required: true }],
      ["is_published", "checkbox", { label: "Published" }],
    ],
  },
};

function CrudPage({ resource }) {
  const { call } = useAuth();
  const { singular, fields } = RESOURCES[resource];
  const { data, error, loading, reload } = useAdminData(() => api.list(resource), [resource]);

  // Portfolio items and case studies reference a service by ObjectId. Asking an
  // admin to paste a 24-character hex id would be a regression from Django's
  // ModelChoiceField, so the options are fetched and rendered as a select.
  // The hook always runs (hooks cannot be conditional); for `services` itself
  // the thunk short-circuits to an empty list rather than a wasted round trip.
  const needsServices = fields.some(([, type]) => type === "service-ref");
  const { data: serviceList } = useAdminData(
    () => (needsServices ? api.list("services") : async () => ({ items: [] })),
    [resource],
  );

  // The form target row: null creates, an object edits, and "closed" hides it.
  const [editing, setEditing] = useState("closed");
  const [feedback, setFeedback] = useState(null);

  const close = () => {
    setEditing("closed");
    setFeedback(null);
  };

  async function save(event) {
    event.preventDefault();
    // Read the elements collection before the first await: React pools the
    // event and currentTarget is nulled out once the handler yields.
    const { elements } = event.currentTarget;
    const body = {};
    for (const [name, type] of fields) {
      const input = elements[name];
      if (!input) continue;
      if (type === "checkbox") body[name] = input.checked;
      else body[name] = input.value.trim();
    }

    try {
      if (editing === "new") await call(api.create(resource, body));
      else await call(api.update(resource, editing.id, body));
      setFeedback("Saved.");
      setEditing("closed");
      reload();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function remove(item) {
    const name = item.title || item.client_name || item.id;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await call(api.remove(resource, item.id));
      reload();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <section>
      <h1>{resource === "case-studies" ? "Case studies" : resource[0].toUpperCase() + resource.slice(1)}</h1>

      {feedback && (
        <p className="admin-alert" role="status">
          {feedback}
        </p>
      )}

      <Panel title={singular} error={error} loading={loading}>
        {data && (
          <>
            {editing !== "closed" ? (
              // Keyed by row so switching from one record to another remounts
              // the form. Without it React reuses the same inputs and their
              // defaultValue is ignored on rerender, leaving the previous
              // record's text in the fields.
              <form
                key={editing === "new" ? "new" : editing.id}
                onSubmit={save}
                className="admin-form admin-form-wide"
              >
                {fields.map(([name, type, options = {}]) => (
                  <label key={name}>
                    {options.label || name}
                    {type === "service-ref" ? (
                      <select
                        name={name}
                        required={options.required}
                        defaultValue={editing !== "new" ? editing[name] ?? "" : ""}
                      >
                        <option value="">Select a service…</option>
                        {(serviceList?.items ?? []).map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.title}
                          </option>
                        ))}
                      </select>
                    ) : type === "checkbox" ? (
                      <input
                        type="checkbox"
                        name={name}
                        defaultChecked={Boolean(editing !== "new" && editing[name])}
                      />
                    ) : type === "textarea" ? (
                      <textarea
                        name={name}
                        rows={4}
                        required={options.required}
                        defaultValue={editing !== "new" ? editing[name] ?? "" : ""}
                      />
                    ) : (
                      <input
                        type={type}
                        name={name}
                        required={options.required}
                        pattern={options.pattern}
                        title={options.title}
                        defaultValue={editing !== "new" ? editing[name] ?? "" : ""}
                      />
                    )}
                  </label>
                ))}
                <div className="admin-form-actions">
                  <button type="submit" className="btn-primary">
                    {editing === "new" ? `Create ${singular}` : "Save changes"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={close}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setEditing("new")}>
                New {singular}
              </button>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>{resource === "case-studies" ? "Client" : "Title"}</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    {/* Services carry `title` and `is_active`; portfolio and case
                        studies carry `is_published`, and a case study's label is
                        `client_name`. One table serves all three, so the flag is
                        read by whichever key the resource actually defines. */}
                    <td>{item.title ?? item.client_name}</td>
                    <td>
                      <code>{item.slug}</code>
                    </td>
                    <td>{(resource === "services" ? item.is_active : item.is_published) ? "live" : "hidden"}</td>
                    <td className="admin-row-actions">
                      <button type="button" className="btn-secondary" onClick={() => setEditing(item)}>
                        Edit
                      </button>
                      <button type="button" className="btn-danger" onClick={() => remove(item)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>
    </section>
  );
}

/* -- Leads ----------------------------------------------------------------- */

// Mirrors STATUS_CHOICES in server/src/models/Lead.js. Any other value is
// rejected by the leadStatusSchema validator, so this list is not cosmetic.
const LEAD_STATUSES = ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"];

function Leads() {
  const { call } = useAuth();
  const [status, setStatus] = useState("");
  const { data, error, loading, reload } = useAdminData(() => api.leads({ status }), [status]);
  const [opened, setOpened] = useState(null);

  async function changeStatus(lead, next) {
    try {
      await call(api.setLeadStatus(lead.id, next));
      reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  /**
   * Fetches the lead through GET /leads/:id rather than reusing the row already
   * in memory. The list response is decrypted too, but only the detail endpoint
   * writes the "Viewed lead PII" audit entry — reading PII from the cached row
   * would silently leave that trail incomplete.
   */
  async function openDetails(lead) {
    try {
      const { lead: full } = await call(api.lead(lead.id));
      setOpened(full);
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <section>
      <h1>Leads</h1>

      <label className="admin-filter">
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <Panel title="leads" error={error} loading={loading}>
        {data && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Received</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.service_type}</td>
                  <td>{new Date(lead.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(event) => changeStatus(lead, event.target.value)}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => openDetails(lead)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {opened && (
        <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Lead details">
          <div className="admin-modal">
            <h2>{opened.name}</h2>
            <dl className="admin-dl">
              <dt>Email</dt>
              <dd>{opened.email}</dd>
              <dt>Phone</dt>
              <dd>{opened.phone}</dd>
              <dt>Service</dt>
              <dd>{opened.service_type}</dd>
              <dt>Message</dt>
              <dd>{opened.additional_info || "—"}</dd>
              <dt>Received</dt>
              <dd>{new Date(opened.created_at).toLocaleString()}</dd>
            </dl>
            <button type="button" className="btn-primary" onClick={() => setOpened(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* -- Transactions ----------------------------------------------------------- */

function Transactions() {
  const { data, error, loading } = useAdminData(() => api.transactions());
  return (
    <section>
      <h1>Transactions</h1>
      <Panel title="transactions" error={error} loading={loading}>
        {data && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Checkout session</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((tx) => (
                <tr key={tx.id}>
                  {/* The gateway's own id is the only human-tractable handle
                      here: Transaction has no title, and its lead FK is
                      nullable by design (Django used SET_NULL). */}
                  <td>
                    <code>{tx.checkout_session_id}</code>
                  </td>
                  <td>
                    {tx.amount} {tx.currency}
                  </td>
                  <td>{tx.payment_gateway}</td>
                  <td>{tx.status}</td>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}

/* -- Erasure requests -------------------------------------------------------- */

function Erasures() {
  const { data, error, loading } = useAdminData(() => api.erasureRequests());
  return (
    <section>
      <h1>Erasure requests</h1>
      <Panel title="erasure requests" error={error} loading={loading}>
        {data && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email hash</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <code>{row.email_hash}</code>
                  </td>
                  <td>{row.status}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}

/* -- Audit log ---------------------------------------------------------------- */

function AuditLog() {
  const { data, error, loading } = useAdminData(() => api.auditLog(200));
  return (
    <section>
      <h1>Audit log</h1>
      <Panel title="audit entries" error={error} loading={loading}>
        {data && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Object</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id}>
                  {/* action_time, not created_at — AdminAuditLog opts out of the
                      shared timestamps to keep Django's single ordering column.
                      `username` is denormalised on the row, and the user ref is
                      not populated, so read the flat field. */}
                  <td>{new Date(entry.action_time).toLocaleString()}</td>
                  <td>{entry.username || "—"}</td>
                  <td>{entry.action}</td>
                  <td>{entry.object_repr || "—"}</td>
                  <td>{entry.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}

/* -- Router -------------------------------------------------------------------- */

export default function Admin() {
  return (
    <AdminGate>
      <div className="admin-frame">
        <Helmet>
          {/* The public pages advertise themselves; an admin console must never
              reach an index, and it overrides the site-wide canonical so the
              console cannot be attributed to a public URL. */}
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href="" />
        </Helmet>
        <AdminHeader />
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="services" element={<CrudPage resource="services" />} />
            <Route path="portfolio" element={<CrudPage resource="portfolio" />} />
            <Route path="case-studies" element={<CrudPage resource="case-studies" />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="erasures" element={<Erasures />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </AdminGate>
  );
}
