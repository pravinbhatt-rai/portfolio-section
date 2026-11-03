const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const cmsConfigured = Boolean(base && key);

export async function cmsRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!base || !key) return null;
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
  const payload = await response.text();
  return payload ? JSON.parse(payload) as T : null;
}
