const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const cmsConfigured = Boolean(base && key);

export class CmsRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "CmsRequestError";
  }
}

export function cmsSetupError(error: unknown, operation: string) {
  if (error instanceof CmsRequestError && (error.code === "PGRST205" || (error.status === 404 && /schema cache|could not find the table/i.test(error.message)))) {
    return {
      status: 503,
      message: `Supabase is missing a portfolio table needed to ${operation}. Run supabase/setup.sql in the Supabase SQL Editor, then retry.`,
    };
  }
  if (error instanceof CmsRequestError && (error.status === 401 || error.status === 403)) {
    return { status: 503, message: "Supabase rejected the server database key. Set the project's service role key in the server environment and redeploy." };
  }
  return { status: 503, message: `Supabase could not ${operation}. Check the database setup and server configuration, then retry.` };
}

export async function cmsRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!base || !key) return null;
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const payload = await response.text();
  if (!response.ok) {
    let message = `Supabase request failed (${response.status})`;
    let code: string | undefined;
    try {
      const error = JSON.parse(payload) as { message?: string; code?: string; hint?: string };
      code = error.code;
      message = [error.message, error.hint].filter(Boolean).join(" ") || message;
    } catch { /* Keep the safe status-based fallback. */ }
    throw new CmsRequestError(message, response.status, code);
  }
  return payload ? JSON.parse(payload) as T : null;
}
