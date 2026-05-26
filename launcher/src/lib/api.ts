// Thin wrapper for the API calls the launcher makes directly — i.e. everything
// beyond what @rumpusroom/auth-client already covers (getSession/refresh/
// signOut/redirect). All requests send the session cookie.
//
// In dev, API_BASE is empty so calls hit the Vite proxy on the launcher origin
// (see vite.config.ts) — no CORS, and the magic-link consume→redirect round
// trip works. In production it points at the API subdomain (CORS applies).

export const API_BASE =
  import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "" : "https://api.rumpusroom.app");

export interface ApiErrorBody {
  code: string;
  message: string;
}

/** A non-2xx response, carrying the API's canonical error code + status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const err = (data as { error?: ApiErrorBody })?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "http_error",
      err?.message ?? `Request failed (${res.status}).`,
      data,
    );
  }
  return data as T;
}

/** POST /auth/magic-link — send a sign-in link. Throws ApiError on 429/4xx. */
export function requestMagicLink(email: string): Promise<{ ok: true }> {
  return request("/auth/magic-link", { method: "POST", body: JSON.stringify({ email }) });
}

/** POST /profiles/:id/select — enter kid mode for a profile. */
export function selectProfileApi(profileId: string): Promise<unknown> {
  return request(`/profiles/${encodeURIComponent(profileId)}/select`, { method: "POST" });
}

/** POST /profiles/deselect — leave kid mode, back to parent mode. */
export function deselectProfileApi(): Promise<unknown> {
  return request("/profiles/deselect", { method: "POST" });
}

export interface CreatedProfile {
  id: string;
  display_name: string;
  avatar_id: number;
  age_band: string | null;
  created_at: number;
}

/** POST /profiles — create a kid profile. Throws ApiError (409 carries suggested_avatar_id). */
export function createProfileApi(body: {
  display_name: string;
  avatar_id: number;
  age_band?: string | null;
}): Promise<CreatedProfile> {
  return request("/profiles", { method: "POST", body: JSON.stringify(body) });
}

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_id: number;
  age_band: string | null;
  created_at: number;
}

/** GET /profiles — full profile rows (incl. age_band + created_at) for the dashboard. */
export function listProfilesApi(): Promise<{ profiles: ProfileRow[] }> {
  return request("/profiles");
}
