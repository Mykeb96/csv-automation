/** API base URL. Empty in local dev → Vite proxies `/api` to localhost:8000. */
const raw = import.meta.env.VITE_API_URL ?? ''

export const API_BASE = raw.replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}
