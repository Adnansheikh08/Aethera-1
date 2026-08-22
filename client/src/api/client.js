const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Error carrying the API's response body.
 *
 * Validation failures arrive as {error, details: {field: [message]}} — the
 * details map is Django-shaped so the wizard can bind messages to fields
 * exactly as the server-rendered form did.
 */
export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = "GET", body, signal, token } = {}) {
  let response;
  try {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    // Access tokens are held in memory by AuthProvider and passed in per call —
    // never localStorage, which XSS can read.
    if (token) headers.Authorization = `Bearer ${token}`;

    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
      // The refresh token is an httpOnly cookie, so credentials must ride along.
      credentials: "include",
      signal,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    throw new ApiError("Network request failed. Check your connection and try again.", 0);
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      payload.error || `Request failed with status ${response.status}`,
      response.status,
      payload.details ?? {},
    );
  }

  return payload;
}

export const getLandingContent = (signal) => request("/content/landing", { signal });
export const getProjectsContent = (signal) => request("/content/projects", { signal });
export const getService = (slug, signal) => request(`/services/${slug}`, { signal });
export const getCaseStudy = (slug, signal) => request(`/case-studies/${slug}`, { signal });
export const submitLead = (values) => request("/leads", { method: "POST", body: values });
export const requestErasure = (email) => request("/erasure", { method: "POST", body: { email } });

export { request };
